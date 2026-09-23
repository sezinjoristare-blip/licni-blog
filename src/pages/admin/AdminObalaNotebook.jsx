import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../../lib/supabaseClient";

import {
  deleteObalaMedia,
  uploadObalaMedia,
} from "../../lib/obalaMedia";

import useAdminDraft
  from "../../admin-safety/useAdminDraft";

import useAdminDraftFile
  from "../../admin-safety/useAdminDraftFile";

import {
  clearAdminDraft,
} from "../../admin-safety/adminDraftStorage";

import "../../styles/admin/AdminObalaNotebook.css";


function createEmptyForm() {
  return {
    title:
      "",

    body:
      "",

    status:
      "draft",

    sort_order:
      "0",

    media_type:
      "none",

    media_label:
      "",

    media_url:
      "",

    media_storage_path:
      "",

    inspiration_title:
      "Шта ме је инспирисало?",

    inspiration_body:
      "",
  };
}


function formFromEntry(
  entry
) {
  return {
    title:
      entry?.title ||
      "",

    body:
      entry?.body ||
      "",

    status:
      entry?.status ||
      "draft",

    sort_order:
      String(
        entry?.sort_order ??
        0
      ),

    media_type:
      entry?.media_type ||
      "none",

    media_label:
      entry?.media_label ||
      "",

    media_url:
      entry?.media_url ||
      "",

    media_storage_path:
      entry?.media_storage_path ||
      "",

    inspiration_title:
      entry?.inspiration_title ||
      "Шта ме је инспирисало?",

    inspiration_body:
      entry?.inspiration_body ||
      "",
  };
}


function normalizeUrl(
  rawValue,
  message =
    "Унеси исправан линк."
) {
  const trimmed =
    String(
      rawValue ||
      ""
    ).trim();


  if (!trimmed) {
    return "";
  }


  const candidate =
    /^https?:\/\//i.test(
      trimmed
    )
      ? trimmed
      : `https://${trimmed}`;


  let url;


  try {
    url =
      new URL(
        candidate
      );

  } catch {
    throw new Error(
      message
    );
  }


  if (
    url.protocol !==
      "https:" &&
    url.protocol !==
      "http:"
  ) {
    throw new Error(
      message
    );
  }


  return url.toString();
}


function normalizeYouTubeUrl(
  rawValue
) {
  const normalized =
    normalizeUrl(
      rawValue,
      "Унеси исправан YouTube линк."
    );


  const url =
    new URL(
      normalized
    );


  const host =
    url.hostname
      .toLowerCase()
      .replace(
        /^www\./,
        ""
      );


  const valid =
    host ===
      "youtu.be" ||
    host ===
      "youtube.com" ||
    host.endsWith(
      ".youtube.com"
    );


  if (!valid) {
    throw new Error(
      "Линк мора да води на YouTube."
    );
  }


  url.protocol =
    "https:";


  return url.toString();
}


