import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../../../lib/supabaseClient";

import {
  deleteBlogImage,
  uploadBlogImage,
} from "../../../lib/blogImages";

import {
  slugify,
} from "../../../utils/slugify";

import useAdminDraft
  from "../../../admin-safety/useAdminDraft";

import useAdminDraftFile
  from "../../../admin-safety/useAdminDraftFile";

import {
  clearAdminDraft,
} from "../../../admin-safety/adminDraftStorage";


function createEmptyForm() {
  return {
    name:
      "",

    sort_order:
      "0",
  };
}


function formFromGenre(
  genre
) {
  return {
    name:
      genre?.name ??
      "",

    sort_order:
      String(
        genre?.sort_order ??
        0
      ),
  };
}


function AdminMusicGenres() {
  const navigate =
    useNavigate();

  const {
    characterKey =
      "covek-1",

    genreId,
  } = useParams();


  const basePath =
    `/admin/likovi/${characterKey}/muzika/zanrovi`;


  const draftKey =
    genreId
      ? `music-genres:${genreId}`
      : "music-genres:new";


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
    editingGenre,
    setEditingGenre,
  ] = useState(null);


  const [
    imageFile,
    setImageFile,
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
      "Музика / жанрови",
  });


  useAdminDraftFile({
    draftKey,

    fieldKey:
      "genre-image",

    file:
      imageFile,

    setFile:
      setImageFile,

    ready:
      editorReady,

    scope:
      "Музика / жанрови",
  });


  async function loadGenres() {
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
        "music_genres"
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
        "name",
        {
          ascending:
            true,
        }
      );


    if (error) {
      setErrorMessage(
        error.message
      );

      setGenres(
        []
      );

    } else {
      setGenres(
        data ?? []
      );
    }


    setLoading(
      false
    );
  }


  useEffect(() => {
    loadGenres();
  }, []);


  useEffect(() => {
    if (loading) {
      return;
    }


    setEditorReadyKey(
      ""
    );

    setImageFile(
      null
    );

    setSuccessMessage(
      ""
    );


    if (!genreId) {
      setEditingGenre(
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


    const genre =
      genres.find(
        (
          item
        ) =>
          String(
            item.id
          ) ===
          String(
            genreId
          )
      );


    if (!genre) {
      setEditingGenre(
        null
      );

      setErrorMessage(
        "Тражени жанр не постоји."
      );

      return;
    }


    setEditingGenre(
      genre
    );

    setForm(
      formFromGenre(
        genre
      )
    );

    setEditorReadyKey(
      draftKey
    );
  }, [
    genreId,
    genres,
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

    setSuccessMessage(
      ""
    );

    setErrorMessage(
      ""
    );
  }


  function handleEdit(
    genre
  ) {
    navigate(
      `${basePath}/${genre.id}`
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
      editingGenre
        ? formFromGenre(
            editingGenre
          )
        : createEmptyForm();


    await discardDraft(
      baseline,
      {
        clearFiles:
          true,
      }
    );


    setImageFile(
      null
    );


    if (genreId) {
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


    let uploadedImage =
      null;


    try {
      const cleanName =
        form.name
          .trim();


      if (!cleanName) {
        throw new Error(
          "Упиши назив жанра."
        );
      }


      if (imageFile) {
        uploadedImage =
          await uploadBlogImage(
            imageFile,
            "music-genres"
          );
      }


      const payload = {
        name:
          cleanName,

        slug:
          slugify(
            cleanName
          ),

        sort_order:
          Number(
            form.sort_order
          ) || 0,

        image_url:
          uploadedImage?.url ??
          editingGenre
            ?.image_url ??
          null,

        image_path:
          uploadedImage?.path ??
          editingGenre
            ?.image_path ??
          null,

        updated_at:
          new Date()
            .toISOString(),
      };


      const result =
        editingGenre
          ? await supabase
              .from(
                "music_genres"
              )
              .update(
                payload
              )
              .eq(
                "id",
                editingGenre.id
              )

          : await supabase
              .from(
                "music_genres"
              )
              .insert(
                payload
              );


      if (
        result.error
      ) {
        throw result.error;
      }


      if (
        uploadedImage &&
        editingGenre
          ?.image_path &&
        editingGenre
          .image_path !==
        uploadedImage.path
      ) {
        await deleteBlogImage(
          editingGenre
            .image_path
        ).catch(
          () => {}
        );
      }


      const nextEmptyForm =
        createEmptyForm();


      await markCommitted(
        editingGenre
          ? {
              name:
                cleanName,

              sort_order:
                String(
                  Number(
                    form.sort_order
                  ) || 0
                ),
            }
          : nextEmptyForm,
        {
          clearFiles:
            true,

          message:
            editingGenre
              ? "Жанр је сачуван."
              : "Жанр је додат.",
        }
      );


      setImageFile(
        null
      );


      await loadGenres();


      if (editingGenre) {
        navigate(
          basePath
        );

      } else {
        setForm(
          nextEmptyForm
        );
      }


      setSuccessMessage(
        editingGenre
          ? "Жанр је успешно измењен."
          : "Жанр је успешно додат."
      );

    } catch (
      error
    ) {
      if (
        uploadedImage
          ?.path
      ) {
        await deleteBlogImage(
          uploadedImage.path
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


  async function handleDelete(
    genre
  ) {
    const confirmed =
      window.confirm(
        `Трајно обрисати жанр „${genre.name}“?\n\nАко постоје препоруке у овом жанру, и оне ће бити обрисане.`
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
        "music_genres"
      )
      .delete()
      .eq(
        "id",
        genre.id
      );


    if (error) {
      setErrorMessage(
        error.message
      );

      return;
    }


    if (
      genre.image_path
    ) {
      await deleteBlogImage(
        genre.image_path
      ).catch(
        () => {}
      );
    }


    await clearAdminDraft(
      `music-genres:${genre.id}`
    ).catch(
      () => {}
    );


    if (
      String(
        genreId
      ) ===
      String(
        genre.id
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
      "Жанр је обрисан."
    );


    await loadGenres();
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
            Жанрови
          </h2>
        </div>

        <p>
          Фотографија жанра се
          користи на јавној
          картици жанра.
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
            {editingGenre
              ? "Измени жанр"
              : "Нови жанр"}
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


          <label>
            Назив жанра

            <input
              type="text"
              value={
                form.name
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "name",
                    event
                      .target
                      .value
                  )
              }
              placeholder="нпр. Rock"
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


          <div className="admin-image-field">
            <strong>
              Фотографија жанра
            </strong>


            {editingGenre
              ?.image_url &&
            !imageFile ? (
              <img
                className="admin-image-preview"
                src={
                  editingGenre
                    .image_url
                }
                alt=""
              />
            ) : null}


            <input
              type="file"
              accept="image/*"
              onChange={
                (
                  event
                ) =>
                  setImageFile(
                    event
                      .target
                      .files?.[0] ??
                    null
                  )
              }
            />


            {imageFile ? (
              <p>
                Локално обезбеђена
                фотографија:
                {" "}

                <strong>
                  {imageFile.name}
                </strong>
              </p>
            ) : null}
          </div>


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
                : editingGenre
                  ? "Сачувај измене"
                  : "Додај жанр"}
            </button>


            {editingGenre ||
            recovered ||
            form.name ||
            Number(
              form.sort_order
            ) !== 0 ||
            imageFile ? (
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
                {editingGenre
                  ? "Откажи измену"
                  : "Очисти форму"}
              </button>
            ) : null}
          </div>
        </form>
      )}


      <div className="admin-list">
        <h3>
          Сви жанрови
        </h3>


        {!genres.length &&
        !loading ? (
          <p>
            Још нема ниједног
            жанра.
          </p>

        ) : (
          genres.map(
            (
              genre
            ) => (
              <article
                className="admin-list-item"
                key={
                  genre.id
                }
              >
                <div className="admin-list-info">
                  {genre
                    .image_url ? (
                    <img
                      className="admin-list-thumb"
                      src={
                        genre
                          .image_url
                      }
                      alt=""
                    />
                  ) : null}


                  <div>
                    <p className="admin-status">
                      РЕДОСЛЕД
                      {" "}
                      {genre
                        .sort_order}
                    </p>

                    <h3>
                      {genre.name}
                    </h3>

                    <p>
                      /{genre.slug}
                    </p>
                  </div>
                </div>


                <div className="item-actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(
                        genre
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
                        genre
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


export default AdminMusicGenres;