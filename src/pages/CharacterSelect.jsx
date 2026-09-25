import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useBlog,
} from "../context/BlogContext";

import {
  useLanguage,
} from "../i18n/LanguageContext";

import LanguageSwitcher
  from "../components/LanguageSwitcher/LanguageSwitcher";

import {
  prepareSekiRoomEntryTransition,
  startSekiRoomTransition,
} from "../transitions/sekiRoomTransition.js";

import "../styles/pages/CharacterSelect.css";


let sekiRoomModulePromise =
  null;


function preloadSekiRoomRoute() {
  if (!sekiRoomModulePromise) {
    sekiRoomModulePromise =
      import("./Home");
  }

  return sekiRoomModulePromise;
}


function preloadSekiRoomBackground() {
  if (
    typeof window === "undefined" ||
    typeof Image === "undefined"
  ) {
    return;
  }

  const useMobileBackground =
    typeof window.matchMedia ===
      "function" &&
    window
      .matchMedia(
        "(max-width: 700px)"
      )
      .matches;

  const image =
    new Image();

  image.decoding =
    "async";

  image.src =
    useMobileBackground
      ? "/images/human-one/room-bg-mobile.webp"
      : "/images/human-one/room-bg.webp";
}


const SERGEJ_OVERLAY_STYLE = {
  position:
    "fixed",

  inset:
    0,

  zIndex:
    1000,

  display:
    "grid",

  placeItems:
    "center",

  padding:
    "24px",

  boxSizing:
    "border-box",

  background:
    "rgba(0, 0, 0, 0.84)",

  backdropFilter:
    "blur(5px)",
};


const SERGEJ_CARD_STYLE = {
  width:
    "min(90vw, 640px)",

  boxSizing:
    "border-box",

  padding:
    "clamp(30px, 5vw, 52px)",

  border:
    "3px solid rgba(225, 222, 212, 0.82)",

  background:
    "linear-gradient(160deg, rgba(35, 35, 35, 0.98), rgba(9, 9, 9, 0.99))",

  color:
    "#eeeae0",

  boxShadow:
    "0 22px 65px rgba(0, 0, 0, 0.72)",

  fontFamily:
    'Georgia, "Times New Roman", serif',

  textAlign:
    "center",
};


const SERGEJ_TEXT_STYLE = {
  margin:
    "0 0 30px",

  fontSize:
    "clamp(1.15rem, 2.5vw, 1.8rem)",

  fontWeight:
    900,

  lineHeight:
    1.45,
};


const SERGEJ_BUTTON_STYLE = {
  display:
    "inline-block",

  padding:
    "12px 20px",

  border:
    "2px solid rgba(238, 234, 224, 0.88)",

  background:
    "#111",

  color:
    "#eeeae0",

  fontFamily:
    '"Courier New", monospace',

  fontSize:
    "0.88rem",

  fontWeight:
    900,

  letterSpacing:
    "0.06em",

  textDecoration:
    "none",
};


const FIGHTER_BUTTON_RESET_STYLE = {
  border:
    0,

  padding:
    0,

  background:
    "transparent",

  color:
    "inherit",

  font:
    "inherit",

  cursor:
    "pointer",
};


