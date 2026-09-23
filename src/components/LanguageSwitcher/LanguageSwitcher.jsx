import {
  LANGUAGES,
} from "../../i18n/constants";

import {
  useLanguage,
} from "../../i18n/LanguageContext";

import "./LanguageSwitcher.css";


function LanguageSwitcher({
  variant = "compact",
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
        `language-switcher language-switcher--${variant}`
      }
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
            ? "language-switcher__button language-switcher__button--active"
            : "language-switcher__button"
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
        className="language-switcher__divider"
        aria-hidden="true"
      >
        |
      </span>


      <button
        type="button"
        className={
          language ===
          LANGUAGES.EN
            ? "language-switcher__button language-switcher__button--active"
            : "language-switcher__button"
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
  );
}


export default LanguageSwitcher;