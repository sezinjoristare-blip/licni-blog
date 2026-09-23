import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import BlogReaderToolbar
  from "../components/reader/BlogReaderToolbar";

import ManualReaderContent
  from "../components/reader/ManualReaderContent";

import PdfReaderContent
  from "../components/reader/PdfReaderContent";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  getArticleProgress,
  saveArticleProgress,
} from "../utils/articleProgress";

import "../reader.css";

const VIEW_MODE_KEY =
  "licni-blog-reader-view-mode";

const NAVIGATION_MODE_KEY =
  "licni-blog-reader-navigation-mode";

function getStoredViewMode() {
  const value =
    window.localStorage.getItem(
      VIEW_MODE_KEY,
    );

  return value === "single" ||
    value === "spread"
    ? value
    : null;
}

function getStoredNavigationMode() {
  const value =
    window.localStorage.getItem(
      NAVIGATION_MODE_KEY,
    );

  return value === "paged"
    ? "paged"
    : "scroll";
}

function getAutomaticViewMode() {
  const landscape =
    window.matchMedia?.(
      "(orientation: landscape)",
    ).matches ??
    (
      window.innerWidth >
      window.innerHeight
    );

  return (
    landscape &&
    window.innerWidth >= 760
  )
    ? "spread"
    : "single";
}

function getStoredPage(key) {
  if (!key) {
    return null;
  }

  const value =
    Number(
      window.localStorage.getItem(
        key,
      ),
    );

  return Number.isInteger(value) &&
    value >= 0
    ? value
    : null;
}

