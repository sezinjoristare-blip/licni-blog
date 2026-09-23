import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  supabase,
} from "../../../lib/supabaseClient";

import {
  slugify,
} from "../../../utils/slugify";

import useAdminDraft
  from "../../../admin-safety/useAdminDraft";

import {
  clearAdminDraft,
} from "../../../admin-safety/adminDraftStorage";


function createEmptyForm() {
  return {
    title:
      "",

    author:
      "",

    release_year:
      "",

    description:
      "",

    youtube_url:
      "",

    sort_order:
      "0",

    status:
      "draft",
  };
}


function formFromDrama(
  drama
) {
  return {
    title:
      drama?.title ??
      "",

    author:
      drama?.author ??
      "",

    release_year:
      drama?.release_year
        ? String(
            drama.release_year
          )
        : "",

    description:
      drama?.description ??
      "",

    youtube_url:
      drama?.youtube_url ??
      "",

    sort_order:
      String(
        drama
          ?.sort_order ??
        0
      ),

    status:
      drama
        ?.status ??
      "draft",
  };
}


function normalizeYouTubeUrl(
  rawValue
) {
  const trimmedValue =
    rawValue.trim();


  if (!trimmedValue) {
    return null;
  }


  let value =
    trimmedValue;


  if (
    !/^https?:\/\//i.test(
      value
    )
  ) {
    value =
      `https://${value}`;
  }


  let url;


  try {
    url =
      new URL(
        value
      );
  } catch {
    throw new Error(
      "Унеси исправан YouTube линк."
    );
  }


  const hostname =
    url.hostname
      .toLowerCase()
      .replace(
        /^www\./,
        ""
      );


  const isYouTube =
    hostname ===
      "youtu.be" ||
    hostname ===
      "youtube.com" ||
    hostname.endsWith(
      ".youtube.com"
    );


  if (!isYouTube) {
    throw new Error(
      "Линк мора да води на YouTube."
    );
  }


  if (
    url.protocol !==
      "https:" &&
    url.protocol !==
      "http:"
  ) {
    throw new Error(
      "YouTube линк није исправан."
    );
  }


  url.protocol =
    "https:";


  return url.toString();
}


