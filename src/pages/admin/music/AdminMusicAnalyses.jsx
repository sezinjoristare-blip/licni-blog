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


function createId() {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }


  return `music-block-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}


function createComparisonBlock(
  original = "",
  translation = ""
) {
  return {
    id:
      createId(),

    original,

    translation,
  };
}


function createEmptyForm() {
  return {
    title:
      "",

    artist:
      "",

    youtube_url:
      "",

    comparison_blocks: [
      createComparisonBlock(),
    ],

    analysis:
      "",

    sort_order:
      "0",

    status:
      "draft",
  };
}


function normalizeComparisonBlocks(
  work
) {
  if (
    Array.isArray(
      work?.comparison_blocks
    ) &&
    work.comparison_blocks.length
  ) {
    return work
      .comparison_blocks
      .map(
        (
          block
        ) => ({
          id:
            block.id ||
            createId(),

          original:
            block.original ||
            "",

          translation:
            block.translation ||
            "",
        })
      );
  }


  if (
    work?.original_text ||
    work?.translation
  ) {
    return [
      createComparisonBlock(
        work.original_text ||
          "",

        work.translation ||
          ""
      ),
    ];
  }


  return [
    createComparisonBlock(),
  ];
}


function formFromWork(
  work
) {
  return {
    title:
      work?.title ??
      "",

    artist:
      work?.artist ??
      "",

    youtube_url:
      work?.youtube_url ??
      "",

    comparison_blocks:
      normalizeComparisonBlocks(
        work
      ),

    analysis:
      work?.analysis ??
      "",

    sort_order:
      String(
        work?.sort_order ??
        0
      ),

    status:
      work?.status ??
      "draft",
  };
}


function normalizeRecoveredForm(
  saved
) {
  const fallback =
    createEmptyForm();


  if (
    !saved ||
    typeof saved !==
      "object"
  ) {
    return fallback;
  }


  return {
    ...fallback,
    ...saved,

    comparison_blocks:
      Array.isArray(
        saved.comparison_blocks
      ) &&
      saved.comparison_blocks.length
        ? saved
            .comparison_blocks
            .map(
              (
                block
              ) => ({
                id:
                  block.id ||
                  createId(),

                original:
                  block.original ||
                  "",

                translation:
                  block.translation ||
                  "",
              })
            )
        : [
            createComparisonBlock(),
          ],
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


function AdminMusicAnalyses() {
  const navigate =
    useNavigate();

  const {
    characterKey =
      "covek-1",

    workId,
  } = useParams();


  const basePath =
    `/admin/likovi/${characterKey}/muzika/analize`;


  const draftKey =
    workId
      ? `music-analyses:${workId}`
      : "music-analyses:new";


  const [
    works,
    setWorks,
  ] = useState([]);


  const [
    form,
    setForm,
  ] = useState(
    createEmptyForm
  );


  const [
    editingWork,
    setEditingWork,
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
        setForm(
          normalizeRecoveredForm(
            savedForm
          )
        );
      },

    ready:
      editorReady,

    scope:
      "Музика / анализе",
  });


  useAdminDraftFile({
    draftKey,

    fieldKey:
      "analysis-image",

    file:
      imageFile,

    setFile:
      setImageFile,

    ready:
      editorReady,

    scope:
      "Музика / анализе",
  });


  async function loadWorks() {
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
        "music_analysis_works"
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
            false,
        }
      );


    if (error) {
      setErrorMessage(
        error.message
      );

      setWorks(
        []
      );

    } else {
      setWorks(
        data ?? []
      );
    }


    setLoading(
      false
    );
  }


  useEffect(() => {
    loadWorks();
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


    if (!workId) {
      setEditingWork(
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


    const work =
      works.find(
        (
          item
        ) =>
          String(
            item.id
          ) ===
          String(
            workId
          )
      );


    if (!work) {
      setEditingWork(
        null
      );

      setErrorMessage(
        "Тражена анализа не постоји."
      );

      return;
    }


    setEditingWork(
      work
    );

    setForm(
      formFromWork(
        work
      )
    );

    setEditorReadyKey(
      draftKey
    );
  }, [
    workId,
    works,
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
    work
  ) {
    navigate(
      `${basePath}/${work.id}`
    );

    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }


  function handleBlockChange(
    blockId,
    field,
    value
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        comparison_blocks:
          current
            .comparison_blocks
            .map(
              (
                block
              ) =>
                block.id ===
                blockId
                  ? {
                      ...block,

                      [field]:
                        value,
                    }

                  : block
            ),
      })
    );

    setSuccessMessage(
      ""
    );
  }


  function addComparisonBlock() {
    setForm(
      (
        current
      ) => ({
        ...current,

        comparison_blocks: [
          ...current
            .comparison_blocks,

          createComparisonBlock(),
        ],
      })
    );
  }


  function removeComparisonBlock(
    blockId
  ) {
    setForm(
      (
        current
      ) => {
        const nextBlocks =
          current
            .comparison_blocks
            .filter(
              (
                block
              ) =>
                block.id !==
                blockId
            );


        return {
          ...current,

          comparison_blocks:
            nextBlocks.length
              ? nextBlocks
              : [
                  createComparisonBlock(),
                ],
        };
      }
    );
  }


  function moveComparisonBlock(
    index,
    direction
  ) {
    setForm(
      (
        current
      ) => {
        const blocks = [
          ...current
            .comparison_blocks,
        ];


        const nextIndex =
          index +
          direction;


        if (
          nextIndex < 0 ||
          nextIndex >=
            blocks.length
        ) {
          return current;
        }


        const [
          movedBlock,
        ] = blocks.splice(
          index,
          1
        );


        blocks.splice(
          nextIndex,
          0,
          movedBlock
        );


        return {
          ...current,

          comparison_blocks:
            blocks,
        };
      }
    );
  }


  async function handleCancel() {
    const baseline =
      editingWork
        ? formFromWork(
            editingWork
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


    if (workId) {
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
      const cleanTitle =
        form.title
          .trim();

      const cleanArtist =
        form.artist
          .trim();

      const cleanYouTubeUrl =
        normalizeYouTubeUrl(
          form.youtube_url
        );

      const cleanAnalysis =
        form.analysis
          .trim();


      if (!cleanTitle) {
        throw new Error(
          "Упиши наслов песме."
        );
      }


      if (!cleanAnalysis) {
        throw new Error(
          "Напиши анализу."
        );
      }


      const cleanBlocks =
        form
          .comparison_blocks
          .map(
            (
              block
            ) => ({
              id:
                block.id ||
                createId(),

              original:
                block.original
                  .trim(),

              translation:
                block.translation
                  .trim(),
            })
          )
          .filter(
            (
              block
            ) =>
              block.original ||
              block.translation
          );


      if (imageFile) {
        uploadedImage =
          await uploadBlogImage(
            imageFile,
            "music-analyses"
          );
      }


      const slugSource =
        cleanArtist
          ? `${cleanArtist}-${cleanTitle}`
          : cleanTitle;


      const originalText =
        cleanBlocks
          .map(
            (
              block
            ) =>
              block.original
          )
          .filter(Boolean)
          .join(
            "\n\n"
          );


      const translationText =
        cleanBlocks
          .map(
            (
              block
            ) =>
              block.translation
          )
          .filter(Boolean)
          .join(
            "\n\n"
          );


      const payload = {
        title:
          cleanTitle,

        artist:
          cleanArtist ||
          null,

        slug:
          slugify(
            slugSource
          ),

        youtube_url:
          cleanYouTubeUrl,

        image_url:
          uploadedImage?.url ??
          editingWork
            ?.image_url ??
          null,

        image_path:
          uploadedImage?.path ??
          editingWork
            ?.image_path ??
          null,

        comparison_blocks:
          cleanBlocks,

        original_text:
          originalText,

        translation:
          translationText,

        analysis:
          cleanAnalysis,

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
        editingWork
          ? await supabase
              .from(
                "music_analysis_works"
              )
              .update(
                payload
              )
              .eq(
                "id",
                editingWork.id
              )

          : await supabase
              .from(
                "music_analysis_works"
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
        editingWork
          ?.image_path &&
        editingWork
          .image_path !==
        uploadedImage.path
      ) {
        await deleteBlogImage(
          editingWork
            .image_path
        ).catch(
          () => {}
        );
      }


      const nextEmptyForm =
        createEmptyForm();


      await markCommitted(
        editingWork
          ? {
              title:
                cleanTitle,

              artist:
                cleanArtist,

              youtube_url:
                cleanYouTubeUrl ||
                "",

              comparison_blocks:
                cleanBlocks,

              analysis:
                cleanAnalysis,

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
          clearFiles:
            true,

          message:
            editingWork
              ? "Анализа је сачувана."
              : "Анализа је додата.",
        }
      );


      setImageFile(
        null
      );


      await loadWorks();


      if (editingWork) {
        navigate(
          basePath
        );

      } else {
        setForm(
          nextEmptyForm
        );
      }


      setSuccessMessage(
        editingWork
          ? "Рад је успешно измењен."
          : "Рад је успешно додат."
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
    work
  ) {
    const confirmed =
      window.confirm(
        `Трајно обрисати рад „${work.title}“?`
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
        "music_analysis_works"
      )
      .delete()
      .eq(
        "id",
        work.id
      );


    if (error) {
      setErrorMessage(
        error.message
      );

      return;
    }


    if (
      work.image_path
    ) {
      await deleteBlogImage(
        work.image_path
      ).catch(
        () => {}
      );
    }


    await clearAdminDraft(
      `music-analyses:${work.id}`
    ).catch(
      () => {}
    );


    if (
      String(
        workId
      ) ===
      String(
        work.id
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
      "Рад је обрисан."
    );


    await loadWorks();
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
            ПРЕВОДИ
          </p>

          <h2>
            Преводи и анализе
          </h2>
        </div>

        <p>
          Оригинал и превод се
          уносе у упареним
          блоковима.
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
            {editingWork
              ? "Измени рад"
              : "Нови рад"}
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


          <div className="admin-image-field">
            <strong>
              Фотографија рада
              {" "}
              <span className="admin-music__optional">
                (опционо)
              </span>
            </strong>


            {editingWork
              ?.image_url &&
            !imageFile ? (
              <img
                className="admin-image-preview"
                src={
                  editingWork
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


          <section
            style={{
              display:
                "grid",

              gap:
                "18px",
            }}
          >
            <div>
              <h3
                style={{
                  marginBottom:
                    "6px",
                }}
              >
                Оригинал и превод
              </h3>

              <p
                style={{
                  margin:
                    0,

                  opacity:
                    0.7,
                }}
              >
                Сваки блок представља
                једну строфу, рефрен
                или део песме који
                желиш да остане
                поравнат.
              </p>
            </div>


            {form
              .comparison_blocks
              .map(
                (
                  block,
                  index
                ) => (
                  <div
                    key={
                      block.id
                    }
                    style={{
                      display:
                        "grid",

                      gap:
                        "14px",

                      padding:
                        "18px",

                      border:
                        "1px dashed rgba(60, 45, 30, 0.35)",

                      background:
                        "rgba(255,255,255,0.18)",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "space-between",

                        gap:
                          "14px",

                        flexWrap:
                          "wrap",
                      }}
                    >
                      <strong>
                        БЛОК
                        {" "}
                        {index + 1}
                      </strong>


                      <div
                        style={{
                          display:
                            "flex",

                          flexWrap:
                            "wrap",

                          gap:
                            "7px",
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            index ===
                            0
                          }
                          onClick={() =>
                            moveComparisonBlock(
                              index,
                              -1
                            )
                          }
                        >
                          ↑ Горе
                        </button>

                        <button
                          type="button"
                          disabled={
                            index ===
                            form
                              .comparison_blocks
                              .length -
                              1
                          }
                          onClick={() =>
                            moveComparisonBlock(
                              index,
                              1
                            )
                          }
                        >
                          ↓ Доле
                        </button>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            removeComparisonBlock(
                              block.id
                            )
                          }
                        >
                          Обриши блок
                        </button>
                      </div>
                    </div>


                    <div
                      style={{
                        display:
                          "grid",

                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(280px, 1fr))",

                        gap:
                          "16px",
                      }}
                    >
                      <label>
                        Оригинал

                        <textarea
                          className="article-editor"
                          rows="10"
                          value={
                            block.original
                          }
                          onChange={
                            (
                              event
                            ) =>
                              handleBlockChange(
                                block.id,
                                "original",
                                event
                                  .target
                                  .value
                              )
                          }
                          placeholder="Оригинални део песме..."
                        />
                      </label>


                      <label>
                        Превод

                        <textarea
                          className="article-editor"
                          rows="10"
                          value={
                            block.translation
                          }
                          onChange={
                            (
                              event
                            ) =>
                              handleBlockChange(
                                block.id,
                                "translation",
                                event
                                  .target
                                  .value
                              )
                          }
                          placeholder="Превод овог истог дела..."
                        />
                      </label>
                    </div>
                  </div>
                )
              )}


            <button
              type="button"
              className="secondary-button"
              onClick={
                addComparisonBlock
              }
            >
              + ДОДАЈ СЛЕДЕЋИ БЛОК
            </button>
          </section>


          <label>
            Анализа

            <textarea
              className="article-editor"
              rows="22"
              value={
                form.analysis
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "analysis",
                    event
                      .target
                      .value
                  )
              }
              placeholder="Овде пишеш анализу песме..."
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
                : editingWork
                  ? "Сачувај измене"
                  : "Додај рад"}
            </button>


            {editingWork ||
            recovered ||
            form.title ||
            form.artist ||
            form.analysis ? (
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
                {editingWork
                  ? "Откажи измену"
                  : "Очисти форму"}
              </button>
            ) : null}
          </div>
        </form>
      )}


      <div className="admin-list">
        <h3>
          Сви радови
        </h3>


        {!works.length &&
        !loading ? (
          <p>
            Још нема радова.
          </p>

        ) : (
          works.map(
            (
              work
            ) => (
              <article
                className="admin-list-item"
                key={
                  work.id
                }
              >
                <div className="admin-list-info">
                  {work
                    .image_url ? (
                    <img
                      className="admin-list-thumb"
                      src={
                        work
                          .image_url
                      }
                      alt=""
                    />
                  ) : null}


                  <div>
                    <p className="admin-status">
                      {work.status ===
                      "published"
                        ? "ОБЈАВЉЕН"
                        : "НАЦРТ"}

                      {" · РЕДОСЛЕД "}

                      {work.sort_order}

                      {" · "}

                      {Array.isArray(
                        work
                          .comparison_blocks
                      )
                        ? work
                            .comparison_blocks
                            .length
                        : 0}

                      {" БЛОКОВА"}

                      {work.youtube_url
                        ? " · YOUTUBE"
                        : ""}
                    </p>


                    <h3>
                      {work.title}
                    </h3>

                    <p>
                      {work.artist ||
                        "Без извођача"}
                    </p>
                  </div>
                </div>


                <div className="item-actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(
                        work
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
                        work
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


export default AdminMusicAnalyses;