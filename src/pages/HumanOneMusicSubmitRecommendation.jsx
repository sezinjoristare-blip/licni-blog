import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  playUiBack,
  playUiSelect,
} from "../audio/uiSounds";

import {
  supabase,
} from "../lib/supabaseClient";

import "../styles/HumanOneMusicRecommendations.css";
import "../styles/HumanOneMusicSubmitRecommendation.css";


const INITIAL_FORM = {
  type:
    "music",

  title:
    "",

  creator:
    "",

  genreId:
    "",

  url:
    "",

  senderName:
    "",

  reason:
    "",

  website:
    "",
};


const TYPE_OPTIONS = [
  {
    value:
      "music",

    label:
      "ПЕСМА",
  },

  {
    value:
      "playlist",

    label:
      "ПЛЕЈЛИСТА",
  },

  {
    value:
      "radio_drama",

    label:
      "РАДИО ДРАМА",
  },
];


function getTitleLabel(
  type
) {
  if (
    type ===
    "playlist"
  ) {
    return "НАЗИВ ПЛЕЈЛИСТЕ";
  }


  if (
    type ===
    "radio_drama"
  ) {
    return "НАЗИВ РАДИО ДРАМЕ";
  }


  return "НАЗИВ ПЕСМЕ";
}


function getCreatorLabel(
  type
) {
  if (
    type ===
    "playlist"
  ) {
    return "АУТОР / КАНАЛ — ОПЦИОНО";
  }


  if (
    type ===
    "radio_drama"
  ) {
    return "АУТОР / ПРОДУКЦИЈА — ОПЦИОНО";
  }


  return "ИЗВОЂАЧ — ОПЦИОНО";
}


function getUrlLabel(
  type
) {
  if (
    type ===
    "playlist"
  ) {
    return "YOUTUBE PLAYLIST ЛИНК";
  }


  if (
    type ===
    "radio_drama"
  ) {
    return "YOUTUBE ЛИНК РАДИО ДРАМЕ";
  }


  return "YOUTUBE ЛИНК ПЕСМЕ";
}


function getUrlHelp(
  type
) {
  if (
    type ===
    "playlist"
  ) {
    return (
      "Пошаљи линк целе YouTube плејлисте. " +
      "Ако буде одобрена, пуштаће се директно на звучнику."
    );
  }


  if (
    type ===
    "radio_drama"
  ) {
    return (
      "Пошаљи директан YouTube линк радио драме."
    );
  }


  return (
    "Пошаљи директан YouTube линк песме."
  );
}


async function getFunctionErrorMessage(
  error
) {
  const fallback =
    "Препоруку тренутно није могуће послати.";


  if (!error) {
    return fallback;
  }


  try {
    const response =
      error.context;


    if (
      response &&
      typeof response.json ===
        "function"
    ) {
      const body =
        await response
          .json();


      if (
        typeof body?.error ===
          "string" &&
        body.error.trim()
      ) {
        return body.error;
      }
    }
  } catch {
    // Koristimo fallback.
  }


  return (
    error.message ||
    fallback
  );
}


