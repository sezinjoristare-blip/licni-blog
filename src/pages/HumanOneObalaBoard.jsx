import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
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
  getContentTranslations,
} from "../i18n/contentTranslations";

import {
  supabase,
} from "../lib/supabaseClient";

import "../styles/pages/HumanOneObalaBoard.css";


const EVENT_ENTITY_TYPE =
  "obala_event";


function getEventYear(
  event
) {
  return new Date(
    event.event_date
  ).getFullYear();
}


function getEventState(
  event,
  now
) {
  const visibleFrom =
    new Date(
      event.visible_from
    ).getTime();

  const expiresAt =
    new Date(
      event.expires_at
    ).getTime();

  const nowTime =
    now.getTime();


  if (
    nowTime <
    visibleFrom
  ) {
    return "future";
  }


  if (
    nowTime >
    expiresAt
  ) {
    return "archive";
  }


  return "current";
}


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
          "medium",

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


function HumanOneObalaBoard() {
  const navigate =
    useNavigate();


  const {
    language,
    t,
  } =
    useLanguage();


  const [
    mode,
    setMode,
  ] = useState(
    "current"
  );


  const [
    events,
    setEvents,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  const [
    openFolder,
    setOpenFolder,
  ] = useState(null);


  useEffect(() => {
    let active =
      true;


    async function loadEvents() {
      setLoading(
        true
      );

      setErrorMessage(
        ""
      );


      const {
        data,
        error,
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
          visible_from,
          expires_at,
          poster_url,
          sort_order
        `)
        .eq(
          "status",
          "published"
        )
        .order(
          "event_date",
          {
            ascending:
              false,
          }
        );


      if (!active) {
        return;
      }


      if (error) {
        setEvents(
          []
        );

        setErrorMessage(
          error.message ||
          t(
            "obala.boardPage.loadError",
            language ===
              LANGUAGES.EN
              ? "The board could not be loaded right now."
              : "Пано тренутно није могао да се учита."
          )
        );

        setLoading(
          false
        );

        return;
      }


      const originalEvents =
        data ?? [];


      let nextEvents =
        originalEvents;


      if (
        language !==
          LANGUAGES.SR &&
        originalEvents.length >
          0
      ) {
        try {
          const translationMap =
            await getContentTranslations({
              entityType:
                EVENT_ENTITY_TYPE,

              entityIds:
                originalEvents.map(
                  (
                    event
                  ) =>
                    String(
                      event.id
                    )
                ),

              language,
            });


          if (
            !active
          ) {
            return;
          }


          nextEvents =
            originalEvents.map(
              (
                event
              ) =>
                applyContentTranslation(
                  event,
                  translationMap.get(
                    String(
                      event.id
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


      setEvents(
        nextEvents
      );

      setLoading(
        false
      );
    }


    loadEvents();


    return () => {
      active =
        false;
    };
  }, [
    language,
    t,
  ]);


  const now =
    useMemo(
      () =>
        new Date(),
      []
    );


  const currentEvents =
    useMemo(
      () =>
        events
          .filter(
            (
              event
            ) =>
              getEventState(
                event,
                now
              ) ===
              "current"
          )
          .sort(
            (
              a,
              b
            ) => {
              const orderDifference =
                (
                  a.sort_order ??
                  0
                ) -
                (
                  b.sort_order ??
                  0
                );


              if (
                orderDifference !==
                0
              ) {
                return orderDifference;
              }


              return (
                new Date(
                  a.event_date
                ).getTime() -
                new Date(
                  b.event_date
                ).getTime()
              );
            }
          ),
      [
        events,
        now,
      ]
    );


  const archivedEvents =
    useMemo(
      () =>
        events.filter(
          (
            event
          ) =>
            getEventState(
              event,
              now
            ) ===
            "archive"
        ),
      [
        events,
        now,
      ]
    );


  const archiveYears =
    useMemo(
      () => {
        const grouped =
          new Map();


        archivedEvents.forEach(
          (
            event
          ) => {
            const year =
              getEventYear(
                event
              );

            const category =
              (
                event.category ||
                t(
                  "obala.boardPage.otherCategory",
                  language ===
                    LANGUAGES.EN
                    ? "Other"
                    : "Остало"
                )
              ).trim();


            if (
              !grouped.has(
                year
              )
            ) {
              grouped.set(
                year,
                new Map()
              );
            }


            const yearMap =
              grouped.get(
                year
              );


            if (
              !yearMap.has(
                category
              )
            ) {
              yearMap.set(
                category,
                []
              );
            }


            yearMap
              .get(
                category
              )
              .push(
                event
              );
          }
        );


        return [
          ...grouped.entries(),
        ]
          .sort(
            (
              [yearA],
              [yearB]
            ) =>
              yearB -
              yearA
          )
          .map(
            (
              [
                year,
                categories,
              ]
            ) => ({
              year,

              categories:
                [
                  ...categories.entries(),
                ]
                  .sort(
                    (
                      [a],
                      [b]
                    ) =>
                      a.localeCompare(
                        b,
                        language ===
                          LANGUAGES.EN
                          ? "en"
                          : "sr"
                      )
                  )
                  .map(
                    (
                      [
                        category,
                        categoryEvents,
                      ]
                    ) => ({
                      category,

                      events:
                        categoryEvents.sort(
                          (
                            a,
                            b
                          ) =>
                            new Date(
                              b.event_date
                            ).getTime() -
                            new Date(
                              a.event_date
                            ).getTime()
                        ),
                    })
                  ),
            })
          );
      },
      [
        archivedEvents,
        language,
        t,
      ]
    );


  function openEvent(
    eventId
  ) {
    navigate(
      `/autor/covek/obala/reader/pano/${eventId}`
    );
  }


  return (
    <main className="obala-board-page">
      <header className="obala-board-page__header">
        <button
          type="button"
          className="obala-board-page__back"
          onClick={
            () =>
              navigate(
                "/autor/covek/obala"
              )
          }
        >
          {
            t(
              "obala.boardPage.backToObala",
              "← OBALA"
            )
          }
        </button>


        <nav className="obala-board-page__tabs">
          <button
            type="button"
            className={
              mode ===
              "current"
                ? "is-active"
                : ""
            }
            onClick={
              () =>
                setMode(
                  "current"
                )
            }
          >
            {
              t(
                "obala.current"
              )
            }
          </button>


          <button
            type="button"
            className={
              mode ===
              "archive"
                ? "is-active"
                : ""
            }
            onClick={
              () =>
                setMode(
                  "archive"
                )
            }
          >
            {
              t(
                "obala.archive"
              )
            }
          </button>
        </nav>
      </header>


      <LanguageMenuControl />


      {loading && (
        <div className="obala-board-page__state">
          {
            t(
              "common.loading"
            )
          }
        </div>
      )}


      {errorMessage && (
        <div className="obala-board-page__state obala-board-page__state--error">
          {
            errorMessage
          }
        </div>
      )}


      {!loading &&
        !errorMessage &&
        mode ===
          "current" && (
        <section className="obala-current-board">
          <div className="obala-current-board__cork">
            {currentEvents.map(
              (
                event,
                index
              ) => (
                <button
                  key={
                    event.id
                  }
                  type="button"
                  className={
                    `obala-current-board__poster obala-current-board__poster--${(index % 8) + 1}`
                  }
                  onClick={
                    () =>
                      openEvent(
                        event.id
                      )
                  }
                >
                  <span className="obala-current-board__pin" />


                  {event.poster_url ? (
                    <img
                      src={
                        event.poster_url
                      }
                      alt={
                        event.title
                      }
                    />
                  ) : (
                    <span className="obala-current-board__paper-fallback">
                      {
                        event.title
                      }
                    </span>
                  )}


                  <span className="obala-current-board__poster-meta">
                    <strong>
                      {
                        event.title
                      }
                    </strong>

                    <small>
                      {
                        formatDate(
                          event.event_date,
                          language
                        )
                      }
                    </small>
                  </span>
                </button>
              )
            )}
          </div>
        </section>
      )}


      {!loading &&
        !errorMessage &&
        mode ===
          "archive" && (
        <section className="obala-archive">
          {archiveYears.length ===
            0 ? (
            <div className="obala-board-page__state">
              {
                t(
                  "obala.boardPage.archiveEmpty",
                  language ===
                    LANGUAGES.EN
                    ? "The archive is still empty."
                    : "Архива је још празна."
                )
              }
            </div>
          ) : (
            archiveYears.map(
              (
                yearData
              ) => (
                <article
                  key={
                    yearData.year
                  }
                  className="obala-archive__year"
                >
                  <div className="obala-archive__shelf-top">
                    <span className="obala-archive__year-label">
                      {
                        yearData.year
                      }
                    </span>


                    <div className="obala-archive__folders">
                      {yearData
                        .categories
                        .map(
                          (
                            categoryData,
                            index
                          ) => {
                            const folderKey =
                              `${yearData.year}::${categoryData.category}`;

                            const isOpen =
                              openFolder ===
                              folderKey;


                            return (
                              <button
                                key={
                                  folderKey
                                }
                                type="button"
                                className={
                                  `obala-archive__folder obala-archive__folder--${(index % 5) + 1} ${isOpen ? "is-open" : ""}`
                                }
                                onClick={
                                  () =>
                                    setOpenFolder(
                                      isOpen
                                        ? null
                                        : folderKey
                                    )
                                }
                              >
                                <span className="obala-archive__folder-tab">
                                  {
                                    categoryData
                                      .category
                                  }
                                </span>

                                <span className="obala-archive__folder-count">
                                  {
                                    categoryData
                                      .events
                                      .length
                                  }
                                </span>
                              </button>
                            );
                          }
                        )}
                    </div>
                  </div>


                  <div className="obala-archive__shelf-plank" />


                  {yearData
                    .categories
                    .map(
                      (
                        categoryData
                      ) => {
                        const folderKey =
                          `${yearData.year}::${categoryData.category}`;


                        if (
                          openFolder !==
                          folderKey
                        ) {
                          return null;
                        }


                        return (
                          <div
                            key={
                              `${folderKey}-drawer`
                            }
                            className="obala-archive__drawer"
                          >
                            <div className="obala-archive__drawer-label">
                              {
                                categoryData
                                  .category
                              }
                            </div>


                            <div className="obala-archive__files">
                              {categoryData
                                .events
                                .map(
                                  (
                                    event
                                  ) => (
                                    <button
                                      key={
                                        event.id
                                      }
                                      type="button"
                                      className="obala-archive__file"
                                      onClick={
                                        () =>
                                          openEvent(
                                            event.id
                                          )
                                      }
                                    >
                                      <span className="obala-archive__file-date">
                                        {
                                          formatDate(
                                            event.event_date,
                                            language
                                          )
                                        }
                                      </span>

                                      <strong>
                                        {
                                          event.title
                                        }
                                      </strong>

                                      {event.location && (
                                        <small>
                                          {
                                            event.location
                                          }
                                        </small>
                                      )}
                                    </button>
                                  )
                                )}
                            </div>
                          </div>
                        );
                      }
                    )}


                  <div className="obala-archive__lower-plank" />
                </article>
              )
            )
          )}
        </section>
      )}
    </main>
  );
}


export default HumanOneObalaBoard;