function ArticlePage() {
  const {
    slug,
  } = useParams();

  const navigate =
    useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const [
    article,
    setArticle,
  ] = useState(null);

  const [
    articleLoading,
    setArticleLoading,
  ] = useState(true);

  const [
    articleError,
    setArticleError,
  ] = useState("");

  const [
    articleParts,
    setArticleParts,
  ] = useState([]);

  const [
    partsLoading,
    setPartsLoading,
  ] = useState(false);

  const [
    partsError,
    setPartsError,
  ] = useState("");

  const [
    articleProgress,
    setArticleProgress,
  ] = useState(null);

  const [
    isAutomaticView,
    setIsAutomaticView,
  ] = useState(
    () =>
      !getStoredViewMode(),
  );

  const [
    viewMode,
    setViewMode,
  ] = useState(
    () =>
      getStoredViewMode() ||
      getAutomaticViewMode(),
  );

  const [
    navigationMode,
    setNavigationMode,
  ] = useState(
    getStoredNavigationMode,
  );

  const [
    currentPageIndex,
    setCurrentPageIndex,
  ] = useState(0);

  const [
    bookmarkPage,
    setBookmarkPage,
  ] = useState(null);

  const [
    isBookmarkMode,
    setIsBookmarkMode,
  ] = useState(false);

  const [
    pageCount,
    setPageCount,
  ] = useState(0);

  const [
    readyScopeKey,
    setReadyScopeKey,
  ] = useState("");

  const requestedPartId =
    searchParams.get(
      "part",
    );

  const articleIsPdf =
    article?.content_type ===
    "pdf";

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      setArticleLoading(true);
      setArticleError("");
      setArticle(null);

      const {
        data,
        error,
      } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          subtitle,
          excerpt,
          content,
          content_blocks,
          slug,
          category_id,
          character_key,
          status,
          content_type,
          pdf_url,
          pdf_path,
          original_file_name,
          page_count,
          cover_image_url,
          published_at,
          created_at,
          categories (
            id,
            name,
            slug
          )
        `)
        .eq("slug", slug)
        .eq(
          "status",
          "published",
        )
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error) {
        console.error(
          "Učitavanje rada:",
          error,
        );

        setArticleError(
          "Rad trenutno nije moguće učitati.",
        );

        setArticleLoading(false);
        return;
      }

      setArticle(
        data || null,
      );

      setArticleLoading(false);
    }

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    async function loadParts() {
      if (
        !article ||
        !articleIsPdf
      ) {
        setArticleParts([]);
        setPartsLoading(false);
        setPartsError("");
        return;
      }

      setPartsLoading(true);
      setPartsError("");

      const {
        data,
        error,
      } = await supabase
        .from("article_parts")
        .select(`
          id,
          article_id,
          title,
          sort_order,
          pdf_url,
          pdf_path,
          original_file_name,
          page_count,
          created_at
        `)
        .eq(
          "article_id",
          article.id,
        )
        .order(
          "sort_order",
          {
            ascending: true,
          },
        )
        .order(
          "created_at",
          {
            ascending: true,
          },
        );

      if (cancelled) {
        return;
      }

      if (error) {
        console.error(
          "Učitavanje PDF delova:",
          error,
        );

        setArticleParts([]);
        setPartsError(
          "Delove ovog rada trenutno nije moguće učitati.",
        );
        setPartsLoading(false);
        return;
      }

      setArticleParts(
        data ?? [],
      );

      setPartsLoading(false);
    }

    loadParts();

    return () => {
      cancelled = true;
    };
  }, [
    article?.id,
    articleIsPdf,
  ]);

  useEffect(() => {
    if (!article) {
      setArticleProgress(null);
      return;
    }

    setArticleProgress(
      getArticleProgress(
        article.id,
      ),
    );
  }, [article?.id]);

  const activePart =
    useMemo(() => {
      if (
        !articleIsPdf ||
        articleParts.length === 0
      ) {
        return null;
      }

      if (requestedPartId) {
        const requestedPart =
          articleParts.find(
            (part) =>
              part.id ===
              requestedPartId,
          );

        if (requestedPart) {
          return requestedPart;
        }
      }

      if (
        articleProgress?.partId
      ) {
        const savedPart =
          articleParts.find(
            (part) =>
              part.id ===
              articleProgress.partId,
          );

        if (savedPart) {
          return savedPart;
        }
      }

      return articleParts[0];
    }, [
      articleIsPdf,
      articleParts,
      requestedPartId,
      articleProgress?.partId,
    ]);

  const activePartIndex =
    activePart
      ? articleParts.findIndex(
          (part) =>
            part.id ===
            activePart.id,
        )
      : -1;

  const nextPart =
    activePartIndex >= 0 &&
    activePartIndex <
      articleParts.length - 1
      ? articleParts[
          activePartIndex + 1
        ]
      : null;

  const activePartId =
    articleIsPdf
      ? (
          activePart?.id ||
          "legacy"
        )
      : "manual";

  const activePdfUrl =
    articleIsPdf
      ? (
          activePart?.pdf_url ||
          article?.pdf_url ||
          ""
        )
      : "";

  const isPdf =
    Boolean(
      articleIsPdf &&
      activePdfUrl,
    );

  const isPosterArticle =
    article?.character_key ===
    "covek-1";

  const titleWords =
  useMemo(
    () => {
      let letterIndex =
        0;

      return String(
        article?.title ||
        "",
      )
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(
          (
            word,
            wordIndex
          ) => ({
            id:
              `word-${wordIndex}`,

            letters:
              Array.from(
                word
              ).map(
                (
                  letter
                ) => ({
                  letter,

                  index:
                    letterIndex++,
                })
              ),
          })
        );
    },
    [
      article?.title,
    ],
  );

  const legacyProgressKey =
    article
      ? `licni-blog-reader-progress:${article.id}`
      : "";

  const progressKey =
    article
      ? (
          articleIsPdf &&
          activePart?.id
            ? `licni-blog-reader-progress:${article.id}:${activePart.id}`
            : legacyProgressKey
        )
      : "";

  const bookmarkKey =
    article
      ? `licni-blog-reader-bookmark:${article.id}`
      : "";

  const readerScopeKey =
    article
      ? `${article.id}:${activePartId}`
      : "";

  useEffect(() => {
    if (!article) {
      return;
    }

    if (
      articleIsPdf &&
      partsLoading
    ) {
      return;
    }

    const savedArticleProgress =
      getArticleProgress(
        article.id,
      );

    setArticleProgress(
      savedArticleProgress,
    );

    let storedProgress =
      getStoredPage(
        progressKey,
      );

    if (
      storedProgress === null &&
      articleIsPdf &&
      activePartIndex === 0 &&
      progressKey !==
        legacyProgressKey
    ) {
      storedProgress =
        getStoredPage(
          legacyProgressKey,
        );
    }

    let storedBookmark = null;

    if (articleIsPdf) {
      const savedBookmarkPage =
        Number(
          savedArticleProgress
            ?.bookmarkPage,
        );

      if (
        savedArticleProgress
          ?.bookmarkPartId ===
          activePartId &&
        Number.isInteger(
          savedBookmarkPage,
        ) &&
        savedBookmarkPage >= 1
      ) {
        storedBookmark =
          savedBookmarkPage - 1;
      } else if (
        !savedArticleProgress
          ?.bookmarkPartId
      ) {
        const oldBookmark =
          getStoredPage(
            bookmarkKey,
          );

        if (
          oldBookmark !== null
        ) {
          storedBookmark =
            oldBookmark;

          const migratedProgress = {
            ...savedArticleProgress,
            partId:
              activePartId,
            page:
              oldBookmark + 1,
            bookmarkPartId:
              activePartId,
            bookmarkPage:
              oldBookmark + 1,
          };

          saveArticleProgress(
            article.id,
            migratedProgress,
          );

          setArticleProgress(
            migratedProgress,
          );
        }
      }
    } else {
      storedBookmark =
        getStoredPage(
          bookmarkKey,
        );
    }

    setBookmarkPage(
      storedBookmark,
    );

    setCurrentPageIndex(
      storedBookmark ??
        storedProgress ??
        0,
    );

    setPageCount(0);
    setIsBookmarkMode(false);

    setReadyScopeKey(
      readerScopeKey,
    );
  }, [
    article?.id,
    articleIsPdf,
    partsLoading,
    readerScopeKey,
    progressKey,
    legacyProgressKey,
    bookmarkKey,
    activePartId,
    activePartIndex,
  ]);

  useEffect(() => {
    if (
      !article ||
      !progressKey ||
      readyScopeKey !==
        readerScopeKey
    ) {
      return;
    }

    window.localStorage.setItem(
      progressKey,
      String(
        currentPageIndex,
      ),
    );

    if (articleIsPdf) {
      const currentProgress =
        getArticleProgress(
          article.id,
        ) || {};

      const nextProgress = {
        ...currentProgress,
        partId:
          activePartId,
        page:
          currentPageIndex + 1,
      };

      saveArticleProgress(
        article.id,
        nextProgress,
      );

      setArticleProgress(
        nextProgress,
      );
    }
  }, [
    article,
    articleIsPdf,
    activePartId,
    currentPageIndex,
    progressKey,
    readyScopeKey,
    readerScopeKey,
  ]);

  useEffect(() => {
    if (!isAutomaticView) {
      return undefined;
    }

    function updateView() {
      setViewMode(
        getAutomaticViewMode(),
      );
    }

    updateView();

    window.addEventListener(
      "resize",
      updateView,
    );

    window.addEventListener(
      "orientationchange",
      updateView,
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateView,
      );

      window.removeEventListener(
        "orientationchange",
        updateView,
      );
    };
  }, [isAutomaticView]);

  function setManualViewMode(
    mode,
  ) {
    setIsAutomaticView(false);
    setViewMode(mode);

    window.localStorage.setItem(
      VIEW_MODE_KEY,
      mode,
    );
  }

  function useAutomaticView() {
    setIsAutomaticView(true);

    setViewMode(
      getAutomaticViewMode(),
    );

    window.localStorage.removeItem(
      VIEW_MODE_KEY,
    );
  }

  function changeNavigationMode(
    mode,
  ) {
    setNavigationMode(mode);

    window.localStorage.setItem(
      NAVIGATION_MODE_KEY,
      mode,
    );
  }

  function closeReader() {
    const historyIndex =
      window.history.state?.idx;

    if (
      typeof historyIndex ===
        "number" &&
      historyIndex > 0
    ) {
      navigate(-1);
      return;
    }

    if (
      article?.character_key ===
        "covek-1" &&
      article?.categories?.slug
    ) {
      navigate(
        `/autor/covek/posteri/${article.categories.slug}`,
      );
      return;
    }

    if (
      article?.categories?.slug
    ) {
      navigate(
        `/kategorija/${article.categories.slug}`,
      );
      return;
    }

    navigate("/pisanje");
  }

  function toggleBookmarkMode() {
    setIsBookmarkMode(
      (current) =>
        !current,
    );
  }

  function selectBookmarkPage(
    pageIndex,
  ) {
    if (!article) {
      return;
    }

    if (articleIsPdf) {
      const currentProgress =
        getArticleProgress(
          article.id,
        ) || {};

      const isSameBookmark =
        currentProgress
          .bookmarkPartId ===
          activePartId &&
        Number(
          currentProgress
            .bookmarkPage,
        ) ===
          pageIndex + 1;

      const nextProgress =
        isSameBookmark
          ? {
              ...currentProgress,
              partId:
                activePartId,
              page:
                currentPageIndex + 1,
              bookmarkPartId:
                null,
              bookmarkPage:
                null,
            }
          : {
              ...currentProgress,
              partId:
                activePartId,
              page:
                currentPageIndex + 1,
              bookmarkPartId:
                activePartId,
              bookmarkPage:
                pageIndex + 1,
            };

      saveArticleProgress(
        article.id,
        nextProgress,
      );

      setArticleProgress(
        nextProgress,
      );

      setBookmarkPage(
        isSameBookmark
          ? null
          : pageIndex,
      );

      window.localStorage.removeItem(
        bookmarkKey,
      );

      setIsBookmarkMode(false);
      return;
    }

    if (
      bookmarkPage ===
      pageIndex
    ) {
      window.localStorage.removeItem(
        bookmarkKey,
      );

      setBookmarkPage(null);
      setIsBookmarkMode(false);
      return;
    }

    window.localStorage.setItem(
      bookmarkKey,
      String(pageIndex),
    );

    setBookmarkPage(
      pageIndex,
    );

    setIsBookmarkMode(false);
  }

  function openPart(part) {
    if (
      !article ||
      !part?.id
    ) {
      return;
    }

    navigate(
      `/tekst/${article.slug}?part=${part.id}`,
    );

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }

  const hasBookmark =
    articleIsPdf
      ? Boolean(
          articleProgress
            ?.bookmarkPartId &&
          Number.isInteger(
            Number(
              articleProgress
                ?.bookmarkPage,
            ),
          ) &&
          Number(
            articleProgress
              ?.bookmarkPage,
          ) >= 1,
        )
      : bookmarkPage !== null;

  const scrollEndContent =
    nextPart ? (
      <aside className="blog-reader-part-end">
        <small>
          KRAJ DELA
          {" "}
          {activePartIndex + 1}
          {" / "}
          {articleParts.length}
        </small>

        <h2>
          {nextPart.title ||
            `Deo ${activePartIndex + 2}`}
        </h2>

        <p>
          Sledeći dokument je nastavak istog rada.
        </p>

        <button
          type="button"
          onClick={() =>
            openPart(nextPart)
          }
        >
          Nastavi na sledeći deo →
        </button>
      </aside>
    ) : null;

  if (articleLoading) {
    return (
      <main className="blog-reader-state">
        Učitavanje rada...
      </main>
    );
  }

  if (articleError) {
    return (
      <main className="blog-reader-state">
        {articleError}
      </main>
    );
  }

  if (!article) {
    return (
      <main className="blog-reader-state">
        Rad nije pronađen.
      </main>
    );
  }

  if (
    articleIsPdf &&
    partsLoading
  ) {
    return (
      <main className="blog-reader-state">
        Učitavanje dokumenta...
      </main>
    );
  }

  if (
    articleIsPdf &&
    partsError &&
    !article.pdf_url
  ) {
    return (
      <main className="blog-reader-state">
        {partsError}
      </main>
    );
  }

  if (
    articleIsPdf &&
    !activePdfUrl
  ) {
    return (
      <main className="blog-reader-state">
        PDF dokument nije pronađen.
      </main>
    );
  }

  return (
    <section
      className={[
        "blog-reader",
        `blog-reader--${viewMode}`,
        `blog-reader--${navigationMode}`,
        isBookmarkMode
          ? "blog-reader--bookmark-mode"
          : "",
        isPosterArticle
          ? "blog-reader--poster-style"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <BlogReaderToolbar
        viewMode={viewMode}
        navigationMode={
          navigationMode
        }
        isAutomaticView={
          isAutomaticView
        }
        hasBookmark={
          hasBookmark
        }
        isBookmarkMode={
          isBookmarkMode
        }
        onSetSinglePage={() =>
          setManualViewMode(
            "single",
          )
        }
        onSetTwoPages={() =>
          setManualViewMode(
            "spread",
          )
        }
        onUseAutomaticView={
          useAutomaticView
        }
        onSetScrollMode={() =>
          changeNavigationMode(
            "scroll",
          )
        }
        onSetPagedMode={() =>
          changeNavigationMode(
            "paged",
          )
        }
        onToggleBookmarkMode={
          toggleBookmarkMode
        }
        onClose={closeReader}
      />

      <header
        className={
          isPosterArticle
            ? "blog-reader-header blog-reader-header--poster"
            : "blog-reader-header"
        }
      >
        {isPosterArticle ? (
          <>
            <div className="blog-reader-poster-dossier">
              СЕКИ / ПОСТЕРИ / ДОСИЈЕ
            </div>

            {article.cover_image_url ? (
              <figure className="blog-reader-poster-cover">
                <img
                  src={
                    article.cover_image_url
                  }
                  alt=""
                />
              </figure>
            ) : null}

            <p className="blog-reader-poster-category">
              {article.categories
                ?.name ||
                "ТЕКСТОВИ"}
            </p>

            <h1
  className="blog-reader-poster-title"
  aria-label={
    article.title
  }
>
  {titleWords.map(
    (
      word
    ) => (
      <span
        key={
          word.id
        }
        className="blog-reader-poster-word"
        aria-hidden="true"
      >
        {word.letters.map(
          (
            item
          ) => (
            <span
              key={
                item.index
              }
              className="blog-reader-poster-letter"
              style={{
                "--poster-letter-index":
                  item.index,

                "--poster-letter-x":
                  `${((item.index % 5) - 2) * 8}px`,

                "--poster-letter-y":
                  `${((item.index % 3) - 1) * 9}px`,

                "--poster-letter-r":
                  `${((item.index % 7) - 3) * 1.1}deg`,
              }}
            >
              {item.letter}
            </span>
          )
        )}
      </span>
    )
  )}
</h1>

            {article.subtitle && (
              <div className="blog-reader-poster-subtitle">
                {article.subtitle}
              </div>
            )}

            <small className="blog-reader-poster-meta">
              {isPdf
                ? (
                    activePart &&
                    articleParts.length > 0
                      ? `PDF документ · Део ${activePartIndex + 1} од ${articleParts.length}${
                          activePart.title
                            ? ` · ${activePart.title}`
                            : ""
                        }`
                      : "PDF документ"
                  )
                : "Текст / медијски блокови"}

              {pageCount > 0
                ? ` · ${pageCount} страна`
                : ""}
            </small>
          </>
        ) : (
          <>
            <p>
              {article.categories
                ?.name ||
                "Rad"}
            </p>

            <h1>
              {article.title}
            </h1>

            {article.subtitle && (
              <div>
                {article.subtitle}
              </div>
            )}

            <small>
              {isPdf
                ? (
                    activePart &&
                    articleParts.length > 0
                      ? `PDF dokument · Deo ${activePartIndex + 1} od ${articleParts.length}${
                          activePart.title
                            ? ` · ${activePart.title}`
                            : ""
                        }`
                      : "PDF dokument"
                  )
                : "Tekst"}

              {pageCount > 0
                ? ` · ${pageCount} strana`
                : ""}
            </small>
          </>
        )}
      </header>

      {isPdf ? (
        <PdfReaderContent
          key={activePartId}
          pdfUrl={
            activePdfUrl
          }
          viewMode={
            viewMode
          }
          navigationMode={
            navigationMode
          }
          currentPageIndex={
            currentPageIndex
          }
          onCurrentPageChange={
            setCurrentPageIndex
          }
          bookmarkPage={
            bookmarkPage
          }
          isBookmarkMode={
            isBookmarkMode
          }
          onSelectBookmarkPage={
            selectBookmarkPage
          }
          onPageCountChange={
            setPageCount
          }
          hasNextSection={
            Boolean(nextPart)
          }
          onNextSection={
            nextPart
              ? () =>
                  openPart(nextPart)
              : undefined
          }
          scrollEndContent={
            scrollEndContent
          }
        />
      ) : (
        <ManualReaderContent
          content={
            article.content
          }
          blocks={
            article.content_blocks
          }
          viewMode={
            viewMode
          }
          navigationMode={
            navigationMode
          }
          currentPageIndex={
            currentPageIndex
          }
          onCurrentPageChange={
            setCurrentPageIndex
          }
          bookmarkPage={
            bookmarkPage
          }
          isBookmarkMode={
            isBookmarkMode
          }
          onSelectBookmarkPage={
            selectBookmarkPage
          }
          onPageCountChange={
            setPageCount
          }
        />
      )}
    </section>
  );
}

export default ArticlePage;