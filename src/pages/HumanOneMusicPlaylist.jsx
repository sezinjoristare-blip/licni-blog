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
  } = useParams();


  const location =
    useLocation();


  const [
    playlist,
    setPlaylist,
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
    let active = true;


    async function loadPlaylist() {
      setLoading(true);
      setNotFound(false);
      setErrorMessage("");


      const {
        data,
        error,
      } = await supabase
        .from(
          "music_playlists"
        )
        .select(`
          id,
          title,
          slug,
          description,
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


      if (!active) {
        return;
      }


      if (error) {
        console.error(
          "Učitavanje plejliste:",
          error
        );

        setErrorMessage(
          "Плејлисту тренутно није могуће учитати."
        );

        setLoading(false);
        return;
      }


      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }


      setPlaylist(data);
      setLoading(false);
    }


    loadPlaylist();


    return () => {
      active = false;
    };
  }, [
    playlistSlug,
  ]);


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


  const playbackQueue =
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


  const playbackState =
    playbackQueue.length
      ? createMusicPlaybackState({
          queue:
            playbackQueue,

          startIndex:
            0,

          origin: {
            path:
              `${location.pathname}${location.search}`,

            label:
              "НАЗАД У ПЛЕЈЛИСТУ",

            state:
              location.state ??
              null,
          },

          autoplay:
            true,
        })
      : null;


  if (notFound) {
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
                {tracks
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
                          track.id
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


              {playbackState ? (
                <Link
                  to={MUSIC_HUB_PATH}
                  state={playbackState}
                  className="music-recommendations__radio-play"
                  onClick={
                    playUiSelect
                  }
                >
                  ПУСТИ НА РАДИЈУ ▶
                </Link>
              ) : (
                <p className="music-recommendations__radio-play-note">
                  У овој плејлисти још нема
                  песама са YouTube линком.
                </p>
              )}


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

                        <span aria-hidden="true">
                          →
                        </span>
                      </>
                    );


                    if (!readerPath) {
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
                        to={readerPath}
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
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}


export default HumanOneMusicPlaylist;