function HumanOneMusicSubmitRecommendation() {
  const [
    form,
    setForm,
  ] = useState(
    INITIAL_FORM
  );


  const [
    genres,
    setGenres,
  ] = useState([]);


  const [
    genresLoading,
    setGenresLoading,
  ] = useState(true);


  const [
    genresError,
    setGenresError,
  ] = useState("");


  const [
    sending,
    setSending,
  ] = useState(false);


  const [
    status,
    setStatus,
  ] = useState({
    type:
      "",

    message:
      "",
  });


  useEffect(
    () => {
      let active =
        true;


      async function loadGenres() {
        setGenresLoading(
          true
        );

        setGenresError(
          ""
        );


        const {
          data,
          error,
        } =
          await supabase
            .from(
              "music_genres"
            )
            .select(`
              id,
              name,
              slug,
              sort_order
            `)
            .order(
              "sort_order",
              {
                ascending:
                  true,
              }
            )
            .order(
              "name",
              {
                ascending:
                  true,
              }
            );


        if (!active) {
          return;
        }


        if (error) {
          console.error(
            "Učitavanje žanrova:",
            error
          );

          setGenres(
            []
          );

          setGenresError(
            "Жанрове тренутно није могуће учитати."
          );

          setGenresLoading(
            false
          );

          return;
        }


        setGenres(
          data ??
          []
        );

        setGenresLoading(
          false
        );
      }


      loadGenres();


      return () => {
        active =
          false;
      };
    },
    []
  );


  function updateField(
    field,
    value
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );


    if (
      status.message
    ) {
      setStatus({
        type:
          "",

        message:
          "",
      });
    }
  }


  function handleTypeChange(
    event
  ) {
    const nextType =
      event.target.value;


    setForm(
      (
        current
      ) => ({
        ...current,

        type:
          nextType,

        /*
         * Žanr pripada samo pesmi.
         */
        genreId:
          nextType ===
            "music"
            ? current.genreId
            : "",
      })
    );


    setStatus({
      type:
        "",

      message:
        "",
    });
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    if (sending) {
      return;
    }


    const title =
      form.title.trim();

    const senderName =
      form.senderName.trim();

    const reason =
      form.reason.trim();

    const url =
      form.url.trim();


    if (
      !title ||
      !senderName ||
      !reason ||
      !url
    ) {
      setStatus({
        type:
          "error",

        message:
          "Попуни назив, линк, име или надимак и зашто ти се ово свиђа.",
      });

      return;
    }


    if (
      form.type ===
        "music" &&
      !form.genreId
    ) {
      setStatus({
        type:
          "error",

        message:
          "Изабери жанр песме.",
      });

      return;
    }


    setSending(
      true
    );


    setStatus({
      type:
        "",

      message:
        "",
    });


    try {
      const {
        data,
        error,
      } =
        await supabase
          .functions
          .invoke(
            "music-listener-recommendation",
            {
              body: {
                type:
                  form.type,

                title,

                creator:
                  form.creator
                    .trim(),

                genreId:
                  form.type ===
                    "music"
                    ? form.genreId
                    : null,

                url,

                senderName,

                reason,

                website:
                  form.website,
              },
            }
          );


      if (error) {
        throw new Error(
          await getFunctionErrorMessage(
            error
          )
        );
      }


      if (
        !data?.ok
      ) {
        throw new Error(
          "Препоруку тренутно није могуће послати."
        );
      }


      playUiSelect();


      setForm(
        INITIAL_FORM
      );


      setStatus({
        type:
          "success",

        message:
          "ПРЕПОРУКА ЈЕ ПОСЛАТА. ХВАЛА.",
      });

    } catch (
      error
    ) {
      setStatus({
        type:
          "error",

        message:
          error?.message ||
          "Препоруку тренутно није могуће послати.",
      });

    } finally {
      setSending(
        false
      );
    }
  }


  return (
    <main className="music-recommendations music-submit">
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


        <header className="music-submit__heading">
          <p>
            ПРЕПОРУКЕ / 04
          </p>

          <h1>
            ПОШАЉИ
            <br />
            ПРЕПОРУКУ
          </h1>

          <span>
            Ако мислиш да нешто
            вреди чути — остави га
            на полици.
          </span>
        </header>


        <section className="music-submit__desk">
          <div
            className="music-submit__note"
            aria-hidden="true"
          >
            <span>
              НЕ МОРАШ
              <br />
              ДА ОСТАВИШ
              <br />
              МЕЈЛ.
            </span>

            <strong>
              САМО РЕЦИ
              <br />
              ШТА ТИ СЕ
              <br />
              СВИЂА.
            </strong>
          </div>


          <form
            className="music-submit__form"
            onSubmit={
              handleSubmit
            }
          >
            <label>
              <span>
                ШТА ШАЉЕШ?
              </span>

              <select
                value={
                  form.type
                }
                onChange={
                  handleTypeChange
                }
              >
                {TYPE_OPTIONS.map(
                  (
                    option
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </label>


            <label>
              <span>
                {getTitleLabel(
                  form.type
                )}
              </span>

              <input
                type="text"
                value={
                  form.title
                }
                maxLength="180"
                onChange={
                  (
                    event
                  ) =>
                    updateField(
                      "title",
                      event.target.value
                    )
                }
                placeholder="Шта препоручујеш?"
                required
              />
            </label>


            <label>
              <span>
                {getCreatorLabel(
                  form.type
                )}
              </span>

              <input
                type="text"
                value={
                  form.creator
                }
                maxLength="180"
                onChange={
                  (
                    event
                  ) =>
                    updateField(
                      "creator",
                      event.target.value
                    )
                }
                placeholder="Ко стоји иза тога?"
              />
            </label>


            {form.type ===
            "music" ? (
              <label>
                <span>
                  ЖАНР
                </span>

                <select
                  value={
                    form.genreId
                  }
                  onChange={
                    (
                      event
                    ) =>
                      updateField(
                        "genreId",
                        event.target.value
                      )
                  }
                  disabled={
                    genresLoading
                  }
                  required
                >
                  <option value="">
                    {genresLoading
                      ? "УЧИТАВАЊЕ..."
                      : "ИЗАБЕРИ ЖАНР"}
                  </option>

                  {genres.map(
                    (
                      genre
                    ) => (
                      <option
                        key={
                          genre.id
                        }
                        value={
                          genre.id
                        }
                      >
                        {genre.name}
                      </option>
                    )
                  )}
                </select>

                {genresError ? (
                  <small>
                    {genresError}
                  </small>
                ) : null}
              </label>
            ) : null}


            <label>
              <span>
                {getUrlLabel(
                  form.type
                )}
              </span>

              <input
                type="url"
                value={
                  form.url
                }
                maxLength="2048"
                onChange={
                  (
                    event
                  ) =>
                    updateField(
                      "url",
                      event.target.value
                    )
                }
                placeholder="https://youtube.com/..."
                required
              />

              <small>
                {getUrlHelp(
                  form.type
                )}
              </small>
            </label>


            <label>
              <span>
                ИМЕ ИЛИ НАДИМАК
              </span>

              <input
                type="text"
                value={
                  form.senderName
                }
                maxLength="80"
                onChange={
                  (
                    event
                  ) =>
                    updateField(
                      "senderName",
                      event.target.value
                    )
                }
                placeholder="Како да те потпишем?"
                required
              />
            </label>


            <label className="music-submit__reason">
              <span>
                ЗАШТО ТИ СЕ ОВО СВИЂА?
              </span>

              <textarea
                value={
                  form.reason
                }
                maxLength="2000"
                rows="8"
                onChange={
                  (
                    event
                  ) =>
                    updateField(
                      "reason",
                      event.target.value
                    )
                }
                placeholder="Напиши свој утисак..."
                required
              />

              <small>
                {form.reason.length}
                /2000
              </small>
            </label>


            <label
              className="music-submit__website"
              aria-hidden="true"
            >
              Website

              <input
                type="text"
                name="website"
                tabIndex="-1"
                autoComplete="off"
                value={
                  form.website
                }
                onChange={
                  (
                    event
                  ) =>
                    updateField(
                      "website",
                      event.target.value
                    )
                }
              />
            </label>


            {status.message ? (
              <p
                className={
                  status.type ===
                  "success"
                    ? "music-submit__status music-submit__status--success"
                    : "music-submit__status music-submit__status--error"
                }
                role="status"
              >
                {status.message}
              </p>
            ) : null}


            <button
              type="submit"
              className="music-submit__send"
              disabled={
                sending ||
                (
                  form.type ===
                    "music" &&
                  genresLoading
                )
              }
            >
              {sending
                ? "ШАЉЕМ..."
                : "ПОШАЉИ ПРЕПОРУКУ →"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}


export default HumanOneMusicSubmitRecommendation;