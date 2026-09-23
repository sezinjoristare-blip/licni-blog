import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import "../styles/pages/HumanOneObalaNotebook.css";


const TOC_ITEMS_PER_PAGE =
  8;


function createTextElement(
  tagName,
  className,
  text
) {
  const element =
    document.createElement(
      tagName
    );

  element.className =
    className;

  element.textContent =
    text;

  return element;
}


function appendMeasureExtra(
  content,
  extraType,
  entry
) {
  if (
    extraType ===
      "media" &&
    entry.media
  ) {
    const media =
      document.createElement(
        "div"
      );

    media.className =
      `obala-notebook-reader__entry-extra obala-notebook-reader__entry-extra--media obala-notebook-reader__entry-extra--${entry.media.type || "link"}`;


    const icon =
      document.createElement(
        "span"
      );

    icon.className =
      "obala-notebook-reader__media-icon";

    icon.textContent =
      entry.media.type ===
      "audio"
        ? "♫"
        : "▶";


    const copy =
      document.createElement(
        "span"
      );

    copy.className =
      "obala-notebook-reader__media-copy";

    copy.textContent =
      entry.media.label ||
      "Песма / снимак";


    media.appendChild(
      icon
    );

    media.appendChild(
      copy
    );


    if (
      entry.media.type ===
      "audio"
    ) {
      const fakePlayer =
        document.createElement(
          "div"
        );

      fakePlayer.className =
        "obala-notebook-reader__media-audio-measure";

      media.appendChild(
        fakePlayer
      );
    }


    if (
      entry.media.type ===
      "video"
    ) {
      const fakeVideo =
        document.createElement(
          "div"
        );

      fakeVideo.className =
        "obala-notebook-reader__media-video-measure";

      media.appendChild(
        fakeVideo
      );
    }


    content.appendChild(
      media
    );
  }


  if (
    extraType ===
      "inspiration" &&
    entry.inspiration
  ) {
    const inspiration =
      document.createElement(
        "div"
      );

    inspiration.className =
      "obala-notebook-reader__entry-extra obala-notebook-reader__entry-extra--inspiration";

    inspiration.textContent =
      "ШТА МЕ ЈЕ ИНСПИРИСАЛО?";

    content.appendChild(
      inspiration
    );
  }
}


function pageFits(
  measureElement,
  entry,
  paragraphs,
  extras,
  showTitle
) {
  measureElement
    .replaceChildren();


  const content =
    document.createElement(
      "div"
    );

  content.className =
    "obala-notebook-reader__content";


  if (
    showTitle &&
    entry.title
  ) {
    content.appendChild(
      createTextElement(
        "h2",
        "obala-notebook-reader__entry-title",
        entry.title
      )
    );
  }


  paragraphs.forEach(
    (
      paragraph
    ) => {
      content.appendChild(
        createTextElement(
          "p",
          "obala-notebook-reader__paragraph",
          paragraph
        )
      );
    }
  );


  extras.forEach(
    (
      extraType
    ) => {
      appendMeasureExtra(
        content,
        extraType,
        entry
      );
    }
  );


  measureElement.appendChild(
    content
  );


  return (
    content.scrollHeight <=
    content.clientHeight + 1
  );
}


