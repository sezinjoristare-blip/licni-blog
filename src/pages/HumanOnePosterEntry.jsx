import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  getArticleProgress,
} from "../utils/articleProgress";

import "../styles/HumanOnePosters.css";


function HumanOnePosterEntry() {
  const {
    categorySlug,
    articleSlug,
  } = useParams();

  const navigate =
    useNavigate();


  const [
    article,
    setArticle,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    notFound,
    setNotFound,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  useEffect(() => {
    let active =
      true;


    async function loadArticle() {
      setLoading(true);

      setNotFound(false);

      setErrorMessage("");


      const {
        data,
        error,
      } = await supabase
        .from(
          "articles"
        )
        .select(`
          id,
          title,
          subtitle,
          excerpt,
          slug,
          cover_image_url,
          content_type,
          pdf_url,
          pdf_path,
          original_file_name,
          page_count,
          categories (
            id,
            name,
            slug
          ),
          article_parts (
            id,
            title,
            sort_order,
            pdf_url,
            pdf_path,
            original_file_name,
            page_count,
            created_at
          )
        `)
        .eq(
          "character_key",
          "covek-1"
        )
        .eq(
          "slug",
          articleSlug
        )
        .eq(
          "status",
          "published"
        )
        .maybeSingle();


      if (!active) {
        return;
      }


      if (error) {
        console.error(
          "Učitavanje teksta:",
          error
        );

        setErrorMessage(
          "Текст тренутно није могуће учитати."
        );

        setLoading(false);

        return;
      }


      if (
        !data ||
        data
          .categories
          ?.slug !==
        categorySlug
      ) {
        setNotFound(true);

        setLoading(false);

        return;
      }


      setArticle(
        data
      );

      setLoading(false);
    }


    loadArticle();


    return () => {
      active =
        false;
    };
  }, [
    articleSlug,
    categorySlug,
  ]);


  const parts =
    useMemo(
      () => {
        if (!article) {
          return [];
        }


        const storedParts =
          Array.isArray(
            article
              .article_parts
          )
            ? [
                ...article
                  .article_parts,
              ]
            : [];


        storedParts.sort(
          (
            first,
            second
          ) =>
            (
              first.sort_order ??
              0
            ) -
            (
              second.sort_order ??
              0
            )
        );


        return storedParts;
      },
      [
        article,
      ]
    );


  const savedProgress =
    article
      ? getArticleProgress(
          article.id
        )
      : null;


  useEffect(() => {
    if (
      !article ||
      loading
    ) {
      return;
    }


    /*
      Ručno napisan tekst:
      odmah postojeći reader.
    */

    if (
      article
        .content_type !==
      "pdf"
    ) {
      navigate(
        `/tekst/${article.slug}`,
        {
          replace:
            true,
        }
      );

      return;
    }


    /*
      Stari jednodelni PDF:
      odmah postojeći reader.
    */

    if (
      parts.length ===
        0 &&
      article.pdf_url
    ) {
      navigate(
        `/tekst/${article.slug}`,
        {
          replace:
            true,
        }
      );

      return;
    }


    /*
      Novi PDF sa jednim delom:
      nema potrebe za međuekranom.
    */

    if (
      parts.length ===
      1
    ) {
      navigate(
        `/tekst/${article.slug}?part=${parts[0].id}`,
        {
          replace:
            true,
        }
      );
    }
  }, [
    article,
    loading,
    navigate,
    parts,
  ]);


  if (notFound) {
    return (
      <Navigate
        to={
          `/autor/covek/posteri/${categorySlug}`
        }
        replace
      />
    );
  }


  function openPart(
    partId
  ) {
    navigate(
      `/tekst/${article.slug}?part=${partId}`
    );
  }


  function continueReading() {
    if (
      !savedProgress
        ?.partId
    ) {
      return;
    }


    if (
      savedProgress
        .partId ===
      "legacy"
    ) {
      navigate(
        `/tekst/${article.slug}`
      );

      return;
    }


    navigate(
      `/tekst/${article.slug}?part=${savedProgress.partId}`
    );
  }


  const canShowChooser =
    article
      ?.content_type ===
      "pdf" &&
    parts.length >
      1;


  return (
    <main className="human-one-posters">
      <div className="human-one-posters__shell">
        <Link
          to={
            `/autor/covek/posteri/${categorySlug}`
          }
          className="human-one-posters__back"
        >
          ← ТЕКСТОВИ
        </Link>


        {loading ? (
          <div className="human-one-posters__state">
            Учитавање...
          </div>

        ) : errorMessage ? (
          <div className="human-one-posters__state">
            {errorMessage}
          </div>

        ) : canShowChooser ? (
          <>
            <header className="human-one-posters__hero human-one-posters__hero--parts">
              <p>
                {article
                  .categories
                  ?.name ||
                  "СЕКИ / ПОСТЕРИ"}
              </p>

              <h1>
                {article.title}
              </h1>

              {article
                .subtitle ? (
                <span>
                  {
                    article
                      .subtitle
                  }
                </span>
              ) : null}
            </header>


            {savedProgress
              ?.partId &&
            parts.some(
              (part) =>
                part.id ===
                savedProgress
                  .partId
            ) ? (
              <button
                type="button"
                className="human-one-posters__continue"
                onClick={
                  continueReading
                }
              >
                <small>
                  НАСТАВИ ЧИТАЊЕ
                </small>

                <strong>
                  {parts.find(
                    (part) =>
                      part.id ===
                      savedProgress
                        .partId
                  )?.title ||
                    "Сачувани део"}
                </strong>

                {savedProgress
                  .page ? (
                  <span>
                    Страна
                    {" "}
                    {
                      savedProgress
                        .page
                    }
                  </span>
                ) : null}
              </button>
            ) : null}


            <section className="human-one-posters__parts">
              {parts.map(
                (
                  part,
                  index
                ) => (
                  <button
                    key={
                      part.id
                    }
                    type="button"
                    className="human-one-posters__part-card"
                    onClick={() =>
                      openPart(
                        part.id
                      )
                    }
                  >
                    <span>
                      {String(
                        index +
                        1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>


                    <div>
                      <small>
                        ДЕО
                        {" "}
                        {index + 1}
                      </small>

                      <h2>
                        {part.title ||
                          `Део ${index + 1}`}
                      </h2>

                      {part
                        .page_count ? (
                        <p>
                          {
                            part
                              .page_count
                          }
                          {" "}
                          страна
                        </p>
                      ) : null}
                    </div>


                    <strong
                      aria-hidden="true"
                    >
                      →
                    </strong>
                  </button>
                )
              )}
            </section>
          </>

        ) : (
          <div className="human-one-posters__state">
            Отварање reader-а...
          </div>
        )}
      </div>
    </main>
  );
}


export default HumanOnePosterEntry;