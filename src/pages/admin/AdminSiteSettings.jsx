import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabaseClient";

import {
  deleteBlogImage,
  uploadBlogImage,
} from "../../lib/blogImages";

import useAdminDraft
  from "../../admin-safety/useAdminDraft";

import useAdminDraftFile
  from "../../admin-safety/useAdminDraftFile";


const initialSettings = {
  entry_image_url: "",
  entry_image_path: "",

  character_one_name:
    "ЧОВЕК 1",

  character_one_image_url:
    "",

  character_one_image_path:
    "",

  character_two_name:
    "ЧОВЕК 2",

  character_two_image_url:
    "",

  character_two_image_path:
    "",

  writing_image_url: "",
  writing_image_path: "",

  about_image_url: "",
  about_image_path: "",

  writing_label:
    "Писање",

  about_label:
    "О мени",

  about_heading:
    "О мени",

  about_text: "",
};


const SETTINGS_DRAFT_KEY =
  "site-settings:main";


function ImageField({
  title,
  imageUrl,
  file,
  onFileChange,
}) {
  return (
    <div className="admin-image-field">
      <div>
        <strong>
          {title}
        </strong>

        <p>
          Изабери нову фотографију
          само ако желиш да промениш
          постојећу.
        </p>
      </div>


      {imageUrl &&
      !file ? (
        <img
          className="admin-image-preview"
          src={
            imageUrl
          }
          alt=""
        />
      ) : null}


      {file ? (
        <div>
          <p>
            Локално изабран фајл:
          </p>

          <strong>
            {file.name}
          </strong>
        </div>
      ) : null}


      <input
        type="file"
        accept="image/*"
        onChange={
          (
            event
          ) =>
            onFileChange(
              event
                .target
                .files?.[0] ??
              null
            )
        }
      />
    </div>
  );
}


