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
  loadYouTubePlaylistInfo,
} from "../lib/youtubePlaylistInfo";

import {
  playUiBack,
  playUiSelect,
} from "../audio/uiSounds";

import "../styles/HumanOneMusicRecommendations.css";


function getGenre(
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


function HumanOneMusicPlaylist() {
  const {
    playlistSlug,
  } =
    useParams();


  const location =
    useLocation();


  const [
    playlist,
    setPlaylist,
  ] =
    useState(null);


  const [
    youtubeInfo,
    setYoutubeInfo,
  ] =
    useState(null);


  const [
    youtubeLoading,
    setYoutubeLoading,
  ] =
    useState(false);


  const [
    youtubeError,
    setYoutubeError,
  ] =
    useState("");


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


  useEffect(
    () => {
      let active =
        true;


      async function loadPlaylist() {
        setLoading(
          true
        );

        setNotFound(
          false
        );

        setErrorMessage(
          ""
        );


        const {
          data,
          error,
        } =
          await supabase
            .from(
              "music_playlists"
            )
            .select(`
              id,
              title,
              slug,
              description,
              youtube_url,
              youtube_playlist_id,
              recommendation_signature,
              music_playlist_items (
                id,
                position,
                music_recommendations (
                  id,
                  title,
                  artist,
                  slug,
                  youtube_url,
                  release_year,
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
            .maybeSingle();


        if (
          !active
        ) {
          return;
        }


        if (
          error
        ) {
          console.error(
            "Učitavanje plejliste:",
            error
          );

          setErrorMessage(
            "Плејлисту тренутно није могуће учитати."
          );

          setLoading(
            false
          );

          return;
        }


        if (
          !data
        ) {
          setNotFound(
            true
          );

          setLoading(
            false
          );

          return;
        }


        setPlaylist(
          data
        );

        setLoading(
          false
        );
      }


      loadPlaylist();


      return () => {
        active =
          false;
      };
    },
    [
      playlistSlug,
    ]
  );


  useEffect(
    () => {
      const playlistId =
        String(
          playlist
            ?.youtube_playlist_id ??
          ""
        ).trim();


      if (
        !playlistId
      ) {
        setYoutubeInfo(
          null
        );

        setYoutubeError(
          ""
        );

        setYoutubeLoading(
          false
        );

        return undefined;
      }


      let active =
        true;


      async function loadExternalInfo() {
        setYoutubeLoading(
          true
        );

        setYoutubeError(
          ""
        );


        try {
          const infoMap =
            await loadYouTubePlaylistInfo(
              [
                playlistId,
              ],
              {
                includeItems:
                  true,
              }
            );


          if (
            !active
          ) {
            return;
          }


          setYoutubeInfo(
            infoMap[
              playlistId
            ] ??
            null
          );

        } catch (
          error
        ) {
          console.error(
            "YouTube playlist metadata:",
            error
          );


          if (
            active
          ) {
            setYoutubeError(
              "Списак песама тренутно није могуће учитати."
            );
          }

        } finally {
          if (
            active
          ) {
            setYoutubeLoading(
              false
            );
          }
        }
      }


      loadExternalInfo();


      return () => {
        active =
          false;
      };
    },
    [
      playlist
        ?.youtube_playlist_id,
    ]
  );


  const tracks =
    useMemo(
      () => {
        if (
          !Array.isArray(
            playlist
              ?.music_playlist_items
          )
        ) {
          return [];
        }


        return [
          ...playlist
            .music_playlist_items,
        ]
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
              recommendation
            ) =>
              recommendation &&
              recommendation.status ===
                "published"
          );
      },
      [
        playlist,
      ]
    );


  const externalTracks =
    useMemo(
      () =>
        Array.isArray(
          youtubeInfo
            ?.items
        )
          ? youtubeInfo
              .items
          : [],
      [
        youtubeInfo,
      ]
    );


  const displayExternalTracks =
    useMemo(
      () =>
        externalTracks.slice(
          0,
          12
        ),
      [
        externalTracks,
      ]
    );


  const isExternalYouTubePlaylist =
    Boolean(
      playlist
        ?.youtube_playlist_id
    );


  const currentPath =
    `${location.pathname}${location.search}`;


  const localPlaybackQueue =
    useMemo(
      () =>
        tracks
          .filter(
            (
              track
            ) =>
              Boolean(
                track.youtube_url
              )
          )
          .map(
            (
              track
            ) => {
              const genre =
                getGenre(
                  track
                );


              const readerPath =
                genre?.slug
                  ? `/autor/covek/muzika/preporuke/${genre.slug}/${track.slug}`
                  : null;


              return {
                id:
                  `playlist:${playlist?.id}:${track.id}`,

                title:
                  track.title,

                artist:
                  track.artist ||
                  "НЕПОЗНАТ ИЗВОЂАЧ",

                slug:
                  track.slug,

                youtube_url:
                  track.youtube_url,

                source:
                  "recommendation",

                sourceLabel:
                  "ПЛЕЈЛИСТА",

                music_genres:
                  track.music_genres,

                readerPath,
              };
            }
          ),
      [
        tracks,
        playlist,
      ]
    );


  /*
   * YouTube plejlista postaje potpuno
   * normalan queue za naš postojeći
   * zvučnik.
   */
  const externalPlaybackQueue =
    useMemo(
      () =>
        externalTracks
          .filter(
            (
              track
            ) =>
              Boolean(
                track.videoId
              )
          )
          .map(
            (
              track,
              index
            ) => ({
              id:
                `youtube-playlist:${playlist?.id}:${track.videoId}`,

              title:
                track.title,

              artist:
                track.channelTitle ||
                "YOUTUBE",

              slug:
                `${playlist?.slug ?? "playlist"}-${index + 1}`,

              youtube_url:
                `https://www.youtube.com/watch?v=${track.videoId}`,

              source:
                "youtube-playlist",

              sourceLabel:
                "ПЛЕЈЛИСТА",

              readerPath:
                currentPath,
            })
          ),
      [
        externalTracks,
        playlist,
        currentPath,
      ]
    );


  const playbackQueue =
    isExternalYouTubePlaylist
      ? externalPlaybackQueue
      : localPlaybackQueue;


  const playbackState =
    playbackQueue.length
      ? createMusicPlaybackState({
          queue:
            playbackQueue,

          startIndex:
            0,

          origin: {
            path:
              currentPath,

            label:
              isExternalYouTubePlaylist
                ? "ЧИТАЈ"
                : "НАЗАД У ПЛЕЈЛИСТУ",

            state:
              location.state ??
              null,
          },

          autoplay:
            true,
        })
      : null;


  const visualTracks =
    isExternalYouTubePlaylist
      ? displayExternalTracks
      : tracks;


  if (
    notFound
  ) {
    return (
      <Navigate
        to="/autor/covek/muzika/preporuke/plejliste"
        replace
      />
    );
  }


  return (
    <main className="music-recommendations">
      <div className="music-recommendations__shell">
        <Link
          to="/autor/covek/muzika/preporuke/plejliste"
          className="music-recommendations__back"
          onClick={
            playUiBack
          }
        >
          ← ПЛЕЈЛИСТЕ
        </Link>


        {loading ? (
          <div className="music-recommendations__state">
            Учитавање плејлисте...
          </div>

        ) : errorMessage ? (
          <div className="music-recommendations__state">
            {errorMessage}
          </div>

        ) : playlist ? (
          <section className="music-recommendations__playlist-open">
            <div className="music-recommendations__playlist-open-bulk">
              <div className="music-recommendations__playlist-open-lid" />

              <div className="music-recommendations__playlist-open-stack">
                {visualTracks
                  .slice(
                    0,
                    12
                  )
                  .map(
                    (
                      track,
                      index
                    ) => (
                      <span
                        key={
                          track.id ??
                          track.videoId ??
                          index
                        }
                        style={{
                          "--disc-index":
                            index,
                        }}
                      />
                    )
                  )}
              </div>

              <div className="music-recommendations__playlist-open-pin" />

              <div className="music-recommendations__playlist-open-base" />
            </div>


            <div className="music-recommendations__playlist-open-copy">
              <header className="music-recommendations__heading">
                <p>
                  ПЛЕЈЛИСТА

                  {isExternalYouTubePlaylist &&
                  Number.isFinite(
                    youtubeInfo
                      ?.itemCount
                  )
                    ? ` · ${youtubeInfo.itemCount} ПЕСАМА`
                    : ""}
                </p>

                <h1>
                  {playlist.title}
                </h1>

                {playlist.description ? (
                  <span>
                    {playlist.description}
                  </span>
                ) : null}
              </header>


              {isExternalYouTubePlaylist &&
              youtubeLoading ? (
                <p className="music-recommendations__radio-play-note">
                  ПРИПРЕМА ПЛЕЈЛИСТЕ...
                </p>

              ) : playbackState ? (
                <Link
                  to={
                    MUSIC_HUB_PATH
                  }
                  state={
                    playbackState
                  }
                  className="music-recommendations__radio-play"
                  onClick={
                    playUiSelect
                  }
                >
                  ПУСТИ НА РАДИЈУ ▶
                </Link>

              ) : (
                <p className="music-recommendations__radio-play-note">
                  Плејлиста нема доступне
                  YouTube песме.
                </p>
              )}


              {isExternalYouTubePlaylist ? (
                <>
                  {youtubeLoading ? (
                    <div className="music-recommendations__state">
                      Учитавање списка песама...
                    </div>

                  ) : youtubeError ? (
                    <div className="music-recommendations__state">
                      {youtubeError}
                    </div>

                  ) : displayExternalTracks.length ? (
                    <div className="music-recommendations__playlist-tracklist">
                      {displayExternalTracks.map(
                        (
                          track,
                          index
                        ) => (
                          <Link
                            key={
                              track.videoId ||
                              index
                            }
                            to={
                              MUSIC_HUB_PATH
                            }
                            state={
                              createMusicPlaybackState({
                                queue:
                                  externalPlaybackQueue,

                                startIndex:
                                  index,

                                origin: {
                                  path:
                                    currentPath,

                                  label:
                                    "ЧИТАЈ",

                                  state:
                                    location.state ??
                                    null,
                                },

                                autoplay:
                                  true,
                              })
                            }
                            className="music-recommendations__playlist-track"
                            onClick={
                              playUiSelect
                            }
                          >
                            <span className="music-recommendations__playlist-track-number">
                              {String(
                                index +
                                1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </span>

                            <span
                              className="music-recommendations__playlist-track-disc"
                              aria-hidden="true"
                            />

                            <div>
                              <h2>
                                {track.title}
                              </h2>

                              <p>
                                {track.channelTitle ||
                                  "YOUTUBE"}
                              </p>
                            </div>

                            <small>
                              YOUTUBE
                            </small>

                            <span
                              aria-hidden="true"
                            >
                              ▶
                            </span>
                          </Link>
                        )
                      )}


                      {Number(
                        youtubeInfo
                          ?.itemCount ??
                        0
                      ) >
                      displayExternalTracks.length ? (
                        <p className="music-recommendations__radio-play-note">
                          + још{" "}
                          {
                            Number(
                              youtubeInfo
                                .itemCount
                            ) -
                            displayExternalTracks.length
                          }{" "}
                          песама у плејлисти
                        </p>
                      ) : null}
                    </div>

                  ) : (
                    <div className="music-recommendations__state">
                      Нема доступних песама.
                    </div>
                  )}
                </>

              ) : (
                <div className="music-recommendations__playlist-tracklist">
                  {tracks.map(
                    (
                      track,
                      index
                    ) => {
                      const genre =
                        getGenre(
                          track
                        );


                      const readerPath =
                        genre?.slug
                          ? `/autor/covek/muzika/preporuke/${genre.slug}/${track.slug}`
                          : null;


                      const content = (
                        <>
                          <span className="music-recommendations__playlist-track-number">
                            {String(
                              index +
                                1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>

                          <span
                            className="music-recommendations__playlist-track-disc"
                            aria-hidden="true"
                          />

                          <div>
                            <h2>
                              {track.title}
                            </h2>

                            <p>
                              {track.artist ||
                                "НЕПОЗНАТ ИЗВОЂАЧ"}
                            </p>
                          </div>

                          <small>
                            {genre?.name ||
                              "БЕЗ ЖАНРА"}

                            {track.release_year
                              ? ` · ${track.release_year}`
                              : ""}
                          </small>

                          <span
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </>
                      );


                      if (
                        !readerPath
                      ) {
                        return (
                          <div
                            key={
                              track.id
                            }
                            className="music-recommendations__playlist-track is-disabled"
                          >
                            {content}
                          </div>
                        );
                      }


                      return (
                        <Link
                          key={
                            track.id
                          }
                          to={
                            readerPath
                          }
                          state={{
                            musicRecommendationsBackTo:
                              `/autor/covek/muzika/preporuke/plejliste/${playlist.slug}`,
                          }}
                          className="music-recommendations__playlist-track"
                          onClick={
                            playUiSelect
                          }
                        >
                          {content}
                        </Link>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}


export default HumanOneMusicPlaylist;