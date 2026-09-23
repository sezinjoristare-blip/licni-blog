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

import {
  slugify,
} from "../../utils/slugify";

import useAdminDraft
  from "../../admin-safety/useAdminDraft";

import useAdminDraftFile
  from "../../admin-safety/useAdminDraftFile";


function createEmptyForm() {
  return {
    name:
      "",

    description:
      "",

    is_visible:
      true,

    sort_order:
      0,
  };
}


function AdminCategories() {
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
   * STABILAN DRAFT IDENTITET
   *
   * Nova kategorija i svaka postojeća
   * kategorija imaju odvojen recovery.
   * ==========================================
   */

  const draftKey =
    editingCategory?.id
      ? `categories:${editingCategory.id}`
      : "categories:new";


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
      "Категорије",
  });


  useAdminDraftFile({
    draftKey,

    fieldKey:
      "category-image",

    file:
      imageFile,

    setFile:
      setImageFile,

    scope:
      "Категорије",
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


    const {
      data,
      error,
    } = await supabase
      .from(
        "categories"
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

    } else {
      setCategories(
        data ?? []
      );
    }


    setLoading(
      false
    );
  }


  useEffect(() => {
    loadCategories();
  }, []);


  /*
   * ==========================================
   * FORMA
   * ==========================================
   */

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
    category
  ) {
    setEditingCategory(
      category
    );


    setImageFile(
      null
    );


    setErrorMessage(
      ""
    );


    setSuccessMessage(
      ""
    );


    setForm({
      name:
        category.name ??
        "",

      description:
        category.description ??
        "",

      is_visible:
        category.is_visible ??
        true,

      sort_order:
        category.sort_order ??
        0,
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
            "categories"
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

        is_visible:
          Boolean(
            form.is_visible
          ),

        sort_order:
          Number(
            form.sort_order
          ) || 0,

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


      /*
       * Tek nakon uspešnog DB update-a
       * brišemo staru sliku.
       */

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
            "Brisanje stare slike kategorije:",
            error
          );
        }
      }


      /*
       * Čistimo recovery za ovaj
       * konkretan editor.
       */

      await markCommitted(
        createEmptyForm(),
        {
          clearFiles:
            true,

          message:
            editingCategory
              ? "Категорија је сачувана."
              : "Категорија је додата.",
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
      /*
       * Ako je upload uspeo ali DB nije,
       * čistimo samo novi upload.
       */

      if (
        uploadedImage
          ?.path
      ) {
        try {
          await deleteBlogImage(
            uploadedImage.path
          );

        } catch {
          // Bez dodatnog rušenja forme.
        }
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
          "Brisanje slike kategorije:",
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
    <section>
      <div className="admin-page-heading">
        <p className="eyebrow">
          САДРЖАЈ
        </p>

        <h1>
          Категорије
        </h1>

        <p>
          Свака категорија може
          имати своју фотографију.
        </p>
      </div>


      <form
        className="admin-form"
        onSubmit={
          handleSubmit
        }
      >
        <h2>
          {editingCategory
            ? "Измени категорију"
            : "Нова категорија"}
        </h2>


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
          Назив категорије

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
          Опис

          <textarea
            rows="4"
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


        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={
              form.is_visible
            }
            onChange={
              (
                event
              ) =>
                updateField(
                  "is_visible",
                  event
                    .target
                    .checked
                )
            }
          />

          Видљива на сајту
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
        <h2>
          Постојеће категорије
        </h2>


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
                    <h3>
                      {category.name}
                    </h3>

                    <p>
                      {category
                        .description ||
                        "Без описа."}
                    </p>

                    <small>
                      {category
                        .is_visible
                        ? "Видљива"
                        : "Скривена"}
                    </small>
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


export default AdminCategories;