function paginateEntry(
  entry,
  measureElement
) {
  const result = [];

  let currentPage = {
    first:
      true,

    paragraphs: [],

    extras: [],
  };


  function pushCurrentPage() {
    if (
      currentPage.first ||
      currentPage
        .paragraphs
        .length > 0 ||
      currentPage
        .extras
        .length > 0
    ) {
      result.push({
        first:
          currentPage.first,

        paragraphs:
          [
            ...currentPage
              .paragraphs,
          ],

        extras:
          [
            ...currentPage
              .extras,
          ],
      });
    }


    currentPage = {
      first:
        false,

      paragraphs: [],

      extras: [],
    };
  }


  function tokenizeText(
    text
  ) {
    const lines =
      String(
        text || ""
      ).split(
        "\n"
      );

    const tokens = [];


    lines.forEach(
      (
        line,
        lineIndex
      ) => {
        const words =
          line
            .split(
              /\s+/
            )
            .filter(
              Boolean
            );


        words.forEach(
          (
            word
          ) => {
            tokens.push({
              type:
                "word",

              value:
                word,
            });
          }
        );


        if (
          lineIndex <
          lines.length - 1
        ) {
          tokens.push({
            type:
              "break",
          });
        }
      }
    );


    return tokens;
  }


  function tokensToText(
    tokens
  ) {
    let output =
      "";


    tokens.forEach(
      (
        token
      ) => {
        if (
          token.type ===
          "break"
        ) {
          output =
            output.replace(
              /[ \t]+$/g,
              ""
            );

          output +=
            "\n";

          return;
        }


        if (
          output &&
          !output.endsWith(
            "\n"
          )
        ) {
          output +=
            " ";
        }


        output +=
          token.value;
      }
    );


    return output
      .replace(
        /[ \t]+\n/g,
        "\n"
      )
      .replace(
        /\n+$/g,
        ""
      );
  }


  entry.paragraphs
    .filter(
      (
        paragraph
      ) =>
        Boolean(
          paragraph
            ?.trim()
        )
    )
    .forEach(
      (
        paragraph
      ) => {
        const tokens =
          tokenizeText(
            paragraph
          );

        let chunkTokens =
          [];


        tokens.forEach(
          (
            token
          ) => {
            const candidateTokens =
              [
                ...chunkTokens,
                token,
              ];


            const candidateText =
              tokensToText(
                candidateTokens
              );


            const candidateParagraphs =
              [
                ...currentPage
                  .paragraphs,

                candidateText,
              ];


            const fits =
              pageFits(
                measureElement,
                entry,
                candidateParagraphs,
                currentPage.extras,
                currentPage.first
              );


            if (fits) {
              chunkTokens =
                candidateTokens;

              return;
            }


            const finishedChunk =
              tokensToText(
                chunkTokens
              );


            if (
              finishedChunk
            ) {
              currentPage
                .paragraphs
                .push(
                  finishedChunk
                );
            }


            pushCurrentPage();


            /*
             * Ako je baš novi red prelomio stranicu,
             * ne počinjemo novu stranu praznim redom.
             */
            if (
              token.type ===
              "break"
            ) {
              chunkTokens =
                [];

              return;
            }


            chunkTokens = [
              token,
            ];
          }
        );


        const remainingText =
          tokensToText(
            chunkTokens
          );


        if (
          !remainingText
        ) {
          return;
        }


        const finalCandidate =
          [
            ...currentPage
              .paragraphs,

            remainingText,
          ];


        if (
          pageFits(
            measureElement,
            entry,
            finalCandidate,
            currentPage.extras,
            currentPage.first
          )
        ) {
          currentPage
            .paragraphs
            .push(
              remainingText
            );

          return;
        }


        pushCurrentPage();

        currentPage
          .paragraphs
          .push(
            remainingText
          );
      }
    );


  /*
   * DODACI IDU POSLE TEKSTA.
   *
   * Ako stanu na poslednju stranu teksta,
   * ostaju na njoj.
   *
   * Ako ne stanu, reader automatski pravi
   * novu stranu istog zapisa.
   */

  const entryExtras = [];


  if (
    entry.media
  ) {
    entryExtras.push(
      "media"
    );
  }


  if (
    entry.inspiration
  ) {
    entryExtras.push(
      "inspiration"
    );
  }


  entryExtras.forEach(
    (
      extraType
    ) => {
      const candidateExtras =
        [
          ...currentPage
            .extras,

          extraType,
        ];


      if (
        pageFits(
          measureElement,
          entry,
          currentPage.paragraphs,
          candidateExtras,
          currentPage.first
        )
      ) {
        currentPage
          .extras
          .push(
            extraType
          );

        return;
      }


      pushCurrentPage();

      currentPage
        .extras
        .push(
          extraType
        );
    }
  );


  if (
    currentPage.first ||
    currentPage
      .paragraphs
      .length > 0 ||
    currentPage
      .extras
      .length > 0
  ) {
    result.push({
      first:
        currentPage.first,

      paragraphs:
        [
          ...currentPage
            .paragraphs,
        ],

      extras:
        [
          ...currentPage
            .extras,
        ],
    });
  }


  return result;
}


