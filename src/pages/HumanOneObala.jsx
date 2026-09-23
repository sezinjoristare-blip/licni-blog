import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import ObalaBartenders
  from "../components/ObalaBartenders";

import LanguageMenuControl
  from "../components/LanguageSwitcher/LanguageMenuControl";

import {
  useLanguage,
} from "../i18n/LanguageContext";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  prepareObalaExitTransition,
  startObalaExitTransition,
} from "../transitions/obalaTransition.js";

import "../styles/pages/HumanOneObala.css";


const COMING_SOON_OVERLAY_STYLE = {
  position:
    "absolute",

  inset:
    0,

  zIndex:
    500,

  display:
    "grid",

  placeItems:
    "center",

  padding:
    "24px",

  boxSizing:
    "border-box",

  background:
    "rgba(7, 5, 3, 0.82)",

  backdropFilter:
    "blur(4px)",
};


const COMING_SOON_CARD_STYLE = {
  width:
    "min(88%, 620px)",

  boxSizing:
    "border-box",

  padding:
    "clamp(28px, 5vw, 48px)",

  border:
    "2px solid rgba(205, 157, 91, 0.82)",

  background:
    "linear-gradient(160deg, rgba(35, 25, 17, 0.98), rgba(13, 10, 8, 0.98))",

  color:
    "#f1dfb4",

  boxShadow:
    "0 18px 55px rgba(0, 0, 0, 0.62)",

  fontFamily:
    '"Courier New", monospace',

  textAlign:
    "center",
};


const COMING_SOON_TEXT_STYLE = {
  margin:
    "0 0 28px",

  fontSize:
    "clamp(1.05rem, 2.3vw, 1.65rem)",

  fontWeight:
    900,

  lineHeight:
    1.45,
};


const COMING_SOON_BUTTON_STYLE = {
  minWidth:
    "190px",

  padding:
    "12px 18px",

  border:
    "1px solid #d28e47",

  background:
    "#7f2018",

  color:
    "#fff0d0",

  fontFamily:
    '"Courier New", monospace',

  fontSize:
    "0.9rem",

  fontWeight:
    900,

  cursor:
    "pointer",
};


