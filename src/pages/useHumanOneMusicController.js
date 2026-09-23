import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  MUSIC_HUB_PATH,
  getMusicPlaybackHandoff,
} from "../lib/musicPlaybackHandoff";

import {
  playUiSelect,
} from "../audio/uiSounds";

import {
  EQUALIZER_IDLE_LEVELS,
  RADIO_STATIONS,
  clamp,
  createPseudoSpectrum,
  frequencyToAngle,
  getAnalyserSpectrum,
  getStationBandLabel,
  getYouTubeVideoId,
  loadYouTubeApi,
  resolveStationStream,
  volumeToAngle,
  wrapIndex,
} from "./HumanOneMusicCore";


export default function useHumanOneMusicController() {
  const location =
    useLocation();


  const playbackHandoff =
    useMemo(
      () =>
        getMusicPlaybackHandoff(
          location.state
        ),
      [
        location.key,
        location.state,
      ]
    );


  const lastProcessedHandoffKeyRef =
    useRef(null);


  const [
    hubRecommendationTracks,
    setHubRecommendationTracks,
  ] =
    useState([]);


  const [
    hubRecommendationsLoaded,
    setHubRecommendationsLoaded,
  ] =
    useState(false);


  const [
    youtubeHostNode,
    setYoutubeHostNode,
  ] =
    useState(null);


  const youtubeHostRef =
    setYoutubeHostNode;


  const playerRef =
    useRef(null);


  const playerReadyRef =
    useRef(false);


  const resumeAfterTrackChangeRef =
    useRef(false);


  const radioAudioRef =
    useRef(null);


  const radioShouldPlayRef =
    useRef(false);


  const radioStreamCacheRef =
    useRef(
      new Map()
    );


  const radioTuneTokenRef =
    useRef(0);


  const analyserAudioRef =
    useRef(null);


  const audioContextRef =
    useRef(null);


  const analyserNodeRef =
    useRef(null);


  const analyserDataRef =
    useRef(null);


  const analyserTokenRef =
    useRef(0);


  const volumeRef =
    useRef(70);


  const volumeDragRef =
    useRef(null);


  const stationDragRef =
    useRef(null);


  const [
    lcdTracks,
    setLcdTracks,
  ] =
    useState([]);


  const [
    lcdIndex,
    setLcdIndex,
  ] =
    useState(0);


  const [
    lcdLoaded,
    setLcdLoaded,
  ] =
    useState(false);


  const [
    playerReady,
    setPlayerReady,
  ] =
    useState(false);


  const [
    playbackStarted,
    setPlaybackStarted,
  ] =
    useState(false);


  const [
    isPlaying,
    setIsPlaying,
  ] =
    useState(false);


  const [
    hasEnded,
    setHasEnded,
  ] =
    useState(false);


  const [
    currentTime,
    setCurrentTime,
  ] =
    useState(0);


  const [
    duration,
    setDuration,
  ] =
    useState(0);


  const [
    playerError,
    setPlayerError,
  ] =
    useState("");


  const [
    radioMode,
    setRadioMode,
  ] =
    useState(false);


  const [
    radioPlaying,
    setRadioPlaying,
  ] =
    useState(false);


  const [
    radioError,
    setRadioError,
  ] =
    useState("");


  const [
    radioNowPlaying,
    setRadioNowPlaying,
  ] =
    useState(null);


  const [
    playbackOrigin,
    setPlaybackOrigin,
  ] =
    useState(null);


  const [
    equalizerLevels,
    setEqualizerLevels,
  ] =
    useState(
      EQUALIZER_IDLE_LEVELS
    );


  const [
    equalizerMode,
    setEqualizerMode,
  ] =
    useState(
      "idle"
    );


  const [
    stationIndex,
    setStationIndex,
  ] =
    useState(0);


  const [
    autoplayEnabled,
    setAutoplayEnabled,
  ] =
    useState(
      () => {
        if (
          typeof window ===
          "undefined"
        ) {
          return false;
        }


        return (
          window.localStorage.getItem(
            "human-one-music-autoplay"
          ) === "on"
        );
      }
    );


  const [
    volume,
    setVolume,
  ] =
    useState(
      () => {
        if (
          typeof window ===
          "undefined"
        ) {
          return 70;
        }


        const saved =
          Number(
            window.localStorage.getItem(
              "human-one-music-volume"
            )
          );


        return Number.isFinite(
          saved
        )
          ? clamp(
              saved,
              0,
              100
            )
          : 70;
      }
    );


  const currentTrack =
    lcdTracks[
      lcdIndex
    ] ??
    null;


  const currentVideoId =
    getYouTubeVideoId(
      currentTrack
        ?.youtube_url
    );


  const currentStation =
    RADIO_STATIONS[
      stationIndex
    ];


  const currentGenreSlug =
    Array.isArray(
      currentTrack
        ?.music_genres
    )
      ? currentTrack
          ?.music_genres?.[0]
          ?.slug
      : currentTrack
          ?.music_genres
          ?.slug;


  const currentReaderPath =
    !radioMode &&
    currentTrack
      ? currentTrack.readerPath ||
        (
          currentTrack
            ?.slug
            ? currentTrack
                .source ===
              "recommendation"
              ? currentGenreSlug
                ? `/autor/covek/muzika/preporuke/${currentGenreSlug}/${currentTrack.slug}`
                : null
              : currentTrack
                    .source ===
                  "analysis"
                ? `/autor/covek/muzika/analize/${currentTrack.slug}`
                : currentTrack
                      .source ===
                    "radio-drama"
                  ? `/autor/covek/muzika/preporuke/radio-drame/${currentTrack.slug}`
                  : null
            : null
        )
      : null;


  const musicReturnPath =
    playbackOrigin
      ?.path ||
    currentReaderPath;


  const musicReturnState =
    playbackOrigin
      ?.state ??
    null;


  const musicReturnLabel =
    playbackOrigin
      ?.label ||
    "ЧИТАЈ";


  const activePlayback =
    radioMode
      ? radioPlaying
      : isPlaying;


  const volumeAngle =
    volumeToAngle(
      volume
    );


  const stationAngle =
    frequencyToAngle(
      currentStation
        .dialValue
    );


  const stationBandLabel =
    getStationBandLabel(
      currentStation
    );


  /* =====================================================
     CENTRALNI KATALOG ZVUČNIKA
     ===================================================== */

  useEffect(
    () => {
      let active =
        true;


      async function loadHubRecommendations() {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "music_recommendations"
            )
            .select(`
              id,
              title,
              artist,
              slug,
              youtube_url,
              created_at,
              music_genres (
                slug
              )
            `)
            .eq(
              "status",
              "published"
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            )
            .limit(
              100
            );


        if (
          !active
        ) {
          return;
        }


        if (
          error
        ) {
          console.error(
            "LCD preporuke:",
            error
          );


          setHubRecommendationTracks(
            []
          );


          setHubRecommendationsLoaded(
            true
          );


          return;
        }


        const tracks =
          (
            data ??
            []
          )
            .filter(
              (
                track
              ) =>
                Boolean(
                  getYouTubeVideoId(
                    track
                      .youtube_url
                  )
                )
            )
            .map(
              (
                track
              ) => ({
                ...track,

                source:
                  "recommendation",

                sourceLabel:
                  "ПРЕПОРУКА",
              })
            );


        const shuffled = [
          ...tracks,
        ];


        for (
          let index =
            shuffled.length -
            1;

          index >
          0;

          index -=
            1
        ) {
          const randomIndex =
            Math.floor(
              Math.random() *
                (
                  index +
                  1
                )
            );


          [
            shuffled[index],
            shuffled[randomIndex],
          ] = [
            shuffled[randomIndex],
            shuffled[index],
          ];
        }


        setHubRecommendationTracks(
          shuffled
        );


        setHubRecommendationsLoaded(
          true
        );
      }


      loadHubRecommendations();


      return () => {
        active =
          false;
      };
    },
    []
  );


  /* =====================================================
     UČITAVANJE / IZBOR AKTIVNOG QUEUE-a
     ===================================================== */

  useEffect(
    () => {
      const hasPlaybackHandoff =
        Boolean(
          playbackHandoff
            ?.queue
            ?.length
        );


      if (
        hasPlaybackHandoff
      ) {
        const handoffQueue =
          playbackHandoff
            .queue;


        const requestedIndex =
          Math.min(
            Math.max(
              Number.isInteger(
                playbackHandoff
                  .startIndex
              )
                ? playbackHandoff
                    .startIndex
                : 0,
              0
            ),
            handoffQueue.length -
              1
          );


        const requestedTrack =
          handoffQueue[
            requestedIndex
          ] ??
          handoffQueue[0];


        const isPlaylistHandoff =
          handoffQueue.some(
            (
              track
            ) =>
              track
                ?.sourceLabel ===
              "ПЛЕЈЛИСТА"
          );


        const isPlainRecommendationHandoff =
          requestedTrack
            ?.source ===
            "recommendation" &&
          !isPlaylistHandoff;


        if (
          isPlainRecommendationHandoff &&
          !hubRecommendationsLoaded
        ) {
          return undefined;
        }


        if (
          lastProcessedHandoffKeyRef
            .current ===
          location.key
        ) {
          return undefined;
        }


        lastProcessedHandoffKeyRef.current =
          location.key;


        radioTuneTokenRef.current +=
          1;


        radioShouldPlayRef.current =
          false;


        radioAudioRef.current
          ?.pause();


        stopRadioAnalyzer();


        setRadioNowPlaying(
          null
        );


        setPlaybackOrigin(
          playbackHandoff
            .origin ??
          null
        );


        if (
          isPlainRecommendationHandoff
        ) {
          let nextQueue =
            hubRecommendationTracks;


          const requestedId =
            requestedTrack
              ?.id;


          const requestedSlug =
            requestedTrack
              ?.slug;


          let nextIndex =
            nextQueue.findIndex(
              (
                track
              ) =>
                (
                  requestedId !=
                    null &&
                  String(
                    track.id
                  ) ===
                    String(
                      requestedId
                    )
                ) ||
                (
                  requestedSlug &&
                  track.slug ===
                    requestedSlug
                )
            );


          if (
            nextIndex <
            0
          ) {
            nextQueue = [
              requestedTrack,

              ...hubRecommendationTracks.filter(
                (
                  track
                ) =>
                  !(
                    requestedSlug &&
                    track.slug ===
                      requestedSlug
                  ) &&
                  !(
                    requestedId !=
                      null &&
                    String(
                      track.id
                    ) ===
                      String(
                        requestedId
                      )
                  )
              ),
            ];


            nextIndex =
              0;
          }


          setLcdTracks(
            nextQueue
          );


          setLcdIndex(
            nextIndex
          );

        } else {
          setLcdTracks(
            handoffQueue
          );


          setLcdIndex(
            requestedIndex
          );
        }


        setLcdLoaded(
          true
        );


        setRadioMode(
          false
        );


        setRadioPlaying(
          false
        );


        setRadioError(
          ""
        );


        setPlaybackStarted(
          Boolean(
            playbackHandoff
              .autoplay
          )
        );


        resumeAfterTrackChangeRef.current =
          Boolean(
            playbackHandoff
              .autoplay
          );


        return undefined;
      }


      if (
        location.pathname !==
        MUSIC_HUB_PATH
      ) {
        return undefined;
      }


      setPlaybackOrigin(
        null
      );


      if (
        !hubRecommendationsLoaded
      ) {
        return undefined;
      }


      if (
        !hubRecommendationTracks.length
      ) {
        if (
          !lcdLoaded
        ) {
          setLcdLoaded(
            true
          );
        }


        return undefined;
      }


      if (
        !playbackStarted &&
        !radioMode
      ) {
        const previousTrack =
          currentTrack;


        let nextIndex =
          0;


        if (
          previousTrack
            ?.source ===
          "recommendation"
        ) {
          const foundIndex =
            hubRecommendationTracks.findIndex(
              (
                track
              ) =>
                (
                  previousTrack.id !=
                    null &&
                  String(
                    track.id
                  ) ===
                    String(
                      previousTrack.id
                    )
                ) ||
                (
                  previousTrack.slug &&
                  track.slug ===
                    previousTrack.slug
                )
            );


          if (
            foundIndex >=
            0
          ) {
            nextIndex =
              foundIndex;
          }
        }


        setLcdTracks(
          hubRecommendationTracks
        );


        setLcdIndex(
          nextIndex
        );


        setLcdLoaded(
          true
        );


        return undefined;
      }


      if (
        !lcdLoaded
      ) {
        setLcdLoaded(
          true
        );
      }


      return undefined;
    },
    [
      playbackHandoff,
      location.key,
      location.pathname,
      hubRecommendationTracks,
      hubRecommendationsLoaded,
      playbackStarted,
      radioMode,
      lcdLoaded,
      currentTrack,
    ]
  );


  /* =====================================================
     AUTOMATSKO LISTANJE LCD-a
     ===================================================== */

  useEffect(
    () => {
      if (
        radioMode ||
        playbackStarted ||
        lcdTracks.length <=
          1
      ) {
        return undefined;
      }


      const intervalId =
        window.setInterval(
          () => {
            setLcdIndex(
              (
                current
              ) =>
                (
                  current +
                  1
                ) %
                lcdTracks.length
            );
          },
          4200
        );


      return () => {
        window.clearInterval(
          intervalId
        );
      };
    },
    [
      radioMode,
      playbackStarted,
      lcdTracks,
      lcdIndex,
    ]
  );


  /* =====================================================
     RADIO AUDIO ELEMENT
     ===================================================== */

  useEffect(
    () => {
      const audio =
        new Audio();


      audio.preload =
        "none";


      audio.volume =
        volumeRef.current /
        100;


      const handlePlaying =
        () => {
          setRadioPlaying(
            true
          );


          setRadioError(
            ""
          );
        };


      const handlePause =
        () => {
          setRadioPlaying(
            false
          );
        };


      const handleError =
        () => {
          setRadioPlaying(
            false
          );


          setRadioError(
            "РАДИО НИЈЕ ДОСТУПАН"
          );
        };


      audio.addEventListener(
        "playing",
        handlePlaying
      );


      audio.addEventListener(
        "pause",
        handlePause
      );


      audio.addEventListener(
        "error",
        handleError
      );


      radioAudioRef.current =
        audio;


      return () => {
        radioTuneTokenRef.current +=
          1;


        stopRadioAnalyzer();


        audio.pause();


        audio.removeAttribute(
          "src"
        );


        audio.load();


        audio.removeEventListener(
          "playing",
          handlePlaying
        );


        audio.removeEventListener(
          "pause",
          handlePause
        );


        audio.removeEventListener(
          "error",
          handleError
        );


        radioAudioRef.current =
          null;
      };
    },
    []
  );


  /* =====================================================
     VOLUME
     ===================================================== */

  useEffect(
    () => {
      volumeRef.current =
        volume;


      if (
        typeof window !==
        "undefined"
      ) {
        window.localStorage.setItem(
          "human-one-music-volume",
          String(
            volume
          )
        );
      }


      if (
        playerReadyRef.current &&
        playerRef.current
      ) {
        try {
          playerRef.current
            .setVolume(
              volume
            );
        } catch {
          // još se učitava
        }
      }


      if (
        radioAudioRef.current
      ) {
        radioAudioRef.current
          .volume =
          volume /
          100;
      }
    },
    [
      volume,
    ]
  );


  /* =====================================================
     AUTOPLAY PODEŠAVANJE
     ===================================================== */

  useEffect(
    () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }


      window.localStorage.setItem(
        "human-one-music-autoplay",
        autoplayEnabled
          ? "on"
          : "off"
      );
    },
    [
      autoplayEnabled,
    ]
  );


  /* =====================================================
     RADIO NOW PLAYING
     ===================================================== */

  useEffect(
    () => {
      if (
        !radioMode
      ) {
        setRadioNowPlaying(
          null
        );


        return;
      }


      setRadioNowPlaying(
        null
      );
    },
    [
      radioMode,
      stationIndex,
    ]
  );


  useEffect(
    () => {
      if (
        !radioMode ||
        !radioPlaying
      ) {
        return undefined;
      }


      let active =
        true;


      async function refreshNowPlaying() {
        try {
          const {
            data,
            error,
          } =
            await supabase
              .functions
              .invoke(
                "radio-now-playing",
                {
                  body:
                    {
                      stationId:
                        currentStation.id,
                    },
                }
              );


          if (
            !active
          ) {
            return;
          }


          if (
            import.meta.env.DEV
          ) {
            console.info(
              "[radio-now-playing]",
              currentStation.id,
              {
                data,
                error,
              }
            );
          }


          if (
            error
          ) {
            console.warn(
              "Radio metadata:",
              currentStation.id,
              error
            );


            return;
          }


          if (
            data?.available ===
            false
          ) {
            setRadioNowPlaying(
              null
            );


            return;
          }


          const nextArtist =
            typeof data
              ?.artist ===
              "string"
              ? data.artist
                  .trim()
              : "";


          const nextTitle =
            typeof data
              ?.title ===
              "string"
              ? data.title
                  .trim()
              : "";


          const nextRaw =
            typeof data
              ?.raw ===
              "string"
              ? data.raw
                  .trim()
              : "";


          if (
            nextArtist ||
            nextTitle ||
            nextRaw
          ) {
            setRadioNowPlaying({
              artist:
                nextArtist,

              title:
                nextTitle,

              raw:
                nextRaw,
            });


            return;
          }


          setRadioNowPlaying(
            null
          );
        } catch (
          metadataError
        ) {
          if (
            import.meta.env.DEV
          ) {
            console.warn(
              "[radio-now-playing] exception",
              currentStation.id,
              metadataError
            );
          }
        }
      }


      refreshNowPlaying();


      const intervalId =
        window.setInterval(
          refreshNowPlaying,
          15000
        );


      return () => {
        active =
          false;


        window.clearInterval(
          intervalId
        );
      };
    },
    [
      radioMode,
      radioPlaying,
      stationIndex,
    ]
  );


  /* =====================================================
     REAKTIVNI EQUALIZER
     ===================================================== */

  useEffect(
    () => {
      const activePlaybackForEqualizer =
        radioMode
          ? radioPlaying
          : isPlaying;


      if (
        !activePlaybackForEqualizer
      ) {
        setEqualizerMode(
          "idle"
        );


        setEqualizerLevels(
          EQUALIZER_IDLE_LEVELS
        );


        return undefined;
      }


      const intervalId =
        window.setInterval(
          () => {
            if (
              radioMode
            ) {
              const analyserResult =
                getAnalyserSpectrum(
                  analyserNodeRef
                    .current,
                  audioContextRef
                    .current,
                  analyserDataRef
                    .current
                );


              if (
                analyserResult
                  ?.hasSignal
              ) {
                setEqualizerMode(
                  "real"
                );


                setEqualizerLevels(
                  analyserResult
                    .levels
                );


                return;
              }
            }


            setEqualizerMode(
              "simulated"
            );


            setEqualizerLevels(
              createPseudoSpectrum(
                performance.now(),
                radioMode
                  ? stationIndex
                  : (
                      lcdIndex +
                      17
                    )
              )
            );
          },
          70
        );


      return () => {
        window.clearInterval(
          intervalId
        );
      };
    },
    [
      radioMode,
      radioPlaying,
      isPlaying,
      stationIndex,
      lcdIndex,
      currentVideoId,
    ]
  );


  /* =====================================================
     YOUTUBE IFRAME API
     ===================================================== */

  useEffect(
    () => {
      if (
        !youtubeHostNode
      ) {
        playerReadyRef.current =
          false;


        setPlayerReady(
          false
        );


        setIsPlaying(
          false
        );


        return undefined;
      }


      let active =
        true;


      loadYouTubeApi()
        .then(
          (
            YT
          ) => {
            if (
              !active ||
              !youtubeHostNode ||
              playerRef.current
            ) {
              return;
            }


            playerRef.current =
              new YT.Player(
                youtubeHostNode,
                {
                  width:
                    "200",

                  height:
                    "200",

                  playerVars:
                    {
                      autoplay:
                        0,

                      controls:
                        0,

                      disablekb:
                        1,

                      playsinline:
                        1,

                      rel:
                        0,
                    },

                  events:
                    {
                      onReady:
                        (
                          event
                        ) => {
                          if (
                            !active
                          ) {
                            return;
                          }


                          playerReadyRef.current =
                            true;


                          setPlayerReady(
                            true
                          );


                          try {
                            event.target
                              .setVolume(
                                volumeRef
                                  .current
                              );
                          } catch {
                            // ignorišemo
                          }
                        },


                      onStateChange:
                        (
                          event
                        ) => {
                          if (
                            !active
                          ) {
                            return;
                          }


                          const state =
                            event.data;


                          if (
                            state ===
                            YT.PlayerState
                              .PLAYING
                          ) {
                            setPlaybackStarted(
                              true
                            );


                            setIsPlaying(
                              true
                            );


                            setHasEnded(
                              false
                            );


                            setPlayerError(
                              ""
                            );


                            const nextDuration =
                              event.target
                                .getDuration();


                            if (
                              Number.isFinite(
                                nextDuration
                              ) &&
                              nextDuration >
                                0
                            ) {
                              setDuration(
                                nextDuration
                              );
                            }


                            return;
                          }


                          if (
                            state ===
                            YT.PlayerState
                              .PAUSED
                          ) {
                            setIsPlaying(
                              false
                            );


                            const nextTime =
                              event.target
                                .getCurrentTime();


                            const nextDuration =
                              event.target
                                .getDuration();


                            if (
                              Number.isFinite(
                                nextTime
                              )
                            ) {
                              setCurrentTime(
                                nextTime
                              );
                            }


                            if (
                              Number.isFinite(
                                nextDuration
                              )
                            ) {
                              setDuration(
                                nextDuration
                              );
                            }


                            return;
                          }


                          if (
                            state ===
                            YT.PlayerState
                              .CUED
                          ) {
                            setIsPlaying(
                              false
                            );


                            setCurrentTime(
                              0
                            );


                            const nextDuration =
                              event.target
                                .getDuration();


                            if (
                              Number.isFinite(
                                nextDuration
                              )
                            ) {
                              setDuration(
                                nextDuration
                              );
                            }


                            return;
                          }


                          if (
                            state ===
                            YT.PlayerState
                              .ENDED
                          ) {
                            const nextDuration =
                              event.target
                                .getDuration();


                            setIsPlaying(
                              false
                            );


                            setHasEnded(
                              true
                            );


                            if (
                              Number.isFinite(
                                nextDuration
                              )
                            ) {
                              setDuration(
                                nextDuration
                              );


                              setCurrentTime(
                                nextDuration
                              );
                            }
                          }
                        },


                      onError:
                        (
                          event
                        ) => {
                          console.error(
                            "YouTube player:",
                            event.data
                          );


                          setIsPlaying(
                            false
                          );


                          setPlayerError(
                            "ПЕСМА НИЈЕ ДОСТУПНА"
                          );
                        },
                    },
                }
              );
          }
        )
        .catch(
          (
            error
          ) => {
            console.error(
              "YouTube API:",
              error
            );


            if (
              active
            ) {
              setPlayerError(
                "ПЛЕЈЕР НИЈЕ ДОСТУПАН"
              );
            }
          }
        );


      return () => {
        active =
          false;


        playerReadyRef.current =
          false;


        if (
          playerRef.current
        ) {
          try {
            playerRef.current
              .destroy();
          } catch {
            // ignorišemo
          }
        }


        playerRef.current =
          null;
      };
    },
    [
      youtubeHostNode,
    ]
  );


  /* =====================================================
     PROMENA PESME
     ===================================================== */

  useEffect(
    () => {
      setCurrentTime(
        0
      );


      setDuration(
        0
      );


      setHasEnded(
        false
      );


      setPlayerError(
        ""
      );


      if (
        !playerReady ||
        !playerRef.current
      ) {
        return;
      }


      if (
        !currentVideoId
      ) {
        try {
          playerRef.current
            .stopVideo();
        } catch {
          // ignorišemo
        }


        setIsPlaying(
          false
        );


        if (
          playbackStarted
        ) {
          setPlayerError(
            "НЕМА YOUTUBE ЛИНКА"
          );
        }


        resumeAfterTrackChangeRef.current =
          false;


        return;
      }


      try {
        if (
          resumeAfterTrackChangeRef.current
        ) {
          playerRef.current
            .loadVideoById(
              currentVideoId
            );

        } else {
          playerRef.current
            .cueVideoById(
              currentVideoId
            );
        }

      } catch (
        error
      ) {
        console.error(
          "Promena YouTube pesme:",
          error
        );


        setIsPlaying(
          false
        );


        setPlayerError(
          "ПЕСМА НИЈЕ ДОСТУПНА"
        );

      } finally {
        resumeAfterTrackChangeRef.current =
          false;
      }
    },
    [
      currentVideoId,
      playerReady,
    ]
  );


  /* =====================================================
     TAJMER PESME
     ===================================================== */

  useEffect(
    () => {
      if (
        !isPlaying ||
        !playerReady
      ) {
        return undefined;
      }


      const intervalId =
        window.setInterval(
          () => {
            const player =
              playerRef.current;


            if (
              !player
            ) {
              return;
            }


            try {
              const nextTime =
                player
                  .getCurrentTime();


              const nextDuration =
                player
                  .getDuration();


              if (
                Number.isFinite(
                  nextTime
                )
              ) {
                setCurrentTime(
                  nextTime
                );
              }


              if (
                Number.isFinite(
                  nextDuration
                ) &&
                nextDuration >
                  0
              ) {
                setDuration(
                  nextDuration
                );
              }

            } catch {
              // kratko učitavanje
            }
          },
          250
        );


      return () => {
        window.clearInterval(
          intervalId
        );
      };
    },
    [
      isPlaying,
      playerReady,
      currentVideoId,
    ]
  );


  /* =====================================================
     AUTOPLAY PESAMA
     ===================================================== */

  useEffect(
    () => {
      if (
        radioMode ||
        !autoplayEnabled ||
        !hasEnded ||
        lcdTracks.length <=
          1
      ) {
        return undefined;
      }


      let nextPlayableIndex =
        null;


      for (
        let offset =
          1;

        offset <=
        lcdTracks.length;

        offset +=
          1
      ) {
        const candidateIndex =
          (
            lcdIndex +
            offset
          ) %
          lcdTracks.length;


        const candidateVideoId =
          getYouTubeVideoId(
            lcdTracks[
              candidateIndex
            ]?.youtube_url
          );


        if (
          candidateVideoId
        ) {
          nextPlayableIndex =
            candidateIndex;


          break;
        }
      }


      if (
        nextPlayableIndex ===
        null
      ) {
        return undefined;
      }


      const timeoutId =
        window.setTimeout(
          () => {
            resumeAfterTrackChangeRef.current =
              true;


            setHasEnded(
              false
            );


            setCurrentTime(
              0
            );


            setPlaybackStarted(
              true
            );


            setLcdIndex(
              nextPlayableIndex
            );
          },
          220
        );


      return () => {
        window.clearTimeout(
          timeoutId
        );
      };
    },
    [
      autoplayEnabled,
      hasEnded,
      radioMode,
      lcdIndex,
      lcdTracks,
    ]
  );


  /* =====================================================
     RADIO AUDIO ANALYZER
     ===================================================== */

  function stopRadioAnalyzer() {
    analyserTokenRef.current +=
      1;


    const analyserAudio =
      analyserAudioRef.current;


    analyserAudioRef.current =
      null;


    if (
      analyserAudio
    ) {
      try {
        analyserAudio.pause();


        analyserAudio.removeAttribute(
          "src"
        );


        analyserAudio.load();
      } catch {
        // analyzer je pomoćni stream
      }
    }


    const audioContext =
      audioContextRef.current;


    audioContextRef.current =
      null;


    analyserNodeRef.current =
      null;


    analyserDataRef.current =
      null;


    if (
      audioContext &&
      audioContext.state !==
        "closed"
    ) {
      audioContext
        .close()
        .catch(
          () => {}
        );
    }
  }


  async function startRadioAnalyzer(
    streamUrl
  ) {
    stopRadioAnalyzer();


    if (
      typeof window ===
        "undefined" ||
      !streamUrl
    ) {
      return;
    }


    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;


    if (
      !AudioContextClass
    ) {
      return;
    }


    const token =
      analyserTokenRef.current +
      1;


    analyserTokenRef.current =
      token;


    let analyserAudio =
      null;


    let audioContext =
      null;


    try {
      analyserAudio =
        new Audio();


      analyserAudio.crossOrigin =
        "anonymous";


      analyserAudio.preload =
        "auto";


      analyserAudio.src =
        streamUrl;


      audioContext =
        new AudioContextClass();


      const analyser =
        audioContext.createAnalyser();


      analyser.fftSize =
        512;


      analyser.smoothingTimeConstant =
        0.76;


      analyser.minDecibels =
        -90;


      analyser.maxDecibels =
        -18;


      const source =
        audioContext
          .createMediaElementSource(
            analyserAudio
          );


      const silentGain =
        audioContext
          .createGain();


      silentGain.gain.value =
        0;


      source.connect(
        analyser
      );


      analyser.connect(
        silentGain
      );


      silentGain.connect(
        audioContext
          .destination
      );


      analyserAudioRef.current =
        analyserAudio;


      audioContextRef.current =
        audioContext;


      analyserNodeRef.current =
        analyser;


      analyserDataRef.current =
        new Uint8Array(
          analyser
            .frequencyBinCount
        );


      if (
        audioContext.state ===
        "suspended"
      ) {
        await audioContext
          .resume();
      }


      await analyserAudio
        .play();


      if (
        analyserTokenRef
          .current !==
        token
      ) {
        analyserAudio.pause();


        await audioContext
          .close()
          .catch(
            () => {}
          );
      }
    } catch {
      if (
        analyserTokenRef
          .current ===
        token
      ) {
        if (
          analyserAudioRef
            .current ===
          analyserAudio
        ) {
          analyserAudioRef.current =
            null;
        }


        if (
          audioContextRef
            .current ===
          audioContext
        ) {
          audioContextRef.current =
            null;
        }


        analyserNodeRef.current =
          null;


        analyserDataRef.current =
          null;
      }


      try {
        analyserAudio
          ?.pause();
      } catch {
        // ignorišemo
      }


      if (
        audioContext &&
        audioContext.state !==
          "closed"
      ) {
        audioContext
          .close()
          .catch(
            () => {}
          );
      }
    }
  }


  /* =====================================================
     RADIO STREAM RESOLVER + CACHE
     ===================================================== */

  async function getStationStream(
    station
  ) {
    const cached =
      radioStreamCacheRef
        .current
        .get(
          station.id
        );


    if (
      cached
    ) {
      return cached;
    }


    const resolved =
      await resolveStationStream(
        station
      );


    if (
      resolved
    ) {
      radioStreamCacheRef
        .current
        .set(
          station.id,
          resolved
        );
    }


    return resolved;
  }


  /* =====================================================
     RADIO
     ===================================================== */

  async function tuneRadio(
    nextIndex,
    shouldPlay =
      radioShouldPlayRef
        .current
  ) {
    const audio =
      radioAudioRef.current;


    const station =
      RADIO_STATIONS[
        nextIndex
      ];


    if (
      !audio ||
      !station
    ) {
      return;
    }


    const tuneToken =
      radioTuneTokenRef.current +
      1;


    radioTuneTokenRef.current =
      tuneToken;


    setRadioError(
      ""
    );


    setRadioNowPlaying(
      null
    );


    stopRadioAnalyzer();


    let nextSource =
      null;


    try {
      nextSource =
        await getStationStream(
          station
        );

    } catch (
      error
    ) {
      console.error(
        "Pronalaženje radio streama:",
        error
      );
    }


    if (
      radioTuneTokenRef
        .current !==
      tuneToken
    ) {
      return;
    }


    if (
      !nextSource
    ) {
      radioShouldPlayRef.current =
        false;


      audio.pause();


      setRadioPlaying(
        false
      );


      setRadioError(
        "СТАНИЦА НИЈЕ ДОСТУПНА"
      );


      return;
    }


    const currentSource =
      audio.getAttribute(
        "src"
      );


    if (
      currentSource !==
      nextSource
    ) {
      audio.pause();


      audio.src =
        nextSource;


      audio.load();
    }


    audio.volume =
      volumeRef.current /
      100;


    if (
      shouldPlay
    ) {
      radioShouldPlayRef.current =
        true;


      try {
        await audio.play();


        startRadioAnalyzer(
          nextSource
        );

      } catch (
        error
      ) {
        console.error(
          "Radio stream:",
          station.name,
          error
        );


        if (
          radioTuneTokenRef
            .current ===
          tuneToken
        ) {
          setRadioPlaying(
            false
          );


          setRadioError(
            "РАДИО НИЈЕ ДОСТУПАН"
          );
        }
      }


      return;
    }


    radioShouldPlayRef.current =
      false;


    stopRadioAnalyzer();


    audio.pause();
  }


  function commitStation(
    nextIndex
  ) {
    const normalized =
      wrapIndex(
        nextIndex,
        RADIO_STATIONS.length
      );


    setStationIndex(
      normalized
    );


    if (
      radioMode
    ) {
      tuneRadio(
        normalized
      );
    }
  }


  function handleRadioToggle() {
    playUiSelect();


    if (
      radioMode
    ) {
      radioTuneTokenRef.current +=
        1;


      radioShouldPlayRef.current =
        false;


      radioAudioRef.current
        ?.pause();


      stopRadioAnalyzer();


      setRadioNowPlaying(
        null
      );


      setRadioMode(
        false
      );


      setRadioPlaying(
        false
      );


      setRadioError(
        ""
      );


      return;
    }


    if (
      isPlaying
    ) {
      try {
        playerRef.current
          ?.pauseVideo();
      } catch {
        // ignorišemo
      }
    }


    setRadioMode(
      true
    );


    radioShouldPlayRef.current =
      true;


    tuneRadio(
      stationIndex,
      true
    );
  }


  /* =====================================================
     NAZAD / NAPRED
     ===================================================== */

  function changeTrack(
    direction
  ) {
    playUiSelect();


    if (
      radioMode
    ) {
      commitStation(
        stationIndex +
          direction
      );


      return;
    }


    if (
      !lcdTracks.length
    ) {
      return;
    }


    resumeAfterTrackChangeRef.current =
      isPlaying;


    setLcdIndex(
      (
        current
      ) =>
        (
          current +
          direction +
          lcdTracks.length
        ) %
        lcdTracks.length
    );
  }


  function handlePrevious() {
    changeTrack(
      -1
    );
  }


  function handleNext() {
    changeTrack(
      1
    );
  }


  function handleAutoplayToggle() {
    playUiSelect();


    setAutoplayEnabled(
      (
        current
      ) =>
        !current
    );
  }


  /* =====================================================
     PLAY / PAUSE
     ===================================================== */

  function handlePlayPause() {
    playUiSelect();


    if (
      radioMode
    ) {
      if (
        radioPlaying
      ) {
        radioShouldPlayRef.current =
          false;


        radioAudioRef.current
          ?.pause();


        stopRadioAnalyzer();

      } else {
        radioShouldPlayRef.current =
          true;


        tuneRadio(
          stationIndex,
          true
        );
      }


      return;
    }


    const player =
      playerRef.current;


    if (
      !currentTrack
    ) {
      return;
    }


    if (
      !currentVideoId
    ) {
      setPlaybackStarted(
        true
      );


      setPlayerError(
        "НЕМА YOUTUBE ЛИНКА"
      );


      return;
    }


    if (
      !player ||
      !playerReadyRef.current
    ) {
      setPlayerError(
        "ПЛЕЈЕР СЕ УЧИТАВА"
      );


      return;
    }


    setPlaybackStarted(
      true
    );


    try {
      if (
        isPlaying
      ) {
        player.pauseVideo();


        return;
      }


      const loadedVideoId =
        player
          .getVideoData()
          ?.video_id;


      if (
        loadedVideoId !==
        currentVideoId
      ) {
        player.loadVideoById(
          currentVideoId
        );


        return;
      }


      if (
        hasEnded
      ) {
        player.seekTo(
          0,
          true
        );


        setCurrentTime(
          0
        );


        setHasEnded(
          false
        );
      }


      player.playVideo();

    } catch (
      error
    ) {
      console.error(
        "Play / pause:",
        error
      );


      setIsPlaying(
        false
      );


      setPlayerError(
        "ПЕСМА НИЈЕ ДОСТУПНА"
      );
    }
  }


  /* =====================================================
     GLASNOĆA
     ===================================================== */

  function changeVolume(
    nextValue
  ) {
    setVolume(
      clamp(
        Math.round(
          nextValue
        ),
        0,
        100
      )
    );
  }


  function handleVolumePointerDown(
    event
  ) {
    playUiSelect();


    event.currentTarget
      .setPointerCapture?.(
        event.pointerId
      );


    volumeDragRef.current =
      {
        pointerId:
          event.pointerId,

        startY:
          event.clientY,

        startVolume:
          volume,
      };
  }


  function handleVolumePointerMove(
    event
  ) {
    const drag =
      volumeDragRef.current;


    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }


    const delta =
      (
        drag.startY -
        event.clientY
      ) *
      0.7;


    changeVolume(
      drag.startVolume +
        delta
    );
  }


  function handleVolumePointerUp(
    event
  ) {
    if (
      volumeDragRef.current
        ?.pointerId !==
      event.pointerId
    ) {
      return;
    }


    volumeDragRef.current =
      null;


    event.currentTarget
      .releasePointerCapture?.(
        event.pointerId
      );
  }


  function handleVolumeWheel(
    event
  ) {
    event.preventDefault();


    playUiSelect();


    changeVolume(
      volume +
        (
          event.deltaY <
          0
            ? 5
            : -5
        )
    );
  }


  function handleVolumeKeyDown(
    event
  ) {
    if (
      [
        "ArrowUp",
        "ArrowRight",
      ].includes(
        event.key
      )
    ) {
      event.preventDefault();


      changeVolume(
        volume +
          5
      );


      return;
    }


    if (
      [
        "ArrowDown",
        "ArrowLeft",
      ].includes(
        event.key
      )
    ) {
      event.preventDefault();


      changeVolume(
        volume -
          5
      );
    }
  }


  /* =====================================================
     STANICA
     ===================================================== */

  function handleStationPointerDown(
    event
  ) {
    playUiSelect();


    event.currentTarget
      .setPointerCapture?.(
        event.pointerId
      );


    stationDragRef.current =
      {
        pointerId:
          event.pointerId,

        startY:
          event.clientY,

        startIndex:
          stationIndex,

        previewIndex:
          stationIndex,

        moved:
          false,
      };
  }


  function handleStationPointerMove(
    event
  ) {
    const drag =
      stationDragRef.current;


    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }


    const delta =
      drag.startY -
      event.clientY;


    if (
      Math.abs(
        delta
      ) >
      4
    ) {
      drag.moved =
        true;
    }


    const steps =
      Math.round(
        delta /
          28
      );


    const nextIndex =
      wrapIndex(
        drag.startIndex +
          steps,
        RADIO_STATIONS.length
      );


    drag.previewIndex =
      nextIndex;


    setStationIndex(
      nextIndex
    );
  }


  function handleStationPointerUp(
    event
  ) {
    const drag =
      stationDragRef.current;


    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }


    let nextIndex =
      drag.previewIndex;


    if (
      !drag.moved
    ) {
      nextIndex =
        wrapIndex(
          drag.startIndex +
            1,
          RADIO_STATIONS.length
        );


      setStationIndex(
        nextIndex
      );
    }


    stationDragRef.current =
      null;


    event.currentTarget
      .releasePointerCapture?.(
        event.pointerId
      );


    if (
      radioMode
    ) {
      tuneRadio(
        nextIndex
      );
    }
  }


  function handleStationWheel(
    event
  ) {
    event.preventDefault();


    playUiSelect();


    commitStation(
      stationIndex +
        (
          event.deltaY <
          0
            ? 1
            : -1
        )
    );
  }


  function handleStationKeyDown(
    event
  ) {
    if (
      [
        "ArrowUp",
        "ArrowRight",
      ].includes(
        event.key
      )
    ) {
      event.preventDefault();


      commitStation(
        stationIndex +
          1
      );


      return;
    }


    if (
      [
        "ArrowDown",
        "ArrowLeft",
      ].includes(
        event.key
      )
    ) {
      event.preventDefault();


      commitStation(
        stationIndex -
          1
      );
    }
  }


  return {
    youtubeHostRef,

    radioMode,
    radioPlaying,
    radioError,
    radioNowPlaying,

    currentTrack,
    currentStation,
    stationBandLabel,

    playerError,
    playbackStarted,
    isPlaying,
    currentTime,
    duration,
    lcdLoaded,
    lcdIndex,

    equalizerLevels,
    equalizerMode,

    currentReaderPath,
    musicReturnPath,
    musicReturnState,
    musicReturnLabel,
    autoplayEnabled,

    volume,
    volumeAngle,

    stationIndex,
    stationAngle,

    activePlayback,

    handlePrevious,
    handleNext,
    handleAutoplayToggle,
    handleRadioToggle,
    handlePlayPause,

    handleVolumePointerDown,
    handleVolumePointerMove,
    handleVolumePointerUp,
    handleVolumeWheel,
    handleVolumeKeyDown,

    handleStationPointerDown,
    handleStationPointerMove,
    handleStationPointerUp,
    handleStationWheel,
    handleStationKeyDown,
  };
}