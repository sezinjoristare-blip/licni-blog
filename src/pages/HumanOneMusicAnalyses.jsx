import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  playUiBack,
  playUiSelect,
} from "../audio/uiSounds";

import "../styles/HumanOneMusicAnalyses.css";


function HumanOneMusicAnalyses() {
  const [
    works,
    setWorks,
  ] =
    useState([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");


  useEffect(
    () => {
      let active =
        true;


      async function loadWorks() {
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
              "music_analysis_works"
            )
            .select(`
              id,
              title,
              artist,
              slug,
              image_url,
              translation,
              sort_order
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


        if (
          !active
        ) {
          return;
        }


        if (
          error
        ) {
          console.error(
            "Učitavanje analiza:",
            error
          );


          setErrorMessage(
            "Анализе тренутно није могуће учитати."
          );

          setLoading(
            false
          );

          return;
        }


        setWorks(
          data ??
          []
        );

        setLoading(
          false
        );
      }


      loadWorks();


      return () => {
        active =
          false;
      };
    },
    []
  );


  return (
    <main className="music-analyses">
      <div className="music-analyses__shell">
        {/* =====================================
            NAZAD
            ===================================== */}

        <Link
          to="/autor/covek/muzika"
          className="music-analyses__back"
          onClick={
            playUiBack
          }
        >
          ← МУЗИКА
        </Link>


        {/* =====================================
            NASLOV
            ===================================== */}

        <header className="music-analyses__heading">
          <p>
            ПРЕВОДИ / АНАЛИЗЕ
          </p>

          <h1>
            СВЕСКЕ
          </h1>

          <span>
            Белешке, преводи и
            рашчлањивање песама.
          </span>
        </header>


        {/* =====================================
            STANJA
            ===================================== */}

        {loading ? (
          <div className="music-analyses__state">
            Учитавање свезака...
          </div>

        ) : errorMessage ? (
          <div className="music-analyses__state">
            {errorMessage}
          </div>

        ) : !works.length ? (
          <div className="music-analyses__state">
            Још нема објављених
            анализа.
          </div>

        ) : (
          <>
            <div className="music-analyses__counter">
              <span>
                НА ПОЛИЦИ
              </span>

              <strong>
                {String(
                  works.length
                ).padStart(
                  2,
                  "0"
                )}
              </strong>
            </div>


            {/* =====================================
                SVESKE
                ===================================== */}

            <section className="music-analyses__notebooks">
              {works.map(
                (
                  work,
                  index
                ) => {
                  const hasTranslation =
                    Boolean(
                      work
                        .translation
                        ?.trim()
                    );


                  const notebookNumber =
                    String(
                      index +
                      1
                    ).padStart(
                      2,
                      "0"
                    );


                  const rotation =
                    [
                      "-1.3deg",
                      "0.8deg",
                      "-0.5deg",
                      "1.15deg",
                      "-0.85deg",
                      "0.45deg",
                    ][
                      index %
                      6
                    ];


                  return (
                    <Link
                      key={
                        work.id
                      }
                      to={
                        `/autor/covek/muzika/analize/${work.slug}`
                      }
                      className="music-analyses__notebook"
                      style={{
                        "--notebook-rotation":
                          rotation,

                        "--notebook-index":
                          index,
                      }}
                      onClick={
                        playUiSelect
                      }
                      aria-label={
                        `Отвори ${
                          work.title
                        } — ${
                          work.artist ||
                          "непознат извођач"
                        }`
                      }
                    >
                      {/* SPIRALA */}

                      <span
                        className="music-analyses__spiral"
                        aria-hidden="true"
                      >
                        {Array.from({
                          length:
                            11,
                        }).map(
                          (
                            _,
                            spiralIndex
                          ) => (
                            <i
                              key={
                                spiralIndex
                              }
                            />
                          )
                        )}
                      </span>


                      {/* KORICE */}

                      <div className="music-analyses__cover">
                        <span
                          className="music-analyses__corner"
                          aria-hidden="true"
                        />


                        <div className="music-analyses__top-line">
                          <span>
                            СЕКИЈЕВЕ БЕЛЕШКЕ
                          </span>

                          <strong>
                            {notebookNumber}
                          </strong>
                        </div>


                        {/* FOTOGRAFIJA */}

                        <div
                          className={`
                            music-analyses__photo
                            ${
                              work.image_url
                                ? "has-image"
                                : "is-empty"
                            }
                          `}
                        >
                          {work.image_url ? (
                            <img
                              src={
                                work.image_url
                              }
                              alt=""
                              loading="lazy"
                            />

                          ) : (
                            <span>
                              {notebookNumber}
                            </span>
                          )}
                        </div>


                        {/* TIP RADA */}

                        <div className="music-analyses__type">
                          {hasTranslation
                            ? "ПРЕВОД + АНАЛИЗА"
                            : "АНАЛИЗА"}
                        </div>


                        {/* NASLOV */}

                        <div className="music-analyses__copy">
                          <h2>
                            {work.title}
                          </h2>

                          <p>
                            {work.artist ||
                              "НЕПОЗНАТ ИЗВОЂАЧ"}
                          </p>
                        </div>


                        {/* DONJI DEO */}

                        <div className="music-analyses__footer">
                          <span>
                            ОТВОРИ СВЕСКУ
                          </span>

                          <strong>
                            →
                          </strong>
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}


export default HumanOneMusicAnalyses;