function CharacterSelect() {
  const navigate =
    useNavigate();


  const {
    siteSettings,
    loading,
  } =
    useBlog();


  const {
    t,
  } =
    useLanguage();


  const sekiPortraitRef =
    useRef(null);


  const [
    showSergejMessage,
    setShowSergejMessage,
  ] =
    useState(false);


  const characterOneName =
    siteSettings
      .character_one_name ||
    "ЧОВЕК 1";


  const characterTwoName =
    siteSettings
      .character_two_name ||
    "ЧОВЕК 2";


  const characterOneImage =
    siteSettings
      .character_one_image_url ||
    siteSettings
      .entry_image_url ||
    "";


  const characterTwoImage =
    siteSettings
      .character_two_image_url ||
    "";


  useEffect(() => {
    prepareSekiRoomEntryTransition();


    let cancelled =
      false;

    let idleId =
      null;

    let timeoutId =
      null;


    function warmSekiRoom() {
      if (cancelled) {
        return;
      }

      preloadSekiRoomRoute()
        .catch(
          () => {}
        );

      preloadSekiRoomBackground();
    }


    if (
      typeof window
        .requestIdleCallback ===
      "function"
    ) {
      idleId =
        window.requestIdleCallback(
          warmSekiRoom,
          {
            timeout: 1200,
          }
        );
    } else {
      timeoutId =
        window.setTimeout(
          warmSekiRoom,
          300
        );
    }


    return () => {
      cancelled =
        true;

      if (timeoutId) {
        window.clearTimeout(
          timeoutId
        );
      }

      if (
        idleId !== null &&
        typeof window
          .cancelIdleCallback ===
          "function"
      ) {
        window.cancelIdleCallback(
          idleId
        );
      }
    };
  }, []);


  function handleSekiSelection(
    event
  ) {
    const isModifiedClick =
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey;


    if (
      event.button !==
        0 ||
      isModifiedClick
    ) {
      return;
    }


    event.preventDefault();


    const roomReady =
      preloadSekiRoomRoute();

    preloadSekiRoomBackground();


    startSekiRoomTransition({
      sourceElement:
        sekiPortraitRef.current,

      navigate: () => {
        roomReady
          .catch(
            () => {}
          )
          .finally(
            () => {
              navigate(
                "/autor/covek"
              );
            }
          );
      },
    });
  }


  if (loading) {
    return (
      <main className="character-select character-select--loading">
        <p>
          {t(
            "common.loading"
          )}
        </p>
      </main>
    );
  }


  return (
    <main className="character-select">
      <div
        className="character-select__texture"
        aria-hidden="true"
      />


      <header className="character-select__header">
        <h1>
          {t(
            "characterSelect.title"
          )}
        </h1>
      </header>


      {/* =====================================
          MOBILE JEZIK

          NAMERNO JE VAN fighters SEKCIJE
          DA NE MENJA :nth-child SELEKTORE
          ===================================== */}

      <div className="character-select__mobile-language">
        <LanguageSwitcher
          variant="entry-inline"
        />
      </div>


      {/* =====================================
          LIČNOSTI

          OVDE OPET POSTOJE SAMO:
          1. SEKI
          2. SERGEJ
          ===================================== */}

      <section className="character-select__fighters">
        <Link
          className="character-select__fighter"
          to="/autor/covek"
          onClick={
            handleSekiSelection
          }
          aria-label={
            `${t(
              "characterSelect.choose"
            )} ${characterOneName}`
          }
        >
          <div className="character-select__frame">
            <div className="character-select__frame-inner">
              {characterOneImage ? (
                <img
                  ref={
                    sekiPortraitRef
                  }
                  className="character-select__image"
                  data-seki-transition-target="character-select-portrait"
                  src={
                    characterOneImage
                  }
                  alt=""
                  decoding="async"
                  fetchPriority="high"
                />
              ) : (
                <div className="character-select__empty">
                  {t(
                    "characterSelect.photo"
                  )}
                </div>
              )}


              <div
                className="character-select__scanlines"
                aria-hidden="true"
              />
            </div>
          </div>


          <div className="character-select__name">
            {characterOneName}
          </div>
        </Link>


        <button
          type="button"
          className="character-select__fighter"
          style={
            FIGHTER_BUTTON_RESET_STYLE
          }
          onClick={() =>
            setShowSergejMessage(
              true
            )
          }
          aria-label={
            `${t(
              "characterSelect.choose"
            )} ${characterTwoName}`
          }
        >
          <div className="character-select__frame">
            <div className="character-select__frame-inner">
              {characterTwoImage ? (
                <img
                  className="character-select__image"
                  src={
                    characterTwoImage
                  }
                  alt=""
                  decoding="async"
                />
              ) : (
                <div className="character-select__empty">
                  {t(
                    "characterSelect.photo"
                  )}
                </div>
              )}


              <div
                className="character-select__scanlines"
                aria-hidden="true"
              />
            </div>
          </div>


          <div className="character-select__name">
            {characterTwoName}
          </div>
        </button>
      </section>


      {showSergejMessage && (
        <div
          style={
            SERGEJ_OVERLAY_STYLE
          }
          role="presentation"
        >
          <section
            style={
              SERGEJ_CARD_STYLE
            }
            role="dialog"
            aria-modal="true"
            aria-label={
              t(
                "characterSelect.notReadyLabel"
              )
            }
          >
            <p
              style={
                SERGEJ_TEXT_STYLE
              }
            >
              {t(
                "characterSelect.notReady"
              )}
            </p>


            <Link
              to="/autor/covek"
              style={
                SERGEJ_BUTTON_STYLE
              }
            >
              {t(
                "characterSelect.sekiRoom"
              )}
            </Link>
          </section>
        </div>
      )}
    </main>
  );
}


export default CharacterSelect;