import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  createMusicPlaybackState,
  MUSIC_HUB_PATH,
} from "../lib/musicPlaybackHandoff";

import {
  playUiSelect,
} from "../audio/uiSounds";

import "../styles/HumanOneMusicReader.css";


function getRecommendationGenre(
  recommendation
) {
  if (
    Array.isArray(
      recommendation
        ?.music_genres
    )
  ) {
    return (
      recommendation
        .music_genres[0] ??
      null
    );
  }


  return (
    recommendation
      ?.music_genres ??
    null
  );
}


function HumanOneMusicReader({
  mode,
}) {
  const {
    genreSlug,
    songSlug,
  } =
    useParams();


  const location =
    useLocation();


  const isRecommendation =
    mode ===
    "recommendation";


  const isAnalysis =
    mode ===
    "analysis";


  const isRadioDrama =
    isRecommendation &&
    genreSlug ===
      "radio-drame";


  /* =====================================================
     POVRATAK IZ READERA
     ===================================================== */

  const recommendationReturnState =
    location.state
      ?.musicRecommendationsBackTo;


  const recommendationReturnIsAllowed =
    typeof recommendationReturnState ===
      "string" &&
    (
      recommendationReturnState
        .startsWith(
          "/autor/covek/muzika/preporuke/pesme"
        ) ||
      recommendationReturnState
        .startsWith(
          "/autor/covek/muzika/preporuke/plejliste/"
        )
    );


  const recommendationBackTo =
    recommendationReturnIsAllowed
      ? recommendationReturnState
      : "/autor/covek/muzika/preporuke/pesme";


  const cameFromPlaylist =
    isRecommendation &&
    !isRadioDrama &&
    recommendationBackTo
      .startsWith(
        "/autor/covek/muzika/preporuke/plejliste/"
      );


  const playlistSlug =
    cameFromPlaylist
      ? recommendationBackTo
          .split(
            "/"
          )
          .filter(
            Boolean
          )
          .at(
            -1
          ) ??
        null
      : null;


  const backTo =
    isRadioDrama
      ? "/autor/covek/muzika/preporuke/radio-drame"
      : isRecommendation
        ? recommendationBackTo
        : "/autor/covek/muzika/analize";


  /* =====================================================
     STATE
     ===================================================== */

  const [
    work,
    setWork,
  ] =
    useState(
      null
    );


  const [
    playbackQueue,
    setPlaybackQueue,
  ] =
    useState([]);


  const [
    playbackStartIndex,
    setPlaybackStartIndex,
  ] =
    useState(0);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    notFound,
    setNotFound,
  ] =
    useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");


  /* =====================================================
     LOAD READER + PLAYBACK QUEUE

     Bitno:
     reader više NE šalje samo jednu pesmu.

     - preporuka = isti žanr
     - playlist reader = cela plejlista
     - analiza = sve analize
     - radio drama = sve radio drame
     ===================================================== */

  useEffect(
    () => {
      if (
        !isRecommendation &&
        !isAnalysis
      ) {
        return;
      }


      let active =
        true;


      async function loadWork() {
        setLoading(
          true
        );


        setNotFound(
          false
        );


        setErrorMessage(
          ""
        );


        setPlaybackQueue(
          []
        );


        setPlaybackStartIndex(
          0
        );


        /* =========================================
           RADIO DRAMA
           ========================================= */

        if (
          isRadioDrama
        ) {
          const [
            workResult,
            queueResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  "music_radio_dramas"
                )
                .select(`
                  id,
                  title,
                  author,
                  slug,
                  release_year,
                  description,
                  youtube_url,
                  status
                `)
                .eq(
                  "slug",
                  songSlug
                )
                .eq(
                  "status",
                  "published"
                )
                .maybeSingle(),

              supabase
                .from(
                  "music_radio_dramas"
                )
                .select(`
                  id,
                  title,
                  author,
                  slug,
                  release_year,
                  youtube_url,
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
                      false,
                  }
                ),
            ]);


          if (
            !active
          ) {
            return;
          }


          if (
            workResult.error
          ) {
            console.error(
              "Učitavanje radio drame:",
              workResult.error
            );


            setErrorMessage(
              "Радио драму тренутно није могуће учитати."
            );


            setLoading(
              false
            );


            return;
          }


          const currentWork =
            workResult.data;


          if (
            !currentWork
          ) {
            setNotFound(
              true
            );


            setLoading(
              false
            );


            return;
          }


          setWork(
            currentWork
          );


          let queue = [];


          if (
            queueResult.error
          ) {
            console.error(
              "Playback queue радио драме:",
              queueResult.error
            );

          } else {
            queue =
              (
                queueResult.data ??
                []
              )
                .filter(
                  (
                    item
                  ) =>
                    Boolean(
                      item.youtube_url
                    )
                )
                .map(
                  (
                    item
                  ) => ({
                    id:
                      `radio-drama:${item.id}`,

                    title:
                      item.title,

                    artist:
                      item.author ||
                      "НЕПОЗНАТ АУТОР",

                    slug:
                      item.slug,

                    youtube_url:
                      item.youtube_url,

                    source:
                      "radio-drama",

                    sourceLabel:
                      "РАДИО ДРАМА",

                    readerPath:
                      `/autor/covek/muzika/preporuke/radio-drame/${item.slug}`,
                  })
                );
          }


          /*
           * Ako queue query zakaže,
           * trenutna drama ipak mora da radi.
           */
          if (
            !queue.length &&
            currentWork.youtube_url
          ) {
            queue = [
              {
                id:
                  `radio-drama:${currentWork.id}`,

                title:
                  currentWork.title,

                artist:
                  currentWork.author ||
                  "НЕПОЗНАТ АУТОР",

                slug:
                  currentWork.slug,

                youtube_url:
                  currentWork.youtube_url,

                source:
                  "radio-drama",

                sourceLabel:
                  "РАДИО ДРАМА",

                readerPath:
                  `/autor/covek/muzika/preporuke/radio-drame/${currentWork.slug}`,
              },
            ];
          }


          const startIndex =
            queue.findIndex(
              (
                item
              ) =>
                String(
                  item.slug
                ) ===
                String(
                  currentWork.slug
                )
            );


          setPlaybackQueue(
            queue
          );


          setPlaybackStartIndex(
            startIndex >=
              0
              ? startIndex
              : 0
          );


          setLoading(
            false
          );


          return;
        }


        /* =========================================
           PREPORUKA / DISK
           ========================================= */

        if (
          isRecommendation
        ) {
          const workPromise =
            supabase
              .from(
                "music_recommendations"
              )
              .select(`
                id,
                title,
                artist,
                slug,
                youtube_url,
                why_i_like,
                status,
                music_genres (
                  name,
                  slug
                )
              `)
              .eq(
                "slug",
                songSlug
              )
              .eq(
                "status",
                "published"
              )
              .maybeSingle();


          /*
           * Ako smo u reader ušli iz plejliste,
           * učitavamo baš tu plejlistu.
           *
           * U suprotnom učitavamo objavljene
           * preporuke i kasnije ih filtriramo
           * na isti žanr.
           */
          const queuePromise =
            cameFromPlaylist &&
            playlistSlug
              ? supabase
                  .from(
                    "music_playlists"
                  )
                  .select(`
                    id,
                    title,
                    slug,
                    music_playlist_items (
                      id,
                      position,
                      music_recommendations (
                        id,
                        title,
                        artist,
                        slug,
                        youtube_url,
                        status,
                        music_genres (
                          name,
                          slug
                        )
                      )
                    )
                  `)
                  .eq(
                    "slug",
                    playlistSlug
                  )
                  .eq(
                    "status",
                    "published"
                  )
                  .maybeSingle()
              : supabase
                  .from(
                    "music_recommendations"
                  )
                  .select(`
                    id,
                    title,
                    artist,
                    slug,
                    youtube_url,
                    sort_order,
                    created_at,
                    music_genres (
                      name,
                      slug
                    )
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
                        false,
                    }
                  );


          const [
            workResult,
            queueResult,
          ] =
            await Promise.all([
              workPromise,
              queuePromise,
            ]);


          if (
            !active
          ) {
            return;
          }


          if (
            workResult.error
          ) {
            console.error(
              "Učitavanje preporuke:",
              workResult.error
            );


            setErrorMessage(
              "Текст тренутно није могуће учитати."
            );


            setLoading(
              false
            );


            return;
          }


          const currentWork =
            workResult.data;


          if (
            !currentWork ||
            getRecommendationGenre(
              currentWork
            )
              ?.slug !==
            genreSlug
          ) {
            setNotFound(
              true
            );


            setLoading(
              false
            );


            return;
          }


          setWork(
            currentWork
          );


          let queue = [];


          if (
            queueResult.error
          ) {
            console.error(
              cameFromPlaylist
                ? "Playback queue плејлисте:"
                : "Playback queue препорука:",
              queueResult.error
            );

          } else if (
            cameFromPlaylist
          ) {
            const playlist =
              queueResult.data;


            const items =
              Array.isArray(
                playlist
                  ?.music_playlist_items
              )
                ? [
                    ...playlist
                      .music_playlist_items,
                  ]
                : [];


            queue =
              items
                .sort(
                  (
                    first,
                    second
                  ) =>
                    (
                      first.position ??
                      0
                    ) -
                    (
                      second.position ??
                      0
                    )
                )
                .map(
                  (
                    item
                  ) =>
                    item
                      .music_recommendations
                )
                .filter(
                  (
                    item
                  ) =>
                    item &&
                    item.status ===
                      "published" &&
                    Boolean(
                      item.youtube_url
                    )
                )
                .map(
                  (
                    item
                  ) => {
                    const genre =
                      getRecommendationGenre(
                        item
                      );


                    return {
                      id:
                        `playlist:${playlist?.id}:${item.id}`,

                      title:
                        item.title,

                      artist:
                        item.artist ||
                        "НЕПОЗНАТ ИЗВОЂАЧ",

                      slug:
                        item.slug,

                      youtube_url:
                        item.youtube_url,

                      source:
                        "recommendation",

                      sourceLabel:
                        "ПЛЕЈЛИСТА",

                      music_genres:
                        item.music_genres,

                      readerPath:
                        genre?.slug
                          ? `/autor/covek/muzika/preporuke/${genre.slug}/${item.slug}`
                          : null,
                    };
                  }
                );

          } else {
            queue =
              (
                queueResult.data ??
                []
              )
                .filter(
                  (
                    item
                  ) =>
                    Boolean(
                      item.youtube_url
                    ) &&
                    getRecommendationGenre(
                      item
                    )
                      ?.slug ===
                    genreSlug
                )
                .map(
                  (
                    item
                  ) => {
                    const genre =
                      getRecommendationGenre(
                        item
                      );


                    return {
                      id:
                        `recommendation:${item.id}`,

                      title:
                        item.title,

                      artist:
                        item.artist ||
                        "НЕПОЗНАТ ИЗВОЂАЧ",

                      slug:
                        item.slug,

                      youtube_url:
                        item.youtube_url,

                      source:
                        "recommendation",

                      sourceLabel:
                        "ПРЕПОРУКА",

                      music_genres:
                        item.music_genres,

                      readerPath:
                        genre?.slug
                          ? `/autor/covek/muzika/preporuke/${genre.slug}/${item.slug}`
                          : null,
                    };
                  }
                );
          }


          /*
           * Fallback:
           * čak i ako queue query ne uspe,
           * trenutna pesma mora da može da se pusti.
           */
          if (
            !queue.length &&
            currentWork.youtube_url
          ) {
            queue = [
              {
                id:
                  `recommendation:${currentWork.id}`,

                title:
                  currentWork.title,

                artist:
                  currentWork.artist ||
                  "НЕПОЗНАТ ИЗВОЂАЧ",

                slug:
                  currentWork.slug,

                youtube_url:
                  currentWork.youtube_url,

                source:
                  "recommendation",

                sourceLabel:
                  cameFromPlaylist
                    ? "ПЛЕЈЛИСТА"
                    : "ПРЕПОРУКА",

                music_genres:
                  currentWork.music_genres,

                readerPath:
                  `${location.pathname}${location.search}`,
              },
            ];
          }


          const startIndex =
            queue.findIndex(
              (
                item
              ) =>
                String(
                  item.slug
                ) ===
                String(
                  currentWork.slug
                )
            );


          setPlaybackQueue(
            queue
          );


          setPlaybackStartIndex(
            startIndex >=
              0
              ? startIndex
              : 0
          );


          setLoading(
            false
          );


          return;
        }


        /* =========================================
           PREVOD / ANALIZA
           ========================================= */

        const [
          workResult,
          queueResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "music_analysis_works"
              )
              .select(`
                id,
                title,
                artist,
                slug,
                youtube_url,
                image_url,
                original_text,
                translation,
                comparison_blocks,
                analysis,
                status
              `)
              .eq(
                "slug",
                songSlug
              )
              .eq(
                "status",
                "published"
              )
              .maybeSingle(),

            supabase
              .from(
                "music_analysis_works"
              )
              .select(`
                id,
                title,
                artist,
                slug,
                youtube_url,
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
                    false,
                }
              ),
          ]);


        if (
          !active
        ) {
          return;
        }


        if (
          workResult.error
        ) {
          console.error(
            "Učitavanje prevoda:",
            workResult.error
          );


          setErrorMessage(
            "Текст тренутно није могуће учитати."
          );


          setLoading(
            false
          );


          return;
        }


        const currentWork =
          workResult.data;


        if (
          !currentWork
        ) {
          setNotFound(
            true
          );


          setLoading(
            false
          );


          return;
        }


        setWork(
          currentWork
        );


        let queue = [];


        if (
          queueResult.error
        ) {
          console.error(
            "Playback queue анализа:",
            queueResult.error
          );

        } else {
          queue =
            (
              queueResult.data ??
              []
            )
              .filter(
                (
                  item
                ) =>
                  Boolean(
                    item.youtube_url
                  )
              )
              .map(
                (
                  item
                ) => ({
                  id:
                    `analysis:${item.id}`,

                  title:
                    item.title,

                  artist:
                    item.artist ||
                    "НЕПОЗНАТ ИЗВОЂАЧ",

                  slug:
                    item.slug,

                  youtube_url:
                    item.youtube_url,

                  source:
                    "analysis",

                  sourceLabel:
                    "ПРЕВОД / АНАЛИЗА",

                  readerPath:
                    `/autor/covek/muzika/analize/${item.slug}`,
                })
              );
        }


        if (
          !queue.length &&
          currentWork.youtube_url
        ) {
          queue = [
            {
              id:
                `analysis:${currentWork.id}`,

              title:
                currentWork.title,

              artist:
                currentWork.artist ||
                "НЕПОЗНАТ ИЗВОЂАЧ",

              slug:
                currentWork.slug,

              youtube_url:
                currentWork.youtube_url,

              source:
                "analysis",

              sourceLabel:
                "ПРЕВОД / АНАЛИЗА",

              readerPath:
                `/autor/covek/muzika/analize/${currentWork.slug}`,
            },
          ];
        }


        const startIndex =
          queue.findIndex(
            (
              item
            ) =>
              String(
                item.slug
              ) ===
              String(
                currentWork.slug
              )
          );


        setPlaybackQueue(
          queue
        );


        setPlaybackStartIndex(
          startIndex >=
            0
            ? startIndex
            : 0
        );


        setLoading(
          false
        );
      }


      loadWork();


      return () => {
        active =
          false;
      };
    },
    [
      genreSlug,
      songSlug,
      isRecommendation,
      isAnalysis,
      isRadioDrama,
      cameFromPlaylist,
      playlistSlug,
      location.pathname,
      location.search,
    ]
  );


  /* =====================================================
     COMPARISON BLOCKS
     ===================================================== */

  const comparisonBlocks =
    useMemo(
      () => {
        if (
          !work ||
          !isAnalysis
        ) {
          return [];
        }


        if (
          Array.isArray(
            work.comparison_blocks
          ) &&
          work
            .comparison_blocks
            .length
        ) {
          return work
            .comparison_blocks
            .filter(
              (
                block
              ) =>
                block?.original ||
                block?.translation
            );
        }


        if (
          work.original_text ||
          work.translation
        ) {
          return [
            {
              id:
                "legacy-block",

              original:
                work.original_text ||
                "",

              translation:
                work.translation ||
                "",
            },
          ];
        }


        return [];
      },
      [
        work,
        isAnalysis,
      ]
    );


  /* =====================================================
     MODE GUARD
     ===================================================== */

  if (
    !isRecommendation &&
    !isAnalysis
  ) {
    return (
      <Navigate
        to="/autor/covek/muzika"
        replace
      />
    );
  }


  if (
    notFound
  ) {
    return (
      <Navigate
        to={
          backTo
        }
        replace
      />
    );
  }


  const displayArtist =
    isRadioDrama
      ? work?.author ||
        "НЕПОЗНАТ АУТОР"
      : work?.artist ||
        "НЕПОЗНАТ ИЗВОЂАЧ";


  const currentReaderPath =
    `${location.pathname}${location.search}`;


  /* =====================================================
     PLAYBACK HANDOFF

     Sada šaljemo CELO okruženje, ne samo
     jednu stavku.
     ===================================================== */

  const playbackState =
    work?.youtube_url &&
    playbackQueue.length
      ? createMusicPlaybackState({
          queue:
            playbackQueue,

          startIndex:
            playbackStartIndex,

          origin: {
            path:
              currentReaderPath,

            label:
              isRadioDrama
                ? "НАЗАД У ДРАМУ"
                : "НАЗАД У РИДЕР",

            state:
              location.state ??
              null,
          },

          autoplay:
            true,
        })
      : null;


  return (
    <main className="human-one-music-reader">
      <Link
        to={
          backTo
        }
        className="human-one-music-reader__back"
      >
        ←{" "}

        {isRadioDrama
          ? "РАДИО ДРАМЕ"
          : cameFromPlaylist
            ? "ПЛЕЈЛИСТА"
            : isRecommendation
              ? "ДИСКОВИ"
              : "РАДОВИ"}
      </Link>


      {loading ? (
        <div className="human-one-music-reader__state">
          Учитавање...
        </div>

      ) : errorMessage ? (
        <div className="human-one-music-reader__state">
          {errorMessage}
        </div>

      ) : !work ? (
        <div className="human-one-music-reader__state">
          Овај текст још није
          објављен.
        </div>

      ) : (
        <article className="human-one-music-reader__deck">
          <header className="human-one-music-reader__header">
            <div className="human-one-music-reader__display">
              <span>
                {isRadioDrama
                  ? "RADIO DRAMA"
                  : isRecommendation
                    ? "RECOMMEND"
                    : "TRANSLATE"}
              </span>


              <strong>
                FM 98.7
              </strong>
            </div>


            <div
              className={
                work.youtube_url
                  ? "human-one-music-reader__header-main"
                  : "human-one-music-reader__header-main human-one-music-reader__header-main--no-link"
              }
            >
              <div className="human-one-music-reader__header-copy">
                <p>
                  {isRadioDrama
                    ? "СЕКИ / РАДИО ДРАМЕ"
                    : "СЕКИ / ЗВУЧНИК"}
                </p>


                <h1>
                  {work.title}
                </h1>


                <h2>
                  {displayArtist}
                </h2>


                {isRadioDrama &&
                work.release_year ? (
                  <p>
                    {work.release_year}
                  </p>
                ) : null}
              </div>


              {playbackState ? (
                <Link
                  className="human-one-music-reader__listen-panel"
                  to={
                    MUSIC_HUB_PATH
                  }
                  state={
                    playbackState
                  }
                  onClick={
                    playUiSelect
                  }
                  aria-label={
                    `Пусти ${work.title} на звучнику`
                  }
                >
                  <span
                    className="human-one-music-reader__listen-play"
                    aria-hidden="true"
                  >
                    ▶
                  </span>


                  <strong>
                    ПУСТИ
                    <br />
                    НА РАДИЈУ
                  </strong>


                  <span className="human-one-music-reader__listen-youtube">
                    ЗВУЧНИК →
                  </span>
                </Link>
              ) : null}
            </div>
          </header>


          {isAnalysis &&
            work.image_url && (
            <figure className="human-one-music-reader__cover">
              <img
                src={
                  work.image_url
                }
                alt=""
              />
            </figure>
          )}


          <div className="human-one-music-reader__paper">
            {isRadioDrama ? (
              <section>
                <p className="human-one-music-reader__label">
                  О РАДИО ДРАМИ
                </p>


                <div className="human-one-music-reader__text">
                  {work.description ||
                    "За ову радио драму још није додат опис."}
                </div>
              </section>

            ) : isRecommendation ? (
              <section>
                <p className="human-one-music-reader__label">
                  ЗАШТО МИ СЕ СВИЂА
                </p>


                <div className="human-one-music-reader__text">
                  {work.why_i_like}
                </div>
              </section>

            ) : (
              <>
                {comparisonBlocks
                  .length >
                  0 && (
                  <section className="human-one-music-reader__comparison-section">
                    <div className="human-one-music-reader__comparison-heading">
                      <span>
                        ОРИГИНАЛ
                      </span>

                      <span>
                        ПРЕВОД
                      </span>
                    </div>


                    <div className="human-one-music-reader__comparison-list">
                      {comparisonBlocks.map(
                        (
                          block,
                          index
                        ) => (
                          <div
                            key={
                              block.id ||
                              index
                            }
                            className="human-one-music-reader__comparison-block"
                          >
                            <div className="human-one-music-reader__comparison-cell">
                              <span className="human-one-music-reader__mobile-column-label">
                                ОРИГИНАЛ
                              </span>

                              <div className="human-one-music-reader__lyrics">
                                {block.original ||
                                  "—"}
                              </div>
                            </div>


                            <div className="human-one-music-reader__comparison-cell">
                              <span className="human-one-music-reader__mobile-column-label">
                                ПРЕВОД
                              </span>

                              <div className="human-one-music-reader__lyrics">
                                {block.translation ||
                                  "—"}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                )}


                <section className="human-one-music-reader__analysis-section">
                  <p className="human-one-music-reader__label">
                    АНАЛИЗА
                  </p>


                  <div className="human-one-music-reader__text">
                    {work.analysis}
                  </div>
                </section>
              </>
            )}
          </div>


          <footer className="human-one-music-reader__footer">
            <span>
              SIDE A
            </span>

            <span>
              END //
            </span>
          </footer>
        </article>
      )}
    </main>
  );
}


export default HumanOneMusicReader;