function HumanOneObala() {
  const navigate =
    useNavigate();


  const {
    t,
  } =
    useLanguage();


  const [
    currentEvents,
    setCurrentEvents,
  ] =
    useState([]);


  const [
    showStageMessage,
    setShowStageMessage,
  ] =
    useState(false);


  const [
    showCategoryPicker,
    setShowCategoryPicker,
  ] =
    useState(false);


  function handleBack() {
    startObalaExitTransition({
      navigate: () => {
        navigate(
          "/autor/covek"
        );
      },
    });
  }


  function handleNotebook() {
    navigate(
      "/autor/covek/obala/sveska"
    );
  }


  function handleBoard() {
    navigate(
      "/autor/covek/obala/pano"
    );
  }


  function handleGuestbook() {
    navigate(
      "/autor/covek/obala/utisci"
    );
  }


  function handleStage() {
    setShowStageMessage(
      true
    );
  }


  function closeStageMessage() {
    setShowStageMessage(
      false
    );
  }


  function openCategoryPicker() {
    setShowCategoryPicker(
      true
    );
  }


  function closeCategoryPicker() {
    setShowCategoryPicker(
      false
    );
  }


  function handleCategorySelection(
    callback
  ) {
    setShowCategoryPicker(
      false
    );


    callback();
  }


  function handleBartendersCategory() {
    setShowCategoryPicker(
      false
    );


    window.requestAnimationFrame(
      () => {
        document
          .querySelector(
            ".human-one-obala__bartenders"
          )
          ?.click();
      }
    );
  }


  useEffect(() => {
    prepareObalaExitTransition();
  }, []);


  useEffect(() => {
    let active =
      true;


    async function loadCurrentEvents() {
      const now =
        new Date()
          .toISOString();


      const {
        data,
        error,
      } =
        await supabase
          .from(
            "obala_events"
          )
          .select(`
            id,
            title,
            poster_url,
            visible_from,
            expires_at,
            event_date,
            sort_order
          `)
          .eq(
            "status",
            "published"
          )
          .lte(
            "visible_from",
            now
          )
          .gte(
            "expires_at",
            now
          )
          .order(
            "sort_order",
            {
              ascending:
                true,
            }
          )
          .order(
            "event_date",
            {
              ascending:
                true,
            }
          )
          .limit(
            4
          );


      if (
        !active
      ) {
        return;
      }


      if (
        error
      ) {
        setCurrentEvents(
          []
        );


        return;
      }


      setCurrentEvents(
        (
          data ??
          []
        )
          .filter(
            (
              event
            ) =>
              Boolean(
                event.poster_url
              )
          )
      );
    }


    loadCurrentEvents();


    return () => {
      active =
        false;
    };
  }, []);


  return (
    <main className="human-one-obala">
      <div className="human-one-obala__stage">
        <picture>
          <source
            media="(max-width: 700px)"
            srcSet="/images/human-one/obala/obala-bg-mobile.png"
          />

          <img
            className="human-one-obala__background"
            src="/images/human-one/obala/obala-bg.png"
            alt=""
            draggable="false"
          />
        </picture>


        {/* =====================================
            NAZAD
            ===================================== */}

        <button
          type="button"
          className="
            human-one-obala__object
            human-one-obala__back
          "
          onClick={
            handleBack
          }
          aria-label={
            t(
              "obala.backToRoomAria"
            )
          }
        >
          <img
            src="/images/human-one/back-sign.png"
            alt=""
            draggable="false"
          />
        </button>


        {/* =====================================
            MOBILE — BIRAJ KATEGORIJU
            ===================================== */}

        <button
          type="button"
          className="human-one-obala__category-button"
          onClick={
            openCategoryPicker
          }
          aria-label={
            t(
              "obala.chooseCategory"
            )
          }
          aria-expanded={
            showCategoryPicker
          }
          aria-controls="human-one-obala-mobile-category-picker"
        >
          <span
            aria-hidden="true"
          >
            ☰
          </span>
        </button>


        {/* =====================================
            KONOBARI
            ===================================== */}

        <ObalaBartenders />


        {/* =====================================
            PANO
            ===================================== */}

        <button
          type="button"
          className="
            human-one-obala__object
            human-one-obala__board
          "
          onClick={
            handleBoard
          }
          aria-label={
            t(
              "obala.openBoard"
            )
          }
        >
          <picture className="human-one-obala__board-picture">
            <source
              media="(max-width: 700px)"
              srcSet="/images/human-one/obala/obala-board-mobile.png"
            />

            <img
              className="human-one-obala__board-base"
              src="/images/human-one/obala/obala-board.png"
              alt=""
              draggable="false"
            />
          </picture>


          {currentEvents.length >
            0 && (
            <span
              className="human-one-obala__board-posters"
              aria-hidden="true"
            >
              {currentEvents.map(
                (
                  event,
                  index
                ) => (
                  <span
                    key={
                      event.id
                    }
                    className={
                      `human-one-obala__board-poster human-one-obala__board-poster--${index + 1}`
                    }
                  >
                    <img
                      src={
                        event.poster_url
                      }
                      alt=""
                      draggable="false"
                    />

                    <i />
                  </span>
                )
              )}
            </span>
          )}
        </button>


        {/* =====================================
            BINA / INSTRUMENTI
            ===================================== */}

        <button
          type="button"
          className="
            human-one-obala__object
            human-one-obala__stage-object
          "
          onClick={
            handleStage
          }
          aria-label={
            t(
              "obala.stageAria"
            )
          }
        >
          <picture className="human-one-obala__stage-picture">
            <source
              media="(max-width: 700px)"
              srcSet="/images/human-one/obala/obala-stage-mobile.png"
            />

            <img
              src="/images/human-one/obala/obala-stage.png"
              alt=""
              draggable="false"
            />
          </picture>
        </button>


        {/* =====================================
            SVESKA
            ===================================== */}

        <button
          type="button"
          className="
            human-one-obala__object
            human-one-obala__notebook
          "
          onClick={
            handleNotebook
          }
          aria-label={
            t(
              "obala.openNotebook"
            )
          }
        >
          <img
            src="/images/human-one/obala/obala-notebook.png"
            alt=""
            draggable="false"
          />
        </button>


        {/* =====================================
            KNJIGA UTISAKA / TIKVAN
            ===================================== */}

        <button
          type="button"
          className="
            human-one-obala__object
            human-one-obala__guestbook-guy
          "
          onClick={
            handleGuestbook
          }
          aria-label={
            t(
              "obala.openGuestbook"
            )
          }
        >
          <img
            data-obala-transition-target="tikvan"
            src="/images/human-one/obala/obala-guestbook-guy.png"
            alt=""
            draggable="false"
          />
        </button>


        {/* =====================================
            MOBILE — HORIZONTALNI IZBOR
            ===================================== */}

        {showCategoryPicker && (
          <section
            className="human-one-obala__category-picker"
            id="human-one-obala-mobile-category-picker"
            aria-label={
              t(
                "obala.categoryPickerLabel"
              )
            }
          >
            <div className="human-one-obala__category-picker-top">
              <button
                type="button"
                className="human-one-obala__category-close"
                onClick={
                  closeCategoryPicker
                }
              >
                {t(
                  "obala.backToObala"
                )}
              </button>

              <p>
                {t(
                  "obala.swipe"
                )}
              </p>
            </div>


            <LanguageMenuControl />


            <div className="human-one-obala__category-track">
              <button
                type="button"
                className="human-one-obala__category-card"
                onClick={
                  handleBartendersCategory
                }
              >
                <span>
                  {t(
                    "obala.bartenders"
                  )}
                </span>

                <img
                  src="/images/human-one/obala/obala-bartenders.png"
                  alt=""
                  draggable="false"
                />
              </button>


              <button
                type="button"
                className="human-one-obala__category-card"
                onClick={() =>
                  handleCategorySelection(
                    handleBoard
                  )
                }
              >
                <span>
                  {t(
                    "obala.board"
                  )}
                </span>

                <img
                  src="/images/human-one/obala/obala-board-mobile.png"
                  alt=""
                  draggable="false"
                />
              </button>


              <button
                type="button"
                className="human-one-obala__category-card"
                onClick={() =>
                  handleCategorySelection(
                    handleStage
                  )
                }
              >
                <span>
                  {t(
                    "obala.stage"
                  )}
                </span>

                <img
                  src="/images/human-one/obala/obala-stage-mobile.png"
                  alt=""
                  draggable="false"
                />
              </button>


              <button
                type="button"
                className="human-one-obala__category-card"
                onClick={() =>
                  handleCategorySelection(
                    handleNotebook
                  )
                }
              >
                <span>
                  {t(
                    "obala.notebook"
                  )}
                </span>

                <img
                  src="/images/human-one/obala/obala-notebook.png"
                  alt=""
                  draggable="false"
                />
              </button>


              <button
                type="button"
                className="
                  human-one-obala__category-card
                  human-one-obala__category-card--guestbook
                "
                onClick={() =>
                  handleCategorySelection(
                    handleGuestbook
                  )
                }
              >
                <span>
                  {t(
                    "obala.guestbook"
                  )}
                </span>

                <img
                  src="/images/human-one/obala/obala-guestbook-guy.png"
                  alt=""
                  draggable="false"
                />
              </button>
            </div>
          </section>
        )}


        {/* =====================================
            INSTRUMENTI — JOŠ NISU GOTOVI
            ===================================== */}

        {showStageMessage && (
          <div
            style={
              COMING_SOON_OVERLAY_STYLE
            }
            role="presentation"
          >
            <section
              style={
                COMING_SOON_CARD_STYLE
              }
              role="dialog"
              aria-modal="true"
              aria-label={
                t(
                  "obala.stageDialogLabel"
                )
              }
            >
              <p
                style={
                  COMING_SOON_TEXT_STYLE
                }
              >
                {t(
                  "obala.stageComingSoon"
                )}
              </p>

              <button
                type="button"
                style={
                  COMING_SOON_BUTTON_STYLE
                }
                onClick={
                  closeStageMessage
                }
              >
                {t(
                  "obala.backToObala"
                )}
              </button>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}


export default HumanOneObala;