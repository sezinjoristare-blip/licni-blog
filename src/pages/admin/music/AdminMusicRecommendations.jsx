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

import AdminMusicPlaylists
  from "./AdminMusicPlaylists";

import AdminMusicRadioDramas
  from "./AdminMusicRadioDramas";


function createEmptyForm() {
  return {
    title:
      "",

    artist:
      "",

    release_year:
      "",

    genre_id:
      "",

    youtube_url:
      "",

    why_i_like:
      "",

    sort_order:
      "0",

    status:
      "draft",
  };
}


function formFromRecommendation(
  recommendation
) {
  return {
    title:
      recommendation
        ?.title ??
      "",

    artist:
      recommendation
        ?.artist ??
      "",

    release_year:
      recommendation
        ?.release_year
        ? String(
            recommendation
              .release_year
          )
        : "",

    genre_id:
      recommendation
        ?.genre_id ??
      "",

    youtube_url:
      recommendation
        ?.youtube_url ??
      "",

    why_i_like:
      recommendation
        ?.why_i_like ??
      "",

    sort_order:
      String(
        recommendation
          ?.sort_order ??
        0
      ),

    status:
      recommendation
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


function AdminMusicDiscs() {
  const navigate =
    useNavigate();

  const {
    characterKey =
      "covek-1",

    recommendationId,
  } = useParams();


  const basePath =
    `/admin/likovi/${characterKey}/muzika/preporuke`;


  const draftKey =
    recommendationId
      ? `music-recommendations:${recommendationId}`
      : "music-recommendations:new";


  const [
    recommendations,
    setRecommendations,
  ] = useState([]);


  const [
    genres,
    setGenres,
  ] = useState([]);


  const [
    form,
    setForm,
  ] = useState(
    createEmptyForm
  );


  const [
    editingRecommendation,
    setEditingRecommendation,
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
      "Музика / препоруке",
  });


  async function loadData() {
    setLoading(
      true
    );

    setErrorMessage(
      ""
    );


    const [
      genresResult,
      recommendationsResult,
    ] = await Promise.all([
      supabase
        .from(
          "music_genres"
        )
        .select(
          "id, name, slug, sort_order"
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        )
        .order(
          "name",
          {
            ascending:
              true,
          }
        ),

      supabase
        .from(
          "music_recommendations"
        )
        .select(`
          *,
          music_genres (
            id,
            name,
            slug
          )
        `)
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
        ),
    ]);


    if (
      genresResult.error
    ) {
      setErrorMessage(
        genresResult
          .error.message
      );
    }


    if (
      recommendationsResult
        .error
    ) {
      setErrorMessage(
        recommendationsResult
          .error.message
      );
    }


    setGenres(
      genresResult.data ??
      []
    );

    setRecommendations(
      recommendationsResult
        .data ??
      []
    );

    setLoading(
      false
    );
  }


  useEffect(() => {
    loadData();
  }, []);


  useEffect(() => {
    if (loading) {
      return;
    }


    setEditorReadyKey(
      ""
    );

    setSuccessMessage(
      ""
    );


    if (
      !recommendationId
    ) {
      setEditingRecommendation(
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


    const recommendation =
      recommendations.find(
        (
          item
        ) =>
          String(
            item.id
          ) ===
          String(
            recommendationId
          )
      );


    if (!recommendation) {
      setEditingRecommendation(
        null
      );

      setErrorMessage(
        "Тражена препорука не постоји."
      );

      return;
    }


    setEditingRecommendation(
      recommendation
    );

    setForm(
      formFromRecommendation(
        recommendation
      )
    );

    setEditorReadyKey(
      draftKey
    );
  }, [
    recommendationId,
    recommendations,
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

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );
  }


  function handleEdit(
    recommendation
  ) {
    navigate(
      `${basePath}/${recommendation.id}`
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
      editingRecommendation
        ? formFromRecommendation(
            editingRecommendation
          )
        : createEmptyForm();


    await discardDraft(
      baseline
    );


    if (
      recommendationId
    ) {
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


    setSaving(
      true
    );

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );


    try {
      const cleanTitle =
        form.title
          .trim();

      const cleanArtist =
        form.artist
          .trim();

      const cleanReleaseYear =
        form.release_year
          .trim();

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
          "Упиши наслов песме."
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
        !form.genre_id
      ) {
        throw new Error(
          "Изабери жанр."
        );
      }


      if (
        !form
          .why_i_like
          .trim()
      ) {
        throw new Error(
          "Напиши зашто ти се песма свиђа."
        );
      }


      const slugSource =
        cleanArtist
          ? `${cleanArtist}-${cleanTitle}`
          : cleanTitle;


      const payload = {
        title:
          cleanTitle,

        artist:
          cleanArtist ||
          null,

        release_year:
          releaseYear,

        genre_id:
          form.genre_id,

        slug:
          slugify(
            slugSource
          ),

        youtube_url:
          cleanYouTubeUrl,

        why_i_like:
          form
            .why_i_like
            .trim(),

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
        editingRecommendation
          ? await supabase
              .from(
                "music_recommendations"
              )
              .update(
                payload
              )
              .eq(
                "id",
                editingRecommendation
                  .id
              )

          : await supabase
              .from(
                "music_recommendations"
              )
              .insert(
                payload
              );


      if (
        result.error
      ) {
        throw result.error;
      }


      const nextEmptyForm =
        createEmptyForm();


      await markCommitted(
        editingRecommendation
          ? {
              title:
                cleanTitle,

              artist:
                cleanArtist,

              release_year:
                releaseYear ===
                  null
                  ? ""
                  : String(
                      releaseYear
                    ),

              genre_id:
                form.genre_id,

              youtube_url:
                cleanYouTubeUrl ||
                "",

              why_i_like:
                form
                  .why_i_like
                  .trim(),

              sort_order:
                String(
                  Number(
                    form.sort_order
                  ) || 0
                ),

              status:
                form.status,
            }
          : nextEmptyForm,
        {
          message:
            editingRecommendation
              ? "Препорука је сачувана."
              : "Препорука је додата.",
        }
      );


      await loadData();


      if (
        editingRecommendation
      ) {
        navigate(
          basePath
        );

      } else {
        setForm(
          nextEmptyForm
        );
      }


      setSuccessMessage(
        editingRecommendation
          ? "Препорука је успешно измењена."
          : "Препорука је успешно додата."
      );

    } catch (
      error
    ) {
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


  async function handleDelete(
    recommendation
  ) {
    const confirmed =
      window.confirm(
        `Трајно обрисати препоруку „${recommendation.title}“?`
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


    const {
      error,
    } = await supabase
      .from(
        "music_recommendations"
      )
      .delete()
      .eq(
        "id",
        recommendation.id
      );


    if (error) {
      setErrorMessage(
        error.message
      );

      return;
    }


    await clearAdminDraft(
      `music-recommendations:${recommendation.id}`
    ).catch(
      () => {}
    );


    if (
      String(
        recommendationId
      ) ===
      String(
        recommendation.id
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
      "Препорука је обрисана."
    );


    await loadData();
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
            Дискови
          </h2>
        </div>

        <p>
          Овде уређујеш појединачне
          препоруке које се појављују
          као дискови. Нацрт се чува
          локално и враћа ако случајно
          напустиш страницу.
        </p>
      </div>


      {!genres.length &&
      !loading ? (
        <p className="admin-music__notice">
          Прво направи бар један
          жанр у секцији „Жанрови“.
        </p>
      ) : null}


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
            {editingRecommendation
              ? "Измени препоруку"
              : "Нова препорука"}
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
            укључено. Ако пређеш у
            другу секцију и вратиш се,
            недовршен унос остаје
            сачуван локално.
          </p>


          <label>
            Наслов песме

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
            Извођач

            <input
              type="text"
              value={
                form.artist
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "artist",
                    event
                      .target
                      .value
                  )
              }
            />
          </label>


          <label>
            Година издања

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
                    event
                      .target
                      .value
                  )
              }
              placeholder="нпр. 1997"
            />

            <small>
              Опционо. Користи се за
              филтер и сортирање на
              јавној полици дискова.
            </small>
          </label>


          <label>
            YouTube линк песме

            <input
              type="text"
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
                    event
                      .target
                      .value
                  )
              }
              placeholder="https://www.youtube.com/watch?v=..."
            />

            <small>
              Опционо. Користи
              званичан или
              ауторизован YouTube
              видео песме.
            </small>
          </label>


          <label>
            Жанр

            <select
              value={
                form.genre_id
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "genre_id",
                    event
                      .target
                      .value
                  )
              }
              required
            >
              <option value="">
                Изабери жанр
              </option>

              {genres.map(
                (
                  genre
                ) => (
                  <option
                    key={
                      genre.id
                    }
                    value={
                      genre.id
                    }
                  >
                    {genre.name}
                  </option>
                )
              )}
            </select>
          </label>


          <label>
            Зашто ми се свиђа

            <textarea
              className="article-editor"
              rows="14"
              value={
                form.why_i_like
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "why_i_like",
                    event
                      .target
                      .value
                  )
              }
              placeholder="Овде пишеш свој текст о песми..."
              required
            />
          </label>


          <label>
            Редослед у жанру

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
                saving ||
                !genres.length
              }
            >
              {saving
                ? "Чување..."
                : editingRecommendation
                  ? "Сачувај измене"
                  : "Додај препоруку"}
            </button>


            {editingRecommendation ||
            recovered ||
            form.title ||
            form.artist ||
            form.release_year ||
            form.youtube_url ||
            form.why_i_like ? (
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
                {editingRecommendation
                  ? "Откажи измену"
                  : "Очисти форму"}
              </button>
            ) : null}
          </div>
        </form>
      )}


      <div className="admin-list">
        <h3>
          Све препоруке
        </h3>


        {!recommendations.length &&
        !loading ? (
          <p>
            Још нема препорука.
          </p>

        ) : (
          recommendations.map(
            (
              recommendation
            ) => (
              <article
                className="admin-list-item"
                key={
                  recommendation.id
                }
              >
                <div className="admin-list-info">
                  <div>
                    <p className="admin-status">
                      {recommendation
                        .status ===
                      "published"
                        ? "ОБЈАВЉЕН"
                        : "НАЦРТ"}

                      {" · "}

                      {recommendation
                        .music_genres
                        ?.name ||
                        "Без жанра"}

                      {recommendation
                        .release_year
                        ? ` · ${recommendation.release_year}`
                        : ""}

                      {" · РЕДОСЛЕД "}

                      {recommendation
                        .sort_order}
                    </p>

                    <h3>
                      {recommendation
                        .title}
                    </h3>

                    <p>
                      {recommendation
                        .artist ||
                        "Без извођача"}
                    </p>

                    <p>
                      {recommendation
                        .youtube_url
                        ? "YouTube линк додат"
                        : "Без YouTube линка"}
                    </p>
                  </div>
                </div>


                <div className="item-actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(
                        recommendation
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
                        recommendation
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


function AdminMusicRecommendations() {
  const [
    searchParams,
  ] = useSearchParams();

  const {
    recommendationId,
  } = useParams();


  if (recommendationId) {
    return (
      <AdminMusicDiscs />
    );
  }


  const section =
    searchParams.get(
      "tip"
    ) ||
    "diskovi";


  if (
    section ===
    "plejliste"
  ) {
    return (
      <AdminMusicPlaylists />
    );
  }


  if (
    section ===
    "radio-drame"
  ) {
    return (
      <AdminMusicRadioDramas />
    );
  }


  return (
    <AdminMusicDiscs />
  );
}


export default AdminMusicRecommendations;