function AdminObalaNotebook() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    characterKey,

    entryId,
  } = useParams();


  const basePath =
    `/admin/likovi/${characterKey}/obala-sveska`;


  const isNewRoute =
    location.pathname ===
    `${basePath}/novi`;


  const isEditRoute =
    Boolean(
      entryId
    );


  const isEditorRoute =
    isNewRoute ||
    isEditRoute;


  const draftKey =
    isNewRoute
      ? `obala-notebook:${characterKey}:new`
      : isEditRoute
        ? `obala-notebook:${characterKey}:${entryId}`
        : "";


  const [
    entries,
    setEntries,
  ] = useState([]);


  const [
    form,
    setForm,
  ] = useState(
    createEmptyForm
  );


  const [
    editingEntry,
    setEditingEntry,
  ] = useState(null);


  const [
    mediaFile,
    setMediaFile,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    editorReadyKey,
    setEditorReadyKey,
  ] = useState("");


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


  const editorReady =
    isEditorRoute &&
    Boolean(
      draftKey
    ) &&
    editorReadyKey ===
      draftKey;


  const {
    recovered,
    recoveredAt,
    forceLocalSave,
    markCommitted,
    discardDraft,
  } = useAdminDraft({
    draftKey,

    data:
      form,

    onRestore:
      (
        savedForm
      ) => {
        if (
          savedForm &&
          typeof savedForm ===
            "object"
        ) {
          setForm({
            ...createEmptyForm(),
            ...savedForm,
          });
        }
      },

    ready:
      editorReady,

    enabled:
      isEditorRoute,

    scope:
      "Обала / свеска",
  });


  useAdminDraftFile({
    draftKey,

    fieldKey:
      "media-file",

    file:
      mediaFile,

    setFile:
      setMediaFile,

    ready:
      editorReady,

    enabled:
      isEditorRoute,

    scope:
      "Обала / свеска",
  });


  async function loadEntries() {
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
        "obala_notebook_entries"
      )
      .select("*")
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


    if (error) {
      setEntries(
        []
      );

      setErrorMessage(
        error.message
      );

      setLoading(
        false
      );

      return [];
    }


    const nextEntries =
      data ?? [];


    setEntries(
      nextEntries
    );

    setLoading(
      false
    );


    return nextEntries;
  }


  useEffect(() => {
    if (
      characterKey ===
      "covek-1"
    ) {
      loadEntries();
    }
  }, [
    characterKey,
  ]);


  useEffect(() => {
    if (
      loading ||
      !isEditorRoute ||
      !draftKey ||
      editorReadyKey ===
        draftKey
    ) {
      return;
    }


    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );

    setMediaFile(
      null
    );


    if (isNewRoute) {
      setEditingEntry(
        null
      );

      setForm(
        createEmptyForm()
      );

      setEditorReadyKey(
        draftKey
      );

      return;
    }


    const entry =
      entries.find(
        (
          item
        ) =>
          String(
            item.id
          ) ===
          String(
            entryId
          )
      );


    if (!entry) {
      setEditingEntry(
        null
      );

      setErrorMessage(
        "Тражени запис не постоји."
      );

      return;
    }


    setEditingEntry(
      entry
    );

    setForm(
      formFromEntry(
        entry
      )
    );

    setEditorReadyKey(
      draftKey
    );
  }, [
    loading,
    isEditorRoute,
    isNewRoute,
    entryId,
    entries,
    draftKey,
    editorReadyKey,
  ]);


  if (
    characterKey !==
    "covek-1"
  ) {
    return (
      <Navigate
        to={
          `/admin/likovi/${characterKey}`
        }
        replace
      />
    );
  }


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

    setSuccessMessage(
      ""
    );

    setErrorMessage(
      ""
    );
  }


  function handleMediaTypeChange(
    value
  ) {
    updateField(
      "media_type",
      value
    );


    setMediaFile(
      null
    );
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    if (saving) {
      return;
    }


    forceLocalSave();


    setSaving(
      true
    );

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );


    let uploadedMedia =
      null;

    let serverSaved =
      false;


    try {
      const title =
        form.title
          .trim();

      const body =
        form.body
          .trim();


      if (!title) {
        throw new Error(
          "Унеси наслов."
        );
      }


      if (!body) {
        throw new Error(
          "Унеси текст."
        );
      }


      const mediaType =
        form.media_type ===
        "none"
          ? null
          : form.media_type;


      let mediaUrl =
        null;

      let mediaStoragePath =
        null;


      if (
        mediaType ===
        "youtube"
      ) {
        mediaUrl =
          normalizeYouTubeUrl(
            form.media_url
          );

      } else if (
        mediaType ===
          "audio" ||
        mediaType ===
          "video"
      ) {
        if (mediaFile) {
          uploadedMedia =
            await uploadObalaMedia(
              mediaFile
            );


          if (
            uploadedMedia
              .mediaType !==
            mediaType
          ) {
            await deleteObalaMedia(
              uploadedMedia.path
            );


            uploadedMedia =
              null;


            throw new Error(
              mediaType ===
                "audio"
                ? "Изабран је видео, а у форми је означен аудио."
                : "Изабран је аудио, а у форми је означен видео."
            );
          }


          mediaUrl =
            uploadedMedia.url;

          mediaStoragePath =
            uploadedMedia.path;

        } else if (
          form.media_storage_path &&
          form.media_url
        ) {
          mediaUrl =
            form.media_url;

          mediaStoragePath =
            form.media_storage_path;

        } else {
          mediaUrl =
            normalizeUrl(
              form.media_url,
              "Изабери фајл или унеси директан линк."
            );
        }
      }


      const inspirationBody =
        form
          .inspiration_body
          .trim();


      const payload = {
        title,

        body,

        status:
          form.status ===
            "published"
            ? "published"
            : "draft",

        sort_order:
          Number(
            form.sort_order
          ) || 0,

        media_type:
          mediaType,

        media_label:
          mediaType
            ? (
                form
                  .media_label
                  .trim() ||
                null
              )
            : null,

        media_url:
          mediaType
            ? mediaUrl
            : null,

        media_storage_path:
          mediaType
            ? mediaStoragePath
            : null,

        inspiration_title:
          inspirationBody
            ? (
                form
                  .inspiration_title
                  .trim() ||
                "Шта ме је инспирисало?"
              )
            : null,

        inspiration_body:
          inspirationBody ||
          null,

        updated_at:
          new Date()
            .toISOString(),
      };


      const oldEntry =
        editingEntry;


      if (editingEntry) {
        const {
          error,
        } = await supabase
          .from(
            "obala_notebook_entries"
          )
          .update(
            payload
          )
          .eq(
            "id",
            editingEntry.id
          );


        if (error) {
          throw error;
        }

      } else {
        const {
          error,
        } = await supabase
          .from(
            "obala_notebook_entries"
          )
          .insert({
            ...payload,

            created_at:
              new Date()
                .toISOString(),
          });


        if (error) {
          throw error;
        }
      }


      serverSaved =
        true;


      if (
        oldEntry
          ?.media_storage_path &&
        oldEntry
          .media_storage_path !==
          mediaStoragePath
      ) {
        await deleteObalaMedia(
          oldEntry
            .media_storage_path
        ).catch(
          () => {}
        );
      }


      await markCommitted(
        createEmptyForm(),
        {
          clearFiles:
            true,

          message:
            editingEntry
              ? "Запис у Свесци је сачуван."
              : "Запис је додат у Свеску.",
        }
      ).catch(
        (
          error
        ) => {
          console.error(
            "Čišćenje recovery drafta Svеске:",
            error
          );
        }
      );


      setMediaFile(
        null
      );


      await loadEntries();


      navigate(
        basePath
      );

    } catch (
      error
    ) {
      if (
        !serverSaved &&
        uploadedMedia
          ?.path
      ) {
        await deleteObalaMedia(
          uploadedMedia.path
        ).catch(
          () => {}
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


  async function handleCancel() {
    const baseline =
      editingEntry
        ? formFromEntry(
            editingEntry
          )
        : createEmptyForm();


    await discardDraft(
      baseline,
      {
        clearFiles:
          true,
      }
    );


    setMediaFile(
      null
    );


    navigate(
      basePath
    );
  }


  async function handleDelete(
    entry
  ) {
    const confirmed =
      window.confirm(
        `Трајно обрисати „${entry.title}“?`
      );


    if (!confirmed) {
      return;
    }


    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );


    try {
      const {
        error,
      } = await supabase
        .from(
          "obala_notebook_entries"
        )
        .delete()
        .eq(
          "id",
          entry.id
        );


      if (error) {
        throw error;
      }


      if (
        entry
          .media_storage_path
      ) {
        await deleteObalaMedia(
          entry
            .media_storage_path
        ).catch(
          () => {}
        );
      }


      await clearAdminDraft(
        `obala-notebook:${characterKey}:${entry.id}`
      ).catch(
        () => {}
      );


      if (
        String(
          entryId
        ) ===
        String(
          entry.id
        )
      ) {
        navigate(
          basePath,
          {
            replace:
              true,
          }
        );
      }


      setSuccessMessage(
        "Запис је обрисан."
      );


      await loadEntries();

    } catch (
      error
    ) {
      setErrorMessage(
        error?.message ||
        "Брисање није успело."
      );
    }
  }


  const showMediaUrl =
    form.media_type ===
      "youtube" ||
    form.media_type ===
      "audio" ||
    form.media_type ===
      "video";


  const showUpload =
    form.media_type ===
      "audio" ||
    form.media_type ===
      "video";


  const recoveryTime =
    recoveredAt
      ? new Date(
          recoveredAt
        ).toLocaleTimeString(
          "sr-RS",
          {
            hour:
              "2-digit",

            minute:
              "2-digit",
          }
        )
      : "";


  function renderList() {
    return (
      <>
        <div className="admin-obala-notebook__form-actions">
          <button
            type="button"
            className="admin-obala-notebook__button admin-obala-notebook__button--primary"
            onClick={() =>
              navigate(
                `${basePath}/novi`
              )
            }
          >
            + НОВИ ЗАПИС
          </button>
        </div>


        <section className="admin-obala-notebook__list-section">
          <div className="admin-obala-notebook__list-heading">
            <div>
              <p className="eyebrow">
                СВЕСКА
              </p>

              <h2>
                Постојећи записи
              </h2>
            </div>

            <strong>
              {entries.length}
            </strong>
          </div>


          {loading ? (
            <p>
              Учитавање...
            </p>

          ) : entries.length ===
            0 ? (
            <p className="admin-obala-notebook__empty">
              Свеска је празна.
              Додај први текст.
            </p>

          ) : (
            <div className="admin-obala-notebook__cards">
              {entries.map(
                (
                  entry
                ) => (
                  <article
                    key={
                      entry.id
                    }
                    className="admin-obala-notebook__card"
                  >
                    <div className="admin-obala-notebook__card-copy">
                      <p className="admin-obala-notebook__status">
                        {entry.status ===
                        "published"
                          ? "ОБЈАВЉЕН"
                          : "НАЦРТ"}

                        {" · РЕДОСЛЕД "}

                        {entry.sort_order}

                        {entry.media_type ? (
                          <>
                            {" · "}

                            {entry
                              .media_type
                              .toUpperCase()}
                          </>
                        ) : null}
                      </p>


                      <h3>
                        {entry.title}
                      </h3>


                      <p>
                        {String(
                          entry.body ||
                          ""
                        )
                          .replace(
                            /\s+/g,
                            " "
                          )
                          .slice(
                            0,
                            180
                          )}

                        {String(
                          entry.body ||
                          ""
                        ).length >
                        180
                          ? "…"
                          : ""}
                      </p>
                    </div>


                    <div className="admin-obala-notebook__card-actions">
                      <button
                        type="button"
                        className="admin-obala-notebook__button admin-obala-notebook__button--secondary"
                        onClick={() =>
                          navigate(
                            `${basePath}/${entry.id}`
                          )
                        }
                      >
                        Измени
                      </button>


                      <button
                        type="button"
                        className="admin-obala-notebook__button admin-obala-notebook__button--danger"
                        onClick={() =>
                          handleDelete(
                            entry
                          )
                        }
                      >
                        Обриши
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </>
    );
  }


  function renderEditor() {
    if (
      loading
    ) {
      return (
        <p>
          Учитавање едитора...
        </p>
      );
    }


    if (
      isEditRoute &&
      !editingEntry &&
      editorReadyKey !==
        draftKey
    ) {
      return (
        <div>
          <p className="error-message">
            {errorMessage ||
              "Тражени запис не постоји."}
          </p>

          <button
            type="button"
            className="admin-obala-notebook__button admin-obala-notebook__button--secondary"
            onClick={() =>
              navigate(
                basePath
              )
            }
          >
            ← Назад
          </button>
        </div>
      );
    }


    if (
      !editorReady
    ) {
      return (
        <p>
          Учитавање едитора...
        </p>
      );
    }


    return (
      <form
        className="admin-obala-notebook__form"
        onSubmit={
          handleSubmit
        }
      >
        <div className="admin-obala-notebook__form-heading">
          <div>
            <p className="eyebrow">
              {editingEntry
                ? "ИЗМЕНА"
                : "НОВИ ЗАПИС"}
            </p>

            <h2>
              {editingEntry
                ? "Измени запис"
                : "Додај текст у свеску"}
            </h2>
          </div>


          <button
            type="button"
            className="admin-obala-notebook__button admin-obala-notebook__button--secondary"
            onClick={
              handleCancel
            }
          >
            Назад / одбаци измене
          </button>
        </div>


        {recovered ? (
          <p className="admin-obala-notebook__message admin-obala-notebook__message--success">
            Враћен је локално
            сачуван нацрт
            {recoveryTime
              ? ` од ${recoveryTime}.`
              : "."}
          </p>
        ) : null}


        <div className="admin-obala-notebook__grid">
          <label>
            Наслов

            <input
              type="text"
              value={
                form.title
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "title",
                    event
                      .target
                      .value
                  )
              }
              required
            />
          </label>


          <label>
            Редослед

            <input
              type="number"
              value={
                form.sort_order
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "sort_order",
                    event
                      .target
                      .value
                  )
              }
            />
          </label>


          <label>
            Статус

            <select
              value={
                form.status
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "status",
                    event
                      .target
                      .value
                  )
              }
            >
              <option value="draft">
                Нацрт
              </option>

              <option value="published">
                Објављен
              </option>
            </select>
          </label>


          <label>
            Медиј

            <select
              value={
                form.media_type
              }
              onChange={
                (
                  event
                ) =>
                  handleMediaTypeChange(
                    event
                      .target
                      .value
                  )
              }
            >
              <option value="none">
                Без медија
              </option>

              <option value="youtube">
                YouTube
              </option>

              <option value="audio">
                Аудио
              </option>

              <option value="video">
                Видео
              </option>
            </select>
          </label>
        </div>


        <label className="admin-obala-notebook__wide">
          Текст

          <textarea
            rows="15"
            value={
              form.body
            }
            onChange={
              (
                event
              ) =>
                updateField(
                  "body",
                  event
                    .target
                    .value
                )
            }
            placeholder="Празан ред раздваја пасусе."
            required
          />
        </label>


        <fieldset className="admin-obala-notebook__fieldset">
          <legend>
            Песма / аудио / видео
          </legend>


          {form.media_type ===
            "none" ? (
            <p className="admin-obala-notebook__muted">
              Овај текст нема медиј.
            </p>

          ) : (
            <>
              <label>
                Натпис

                <input
                  type="text"
                  value={
                    form.media_label
                  }
                  onChange={
                    (
                      event
                    ) =>
                      updateField(
                        "media_label",
                        event
                          .target
                          .value
                      )
                  }
                  placeholder={
                    form.media_type ===
                      "youtube"
                      ? "Послушај песму"
                      : form.media_type ===
                        "audio"
                        ? "Аудио снимак"
                        : "Видео снимак"
                  }
                />
              </label>


              {showMediaUrl ? (
                <label>
                  {form.media_type ===
                    "youtube"
                    ? "YouTube линк"
                    : "Директан линк — опционо ако отпремаш фајл"}

                  <input
                    type="url"
                    value={
                      form.media_url
                    }
                    onChange={
                      (
                        event
                      ) =>
                        updateField(
                          "media_url",
                          event
                            .target
                            .value
                        )
                    }
                    placeholder="https://..."
                  />
                </label>
              ) : null}


              {showUpload ? (
                <label>
                  Или отпреми
                  {" "}
                  {form.media_type ===
                    "audio"
                    ? "аудио"
                    : "видео"}
                  {" "}
                  фајл

                  <input
                    type="file"
                    accept={
                      form.media_type ===
                        "audio"
                        ? "audio/*"
                        : "video/*"
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setMediaFile(
                          event
                            .target
                            .files?.[0] ||
                          null
                        )
                    }
                  />


                  {mediaFile ? (
                    <small>
                      Локално обезбеђен
                      фајл:{" "}

                      <strong>
                        {mediaFile.name}
                      </strong>
                    </small>

                  ) : form
                      .media_storage_path ? (
                    <small>
                      Постојећи
                      отпремљени фајл
                      остаје ако не
                      изабереш нови.
                    </small>

                  ) : null}
                </label>
              ) : null}
            </>
          )}
        </fieldset>


        <fieldset className="admin-obala-notebook__fieldset">
          <legend>
            Шта ме је инспирисало?
          </legend>


          <label>
            Наслов

            <input
              type="text"
              value={
                form.inspiration_title
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "inspiration_title",
                    event
                      .target
                      .value
                  )
              }
            />
          </label>


          <label>
            Текст инспирације

            <textarea
              rows="8"
              value={
                form.inspiration_body
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "inspiration_body",
                    event
                      .target
                      .value
                  )
              }
              placeholder="Остави празно ако овај запис нема део о инспирацији."
            />
          </label>
        </fieldset>


        {errorMessage ? (
          <p className="admin-obala-notebook__message admin-obala-notebook__message--error">
            {errorMessage}
          </p>
        ) : null}


        <div className="admin-obala-notebook__form-actions">
          <button
            type="submit"
            className="admin-obala-notebook__button admin-obala-notebook__button--primary"
            disabled={
              saving
            }
          >
            {saving
              ? "ЧУВАМ..."
              : editingEntry
                ? "САЧУВАЈ ИЗМЕНЕ"
                : "ДОДАЈ У СВЕСКУ"}
          </button>
        </div>
      </form>
    );
  }


  return (
    <section className="admin-obala-notebook">
      <Link
        to="/admin/likovi/covek-1"
        className="admin-obala-notebook__back"
      >
        ← ЧОВЕК 1
      </Link>


      <header className="admin-obala-notebook__heading">
        <div>
          <p className="eyebrow">
            ЧОВЕК 1 / АКЦ ОБАЛА
          </p>

          <h1>
            Свеска
          </h1>

          <p>
            Додавање, измена и
            објављивање текстова
            који се појављују у
            физичкој свесци.
          </p>
        </div>


        <Link
          to="/autor/covek/obala/sveska"
          className="admin-obala-notebook__preview-link"
        >
          Отвори јавну свеску ↗
        </Link>
      </header>


      {!isEditorRoute &&
      errorMessage ? (
        <p className="admin-obala-notebook__message admin-obala-notebook__message--error">
          {errorMessage}
        </p>
      ) : null}


      {!isEditorRoute &&
      successMessage ? (
        <p className="admin-obala-notebook__message admin-obala-notebook__message--success">
          {successMessage}
        </p>
      ) : null}


      {isEditorRoute
        ? renderEditor()
        : renderList()}
    </section>
  );
}


export default AdminObalaNotebook;