function AdminMusicRadioDramas() {
  const navigate =
    useNavigate();


  const {
    characterKey =
      "covek-1",
  } = useParams();


  const [
    searchParams,
  ] = useSearchParams();


  const dramaId =
    searchParams.get(
      "id"
    );


  const basePath =
    `/admin/likovi/${characterKey}/muzika/preporuke?tip=radio-drame`;


  const draftKey =
    dramaId
      ? `music-radio-dramas:${dramaId}`
      : "music-radio-dramas:new";


  const [
    dramas,
    setDramas,
  ] = useState([]);


  const [
    form,
    setForm,
  ] = useState(
    createEmptyForm
  );


  const [
    editingDrama,
    setEditingDrama,
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
    !loading &&
    editorReadyKey ===
      draftKey;


  const {
    recovered,
    recoveredAt,
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

    scope:
      "Музика / радио драме",
  });


  async function loadDramas() {
    setLoading(true);
    setErrorMessage("");


    const {
      data,
      error,
    } = await supabase
      .from(
        "music_radio_dramas"
      )
      .select(
        "*"
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
            false,
        }
      );


    if (error) {
      setErrorMessage(
        error.message
      );

      setLoading(false);
      return;
    }


    setDramas(
      data ??
      []
    );

    setLoading(false);
  }


  useEffect(() => {
    loadDramas();
  }, []);


  useEffect(() => {
    if (loading) {
      return;
    }


    setEditorReadyKey("");
    setSuccessMessage("");


    if (!dramaId) {
      setEditingDrama(null);
      setForm(
        createEmptyForm()
      );
      setEditorReadyKey(
        draftKey
      );
      return;
    }


    const drama =
      dramas.find(
        (
          item
        ) =>
          String(
            item.id
          ) ===
          String(
            dramaId
          )
      );


    if (!drama) {
      setEditingDrama(null);
      setErrorMessage(
        "Тражена радио драма не постоји."
      );
      return;
    }


    setEditingDrama(
      drama
    );

    setForm(
      formFromDrama(
        drama
      )
    );

    setEditorReadyKey(
      draftKey
    );
  }, [
    dramaId,
    dramas,
    loading,
    draftKey,
  ]);


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

    setErrorMessage("");
    setSuccessMessage("");
  }


  function handleEdit(
    drama
  ) {
    navigate(
      `${basePath}&id=${encodeURIComponent(
        drama.id
      )}`
    );

    window.scrollTo({
      top:
        0,
      behavior:
        "smooth",
    });
  }


  async function handleCancel() {
    const baseline =
      editingDrama
        ? formFromDrama(
            editingDrama
          )
        : createEmptyForm();


    await discardDraft(
      baseline
    );


    if (dramaId) {
      navigate(
        basePath
      );
    } else {
      setForm(
        baseline
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


    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");


    try {
      const cleanTitle =
        form.title.trim();

      const cleanAuthor =
        form.author.trim();

      const cleanDescription =
        form.description.trim();

      const cleanReleaseYear =
        form.release_year.trim();

      const releaseYear =
        cleanReleaseYear
          ? Number(
              cleanReleaseYear
            )
          : null;

      const cleanYouTubeUrl =
        normalizeYouTubeUrl(
          form.youtube_url
        );


      if (!cleanTitle) {
        throw new Error(
          "Упиши наслов радио драме."
        );
      }


      if (
        releaseYear !== null &&
        (
          !Number.isInteger(
            releaseYear
          ) ||
          releaseYear < 1900 ||
          releaseYear > 2100
        )
      ) {
        throw new Error(
          "Година мора бити цео број између 1900. и 2100."
        );
      }


      if (
        form.status ===
          "published" &&
        !cleanYouTubeUrl
      ) {
        throw new Error(
          "Објављена радио драма мора имати YouTube линк."
        );
      }


      const slugSource =
        cleanAuthor
          ? `${cleanAuthor}-${cleanTitle}`
          : cleanTitle;


      const payload = {
        title:
          cleanTitle,

        author:
          cleanAuthor ||
          null,

        slug:
          slugify(
            slugSource
          ),

        release_year:
          releaseYear,

        description:
          cleanDescription ||
          null,

        youtube_url:
          cleanYouTubeUrl,

        sort_order:
          Number(
            form.sort_order
          ) || 0,

        status:
          form.status,

        updated_at:
          new Date()
            .toISOString(),
      };


      const result =
        editingDrama
          ? await supabase
              .from(
                "music_radio_dramas"
              )
              .update(
                payload
              )
              .eq(
                "id",
                editingDrama.id
              )
          : await supabase
              .from(
                "music_radio_dramas"
              )
              .insert(
                payload
              );


      if (result.error) {
        throw result.error;
      }


      const committedForm = {
        title:
          cleanTitle,

        author:
          cleanAuthor,

        release_year:
          releaseYear ===
            null
            ? ""
            : String(
                releaseYear
              ),

        description:
          cleanDescription,

        youtube_url:
          cleanYouTubeUrl ||
          "",

        sort_order:
          String(
            Number(
              form.sort_order
            ) || 0
          ),

        status:
          form.status,
      };


      const nextEmptyForm =
        createEmptyForm();


      await markCommitted(
        editingDrama
          ? committedForm
          : nextEmptyForm,
        {
          message:
            editingDrama
              ? "Радио драма је сачувана."
              : "Радио драма је додата.",
        }
      );


      await loadDramas();


      if (editingDrama) {
        navigate(
          basePath
        );
      } else {
        setForm(
          nextEmptyForm
        );
      }


      setSuccessMessage(
        editingDrama
          ? "Радио драма је успешно измењена."
          : "Радио драма је успешно додата."
      );

    } catch (
      error
    ) {
      setErrorMessage(
        error?.message ||
        "Чување није успело. Локални нацрт је остао сачуван."
      );

    } finally {
      setSaving(false);
    }
  }


  async function handleDelete(
    drama
  ) {
    const confirmed =
      window.confirm(
        `Трајно обрисати радио драму „${drama.title}“?`
      );


    if (!confirmed) {
      return;
    }


    setErrorMessage("");
    setSuccessMessage("");


    const {
      error,
    } = await supabase
      .from(
        "music_radio_dramas"
      )
      .delete()
      .eq(
        "id",
        drama.id
      );


    if (error) {
      setErrorMessage(
        error.message
      );
      return;
    }


    await clearAdminDraft(
      `music-radio-dramas:${drama.id}`
    ).catch(
      () => {}
    );


    if (
      String(
        dramaId
      ) ===
      String(
        drama.id
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
      "Радио драма је обрисана."
    );

    await loadDramas();
  }


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


  return (
    <section className="admin-music-section">
      <div className="admin-music-section__heading">
        <div>
          <p className="eyebrow">
            ПРЕПОРУКЕ
          </p>

          <h2>
            Радио драме
          </h2>
        </div>

        <p>
          Радио драма користи YouTube
          као технички извор, али се
          на јавном сајту пушта преко
          нашег физичког звучника.
        </p>
      </div>


      {loading ||
      !editorReady ? (
        <p>
          Учитавање...
        </p>

      ) : (
        <form
          className="admin-form admin-music-form"
          onSubmit={
            handleSubmit
          }
        >
          <h3>
            {editingDrama
              ? "Измени радио драму"
              : "Нова радио драма"}
          </h3>


          {recovered ? (
            <p className="success-message">
              Враћен је локално
              сачуван нацрт
              {recoveryTime
                ? ` од ${recoveryTime}.`
                : "."}
            </p>
          ) : null}


          <p className="admin-music__draft-note">
            Аутоматско чување је
            укључено. Можеш да пређеш
            у другу секцију и вратиш се
            без губљења незавршеног уноса.
          </p>


          <label>
            Наслов радио драме

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
                    event.target.value
                  )
              }
              required
            />
          </label>


          <label>
            Аутор / аутори

            <input
              type="text"
              value={
                form.author
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "author",
                    event.target.value
                  )
              }
              placeholder="нпр. Душан Ковачевић"
            />
          </label>


          <label>
            Година

            <input
              type="number"
              min="1900"
              max="2100"
              step="1"
              value={
                form.release_year
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "release_year",
                    event.target.value
                  )
              }
              placeholder="нпр. 1984"
            />
          </label>


          <label>
            YouTube линк

            <input
              type="url"
              inputMode="url"
              value={
                form.youtube_url
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "youtube_url",
                    event.target.value
                  )
              }
              placeholder="https://www.youtube.com/watch?v=..."
            />

            <small>
              Линк се не приказује као
              спољни YouTube линк на
              јавном сајту. Користи се
              само као извор за наш
              звучник.
            </small>
          </label>


          <label>
            Опис / текст о радио драми

            <textarea
              rows="10"
              value={
                form.description
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "description",
                    event.target.value
                  )
              }
              placeholder="О чему је драма, зашто је препоручујеш, занимљивости..."
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
                    event.target.value
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
                    event.target.value
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


          <div className="form-actions">
            <button
              className="primary-button"
              type="submit"
              disabled={
                saving
              }
            >
              {saving
                ? "Чување..."
                : editingDrama
                  ? "Сачувај измене"
                  : "Додај радио драму"}
            </button>


            {editingDrama ||
            recovered ||
            form.title ||
            form.author ||
            form.description ||
            form.youtube_url ? (
              <button
                className="secondary-button"
                type="button"
                disabled={
                  saving
                }
                onClick={
                  handleCancel
                }
              >
                {editingDrama
                  ? "Откажи измену"
                  : "Очисти форму"}
              </button>
            ) : null}
          </div>
        </form>
      )}


      <div className="admin-list">
        <h3>
          Све радио драме
        </h3>


        {!dramas.length &&
        !loading ? (
          <p>
            Још нема радио драма.
          </p>

        ) : (
          dramas.map(
            (
              drama
            ) => (
              <article
                className="admin-list-item"
                key={
                  drama.id
                }
              >
                <div className="admin-list-info">
                  <div>
                    <p className="admin-status">
                      {drama.status ===
                      "published"
                        ? "ОБЈАВЉЕНА"
                        : "НАЦРТ"}

                      {drama.release_year
                        ? ` · ${drama.release_year}`
                        : ""}

                      {" · РЕДОСЛЕД "}
                      {drama.sort_order}
                    </p>

                    <h3>
                      {drama.title}
                    </h3>

                    <p>
                      {drama.author ||
                        "Без аутора"}
                    </p>

                    <p>
                      {drama.youtube_url
                        ? "YouTube извор додат"
                        : "Без YouTube извора"}
                    </p>
                  </div>
                </div>


                <div className="item-actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(
                        drama
                      )
                    }
                  >
                    Измени
                  </button>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() =>
                      handleDelete(
                        drama
                      )
                    }
                  >
                    Обриши
                  </button>
                </div>
              </article>
            )
          )
        )}
      </div>
    </section>
  );
}


export default AdminMusicRadioDramas;
