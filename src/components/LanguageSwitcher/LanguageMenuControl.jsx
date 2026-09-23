import {
  LANGUAGES,
} from "../../i18n/constants";

import {
  useLanguage,
} from "../../i18n/LanguageContext";

import "./LanguageMenuControl.css";


function LanguageMenuControl({
  className = "",
}) {
  const {
    language,
    setLanguage,
    t,
  } =
    useLanguage();


  return (
    <div
      className={
        `language-menu-control ${className}`.trim()
      }
    >
      <span className="language-menu-control__label">
        {t(
          "language.label"
        )}
      </span>


      <div
        className="language-menu-control__choices"
        role="group"
        aria-label={
          t(
            "language.chooseLanguage"
          )
        }
      >
        <button
          type="button"
          className={
            language ===
            LANGUAGES.SR
              ? "language-menu-control__button language-menu-control__button--active"
              : "language-menu-control__button"
          }
          onClick={() =>
            setLanguage(
              LANGUAGES.SR
            )
          }
          aria-label={
            t(
              "language.switchToSerbian"
            )
          }
          aria-pressed={
            language ===
            LANGUAGES.SR
          }
        >
          СР
        </button>


        <span
          className="language-menu-control__divider"
          aria-hidden="true"
        >
          |
        </span>


        <button
          type="button"
          className={
            language ===
            LANGUAGES.EN
              ? "language-menu-control__button language-menu-control__button--active"
              : "language-menu-control__button"
          }
          onClick={() =>
            setLanguage(
              LANGUAGES.EN
            )
          }
          aria-label={
            t(
              "language.switchToEnglish"
            )
          }
          aria-pressed={
            language ===
            LANGUAGES.EN
          }
        >
          EN
        </button>
      </div>
    </div>
  );
}


export default LanguageMenuControl;