function AdminSiteSettings() {
  const [
    settings,
    setSettings,
  ] = useState(
    initialSettings
  );


  const [
    characterOneFile,
    setCharacterOneFile,
  ] = useState(null);


  const [
    characterTwoFile,
    setCharacterTwoFile,
  ] = useState(null);


  const [
    writingFile,
    setWritingFile,
  ] = useState(null);


  const [
    aboutFile,
    setAboutFile,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  /*
   * ==========================================
   * SERVER SETTINGS
   * ==========================================
   */

  useEffect(() => {
    let active =
      true;


    async function loadSettings() {
      const {
        data,
        error,
      } = await supabase
        .from(
          "site_settings"
        )
        .select("*")
        .eq(
          "id",
          1
        )
        .single();


      if (!active) {
        return;
      }


      if (error) {
        setErrorMessage(
          error.message
        );

      } else if (data) {
        setSettings({
          ...initialSettings,
          ...data,
        });
      }


      setLoading(
        false
      );
    }


    loadSettings();


    return () => {
      active =
        false;
    };
  }, []);


  /*
   * ==========================================
   * RECOVERY TEKSTA / INPUTA
   * ==========================================
   */

  const {
    recovered,
    recoveredAt,
    markCommitted,
  } = useAdminDraft({
    draftKey:
      SETTINGS_DRAFT_KEY,

    data:
      settings,

    onRestore:
      (
        savedSettings
      ) => {
        if (
          savedSettings &&
          typeof savedSettings ===
            "object"
        ) {
          setSettings({
            ...initialSettings,
            ...savedSettings,
          });
        }
      },

    ready:
      !loading,

    scope:
      "Изглед сајта",
  });


  /*
   * ==========================================
   * RECOVERY FAJLOVA
   * ==========================================
   */

  useAdminDraftFile({
    draftKey:
      SETTINGS_DRAFT_KEY,

    fieldKey:
      "character-one-image",

    file:
      characterOneFile,

    setFile:
      setCharacterOneFile,

    ready:
      !loading,

    scope:
      "Изглед сајта",
  });


  useAdminDraftFile({
    draftKey:
      SETTINGS_DRAFT_KEY,

    fieldKey:
      "character-two-image",

    file:
      characterTwoFile,

    setFile:
      setCharacterTwoFile,

    ready:
      !loading,

    scope:
      "Изглед сајта",
  });


  useAdminDraftFile({
    draftKey:
      SETTINGS_DRAFT_KEY,

    fieldKey:
      "writing-image",

    file:
      writingFile,

    setFile:
      setWritingFile,

    ready:
      !loading,

    scope:
      "Изглед сајта",
  });


  useAdminDraftFile({
    draftKey:
      SETTINGS_DRAFT_KEY,

    fieldKey:
      "about-image",

    file:
      aboutFile,

    setFile:
      setAboutFile,

    ready:
      !loading,

    scope:
      "Изглед сајта",
  });


  function changeField(
    field,
    value
  ) {
    setSettings(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );


    setSuccessMessage(
      ""
    );
  }


  /*
   * ==========================================
   * UPLOAD
   *
   * Više ne brišemo staru fotografiju
   * PRE uspešnog DB update-a.
   * ==========================================
   */

  async function uploadReplacement({
    file,
    folder,
  }) {
    if (!file) {
      return null;
    }


    return uploadBlogImage(
      file,
      folder
    );
  }


  async function safeDeleteImage(
    path
  ) {
    if (!path) {
      return;
    }


    try {
      await deleteBlogImage(
        path
      );

    } catch (
      error
    ) {
      console.error(
        "Brisanje stare slike:",
        error
      );
    }
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    if (saving) {
      return;
    }


    setSaving(
      true
    );

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );


    const uploadedImages =
      [];


    try {
      const oldPaths = {
        characterOne:
          settings
            .character_one_image_path,

        characterTwo:
          settings
            .character_two_image_path,

        writing:
          settings
            .writing_image_path,

        about:
          settings
            .about_image_path,
      };


      const nextSettings = {
        ...settings,
      };


      /*
       * PRVA LIČNOST
       */

      const characterOneImage =
        await uploadReplacement({
          file:
            characterOneFile,

          folder:
            "site/characters/one",
        });


      if (
        characterOneImage
      ) {
        uploadedImages.push(
          characterOneImage
        );


        nextSettings
          .character_one_image_url =
            characterOneImage.url;


        nextSettings
          .character_one_image_path =
            characterOneImage.path;
      }


      /*
       * DRUGA LIČNOST
       */

      const characterTwoImage =
        await uploadReplacement({
          file:
            characterTwoFile,

          folder:
            "site/characters/two",
        });


      if (
        characterTwoImage
      ) {
        uploadedImages.push(
          characterTwoImage
        );


        nextSettings
          .character_two_image_url =
            characterTwoImage.url;


        nextSettings
          .character_two_image_path =
            characterTwoImage.path;
      }


      /*
       * PISANJE
       */

      const writingImage =
        await uploadReplacement({
          file:
            writingFile,

          folder:
            "site/writing",
        });


      if (
        writingImage
      ) {
        uploadedImages.push(
          writingImage
        );


        nextSettings
          .writing_image_url =
            writingImage.url;


        nextSettings
          .writing_image_path =
            writingImage.path;
      }


      /*
       * O MENI
       */

      const aboutImage =
        await uploadReplacement({
          file:
            aboutFile,

          folder:
            "site/about",
        });


      if (
        aboutImage
      ) {
        uploadedImages.push(
          aboutImage
        );


        nextSettings
          .about_image_url =
            aboutImage.url;


        nextSettings
          .about_image_path =
            aboutImage.path;
      }


      /*
       * SUPABASE
       */

      const {
        error,
      } = await supabase
        .from(
          "site_settings"
        )
        .update({
          character_one_name:
            nextSettings
              .character_one_name,

          character_one_image_url:
            nextSettings
              .character_one_image_url,

          character_one_image_path:
            nextSettings
              .character_one_image_path,

          character_two_name:
            nextSettings
              .character_two_name,

          character_two_image_url:
            nextSettings
              .character_two_image_url,

          character_two_image_path:
            nextSettings
              .character_two_image_path,

          writing_image_url:
            nextSettings
              .writing_image_url,

          writing_image_path:
            nextSettings
              .writing_image_path,

          about_image_url:
            nextSettings
              .about_image_url,

          about_image_path:
            nextSettings
              .about_image_path,

          writing_label:
            nextSettings
              .writing_label,

          about_label:
            nextSettings
              .about_label,

          about_heading:
            nextSettings
              .about_heading,

          about_text:
            nextSettings
              .about_text,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          1
        );


      if (error) {
        throw error;
      }


      /*
       * Tek sada, nakon uspešnog DB update-a,
       * brišemo stare slike.
       */

      if (
        characterOneImage &&
        oldPaths.characterOne &&
        oldPaths.characterOne !==
          characterOneImage.path
      ) {
        await safeDeleteImage(
          oldPaths.characterOne
        );
      }


      if (
        characterTwoImage &&
        oldPaths.characterTwo &&
        oldPaths.characterTwo !==
          characterTwoImage.path
      ) {
        await safeDeleteImage(
          oldPaths.characterTwo
        );
      }


      if (
        writingImage &&
        oldPaths.writing &&
        oldPaths.writing !==
          writingImage.path
      ) {
        await safeDeleteImage(
          oldPaths.writing
        );
      }


      if (
        aboutImage &&
        oldPaths.about &&
        oldPaths.about !==
          aboutImage.path
      ) {
        await safeDeleteImage(
          oldPaths.about
        );
      }


      setSettings(
        nextSettings
      );


      await markCommitted(
        nextSettings,
        {
          clearFiles:
            true,

          message:
            "Изглед сајта је сачуван.",
        }
      );


      setCharacterOneFile(
        null
      );

      setCharacterTwoFile(
        null
      );

      setWritingFile(
        null
      );

      setAboutFile(
        null
      );


      setSuccessMessage(
        "Изглед сајта је сачуван."
      );

    } catch (
      error
    ) {
      /*
       * Ako DB nije prihvatio izmene,
       * uklanjamo samo NOVO uploadovane
       * fajlove. Stari ostaju netaknuti.
       */

      for (
        const uploaded
        of uploadedImages
      ) {
        await safeDeleteImage(
          uploaded?.path
        );
      }


      setErrorMessage(
        error?.message ||
        "Чување није успело. Локални нацрт је остао сачуван."
      );

    } finally {
      setSaving(
        false
      );
    }
  }


  if (loading) {
    return (
      <p>
        Учитавање...
      </p>
    );
  }


  return (
    <section>
      <div className="admin-page-heading">
        <p className="eyebrow">
          ЈАВНИ ДЕО
        </p>

        <h1>
          Изглед сајта
        </h1>

        <p>
          Главне фотографије,
          имена и текстове мењаш
          одавде, без VS Code-а.
        </p>
      </div>


      <form
        className="admin-form"
        onSubmit={
          handleSubmit
        }
      >
        {recovered ? (
          <p className="success-message">
            Враћене су локално
            сачуване измене
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


        <h2>
          Изабери противника
        </h2>

        <p>
          Овде подешаваш две
          равноправне личности
          које се приказују на
          улазном екрану.
        </p>


        <h3>
          Прва личност
        </h3>


        <label>
          Име прве личности

          <input
            value={
              settings
                .character_one_name
            }
            onChange={
              (
                event
              ) =>
                changeField(
                  "character_one_name",
                  event
                    .target
                    .value
                )
            }
          />
        </label>


        <ImageField
          title="Фотографија прве личности"
          imageUrl={
            settings
              .character_one_image_url
          }
          file={
            characterOneFile
          }
          onFileChange={
            setCharacterOneFile
          }
        />


        <hr />


        <h3>
          Друга личност
        </h3>


        <label>
          Име друге личности

          <input
            value={
              settings
                .character_two_name
            }
            onChange={
              (
                event
              ) =>
                changeField(
                  "character_two_name",
                  event
                    .target
                    .value
                )
            }
          />
        </label>


        <ImageField
          title="Фотографија друге личности"
          imageUrl={
            settings
              .character_two_image_url
          }
          file={
            characterTwoFile
          }
          onFileChange={
            setCharacterTwoFile
          }
        />


        <hr />


        <h2>
          Главни избор
        </h2>


        <label>
          Натпис за Писање

          <input
            value={
              settings
                .writing_label
            }
            onChange={
              (
                event
              ) =>
                changeField(
                  "writing_label",
                  event
                    .target
                    .value
                )
            }
          />
        </label>


        <ImageField
          title="Фотографија за Писање"
          imageUrl={
            settings
              .writing_image_url
          }
          file={
            writingFile
          }
          onFileChange={
            setWritingFile
          }
        />


        <label>
          Натпис за О мени

          <input
            value={
              settings
                .about_label
            }
            onChange={
              (
                event
              ) =>
                changeField(
                  "about_label",
                  event
                    .target
                    .value
                )
            }
          />
        </label>


        <ImageField
          title="Фотографија за О мени"
          imageUrl={
            settings
              .about_image_url
          }
          file={
            aboutFile
          }
          onFileChange={
            setAboutFile
          }
        />


        <hr />


        <h2>
          О мени
        </h2>


        <label>
          Наслов

          <input
            value={
              settings
                .about_heading
            }
            onChange={
              (
                event
              ) =>
                changeField(
                  "about_heading",
                  event
                    .target
                    .value
                )
            }
          />
        </label>


        <label>
          Текст

          <textarea
            rows="14"
            value={
              settings
                .about_text
            }
            onChange={
              (
                event
              ) =>
                changeField(
                  "about_text",
                  event
                    .target
                    .value
                )
            }
          />
        </label>


        {errorMessage ? (
          <p className="error-message">
            {errorMessage}
          </p>
        ) : null}


        {successMessage ? (
          <p className="success-message">
            {successMessage}
          </p>
        ) : null}


        <button
          className="primary-button"
          type="submit"
          disabled={
            saving
          }
        >
          {saving
            ? "Чување..."
            : "Сачувај изглед"}
        </button>
      </form>
    </section>
  );
}


export default AdminSiteSettings;