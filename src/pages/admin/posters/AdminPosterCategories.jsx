import {
  useEffect,
  useState,
} from "react";

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


function createEmptyForm() {
  return {
    name:
      "",

    description:
      "",

    sort_order:
      "0",
  };
}


function AdminPosterCategories({
  characterKey =
    "covek-1",
}) {
  const [
    categories,
    setCategories,
  ] = useState([]);


  const [
    form,
    setForm,
  ] = useState(
    createEmptyForm
  );


  const [
    editingCategory,
    setEditingCategory,
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
   * DRAFT IDENTITET
   * ==========================================
   */

  const draftKey =
    editingCategory?.id
      ? `poster-categories:${characterKey}:${editingCategory.id}`
      : `poster-categories:${characterKey}:new`;


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

    scope:
      "Постери / категорије",
  });


  useAdminDraftFile({
    draftKey,

    fieldKey:
      "poster-category-image",

    file:
      imageFile,

    setFile:
      setImageFile,

    scope:
      "Постери / категорије",
  });


  /*
   * ==========================================
   * UČITAVANJE
   * ==========================================
   */

  async function loadCategories() {
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
        "categories"
      )
      .select(`
        id,
        name,
        slug,
        description,
        image_url,
        image_path,
        sort_order,
        character_key
      `)
      .eq(
        "character_key",
        characterKey
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
      );


    if (error) {
      setErrorMessage(
        error.message
      );


      setLoading(
        false
      );


      return;
    }


    setCategories(
      data ?? []
    );


    setLoading(
      false
    );
  }


  useEffect(() => {
    loadCategories();
  }, [
    characterKey,
  ]);


  /*
   * ==========================================
   * FORMA
   * ==========================================
   */

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


  function resetForm() {
    setForm(
      createEmptyForm()
    );


    setEditingCategory(
      null
    );


    setImageFile(
      null
    );


    setErrorMessage(
      ""
    );
  }


  function handleEdit(
    category
  ) {
    setEditingCategory(
      category
    );


    setImageFile(
      null
    );


    setSuccessMessage(
      ""
    );


    setErrorMessage(
      ""
    );


    setForm({
      name:
        category.name ??
        "",

      description:
        category.description ??
        "",

      sort_order:
        String(
          category.sort_order ??
          0
        ),
    });


    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }


  async function handleCancel() {
    await discardDraft(
      createEmptyForm(),
      {
        clearFiles:
          true,
      }
    );


    resetForm();


    setSuccessMessage(
      "Локални нацрт је одбачен."
    );
  }


  /*
   * ==========================================
   * ČUVANJE
   * ==========================================
   */

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
          "Упиши назив категорије."
        );
      }


      if (imageFile) {
        uploadedImage =
          await uploadBlogImage(
            imageFile,
            "poster-categories"
          );
      }


      const payload = {
        name:
          cleanName,

        slug:
          slugify(
            cleanName
          ),

        description:
          form.description
            .trim(),

        sort_order:
          Number(
            form.sort_order
          ) || 0,

        character_key:
          characterKey,

        image_url:
          uploadedImage?.url ??
          editingCategory
            ?.image_url ??
          null,

        image_path:
          uploadedImage?.path ??
          editingCategory
            ?.image_path ??
          null,
      };


      const result =
        editingCategory
          ? await supabase
              .from(
                "categories"
              )
              .update(
                payload
              )
              .eq(
                "id",
                editingCategory.id
              )

          : await supabase
              .from(
                "categories"
              )
              .insert(
                payload
              );


      if (
        result.error
      ) {
        if (
          uploadedImage
            ?.path
        ) {
          await deleteBlogImage(
            uploadedImage.path
          );
        }


        throw result.error;
      }


      if (
        uploadedImage &&
        editingCategory
          ?.image_path &&
        editingCategory
          .image_path !==
        uploadedImage.path
      ) {
        try {
          await deleteBlogImage(
            editingCategory
              .image_path
          );

        } catch (
          error
        ) {
          console.error(
            "Brisanje stare poster fotografije:",
            error
          );
        }
      }


      await markCommitted(
        createEmptyForm(),
        {
          clearFiles:
            true,

          message:
            editingCategory
              ? "Категорија постера је сачувана."
              : "Категорија постера је додата.",
        }
      );


      resetForm();


      setSuccessMessage(
        editingCategory
          ? "Категорија је успешно измењена."
          : "Категорија је успешно додата."
      );


      await loadCategories();

    } catch (
      error
    ) {
      if (
        uploadedImage
          ?.path
      ) {
        try {
          await deleteBlogImage(
            uploadedImage.path
          );

        } catch {
          // Ne rušimo formu zbog cleanup-a.
        }
      }


      setErrorMessage(
        error?.message ||
        "Чување категорије није успело. Локални нацрт је остао сачуван."
      );

    } finally {
      setSaving(
        false
      );
    }
  }


  /*
   * ==========================================
   * BRISANJE
   * ==========================================
   */

  async function handleDelete(
    category
  ) {
    const confirmed =
      window.confirm(
        `Обрисати категорију „${category.name}“?`
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
        "categories"
      )
      .delete()
      .eq(
        "id",
        category.id
      );


    if (error) {
      setErrorMessage(
        error.message
      );

      return;
    }


    if (
      category
        .image_path
    ) {
      try {
        await deleteBlogImage(
          category.image_path
        );

      } catch (
        error
      ) {
        console.error(
          "Brisanje poster slike:",
          error
        );
      }
    }


    if (
      editingCategory
        ?.id ===
      category.id
    ) {
      await discardDraft(
        createEmptyForm(),
        {
          clearFiles:
            true,
        }
      );


      resetForm();
    }


    setSuccessMessage(
      "Категорија је обрисана."
    );


    await loadCategories();
  }


  const hasFormContent =
    Boolean(
      form.name
        .trim() ||
      form.description
        .trim() ||
      Number(
        form.sort_order
      ) !== 0 ||
      imageFile
    );


  return (
    <section className="admin-music-section">
      <div className="admin-music-section__heading">
        <div>
          <p className="eyebrow">
            ПОСТЕРИ
          </p>

          <h2>
            Категорије
          </h2>
        </div>


        <p>
          Путовања, бајке,
          сценарији, догађаји
          из живота и све наредне
          лагане теме.
        </p>
      </div>


      <form
        className="admin-form"
        onSubmit={
          handleSubmit
        }
      >
        <h3>
          {editingCategory
            ? "Измени категорију"
            : "Нова категорија"}
        </h3>


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


        <label>
          Назив

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
            required
          />
        </label>


        <label>
          Кратак опис

          <textarea
            rows="3"
            value={
              form.description
            }
            onChange={
              (
                event
              ) =>
                updateField(
                  "description",
                  event
                    .target
                    .value
                )
            }
            placeholder="На пример: Приче, фотографије и белешке са путовања."
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
            Фотографија категорије
          </strong>


          {editingCategory
            ?.image_url &&
          !imageFile ? (
            <img
              className="admin-image-preview"
              src={
                editingCategory
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
              : editingCategory
                ? "Сачувај измене"
                : "Додај категорију"}
          </button>


          {editingCategory ||
          recovered ||
          hasFormContent ? (
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
              {editingCategory
                ? "Откажи измену"
                : "Очисти форму"}
            </button>
          ) : null}
        </div>
      </form>


      <div className="admin-list">
        <h3>
          Све категорије
        </h3>


        {loading ? (
          <p>
            Учитавање...
          </p>

        ) : !categories.length ? (
          <p>
            Још нема категорија.
          </p>

        ) : (
          categories.map(
            (
              category
            ) => (
              <article
                className="admin-list-item"
                key={
                  category.id
                }
              >
                <div className="admin-list-info">
                  {category
                    .image_url ? (
                    <img
                      className="admin-list-thumb"
                      src={
                        category
                          .image_url
                      }
                      alt=""
                    />
                  ) : null}


                  <div>
                    <p className="admin-status">
                      РЕДОСЛЕД
                      {" "}
                      {category
                        .sort_order}
                    </p>


                    <h3>
                      {category.name}
                    </h3>


                    {category
                      .description ? (
                      <p>
                        {
                          category
                            .description
                        }
                      </p>
                    ) : null}
                  </div>
                </div>


                <div className="item-actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(
                        category
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
                        category
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


export default AdminPosterCategories;