function splitNotebookText(
  rawText
) {
  const text =
    String(
      rawText || ""
    )
      .replace(
        /\r\n/g,
        "\n"
      )
      .replace(
        /\r/g,
        "\n"
      )
      .replace(
        /[ \t]+$/gm,
        ""
      )
      .trim();


  if (!text) {
    return [];
  }


  /*
   * Namerno NE delimo tekst na pasuse.
   * Ceo unos ostaje jedan niz sa istim \n znakovima
   * koje je korisnik uneo u adminu.
   */
  return [
    text,
  ];
}


function mapDatabaseEntry(
  row
) {
  const hasMedia =
    Boolean(
      row.media_type &&
      row.media_url
    );


  const hasInspiration =
    Boolean(
      row.inspiration_body
        ?.trim()
    );


  return {
    id:
      row.id,

    title:
      row.title,

    paragraphs:
      splitNotebookText(
        row.body
      ),

    media:
      hasMedia
        ? {
            type:
              row.media_type,

            label:
              row.media_label ||
              (
                row.media_type ===
                "youtube"
                  ? "Послушај / погледај"
                  : row.media_type ===
                    "audio"
                    ? "Аудио снимак"
                    : "Видео снимак"
              ),

            url:
              row.media_url,
          }
        : null,

    inspiration:
      hasInspiration
        ? {
            title:
              row.inspiration_title ||
              "Шта ме је инспирисало?",

            paragraphs:
              splitNotebookText(
                row.inspiration_body
              ),
          }
        : null,
  };
}


function getIsSinglePage() {
  return window.matchMedia(
    "(max-width: 760px) and (orientation: portrait)"
  ).matches;
}


