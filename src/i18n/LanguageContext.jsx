import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
} from "./constants";

import {
  translations,
} from "./translations";


const LanguageContext =
  createContext(null);


function getInitialLanguage() {
  if (
    typeof window ===
    "undefined"
  ) {
    return DEFAULT_LANGUAGE;
  }


  const storedLanguage =
    window.localStorage
      .getItem(
        LANGUAGE_STORAGE_KEY
      );


  if (
    SUPPORTED_LANGUAGES.includes(
      storedLanguage
    )
  ) {
    return storedLanguage;
  }


  return DEFAULT_LANGUAGE;
}


function getNestedValue(
  object,
  path
) {
  return String(
    path ||
    ""
  )
    .split(".")
    .reduce(
      (
        current,
        key
      ) =>
        current?.[key],
      object
    );
}


export function LanguageProvider({
  children,
}) {
  const [
    language,
    setLanguageState,
  ] = useState(
    getInitialLanguage
  );


  const setLanguage =
    useCallback(
      (
        nextLanguage
      ) => {
        if (
          !SUPPORTED_LANGUAGES.includes(
            nextLanguage
          )
        ) {
          return;
        }


        setLanguageState(
          nextLanguage
        );


        window.localStorage
          .setItem(
            LANGUAGE_STORAGE_KEY,
            nextLanguage
          );
      },
      []
    );


  const toggleLanguage =
    useCallback(
      () => {
        setLanguage(
          language ===
            LANGUAGES.SR
            ? LANGUAGES.EN
            : LANGUAGES.SR
        );
      },
      [
        language,
        setLanguage,
      ]
    );


  const t =
    useCallback(
      (
        key,
        fallback = ""
      ) => {
        const value =
          getNestedValue(
            translations[
              language
            ],
            key
          );


        if (
          typeof value ===
          "string"
        ) {
          return value;
        }


        /*
         * Ako greškom još nismo
         * napravili EN prevod UI-ja,
         * probaj srpski pre nego
         * što prikažeš prazan tekst.
         */
        const serbianValue =
          getNestedValue(
            translations[
              LANGUAGES.SR
            ],
            key
          );


        if (
          typeof serbianValue ===
          "string"
        ) {
          return serbianValue;
        }


        return (
          fallback ||
          key
        );
      },
      [
        language,
      ]
    );


  useEffect(() => {
    document.documentElement
      .lang =
      language;


    document.documentElement
      .dataset
      .language =
      language;
  }, [
    language,
  ]);


  const value =
    useMemo(
      () => ({
        language,

        isSerbian:
          language ===
          LANGUAGES.SR,

        isEnglish:
          language ===
          LANGUAGES.EN,

        setLanguage,

        toggleLanguage,

        t,
      }),
      [
        language,
        setLanguage,
        t,
        toggleLanguage,
      ]
    );


  return (
    <LanguageContext.Provider
      value={
        value
      }
    >
      {children}
    </LanguageContext.Provider>
  );
}


export function useLanguage() {
  const context =
    useContext(
      LanguageContext
    );


  if (!context) {
    throw new Error(
      "useLanguage mora biti korišćen unutar LanguageProvider-a."
    );
  }


  return context;
}


export default LanguageContext;