import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import LanguageMenuControl
  from "../components/LanguageSwitcher/LanguageMenuControl";

import {
  LANGUAGES,
} from "../i18n/constants";

import {
  useLanguage,
} from "../i18n/LanguageContext";

import {
  applyContentTranslation,
  getContentTranslation,
  getContentTranslations,
} from "../i18n/contentTranslations";

import {
  supabase,
} from "../lib/supabaseClient";

import "../styles/pages/ObalaArchiveReader.css";


const EVENT_ENTITY_TYPE =
  "obala_event";

const EVENT_BLOCK_ENTITY_TYPE =
  "obala_event_block";


function formatDate(
  value,
  language
) {
  if (!value) {
    return "";
  }


  return new Intl
    .DateTimeFormat(
      language ===
      LANGUAGES.EN
        ? "en-GB"
        : "sr-RS",
      {
        dateStyle:
          "long",

        timeStyle:
          "short",
      }
    )
    .format(
      new Date(
        value
      )
    );
}


function getYoutubeEmbedUrl(
  rawUrl
) {
  try {
    const url =
      new URL(
        rawUrl
      );

    const host =
      url.hostname
        .replace(
          /^www\./,
          ""
        )
        .toLowerCase();


    if (
      host ===
      "youtu.be"
    ) {
      const id =
        url.pathname
          .replace(
            "/",
            ""
          )
          .trim();


      return id
        ? `https://www.youtube.com/embed/${id}`
        : "";
    }


    if (
      host ===
        "youtube.com" ||
      host.endsWith(
        ".youtube.com"
      )
    ) {
      const id =
        url.searchParams
          .get(
            "v"
          );


      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }


      const match =
        url.pathname
          .match(
            /\/(?:embed|shorts)\/([^/?#]+)/
          );


      return match
        ? `https://www.youtube.com/embed/${match[1]}`
        : "";
    }
  } catch {
    return "";
  }


  return "";
}


function ObalaArchiveReader() {
  const navigate =
    useNavigate();


  const {
    language,
    t,
  } =
    useLanguage();


  const {
    sourceType,
    entryId,
  } = useParams();


  const rootRef =
    useRef(null);


  const titleRef =
    useRef(null);


  const [
    entry,
    setEntry,
  ] = useState(null);


  const [
    blocks,
    setBlocks,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  useEffect(() => {
    let active =
      true;


    async function loadEntry() {
      setLoading(
        true
      );

      setErrorMessage(
        ""
      );


      if (
        sourceType !==
        "pano"
      ) {
        if (active) {
          setErrorMessage(
            t(
              "obala.reader.unsupportedType",
              language ===
                LANGUAGES.EN
                ? "This part of the Obala archive is not connected yet."
                : "Ова врста Обалиног архива још није повезана."
            )
          );

          setLoading(
            false
          );
        }

        return;
      }


      const {
        data:
          eventData,
        error:
          eventError,
      } = await supabase
        .from(
          "obala_events"
        )
        .select(`
          id,
          title,
          category,
          location,
          event_date,
          poster_url
        `)
        .eq(
          "id",
          entryId
        )
        .eq(
          "status",
          "published"
        )
        .maybeSingle();


      if (!active) {
        return;
      }


      if (
        eventError ||
        !eventData
      ) {
        setErrorMessage(
          eventError?.message ||
          t(
            "obala.reader.eventNotFound",
            language ===
              LANGUAGES.EN
              ? "Event not found."
              : "Догађај није пронађен."
          )
        );

        setLoading(
          false
        );

        return;
      }


      const {
        data:
          blockData,
        error:
          blockError,
      } = await supabase
        .from(
          "obala_event_blocks"
        )
        .select(`
          id,
          block_type,
          position,
          text_content,
          media_url,
          media_storage_path,
          caption,
          sort_order
        `)
        .eq(
          "event_id",
          entryId
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        );


      if (!active) {
        return;
      }


      if (
        blockError
      ) {
        setErrorMessage(
          blockError.message
        );

        setLoading(
          false
        );

        return;
      }


      let nextEntry =
        eventData;

      let nextBlocks =
        blockData ?? [];


      if (
        language !==
        LANGUAGES.SR
      ) {
        try {
          const [
            eventTranslation,
            blockTranslationMap,
          ] =
            await Promise.all([
              getContentTranslation({
                entityType:
                  EVENT_ENTITY_TYPE,

                entityId:
                  String(
                    entryId
                  ),

                language,
              }),

              nextBlocks.length >
                0
                ? getContentTranslations({
                    entityType:
                      EVENT_BLOCK_ENTITY_TYPE,

                    entityIds:
                      nextBlocks.map(
                        (
                          block
                        ) =>
                          String(
                            block.id
                          )
                      ),

                    language,
                  })
                : Promise.resolve(
                    new Map()
                  ),
            ]);


          if (
            !active
          ) {
            return;
          }


          nextEntry =
            applyContentTranslation(
              eventData,
              eventTranslation
            );


          nextBlocks =
            nextBlocks.map(
              (
                block
              ) =>
                applyContentTranslation(
                  block,
                  blockTranslationMap.get(
                    String(
                      block.id
                    )
                  ) ||
                    null
                )
            );
        } catch (
          translationError
        ) {
          console.error(
            translationError
          );
        }
      }


      setEntry(
        nextEntry
      );

      setBlocks(
        nextBlocks
      );

      setLoading(
        false
      );
    }


    loadEntry();


    return () => {
      active =
        false;
    };
  }, [
    entryId,
    language,
    sourceType,
    t,
  ]);


  useEffect(() => {
    if (
      loading ||
      !rootRef.current
    ) {
      return undefined;
    }


    const elements =
      rootRef.current
        .querySelectorAll(
          "[data-obala-reveal]"
        );


    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      elements.forEach(
        (
          element
        ) =>
          element.classList.add(
            "is-visible"
          )
      );

      return undefined;
    }


    const observer =
      new IntersectionObserver(
        (
          entries
        ) => {
          entries.forEach(
            (
              observedEntry
            ) => {
              if (
                observedEntry
                  .isIntersecting
              ) {
                observedEntry
                  .target
                  .classList
                  .add(
                    "is-visible"
                  );

                observer
                  .unobserve(
                    observedEntry
                      .target
                  );
              }
            }
          );
        },
        {
          rootMargin:
            "0px 0px -8% 0px",

          threshold:
            0.12,
        }
      );


    elements.forEach(
      (
        element
      ) =>
        observer.observe(
          element
        )
    );


    return () => {
      observer.disconnect();
    };
  }, [
    blocks,
    loading,
  ]);


  const titleWords =
    useMemo(
      () => {
        const words =
          (
            entry?.title ||
            ""
          )
            .trim()
            .split(
              /\s+/
            )
            .filter(
              Boolean
            );


        let globalLetterIndex =
          0;


        return words.map(
          (
            word,
            wordIndex
          ) => {
            const letters =
              Array.from(
                word
              );


            const startIndex =
              globalLetterIndex;


            globalLetterIndex +=
              letters.length +
              1;


            return {
              word,
              wordIndex,
              letters,
              startIndex,
            };
          }
        );
      },
      [
        entry?.title,
      ]
    );


  useEffect(() => {
    const titleElement =
      titleRef.current;


    if (!titleElement) {
      return undefined;
    }


    let animationFrame =
      0;


    function fitTitleWords() {
      window.cancelAnimationFrame(
        animationFrame
      );


      animationFrame =
        window.requestAnimationFrame(
          () => {
            const availableWidth =
              titleElement
                .clientWidth;


            if (
              availableWidth <=
              0
            ) {
              return;
            }


            const wordElements =
              titleElement
                .querySelectorAll(
                  ".obala-archive-reader__title-word"
                );


            wordElements.forEach(
              (
                wordElement
              ) => {
                const inner =
                  wordElement
                    .querySelector(
                      ".obala-archive-reader__title-word-inner"
                    );


                if (!inner) {
                  return;
                }


                inner.style
                  .setProperty(
                    "--obala-word-scale",
                    "1"
                  );


                wordElement.style
                  .removeProperty(
                    "width"
                  );


                const naturalWidth =
                  inner.scrollWidth;


                if (
                  naturalWidth <=
                  0
                ) {
                  return;
                }


                const scale =
                  Math.min(
                    1,
                    availableWidth /
                      naturalWidth
                  );


                inner.style
                  .setProperty(
                    "--obala-word-scale",
                    String(
                      scale
                    )
                  );


                if (
                  scale <
                  1
                ) {
                  wordElement.style
                    .setProperty(
                      "width",
                      `${naturalWidth * scale}px`
                    );
                }
              }
            );
          }
        );
    }


    fitTitleWords();


    const resizeObserver =
      new ResizeObserver(
        fitTitleWords
      );


    resizeObserver.observe(
      titleElement
    );


    window.addEventListener(
      "resize",
      fitTitleWords
    );


    return () => {
      window.cancelAnimationFrame(
        animationFrame
      );

      resizeObserver.disconnect();

      window.removeEventListener(
        "resize",
        fitTitleWords
      );
    };
  }, [
    entry?.title,
  ]);


  function renderBlock(
    block,
    index
  ) {
    const position =
      block.position ||
      "full";


    const revealClass =
      `obala-archive-reader__reveal obala-archive-reader__reveal--${block.block_type} obala-archive-reader__reveal--${position}`;


    if (
      block.block_type ===
      "text"
    ) {
      return (
        <div
          key={
            block.id
          }
          className={
            `${revealClass} obala-archive-reader__text`
          }
          data-obala-reveal
          style={{
            "--obala-delay":
              `${Math.min(index, 6) * 45}ms`,
          }}
        >
          {
            block.text_content
          }
        </div>
      );
    }


    if (
      block.block_type ===
      "youtube"
    ) {
      const embedUrl =
        getYoutubeEmbedUrl(
          block.media_url
        );


      if (!embedUrl) {
        return null;
      }


      return (
        <figure
          key={
            block.id
          }
          className={
            `${revealClass} obala-archive-reader__media obala-archive-reader__media--${position}`
          }
          data-obala-reveal
          style={{
            "--obala-delay":
              `${Math.min(index, 6) * 45}ms`,
          }}
        >
          <div className="obala-archive-reader__video-frame">
            <iframe
              src={
                embedUrl
              }
              title={
                block.caption ||
                entry.title
              }
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>


          {block.caption && (
            <figcaption>
              {
                block.caption
              }
            </figcaption>
          )}
        </figure>
      );
    }


    if (
      block.block_type ===
      "video"
    ) {
      return (
        <figure
          key={
            block.id
          }
          className={
            `${revealClass} obala-archive-reader__media obala-archive-reader__media--${position}`
          }
          data-obala-reveal
          style={{
            "--obala-delay":
              `${Math.min(index, 6) * 45}ms`,
          }}
        >
          <div className="obala-archive-reader__video-frame">
            <video
              controls
              preload="metadata"
              src={
                block.media_url
              }
            />
          </div>


          {block.caption && (
            <figcaption>
              {
                block.caption
              }
            </figcaption>
          )}
        </figure>
      );
    }


    if (
      block.block_type ===
        "image" ||
      block.block_type ===
        "gif"
    ) {
      return (
        <figure
          key={
            block.id
          }
          className={
            `${revealClass} obala-archive-reader__media obala-archive-reader__media--${position}`
          }
          data-obala-reveal
          style={{
            "--obala-delay":
              `${Math.min(index, 6) * 45}ms`,
          }}
        >
          <div className="obala-archive-reader__image-mask">
            <img
              src={
                block.media_url
              }
              alt={
                block.caption ||
                ""
              }
            />
          </div>


          {block.caption && (
            <figcaption>
              {
                block.caption
              }
            </figcaption>
          )}
        </figure>
      );
    }


    return null;
  }


  if (
    loading
  ) {
    return (
      <main className="obala-archive-reader obala-archive-reader--state">
        {
          t(
            "obala.reader.loading",
            language ===
              LANGUAGES.EN
              ? "LOADING DOSSIER..."
              : "Учитавање досијеа..."
          )
        }
      </main>
    );
  }


  if (
    errorMessage ||
    !entry
  ) {
    return (
      <main className="obala-archive-reader obala-archive-reader--state">
        <p>
          {
            errorMessage
              ? errorMessage
              : t(
                  "obala.reader.dossierNotFound",
                  language ===
                    LANGUAGES.EN
                    ? "Dossier not found."
                    : "Досије није пронађен."
                )
          }
        </p>

        <button
          type="button"
          onClick={
            () =>
              navigate(
                "/autor/covek/obala/pano"
              )
          }
        >
          ← {
            t(
              "obala.board"
            )
          }
        </button>
      </main>
    );
  }


  return (
    <main
      ref={
        rootRef
      }
      className="obala-archive-reader"
    >
      <button
        type="button"
        className="obala-archive-reader__back"
        onClick={
          () =>
            navigate(
              "/autor/covek/obala/pano"
            )
        }
      >
        ← {
          t(
            "obala.board"
          )
        }
      </button>


      <LanguageMenuControl />


      <header className="obala-archive-reader__hero">
        <div className="obala-archive-reader__dossier">
          {
            t(
              "obala.reader.dossierLabel",
              language ===
                LANGUAGES.EN
                ? "OBALA / DOSSIER"
                : "ОБАЛА / ДОСИЈЕ"
            )
          }
        </div>


        <h1
          ref={
            titleRef
          }
          className="obala-archive-reader__animated-title"
          aria-label={
            entry.title
          }
        >
          {titleWords.map(
            (
              titleWord
            ) => (
              <span
                key={
                  `${titleWord.word}-${titleWord.wordIndex}`
                }
                className="obala-archive-reader__title-word"
                aria-hidden="true"
              >
                <span className="obala-archive-reader__title-word-inner">
                  {titleWord
                    .letters
                    .map(
                      (
                        letter,
                        localIndex
                      ) => {
                        const index =
                          titleWord
                            .startIndex +
                          localIndex;


                        return (
                          <span
                            key={
                              `${letter}-${index}`
                            }
                            className="obala-archive-reader__title-letter"
                            style={{
                              "--letter-index":
                                index,

                              "--letter-x":
                                `${((index % 5) - 2) * 11}px`,

                              "--letter-y":
                                `${((index % 3) - 1) * 13}px`,

                              "--letter-r":
                                `${((index % 7) - 3) * 1.4}deg`,
                            }}
                          >
                            {
                              letter
                            }
                          </span>
                        );
                      }
                    )}
                </span>
              </span>
            )
          )}
        </h1>


        <div className="obala-archive-reader__meta">
          <span>
            {
              entry.category
            }
          </span>

          <span>
            {
              formatDate(
                entry.event_date,
                language
              )
            }
          </span>

          {entry.location && (
            <span>
              {
                entry.location
              }
            </span>
          )}
        </div>
      </header>


      <article className="obala-archive-reader__body">
        {entry.poster_url && (
          <figure
            className="
              obala-archive-reader__opening-poster
              obala-archive-reader__reveal
              obala-archive-reader__reveal--right
            "
            data-obala-reveal
          >
            <div className="obala-archive-reader__image-mask">
              <img
                src={
                  entry.poster_url
                }
                alt=""
              />
            </div>
          </figure>
        )}


        {blocks.map(
          (
            block,
            index
          ) =>
            renderBlock(
              block,
              index
            )
        )}


        <div className="obala-archive-reader__clearfix" />
      </article>
    </main>
  );
}


export default ObalaArchiveReader;