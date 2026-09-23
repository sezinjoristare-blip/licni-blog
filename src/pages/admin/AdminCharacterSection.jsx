import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  Navigate,
  useParams,
} from "react-router-dom";

import {
  useBlog,
} from "../../context/BlogContext";

import {
  supabase,
} from "../../lib/supabaseClient";

import useAdminDraft
  from "../../admin-safety/useAdminDraft";

import "../../styles/admin/AdminCharacters.css";


const VALID_CHARACTERS = [
  "covek-1",
  "covek-2",
];


const MAIN_SECTIONS = {
  identitet: {
    title:
      "ИДЕНТИТЕТ",

    description:
      "Име, фотографија и основни подаци лика.",
  },

  soba: {
    title:
      "СОБА",

    description:
      "Изглед собе, предмети и њихове интеракције.",
  },

  muzika: {
    title:
      "МУЗИКА",

    description:
      "Радио, музичке препоруке, анализе и преводи.",
  },

  tekstovi: {
    title:
      "ТЕКСТОВИ",

    description:
      "Текстови који припадају овом лику.",
  },
};


const HUMAN_ONE_ABOUT_SECTIONS = {
  "licni-principi": {
    title:
      "ЛИЧНИ ПРИНЦИПИ",

    sortOrder:
      1,
  },

  filozofija: {
    title:
      "ФИЛОЗОФИЈА",

    sortOrder:
      2,
  },

  sudbina: {
    title:
      "СУДБИНА",

    sortOrder:
      3,
  },

  put: {
    title:
      "ПУТ",

    sortOrder:
      4,
  },

  zelje: {
    title:
      "ЖЕЉЕ",

    sortOrder:
      5,
  },
};


