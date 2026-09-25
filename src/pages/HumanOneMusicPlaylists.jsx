import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  loadYouTubePlaylistInfo,
} from "../lib/youtubePlaylistInfo";

import {
  playUiBack,
  playUiSelect,
} from "../audio/uiSounds";

import "../styles/HumanOneMusicRecommendations.css";


function normalizeText(
  value
) {
  return String(
    value ??
    ""
  )
    .trim()
    .toLocaleLowerCase(
      "sr"
    );
}


function HumanOneMusicPlaylists() {
  const [
    playlists,
    setPlaylists,
  ] = useState([]);


  const [
    youtubeInfo,
    setYoutubeInfo,
  ] = useState({});


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");


  const [
    sortBy,
    setSortBy,
  ] = useState(
    "manual"
  );


  useEffect(
    () => {
      let active =
        true;


      async function loadPlaylists() {
        setLoading(
          true
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
              sort_order,
              created_at,
              youtube_playlist_id,
              music_playlist_items (
                id
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


        if (
          !active
        ) {
          return;
        }


        if (
          error
        ) {
          console.error(
            "Učitavanje plejlista:",
            error
          );

          setErrorMessage(
            "Плејлисте тренутно није могуће учитати."
          );

          setLoading(
            false
          );

          return;
        }


        const nextPlaylists =
          data ??
          [];


        setPlaylists(
          nextPlaylists
        );


        const externalIds =
          nextPlaylists
            .map(
              (
                playlist
              ) =>
                playlist
                  .youtube_playlist_id
            )
            .filter(
              Boolean
            );


        if (
          externalIds.length
        ) {
          try {
            const info =
              await loadYouTubePlaylistInfo(
                externalIds,
                {
                  includeItems:
                    false,
                }
              );


            if (
              active
            ) {
              setYoutubeInfo(
                info
              );
            }

          } catch (
            metadataError
          ) {
            console.error(
              "YouTube playlist metadata:",
              metadataError
            );
          }
        }


        if (
          active
        ) {
          setLoading(
            false
          );
        }
      }


      loadPlaylists();


      return () => {
        active =
          false;
      };
    },
    []
  );


  const visiblePlaylists =
    useMemo(
      () => {
        const search =
          normalizeText(
            searchTerm
          );


        const filtered =
          playlists.filter(
            (
              playlist
            ) =>
              !search ||
              normalizeText(
                `${playlist.title} ${playlist.description ?? ""}`
              ).includes(
                search
              )
          );


        return [
          ...filtered,
        ].sort(
          (
            first,
            second
          ) => {
            if (
              sortBy ===
              "title"
            ) {
              return first.title
                .localeCompare(
                  second.title,
                  "sr"
                );
            }


            if (
              sortBy ===
              "newest"
            ) {
              return (
                new Date(
                  second.created_at
                ).getTime() -
                new Date(
                  first.created_at
                ).getTime()
              );
            }


            return (
              first.sort_order ??
              0
            ) -
            (
              second.sort_order ??
              0
            );
          }
        );
      },
      [
        playlists,
        searchTerm,
        sortBy,
      ]
    );


  return (
    <main className="music-recommendations">
      <div className="music-recommendations__shell">
        <Link
          to="/autor/covek/muzika/preporuke"
          className="music-recommendations__back"
          onClick={
            playUiBack
          }
        >
          ← ПРЕПОРУКЕ
        </Link>


        <header className="music-recommendations__heading music-recommendations__heading--playlists">
          <h1>
            ПЛЕЈЛИСТЕ
          </h1>

          <span>
            Изабери плејлисту по жељи,
            фазону и мери.
          </span>
        </header>


        <section className="music-recommendations__filters music-recommendations__filters--playlists">
          <label className="music-recommendations__search">
            <span>
              ПРЕТРАГА
            </span>

            <input
              type="search"
              value={
                searchTerm
              }
              onChange={
                (
                  event
                ) =>
                  setSearchTerm(
                    event.target
                      .value
                  )
              }
              placeholder="Назив плејлисте..."
            />
          </label>


          <label>
            <span>
              РЕДОСЛЕД
            </span>

            <select
              value={
                sortBy
              }
              onChange={
                (
                  event
                ) =>
                  setSortBy(
                    event.target
                      .value
                  )
              }
            >
              <option value="manual">
                МОЈ РЕДОСЛЕД
              </option>

              <option value="title">
                НАЗИВ
              </option>

              <option value="newest">
                НАЈНОВИЈЕ
              </option>
            </select>
          </label>
        </section>


        {loading ? (
          <div className="music-recommendations__state">
            Учитавање...
          </div>

        ) : errorMessage ? (
          <div className="music-recommendations__state">
            {errorMessage}
          </div>

        ) : !visiblePlaylists.length ? (
          <div className="music-recommendations__state">
            Још нема објављених
            плејлиста.
          </div>

        ) : (
          <section className="music-recommendations__playlist-grid">
            {visiblePlaylists.map(
              (
                playlist
              ) => {
                const playlistId =
                  playlist
                    .youtube_playlist_id;


                const externalInfo =
                  playlistId
                    ? youtubeInfo[
                        playlistId
                      ]
                    : null;


                const localCount =
                  Array.isArray(
                    playlist
                      .music_playlist_items
                  )
                    ? playlist
                        .music_playlist_items
                        .length
                    : 0;


                const songCount =
                  playlistId
                    ? externalInfo
                        ?.itemCount ??
                      null
                    : localCount;


                return (
                  <Link
                    key={
                      playlist.id
                    }
                    to={
                      `/autor/covek/muzika/preporuke/plejliste/${playlist.slug}`
                    }
                    className="music-recommendations__playlist-card"
                    onClick={
                      playUiSelect
                    }
                  >
                    <div className="music-recommendations__playlist-visual-zone">
                      <div
                        className="music-recommendations__playlist-bulk"
                        aria-hidden="true"
                      >
                        <div className="music-recommendations__playlist-bulk-lid" />

                        <div className="music-recommendations__playlist-bulk-stack">
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                        </div>

                        <div className="music-recommendations__playlist-bulk-pin" />

                        <div className="music-recommendations__playlist-bulk-base">
                          <b>
                            {songCount ===
                            null
                              ? "—"
                              : String(
                                  songCount
                                ).padStart(
                                  2,
                                  "0"
                                )}
                          </b>
                        </div>
                      </div>
                    </div>


                    <div className="music-recommendations__playlist-copy">
                      <small>
                        ПЛЕЈЛИСТА
                        {" · "}

                        {songCount ===
                        null
                          ? "?"
                          : songCount}

                        {" "}

                        {songCount ===
                        1
                          ? "ПЕСМА"
                          : "ПЕСАМА"}
                      </small>

                      <h2>
                        {playlist.title}
                      </h2>

                      <p>
                        {playlist.description ||
                          "Без описа."}
                      </p>

                      <strong>
                        ОТВОРИ ПЛЕЈЛИСТУ →
                      </strong>
                    </div>
                  </Link>
                );
              }
            )}
          </section>
        )}
      </div>
    </main>
  );
}


export default HumanOneMusicPlaylists;