function HumanOneObalaNotebook() {
  const navigate =
    useNavigate();


  const bookRef =
    useRef(null);

  const measureRef =
    useRef(null);

  const pointerStartRef =
    useRef(null);


  const [
    isSinglePage,
    setIsSinglePage,
  ] = useState(
    getIsSinglePage
  );


  const [
    layoutVersion,
    setLayoutVersion,
  ] = useState(0);


  const [
    builtPages,
    setBuiltPages,
  ] = useState([]);


  const [
    tocItems,
    setTocItems,
  ] = useState([]);


  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);


  const [
    isReady,
    setIsReady,
  ] = useState(false);


  const [
    activeInspiration,
    setActiveInspiration,
  ] = useState(null);


  const [
    notebookEntries,
    setNotebookEntries,
  ] = useState([]);


  const [
    entriesLoading,
    setEntriesLoading,
  ] = useState(true);


  const [
    entriesError,
    setEntriesError,
  ] = useState("");


  const visiblePageCount =
    isSinglePage
      ? 1
      : 2;


  /* ===================================================
     UČITAVANJE OBJAVLJENIH TEKSTOVA IZ SUPABASE-A
     =================================================== */

  useEffect(() => {
    let active =
      true;


    async function loadEntries() {
      setEntriesLoading(
        true
      );

      setEntriesError(
        ""
      );


      const {
        data,
        error,
      } = await supabase
        .from(
          "obala_notebook_entries"
        )
        .select(`
          id,
          title,
          body,
          media_type,
          media_label,
          media_url,
          inspiration_title,
          inspiration_body,
          sort_order,
          created_at
        `)
        .eq(
          "status",
          "published"
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        )
        .order(
          "created_at",
          {
            ascending:
              true,
          }
        );


      if (!active) {
        return;
      }


      if (error) {
        setNotebookEntries(
          []
        );

        setEntriesError(
          error.message ||
          "Свеска тренутно није могла да се учита."
        );

        setEntriesLoading(
          false
        );

        return;
      }


      setNotebookEntries(
        (
          data ?? []
        ).map(
          mapDatabaseEntry
        )
      );

      setEntriesLoading(
        false
      );
    }


    loadEntries();


    return () => {
      active =
        false;
    };
  }, []);


  /* ===================================================
     RESPONSIVE MODE
     =================================================== */

  useEffect(() => {
    const media =
      window.matchMedia(
        "(max-width: 760px) and (orientation: portrait)"
      );


    function handleMediaChange() {
      setIsSinglePage(
        media.matches
      );
    }


    media.addEventListener(
      "change",
      handleMediaChange
    );


    return () => {
      media.removeEventListener(
        "change",
        handleMediaChange
      );
    };
  }, []);


  /* ===================================================
     RESIZE — PONOVO IZRAČUNAJ STRANE
     =================================================== */

  useEffect(() => {
    if (
      !bookRef.current
    ) {
      return undefined;
    }


    let frameId = null;


    const observer =
      new ResizeObserver(
        () => {
          if (
            frameId !==
            null
          ) {
            cancelAnimationFrame(
              frameId
            );
          }


          frameId =
            requestAnimationFrame(
              () => {
                setLayoutVersion(
                  (
                    current
                  ) =>
                    current + 1
                );
              }
            );
        }
      );


    observer.observe(
      bookRef.current
    );


    return () => {
      observer.disconnect();


      if (
        frameId !==
        null
      ) {
        cancelAnimationFrame(
          frameId
        );
      }
    };
  }, []);


  /* ===================================================
     PAGINACIJA
     =================================================== */

  useLayoutEffect(() => {
    const measureElement =
      measureRef.current;


    if (
      !measureElement
    ) {
      return;
    }


    setIsReady(
      false
    );


    const contentPages = [];

    const nextTocItems = [];

    let contentPageNumber =
      1;


    notebookEntries.forEach(
      (
        entry
      ) => {
        const entryPages =
          paginateEntry(
            entry,
            measureElement
          );


        nextTocItems.push({
          id:
            entry.id,

          title:
            entry.title,

          startPageNumber:
            contentPageNumber,

          contentOffset:
            contentPages
              .length,
        });


        entryPages.forEach(
          (
            entryPage
          ) => {
            contentPages.push({
              kind:
                "content",

              entryId:
                entry.id,

              entryTitle:
                entry.title,

              first:
                entryPage.first,

              paragraphs:
                entryPage
                  .paragraphs,

              extras:
                entryPage
                  .extras || [],

              media:
                entry.media ||
                null,

              inspiration:
                entry.inspiration ||
                null,

              pageNumber:
                contentPageNumber,
            });


            contentPageNumber +=
              1;
          }
        );
      }
    );


    const tocPageCount =
      Math.max(
        1,
        Math.ceil(
          nextTocItems
            .length /
          TOC_ITEMS_PER_PAGE
        )
      );


    const introPages = [
      {
        kind:
          "inside-front",
      },
    ];


    for (
      let tocPageIndex = 0;
      tocPageIndex <
      tocPageCount;
      tocPageIndex += 1
    ) {
      introPages.push({
        kind:
          "toc",

        tocPageIndex,
      });
    }


    /*
     * Na desktopu sadržaj uvek počinje
     * na levoj strani novog otvaranja.
     *
     * Uvodne prazne strane NISU numerisane.
     */

    if (
      introPages.length %
      2 !==
      0
    ) {
      introPages.push({
        kind:
          "intro-blank",
      });
    }


    const firstContentIndex =
      introPages.length;


    const absoluteTocItems =
      nextTocItems.map(
        (
          item
        ) => ({
          ...item,

          absoluteIndex:
            firstContentIndex +
            item.contentOffset,
        })
      );


    const allPages = [
      ...introPages,
      ...contentPages,
    ];


    /*
     * Unutrašnja zadnja korica uvek ide
     * na desnu stranu kada gledamo dve strane.
     */

    if (
      allPages.length %
      2 ===
      0
    ) {
      allPages.push({
        kind:
          "back-blank",
      });
    }


    allPages.push({
      kind:
        "inside-back",
    });


    setTocItems(
      absoluteTocItems
    );

    setBuiltPages(
      allPages
    );

    setCurrentIndex(
      (
        current
      ) => {
        const maximumIndex =
          Math.max(
            0,
            allPages.length -
            visiblePageCount
          );


        const clamped =
          Math.min(
            current,
            maximumIndex
          );


        if (
          visiblePageCount ===
          2
        ) {
          return (
            Math.floor(
              clamped / 2
            ) * 2
          );
        }


        return clamped;
      }
    );

    setIsReady(
      true
    );
  }, [
    layoutVersion,
    isSinglePage,
    notebookEntries,
    visiblePageCount,
  ]);


  /* ===================================================
     NAVIGACIJA
     =================================================== */

  const goBack =
    useCallback(
      () => {
        navigate(
          "/autor/covek/obala"
        );
      },
      [
        navigate,
      ]
    );


  const goPrevious =
    useCallback(
      () => {
        setCurrentIndex(
          (
            current
          ) =>
            Math.max(
              0,
              current -
              visiblePageCount
            )
        );
      },
      [
        visiblePageCount,
      ]
    );


  const goNext =
    useCallback(
      () => {
        setCurrentIndex(
          (
            current
          ) => {
            const maximumIndex =
              Math.max(
                0,
                builtPages.length -
                visiblePageCount
              );


            return Math.min(
              maximumIndex,
              current +
              visiblePageCount
            );
          }
        );
      },
      [
        builtPages.length,
        visiblePageCount,
      ]
    );


  function jumpToPage(
    absoluteIndex
  ) {
    if (
      visiblePageCount ===
      2
    ) {
      setCurrentIndex(
        Math.floor(
          absoluteIndex / 2
        ) * 2
      );

      return;
    }


    setCurrentIndex(
      absoluteIndex
    );
  }


  /* ===================================================
     TASTATURA
     =================================================== */

  useEffect(() => {
    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "ArrowLeft"
      ) {
        goPrevious();
      }


      if (
        event.key ===
        "ArrowRight"
      ) {
        goNext();
      }


      if (
        event.key ===
        "Escape"
      ) {
        if (
          activeInspiration
        ) {
          setActiveInspiration(
            null
          );

          return;
        }


        goBack();
      }
    }


    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    activeInspiration,
    goBack,
    goNext,
    goPrevious,
  ]);


  /* ===================================================
     SWIPE
     =================================================== */

  function shouldIgnorePageSwipe(
    target
  ) {
    if (
      !(target instanceof Element)
    ) {
      return false;
    }


    return Boolean(
      target.closest(
        "a, button, audio, video, input, textarea, select, [role='button'], [data-no-page-swipe]"
      )
    );
  }


  function handlePointerDown(
    event
  ) {
    /*
     * Listanje ne započinjemo preko interaktivnih
     * elemenata. Tako pomeranje audio/video timeline-a,
     * klik na sadržaj ili link ne može slučajno da
     * okrene stranu.
     */
    if (
      !event.isPrimary ||
      (
        event.pointerType ===
          "mouse" &&
        event.button !== 0
      ) ||
      shouldIgnorePageSwipe(
        event.target
      )
    ) {
      pointerStartRef.current =
        null;

      return;
    }


    pointerStartRef.current = {
      pointerId:
        event.pointerId,

      x:
        event.clientX,

      y:
        event.clientY,
    };
  }


  function handlePointerUp(
    event
  ) {
    const start =
      pointerStartRef.current;


    pointerStartRef.current =
      null;


    if (
      !start ||
      start.pointerId !==
        event.pointerId
    ) {
      return;
    }


    const deltaX =
      event.clientX -
      start.x;

    const deltaY =
      event.clientY -
      start.y;


    if (
      Math.abs(
        deltaX
      ) < 55 ||
      Math.abs(
        deltaX
      ) <=
      Math.abs(
        deltaY
      )
    ) {
      return;
    }


    if (
      deltaX < 0
    ) {
      goNext();

      return;
    }


    goPrevious();
  }


  function handlePointerCancel(
    event
  ) {
    const start =
      pointerStartRef.current;


    if (
      !start ||
      start.pointerId ===
        event.pointerId
    ) {
      pointerStartRef.current =
        null;
    }
  }


  /* ===================================================
     TOC STRANE
     =================================================== */

  const tocPages =
    useMemo(
      () => {
        const chunks = [];


        for (
          let index = 0;
          index <
          tocItems.length;
          index +=
          TOC_ITEMS_PER_PAGE
        ) {
          chunks.push(
            tocItems.slice(
              index,
              index +
              TOC_ITEMS_PER_PAGE
            )
          );
        }


        return chunks.length >
          0
          ? chunks
          : [
              [],
            ];
      },
      [
        tocItems,
      ]
    );


  /* ===================================================
     DODACI NA KRAJU TEKSTA
     =================================================== */

  function renderMedia(
    page
  ) {
    const media =
      page.media;


    if (!media) {
      return null;
    }


    const label =
      media.label ||
      "Песма / снимак";


    if (
      media.type ===
      "audio"
    ) {
      return (
        <div
          className="
            obala-notebook-reader__entry-extra
            obala-notebook-reader__entry-extra--media
            obala-notebook-reader__entry-extra--audio
          "
        >
          <div className="obala-notebook-reader__media-heading">
            <span
              className="obala-notebook-reader__media-icon"
              aria-hidden="true"
            >
              ♫
            </span>

            <strong>
              {
                label
              }
            </strong>
          </div>


          <audio
            className="obala-notebook-reader__audio"
            controls
            preload="metadata"
            src={
              media.url
            }
          />
        </div>
      );
    }


    if (
      media.type ===
      "video"
    ) {
      return (
        <div
          className="
            obala-notebook-reader__entry-extra
            obala-notebook-reader__entry-extra--media
            obala-notebook-reader__entry-extra--video
          "
        >
          <div className="obala-notebook-reader__media-heading">
            <span
              className="obala-notebook-reader__media-icon"
              aria-hidden="true"
            >
              ▶
            </span>

            <strong>
              {
                label
              }
            </strong>
          </div>


          <video
            className="obala-notebook-reader__video"
            controls
            preload="metadata"
            src={
              media.url
            }
          />
        </div>
      );
    }


    return (
      <a
        className="
          obala-notebook-reader__entry-extra
          obala-notebook-reader__entry-extra--media
          obala-notebook-reader__entry-extra--link
        "
        href={
          media.url
        }
        target="_blank"
        rel="noreferrer"
      >
        <span
          className="obala-notebook-reader__media-icon"
          aria-hidden="true"
        >
          ▶
        </span>

        <span className="obala-notebook-reader__media-copy">
          {
            label
          }
        </span>
      </a>
    );
  }


  function renderEntryExtra(
    extraType,
    page,
    extraIndex
  ) {
    if (
      extraType ===
      "media"
    ) {
      return (
        <div
          key={
            `media-${page.entryId}-${extraIndex}`
          }
        >
          {
            renderMedia(
              page
            )
          }
        </div>
      );
    }


    if (
      extraType ===
      "inspiration" &&
      page.inspiration
    ) {
      return (
        <button
          key={
            `inspiration-${page.entryId}-${extraIndex}`
          }
          type="button"
          className="
            obala-notebook-reader__entry-extra
            obala-notebook-reader__entry-extra--inspiration
          "
          onClick={
            () =>
              setActiveInspiration({
                entryTitle:
                  page.entryTitle,

                title:
                  page
                    .inspiration
                    .title ||
                  "Шта ме је инспирисало?",

                paragraphs:
                  page
                    .inspiration
                    .paragraphs ||
                  [],
              })
          }
        >
          ШТА МЕ ЈЕ ИНСПИРИСАЛО?
        </button>
      );
    }


    return null;
  }


  /* ===================================================
     RENDER JEDNE STRANE
     =================================================== */

  function renderPage(
    page,
    absoluteIndex
  ) {
    if (!page) {
      return (
        <article
          className="
            obala-notebook-reader__paper
            obala-notebook-reader__paper--empty
          "
          aria-hidden="true"
        />
      );
    }


    if (
      page.kind ===
      "inside-front"
    ) {
      return (
        <article
          className="
            obala-notebook-reader__paper
            obala-notebook-reader__paper--art
          "
        >
          <img
            src="/images/human-one/obala/obala-notebook-inside-front.png"
            alt="Прва унутрашња корица свеске"
            draggable="false"
          />
        </article>
      );
    }


    if (
      page.kind ===
      "inside-back"
    ) {
      return (
        <article
          className="
            obala-notebook-reader__paper
            obala-notebook-reader__paper--art
          "
        >
          <img
            src="/images/human-one/obala/obala-notebook-inside-back.png"
            alt="Последња унутрашња корица свеске"
            draggable="false"
          />
        </article>
      );
    }


    if (
      page.kind ===
        "intro-blank" ||
      page.kind ===
        "back-blank"
    ) {
      return (
        <article
          className="
            obala-notebook-reader__paper
            obala-notebook-reader__paper--blank
          "
          aria-hidden="true"
        >
          <span>
            ✶
          </span>
        </article>
      );
    }


    if (
      page.kind ===
      "toc"
    ) {
      const items =
        tocPages[
          page.tocPageIndex
        ] || [];


      return (
        <article
          className="
            obala-notebook-reader__paper
            obala-notebook-reader__paper--toc
          "
        >
          <div className="obala-notebook-reader__content">
            <h2 className="obala-notebook-reader__toc-title">
              САДРЖАЈ
            </h2>


            <div className="obala-notebook-reader__toc-list">
              {items.length ===
                0 ? (
                <p className="obala-notebook-reader__toc-empty">
                  Још нема објављених записа.
                </p>
              ) : (
                items.map(
                  (
                    item
                  ) => (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    className="obala-notebook-reader__toc-item"
                    onClick={
                      () =>
                        jumpToPage(
                          item
                            .absoluteIndex
                        )
                    }
                  >
                    <span className="obala-notebook-reader__toc-name">
                      {
                        item.title
                      }
                    </span>

                    <span
                      className="obala-notebook-reader__toc-dots"
                      aria-hidden="true"
                    />

                    <span className="obala-notebook-reader__toc-page">
                      стр.{" "}
                      {
                        item
                          .startPageNumber
                      }
                    </span>
                  </button>
                  )
                )
              )}
            </div>


            {tocPages.length >
              1 && (
              <div className="obala-notebook-reader__toc-counter">
                {
                  page.tocPageIndex +
                  1
                }
                /
                {
                  tocPages.length
                }
              </div>
            )}
          </div>
        </article>
      );
    }


    if (
      page.kind ===
      "content"
    ) {
      return (
        <article
          className="
            obala-notebook-reader__paper
            obala-notebook-reader__paper--text
          "
        >
          <div className="obala-notebook-reader__content">
            {page.first && (
              <h2 className="obala-notebook-reader__entry-title">
                {
                  page.entryTitle
                }
              </h2>
            )}


            {page.paragraphs.map(
              (
                paragraph,
                paragraphIndex
              ) => (
                <p
                  key={
                    `${page.entryId}-${absoluteIndex}-${paragraphIndex}`
                  }
                  className="obala-notebook-reader__paragraph"
                >
                  {
                    paragraph
                  }
                </p>
              )
            )}


            {page.extras?.map(
              (
                extraType,
                extraIndex
              ) =>
                renderEntryExtra(
                  extraType,
                  page,
                  extraIndex
                )
            )}
          </div>


          <span className="obala-notebook-reader__page-number">
            {
              page.pageNumber
            }
          </span>
        </article>
      );
    }


    return null;
  }


  const leftPage =
    builtPages[
      currentIndex
    ];


  const rightPage =
    isSinglePage
      ? null
      : builtPages[
          currentIndex + 1
        ];


  const canGoPrevious =
    currentIndex > 0;


  const canGoNext =
    currentIndex +
    visiblePageCount <
    builtPages.length;


  return (
    <main className="obala-notebook-reader">
      <div className="obala-notebook-reader__topbar">
        <button
          type="button"
          className="obala-notebook-reader__back"
          onClick={
            goBack
          }
        >
          ← ОБАЛА
        </button>


        <span className="obala-notebook-reader__hint">
          ← → за листање
        </span>
      </div>


      <section
        ref={
          bookRef
        }
        className={
          isSinglePage
            ? "obala-notebook-reader__book obala-notebook-reader__book--single"
            : "obala-notebook-reader__book"
        }
        onPointerDown={
          handlePointerDown
        }
        onPointerUp={
          handlePointerUp
        }
        onPointerCancel={
          handlePointerCancel
        }
      >
        {(entriesLoading ||
          !isReady ||
          entriesError) && (
          <div className="obala-notebook-reader__loading">
            {entriesError
              ? (
                <>
                  <strong>
                    Свеска није могла да се учита.
                  </strong>

                  <span>
                    {
                      entriesError
                    }
                  </span>
                </>
              )
              : entriesLoading
                ? "Учитавам свеску..."
                : "Слажем странице..."}
          </div>
        )}


        <div
          ref={
            measureRef
          }
          className="
            obala-notebook-reader__paper
            obala-notebook-reader__paper--measure
          "
          aria-hidden="true"
        />


        <div className="obala-notebook-reader__page-slot obala-notebook-reader__page-slot--left">
          {isReady &&
            renderPage(
              leftPage,
              currentIndex
            )}
        </div>


        {!isSinglePage && (
          <>
            <div
              className="obala-notebook-reader__spine"
              aria-hidden="true"
            >
              {Array.from({
                length:
                  18,
              }).map(
                (
                  _,
                  index
                ) => (
                  <i
                    key={
                      index
                    }
                  />
                )
              )}
            </div>


            <div className="obala-notebook-reader__page-slot obala-notebook-reader__page-slot--right">
              {isReady &&
                renderPage(
                  rightPage,
                  currentIndex +
                  1
                )}
            </div>
          </>
        )}
      </section>


      <div className="obala-notebook-reader__controls">
        <button
          type="button"
          className="obala-notebook-reader__turn"
          onClick={
            goPrevious
          }
          disabled={
            !canGoPrevious
          }
          aria-label="Претходна страна"
        >
          ←
        </button>


        <button
          type="button"
          className="obala-notebook-reader__contents-button"
          onClick={
            () =>
              jumpToPage(
                1
              )
          }
        >
          САДРЖАЈ
        </button>


        <button
          type="button"
          className="obala-notebook-reader__turn"
          onClick={
            goNext
          }
          disabled={
            !canGoNext
          }
          aria-label="Следећа страна"
        >
          →
        </button>
      </div>


      {activeInspiration && (
        <div
          className="obala-notebook-inspiration"
          role="presentation"
          onPointerDown={
            (
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setActiveInspiration(
                  null
                );
              }
            }
          }
        >
          <article
            className="obala-notebook-inspiration__paper"
            role="dialog"
            aria-modal="true"
            aria-labelledby="obala-notebook-inspiration-title"
          >
            <button
              type="button"
              className="obala-notebook-inspiration__close"
              onClick={
                () =>
                  setActiveInspiration(
                    null
                  )
              }
              aria-label="Затвори"
            >
              ×
            </button>


            <span className="obala-notebook-inspiration__eyebrow">
              {
                activeInspiration
                  .entryTitle
              }
            </span>


            <h2
              id="obala-notebook-inspiration-title"
            >
              {
                activeInspiration
                  .title
              }
            </h2>


            <div className="obala-notebook-inspiration__text">
              {activeInspiration
                .paragraphs
                .map(
                  (
                    paragraph,
                    index
                  ) => (
                    <p
                      key={
                        index
                      }
                    >
                      {
                        paragraph
                      }
                    </p>
                  )
                )}
            </div>
          </article>
        </div>
      )}
    </main>
  );
}


export default HumanOneObalaNotebook;