function AdminCharacterSection() {
  const {
    characterKey,
    sectionKey,
  } = useParams();


  const {
    siteSettings,
  } = useBlog();


  const [
    content,
    setContent,
  ] = useState("");


  const [
    editorLoading,
    setEditorLoading,
  ] = useState(true);


  const [
    loadedEditorKey,
    setLoadedEditorKey,
  ] = useState("");


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    statusMessage,
    setStatusMessage,
  ] = useState("");


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  const isValidCharacter =
    VALID_CHARACTERS.includes(
      characterKey
    );


  const isCharacterOne =
    characterKey ===
    "covek-1";


  const characterName =
    isCharacterOne
      ? (
        siteSettings
          .character_one_name ||
        "ЧОВЕК 1"
      )
      : (
        siteSettings
          .character_two_name ||
        "ЧОВЕК 2"
      );


  const isAboutSection =
    isCharacterOne &&
    Boolean(
      HUMAN_ONE_ABOUT_SECTIONS[
        sectionKey
      ]
    );


  const section =
    isAboutSection
      ? HUMAN_ONE_ABOUT_SECTIONS[
          sectionKey
        ]
      : MAIN_SECTIONS[
          sectionKey
        ];


  const editorKey =
    `${characterKey || "unknown"}:${
      sectionKey || "unknown"
    }`;


  const draftKey =
    `character-about:${editorKey}`;


  const editorReady =
    isAboutSection &&
    loadedEditorKey ===
      editorKey &&
    !editorLoading;


  const {
    recovered,
    recoveredAt,
    markCommitted,
  } = useAdminDraft({
    draftKey,

    data: {
      content,
    },

    onRestore:
      (
        savedDraft
      ) => {
        if (
          typeof savedDraft
            ?.content ===
          "string"
        ) {
          setContent(
            savedDraft.content
          );
        }
      },

    ready:
      editorReady,

    enabled:
      isAboutSection,

    scope:
      section?.title ||
      "О мени",
  });


  /*
   * ==========================================
   * UČITAVANJE SERVER VERZIJE
   * ==========================================
   */

  useEffect(() => {
    if (
      !isValidCharacter ||
      !isAboutSection
    ) {
      setEditorLoading(
        false
      );

      setLoadedEditorKey(
        ""
      );

      return;
    }


    let active =
      true;


    const currentEditorKey =
      `${characterKey}:${sectionKey}`;


    async function loadAboutSection() {
      setEditorLoading(
        true
      );

      setLoadedEditorKey(
        ""
      );

      setErrorMessage(
        ""
      );

      setStatusMessage(
        ""
      );


      const {
        data,
        error,
      } = await supabase
        .from(
          "character_about_sections"
        )
        .select(
          "content"
        )
        .eq(
          "character_key",
          characterKey
        )
        .eq(
          "section_key",
          sectionKey
        )
        .maybeSingle();


      if (!active) {
        return;
      }


      if (error) {
        console.error(
          "Učitavanje O meni teksta:",
          error
        );


        setContent(
          ""
        );


        setErrorMessage(
          "Серверска верзија текста није могла да се учита. Ако постоји локални нацрт, биће враћен."
        );


        /*
         * I u slučaju server greške
         * dozvoljavamo recovery sistemu
         * da vrati lokalni draft.
         */

        setLoadedEditorKey(
          currentEditorKey
        );

        setEditorLoading(
          false
        );

        return;
      }


      setContent(
        data?.content ||
        ""
      );


      setLoadedEditorKey(
        currentEditorKey
      );


      setEditorLoading(
        false
      );
    }


    loadAboutSection();


    return () => {
      active =
        false;
    };
  }, [
    characterKey,
    sectionKey,
    isValidCharacter,
    isAboutSection,
  ]);


  if (
    !isValidCharacter
  ) {
    return (
      <Navigate
        to="/admin/likovi"
        replace
      />
    );
  }


  if (!section) {
    return (
      <Navigate
        to={
          `/admin/likovi/${characterKey}`
        }
        replace
      />
    );
  }


  const backTo =
    isAboutSection
      ? `/admin/likovi/${characterKey}/o-meni`
      : `/admin/likovi/${characterKey}`;


  /*
   * ==========================================
   * RUČNO ČUVANJE U SUPABASE
   *
   * Local autosave ne menja javni tekst.
   * Tek klik na SAČUVAJ menja server.
   * ==========================================
   */

  async function handleSave(
    event
  ) {
    event.preventDefault();


    if (
      !isAboutSection ||
      saving
    ) {
      return;
    }


    setSaving(
      true
    );

    setStatusMessage(
      ""
    );

    setErrorMessage(
      ""
    );


    const {
      error,
    } = await supabase
      .from(
        "character_about_sections"
      )
      .upsert(
        {
          character_key:
            characterKey,

          section_key:
            sectionKey,

          title:
            section.title,

          content,

          sort_order:
            section.sortOrder,

          updated_at:
            new Date()
              .toISOString(),
        },
        {
          onConflict:
            "character_key,section_key",
        }
      );


    if (error) {
      console.error(
        "Čuvanje O meni teksta:",
        error
      );


      setErrorMessage(
        "Текст није сачуван у бази. Локални нацрт је остао безбедан."
      );


      setSaving(
        false
      );

      return;
    }


    await markCommitted(
      {
        content,
      },
      {
        message:
          "Текст је сачуван у бази.",
      }
    );


    setStatusMessage(
      "Текст је успешно сачуван."
    );


    setSaving(
      false
    );
  }


  return (
    <section className="admin-character-section">
      <Link
        to={
          backTo
        }
        className="admin-characters__back"
      >
        ← Назад
      </Link>


      <div className="admin-page-heading">
        <p className="eyebrow">
          {characterName}
        </p>

        <h1>
          {section.title}
        </h1>

        <p>
          {
            section.description ||
            "Уреди текст ове целине."
          }
        </p>
      </div>


      {isAboutSection ? (
        <div className="admin-section-placeholder">
          <span>
            О МЕНИ
          </span>

          <h2>
            {section.title}
          </h2>


          {editorLoading ? (
            <p>
              Учитавање текста...
            </p>
          ) : (
            <form
              onSubmit={
                handleSave
              }
            >
              {recovered ? (
                <p className="success-message">
                  Враћен је локално
                  сачуван нацрт
                  {recoveredAt
                    ? ` од ${new Date(
                        recoveredAt
                      ).toLocaleTimeString(
                        "sr-RS",
                        {
                          hour:
                            "2-digit",

                          minute:
                            "2-digit",
                        }
                      )}.`
                    : "."}
                </p>
              ) : null}


              <textarea
                value={
                  content
                }
                onChange={
                  (
                    event
                  ) => {
                    setContent(
                      event
                        .target
                        .value
                    );

                    setStatusMessage(
                      ""
                    );
                  }
                }
                rows="18"
                placeholder="Напиши текст..."
              />


              {errorMessage && (
                <p className="error-message">
                  {errorMessage}
                </p>
              )}


              {statusMessage && (
                <p className="success-message">
                  {statusMessage}
                </p>
              )}


              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "ЧУВАЊЕ..."
                    : "САЧУВАЈ"}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="admin-section-placeholder">
          <span>
            КАБИНЕТ
          </span>

          <h2>
            {section.title}
          </h2>

          <p>
            Структура и навигација су
            спремне. Овај део ћемо
            повезати касније.
          </p>
        </div>
      )}
    </section>
  );
}


export default AdminCharacterSection;