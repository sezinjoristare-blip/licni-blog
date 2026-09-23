import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

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


function normalizeText(
  value
) {
  return String(
    value ?? ""
  )
    .trim()
    .toLocaleLowerCase(
      "sr"
    );
}


function HumanOneMusicSongs() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();


  const [
    recommendations,
    setRecommendations,
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
    searchTerm,
    setSearchTerm,
  ] = useState(
    () =>
      searchParams.get(
        "trazi"
      ) ?? ""
  );


  const [
    genreFilter,
    setGenreFilter,
  ] = useState(
    () =>
      searchParams.get(
        "zanr"
      ) ?? ""
  );


  const [
    artistFilter,
    setArtistFilter,
  ] = useState(
    () =>
      searchParams.get(
        "izvodjac"
      ) ?? ""
  );


  const [
    yearFilter,
    setYearFilter,
  ] = useState(
    () =>
      searchParams.get(
        "godina"
      ) ?? ""
  );


  const [
    sortBy,
    setSortBy,
  ] = useState(
    () =>
      searchParams.get(
        "sort"
      ) ?? "manual"
  );


  useEffect(
    () => {
      let active =
        true;


      async function loadRecommendations() {
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
            "music_recommendations"
          )
          .select(`
            id,
            title,
            artist,
            slug,
            release_year,
            sort_order,
            created_at,
            music_genres (
              id,
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


        if (!active) {
          return;
        }


        if (error) {
          console.error(
            "Učitavanje preporučenih pesama:",
            error
          );

          setErrorMessage(
            "Дискове тренутно није могуће учитати."
          );

          setLoading(
            false
          );

          return;
        }


        setRecommendations(
          data ?? []
        );

        setLoading(
          false
        );
      }


      loadRecommendations();


      return () => {
        active =
          false;
      };
    },
    []
  );


  useEffect(
    () => {
      const next =
        {};


      if (
        searchTerm.trim()
      ) {
        next.trazi =
          searchTerm.trim();
      }


      if (genreFilter) {
        next.zanr =
          genreFilter;
      }


      if (artistFilter) {
        next.izvodjac =
          artistFilter;
      }


      if (yearFilter) {
        next.godina =
          yearFilter;
      }


      if (
        sortBy !==
        "manual"
      ) {
        next.sort =
          sortBy;
      }


      setSearchParams(
        next,
        {
          replace:
            true,
        }
      );
    },
    [
      searchTerm,
      genreFilter,
      artistFilter,
      yearFilter,
      sortBy,
      setSearchParams,
    ]
  );


  const genres =
    useMemo(
      () => {
        const map =
          new Map();


        recommendations.forEach(
          (
            recommendation
          ) => {
            const genre =
              getGenre(
                recommendation
              );


            if (
              genre?.slug
            ) {
              map.set(
                genre.slug,
                genre
              );
            }
          }
        );


        return [
          ...map.values(),
        ].sort(
          (
            first,
            second
          ) =>
            first.name.localeCompare(
              second.name,
              "sr"
            )
        );
      },
      [
        recommendations,
      ]
    );


  const artists =
    useMemo(
      () => {
        const values =
          recommendations
            .map(
              (
                recommendation
              ) =>
                recommendation
                  .artist
                  ?.trim()
            )
            .filter(
              Boolean
            );


        return [
          ...new Set(
            values
          ),
        ].sort(
          (
            first,
            second
          ) =>
            first.localeCompare(
              second,
              "sr"
            )
        );
      },
      [
        recommendations,
      ]
    );


  const years =
    useMemo(
      () =>
        [
          ...new Set(
            recommendations
              .map(
                (
                  recommendation
                ) =>
                  recommendation
                    .release_year
              )
              .filter(
                (
                  year
                ) =>
                  Number.isFinite(
                    year
                  )
              )
          ),
        ].sort(
          (
            first,
            second
          ) =>
            second -
            first
        ),
      [
        recommendations,
      ]
    );


  const visibleRecommendations =
    useMemo(
      () => {
        const normalizedSearch =
          normalizeText(
            searchTerm
          );


        const filtered =
          recommendations.filter(
            (
              recommendation
            ) => {
              const genre =
                getGenre(
                  recommendation
                );


              if (
                genreFilter &&
                genre?.slug !==
                  genreFilter
              ) {
                return false;
              }


              if (
                artistFilter &&
                recommendation
                  .artist !==
                  artistFilter
              ) {
                return false;
              }


              if (
                yearFilter &&
                String(
                  recommendation
                    .release_year ??
                    ""
                ) !==
                  yearFilter
              ) {
                return false;
              }


              if (
                !normalizedSearch
              ) {
                return true;
              }


              const haystack =
                normalizeText(
                  [
                    recommendation
                      .title,
                    recommendation
                      .artist,
                    genre?.name,
                    recommendation
                      .release_year,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      " "
                    )
                );


              return haystack.includes(
                normalizedSearch
              );
            }
          );


        return [
          ...filtered,
        ].sort(
          (
            first,
            second
          ) => {
            const firstGenre =
              getGenre(
                first
              );

            const secondGenre =
              getGenre(
                second
              );


            if (
              sortBy ===
              "title"
            ) {
              return (
                first.title ??
                ""
              ).localeCompare(
                second.title ??
                  "",
                "sr"
              );
            }


            if (
              sortBy ===
              "artist"
            ) {
              return (
                first.artist ??
                ""
              ).localeCompare(
                second.artist ??
                  "",
                "sr"
              );
            }


            if (
              sortBy ===
              "genre"
            ) {
              return (
                firstGenre
                  ?.name ??
                ""
              ).localeCompare(
                secondGenre
                  ?.name ??
                  "",
                "sr"
              );
            }


            if (
              sortBy ===
              "year-desc"
            ) {
              return (
                second.release_year ??
                -Infinity
              ) -
              (
                first.release_year ??
                -Infinity
              );
            }


            if (
              sortBy ===
              "year-asc"
            ) {
              return (
                first.release_year ??
                Infinity
              ) -
              (
                second.release_year ??
                Infinity
              );
            }


            const orderDifference =
              (
                first.sort_order ??
                0
              ) -
              (
                second.sort_order ??
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
                second.created_at
              ).getTime() -
              new Date(
                first.created_at
              ).getTime()
            );
          }
        );
      },
      [
        recommendations,
        searchTerm,
        genreFilter,
        artistFilter,
        yearFilter,
        sortBy,
      ]
    );


  const readerReturnPath =
    useMemo(
      () => {
        const params =
          new URLSearchParams();


        if (
          searchTerm.trim()
        ) {
          params.set(
            "trazi",
            searchTerm.trim()
          );
        }


        if (genreFilter) {
          params.set(
            "zanr",
            genreFilter
          );
        }


        if (artistFilter) {
          params.set(
            "izvodjac",
            artistFilter
          );
        }


        if (yearFilter) {
          params.set(
            "godina",
            yearFilter
          );
        }


        if (
          sortBy !==
          "manual"
        ) {
          params.set(
            "sort",
            sortBy
          );
        }


        const query =
          params.toString();


        return (
          "/autor/covek/muzika/preporuke/pesme" +
          (
            query
              ? `?${query}`
              : ""
          )
        );
      },
      [
        searchTerm,
        genreFilter,
        artistFilter,
        yearFilter,
        sortBy,
      ]
    );


  function resetFilters() {
    setSearchTerm("");
    setGenreFilter("");
    setArtistFilter("");
    setYearFilter("");
    setSortBy(
      "manual"
    );

    playUiSelect();
  }


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


        <header className="music-recommendations__heading">
          <p>
            ПРЕПОРУКЕ / ДИСКОВИ
          </p>

          <h1>
            ВИНИЛ ПОЛИЦА
          </h1>

          <span>
            Претражи, филтрирај
            и извуци плочу.
          </span>
        </header>


        <section className="music-recommendations__filters">
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
              placeholder="Песма, извођач, жанр..."
            />
          </label>


          <label>
            <span>
              ЖАНР
            </span>

            <select
              value={
                genreFilter
              }
              onChange={
                (
                  event
                ) =>
                  setGenreFilter(
                    event.target
                      .value
                  )
              }
            >
              <option value="">
                СВИ ЖАНРОВИ
              </option>

              {genres.map(
                (
                  genre
                ) => (
                  <option
                    key={
                      genre.slug
                    }
                    value={
                      genre.slug
                    }
                  >
                    {genre.name}
                  </option>
                )
              )}
            </select>
          </label>


          <label>
            <span>
              ИЗВОЂАЧ
            </span>

            <select
              value={
                artistFilter
              }
              onChange={
                (
                  event
                ) =>
                  setArtistFilter(
                    event.target
                      .value
                  )
              }
            >
              <option value="">
                СВИ ИЗВОЂАЧИ
              </option>

              {artists.map(
                (
                  artist
                ) => (
                  <option
                    key={
                      artist
                    }
                    value={
                      artist
                    }
                  >
                    {artist}
                  </option>
                )
              )}
            </select>
          </label>


          <label>
            <span>
              ГОДИНА
            </span>

            <select
              value={
                yearFilter
              }
              onChange={
                (
                  event
                ) =>
                  setYearFilter(
                    event.target
                      .value
                  )
              }
            >
              <option value="">
                СВЕ ГОДИНЕ
              </option>

              {years.map(
                (
                  year
                ) => (
                  <option
                    key={
                      year
                    }
                    value={
                      year
                    }
                  >
                    {year}
                  </option>
                )
              )}
            </select>
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

              <option value="artist">
                ИЗВОЂАЧ
              </option>

              <option value="genre">
                ЖАНР
              </option>

              <option value="year-desc">
                ГОДИНА ↓
              </option>

              <option value="year-asc">
                ГОДИНА ↑
              </option>
            </select>
          </label>


          <button
            type="button"
            className="music-recommendations__reset"
            onClick={
              resetFilters
            }
          >
            РЕСЕТ
          </button>
        </section>


        <div className="music-recommendations__counter">
          <span>
            ПРОНАЂЕНО
          </span>

          <strong>
            {String(
              visibleRecommendations
                .length
            ).padStart(
              2,
              "0"
            )}
          </strong>
        </div>


        {loading ? (
          <div className="music-recommendations__state">
            Учитавање плоча...
          </div>

        ) : errorMessage ? (
          <div className="music-recommendations__state">
            {errorMessage}
          </div>

        ) : !visibleRecommendations.length ? (
          <div className="music-recommendations__state">
            Нема плоча које
            одговарају овом филтеру.
          </div>

        ) : (
          <section className="music-recommendations__vinyl-grid">
            {visibleRecommendations.map(
              (
                recommendation,
                index
              ) => {
                const genre =
                  getGenre(
                    recommendation
                  );


                const readerPath =
                  genre?.slug
                    ? `/autor/covek/muzika/preporuke/${genre.slug}/${recommendation.slug}`
                    : null;


                const content = (
                  <>
                    <div
                      className="music-recommendations__vinyl"
                      style={{
                        "--vinyl-delay":
                          `${index * -0.37}s`,
                      }}
                      aria-hidden="true"
                    >
                      <div className="music-recommendations__vinyl-groove" />

                      <div className="music-recommendations__vinyl-label">
                        <span>
                          {recommendation
                            .release_year ||
                            "СЕКИ"}
                        </span>
                      </div>

                      <div className="music-recommendations__vinyl-hole" />
                    </div>


                    <div className="music-recommendations__vinyl-copy">
                      <small>
                        {genre?.name ||
                          "БЕЗ ЖАНРА"}

                        {recommendation
                          .release_year
                          ? ` · ${recommendation.release_year}`
                          : ""}
                      </small>

                      <h2>
                        {recommendation
                          .title}
                      </h2>

                      <p>
                        {recommendation
                          .artist ||
                          "НЕПОЗНАТ ИЗВОЂАЧ"}
                      </p>

                      <strong>
                        ИЗВУЦИ ПЛОЧУ →
                      </strong>
                    </div>
                  </>
                );


                if (!readerPath) {
                  return (
                    <article
                      key={
                        recommendation.id
                      }
                      className="music-recommendations__vinyl-card is-disabled"
                    >
                      {content}
                    </article>
                  );
                }


                return (
                  <Link
                    key={
                      recommendation.id
                    }
                    to={
                      readerPath
                    }
                    state={{
                      musicRecommendationsBackTo:
                        readerReturnPath,
                    }}
                    className="music-recommendations__vinyl-card"
                    onClick={
                      playUiSelect
                    }
                  >
                    {content}
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


export default HumanOneMusicSongs;