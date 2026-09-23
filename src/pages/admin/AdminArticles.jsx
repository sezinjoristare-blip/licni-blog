import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../../lib/supabaseClient";

import {
  deleteBlogImage,
  uploadBlogImage,
} from "../../lib/blogImages";

import {
  deleteBlogPdf,
  uploadBlogPdf,
} from "../../lib/blogDocuments";

import {
  deleteObalaBoardMedia,
  uploadObalaBoardMedia,
} from "../../lib/obalaBoardMedia";

import {
  slugify,
} from "../../utils/slugify";

import useAdminDraft
  from "../../admin-safety/useAdminDraft";

import {
  clearAdminDraft,
  loadAdminDraftFiles,
  removeAdminDraftFile,
  saveAdminDraftFile,
} from "../../admin-safety/adminDraftStorage";

import {
  useAdminDraftStatus,
} from "../../admin-safety/AdminDraftContext";

import "../../styles/admin/AdminArticlesRich.css";


const MAX_PDF_BYTES =
  50 * 1024 * 1024;


const RICH_BLOCK_TYPES = [
  {
    value: "text",
    label: "Текст",
  },
  {
    value: "image",
    label: "Фотографија",
  },
  {
    value: "gif",
    label: "GIF",
  },
  {
    value: "video",
    label: "Видео",
  },
  {
    value: "youtube",
    label: "YouTube",
  },
];


function createEmptyForm() {
  return {
    title: "",
    subtitle: "",
    excerpt: "",
    content: "",
    category_id: "",
    status: "draft",
    content_type: "manual",
  };
}


function createClientId(
  prefix = "item"
) {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }


  return `${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}


function createEmptyPart(
  index = 0
) {
  return {
    client_id:
      createClientId(
        "pdf"
      ),

    id:
      null,

    title:
      `Део ${index + 1}`,

    sort_order:
      index,

    file:
      null,

    pdf_url:
      "",

    pdf_path:
      "",

    original_file_name:
      "",

    page_count:
      null,
  };
}


function sortParts(
  parts
) {
  return parts.map(
    (
      part,
      index
    ) => ({
      ...part,

      sort_order:
        index,
    })
  );
}


function normalizeStoredParts(
  article
) {
  const storedParts =
    Array.isArray(
      article?.article_parts
    )
      ? [
          ...article
            .article_parts,
        ]
      : [];


  storedParts.sort(
    (
      first,
      second
    ) =>
      (
        first.sort_order ??
        0
      ) -
      (
        second.sort_order ??
        0
      )
  );


  if (
    storedParts.length
  ) {
    return storedParts.map(
      (
        part,
        index
      ) => ({
        client_id:
          createClientId(
            "pdf"
          ),

        id:
          part.id,

        title:
          part.title ||
          `Део ${index + 1}`,

        sort_order:
          part.sort_order ??
          index,

        file:
          null,

        pdf_url:
          part.pdf_url ||
          "",

        pdf_path:
          part.pdf_path ||
          "",

        original_file_name:
          part
            .original_file_name ||
          "",

        page_count:
          part.page_count ??
          null,
      })
    );
  }


  if (
    article?.pdf_url
  ) {
    return [
      {
        client_id:
          createClientId(
            "pdf"
          ),

        id:
          null,

        title:
          "Део 1",

        sort_order:
          0,

        file:
          null,

        pdf_url:
          article.pdf_url,

        pdf_path:
          article.pdf_path ||
          "",

        original_file_name:
          article
            .original_file_name ||
          "",

        page_count:
          article.page_count ??
          null,
      },
    ];
  }


  return [];
}


function createRichBlock(
  blockType = "text"
) {
  return {
    client_id:
      createClientId(
        "rich"
      ),

    block_type:
      blockType,

    position:
      blockType === "text"
        ? "full"
        : "right",

    text_content:
      "",

    media_url:
      "",

    media_storage_path:
      "",

    caption:
      "",

    sort_order:
      0,

    file:
      null,
  };
}


function normalizeStoredRichBlocks(
  article
) {
  const stored =
    Array.isArray(
      article?.content_blocks
    )
      ? article.content_blocks
      : [];


  if (stored.length) {
    return stored
      .slice()
      .sort(
        (
          first,
          second
        ) =>
          (
            first.sort_order ??
            0
          ) -
          (
            second.sort_order ??
            0
          )
      )
      .map(
        (
          block,
          index
        ) => ({
          client_id:
            createClientId(
              "rich"
            ),

          block_type:
            block.block_type ||
            "text",

          position:
            block.block_type ===
            "text"
              ? "full"
              : block.position ||
                "right",

          text_content:
            block.text_content ||
            "",

          media_url:
            block.media_url ||
            "",

          media_storage_path:
            block.media_storage_path ||
            "",

          caption:
            block.caption ||
            "",

          sort_order:
            index,

          file:
            null,
        })
      );
  }


  if (
    article?.content_type !==
      "pdf" &&
    String(
      article?.content ||
      ""
    ).trim()
  ) {
    return [
      {
        ...createRichBlock(
          "text"
        ),

        text_content:
          article.content,
      },
    ];
  }


  return [
    createRichBlock(
      "text"
    ),
  ];
}


function sortRichBlocks(
  blocks
) {
  return blocks.map(
    (
      block,
      index
    ) => ({
      ...block,

      sort_order:
        index,
    })
  );
}


function stripPartFiles(
  parts
) {
  return sortParts(
    parts
  ).map(
    (part) => ({
      ...part,
      file:
        null,
    })
  );
}


function stripRichFiles(
  blocks
) {
  return sortRichBlocks(
    blocks
  ).map(
    (block) => ({
      ...block,
      file:
        null,
    })
  );
}


function createNewEditorState() {
  return {
    form:
      createEmptyForm(),

    parts:
      [],

    richBlocks: [
      createRichBlock(
        "text"
      ),
    ],
  };
}


function createEditorStateFromArticle(
  article
) {
  return {
    form: {
      title:
        article?.title ??
        "",

      subtitle:
        article?.subtitle ??
        "",

      excerpt:
        article?.excerpt ??
        "",

      content:
        article?.content ??
        "",

      category_id:
        article?.category_id ??
        "",

      status:
        article?.status ??
        "draft",

      content_type:
        article?.content_type ??
        (
          article?.pdf_url
            ? "pdf"
            : "manual"
        ),
    },

    parts:
      normalizeStoredParts(
        article
      ),

    richBlocks:
      normalizeStoredRichBlocks(
        article
      ),
  };
}


function toDraftData({
  form,
  parts,
  richBlocks,
}) {
  return {
    form: {
      ...form,
    },

    parts:
      stripPartFiles(
        parts
      ),

    richBlocks:
      stripRichFiles(
        richBlocks
      ),
  };
}


function normalizeRecoveredState(
  saved
) {
  const fallback =
    createNewEditorState();


  if (
    !saved ||
    typeof saved !==
      "object"
  ) {
    return fallback;
  }


  const nextForm = {
    ...fallback.form,
    ...(saved.form || {}),
  };


  const nextParts =
    Array.isArray(
      saved.parts
    )
      ? saved.parts.map(
          (
            part,
            index
          ) => ({
            ...createEmptyPart(
              index
            ),

            ...part,

            file:
              null,

            client_id:
              part.client_id ||
              createClientId(
                "pdf"
              ),
          })
        )
      : [];


  const nextRichBlocks =
    Array.isArray(
      saved.richBlocks
    ) &&
    saved.richBlocks.length
      ? saved.richBlocks.map(
          (
            block,
            index
          ) => ({
            ...createRichBlock(
              block.block_type ||
              "text"
            ),

            ...block,

            file:
              null,

            sort_order:
              index,

            client_id:
              block.client_id ||
              createClientId(
                "rich"
              ),
          })
        )
      : [
          createRichBlock(
            "text"
          ),
        ];


  return {
    form:
      nextForm,

    parts:
      sortParts(
        nextParts
      ),

    richBlocks:
      sortRichBlocks(
        nextRichBlocks
      ),
  };
}


function formatRecoveryTime(
  value
) {
  if (!value) {
    return "";
  }


  try {
    return new Date(
      value
    ).toLocaleTimeString(
      "sr-RS",
      {
        hour:
          "2-digit",

        minute:
          "2-digit",
      }
    );

  } catch {
    return "";
  }
}


function AdminArticles({
  characterKey:
    characterKeyProp =
      "covek-1",
}) {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const params =
    useParams();

  const {
    reportStatus,
  } =
    useAdminDraftStatus();


  const characterKey =
    params.characterKey ||
    characterKeyProp ||
    "covek-1";


  const articleId =
    params.articleId ||
    null;


  const isNewRoute =
    location.pathname.endsWith(
      "/novi"
    );


  const isEditorRoute =
    isNewRoute ||
    Boolean(
      articleId
    );


  const isCharacterBranch =
    Boolean(
      params.characterKey
    );


  const basePath =
    isCharacterBranch
      ? `/admin/likovi/${characterKey}/tekstovi`
      : "/admin/tekstovi";


  const draftKey =
    !isEditorRoute
      ? ""
      : isNewRoute
        ? `articles:${characterKey}:new`
        : `articles:${characterKey}:${articleId}`;


  const [
    articles,
    setArticles,
  ] = useState([]);

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
    editingArticle,
    setEditingArticle,
  ] = useState(null);

  const [
    coverFile,
    setCoverFile,
  ] = useState(null);

  const [
    parts,
    setParts,
  ] = useState([]);

  const [
    richBlocks,
    setRichBlocks,
  ] = useState([
    createRichBlock(
      "text"
    ),
  ]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    editorReadyKey,
    setEditorReadyKey,
  ] = useState("");


  const orderedParts =
    useMemo(
      () =>
        sortParts(
          parts
        ),
      [
        parts,
      ]
    );


  const draftData =
    useMemo(
      () =>
        toDraftData({
          form,
          parts,
          richBlocks,
        }),
      [
        form,
        parts,
        richBlocks,
      ]
    );


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
      draftData,

    onRestore:
      (
        savedDraft
      ) => {
        const restored =
          normalizeRecoveredState(
            savedDraft
          );


        setForm(
          restored.form
        );

        setParts(
          restored.parts
        );

        setRichBlocks(
          restored.richBlocks
        );
      },

    ready:
      editorReady,

    enabled:
      isEditorRoute,

    scope:
      "Текстови",
  });


  async function fetchData() {
    const [
      categoriesResult,
      articlesResult,
    ] = await Promise.all([
      supabase
        .from(
          "categories"
        )
        .select(`
          id,
          name,
          slug,
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
        ),

      supabase
        .from(
          "articles"
        )
        .select(`
          *,
          categories (
            id,
            name,
            slug
          ),
          article_parts (
            id,
            title,
            sort_order,
            pdf_url,
            pdf_path,
            original_file_name,
            page_count,
            created_at
          )
        `)
        .eq(
          "character_key",
          characterKey
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
      categoriesResult.error
    ) {
      throw categoriesResult.error;
    }


    if (
      articlesResult.error
    ) {
      throw articlesResult.error;
    }


    return {
      categories:
        categoriesResult.data ??
        [],

      articles:
        articlesResult.data ??
        [],
    };
  }


  async function loadData() {
    setLoading(
      true
    );

    setErrorMessage(
      ""
    );


    try {
      const data =
        await fetchData();


      setCategories(
        data.categories
      );

      setArticles(
        data.articles
      );


      return data;

    } catch (
      error
    ) {
      console.error(
        "Učitavanje tekstova:",
        error
      );


      setErrorMessage(
        error?.message ||
        "Подаци нису могли да се учитају."
      );


      return {
        categories:
          [],

        articles:
          [],
      };

    } finally {
      setLoading(
        false
      );
    }
  }


  useEffect(() => {
    setEditorReadyKey(
      ""
    );

    setSuccessMessage(
      ""
    );

    loadData();
  }, [
    characterKey,
  ]);


  function applyEditorState(
    state
  ) {
    setForm(
      state.form
    );

    setParts(
      state.parts
    );

    setRichBlocks(
      state.richBlocks
    );

    setCoverFile(
      null
    );
  }


  useEffect(() => {
    if (
      !isEditorRoute ||
      loading ||
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


    if (isNewRoute) {
      setEditingArticle(
        null
      );

      applyEditorState(
        createNewEditorState()
      );

      setEditorReadyKey(
        draftKey
      );

      return;
    }


    const article =
      articles.find(
        (item) =>
          String(
            item.id
          ) ===
          String(
            articleId
          )
      );


    if (!article) {
      setEditingArticle(
        null
      );

      setErrorMessage(
        "Тражени рад не постоји или не припада овом лику."
      );

      return;
    }


    setEditingArticle(
      article
    );

    applyEditorState(
      createEditorStateFromArticle(
        article
      )
    );

    setEditorReadyKey(
      draftKey
    );
  }, [
    isEditorRoute,
    isNewRoute,
    articleId,
    articles,
    loading,
    draftKey,
    editorReadyKey,
  ]);


  useEffect(() => {
    if (
      !editorReady ||
      !draftKey
    ) {
      return undefined;
    }


    let active =
      true;


    const timer =
      window.setTimeout(
        async () => {
          try {
            const storedFiles =
              await loadAdminDraftFiles(
                draftKey
              );


            if (!active) {
              return;
            }


            if (
              storedFiles.cover
            ) {
              setCoverFile(
                storedFiles.cover
              );
            }


            setParts(
              (current) =>
                current.map(
                  (part) => {
                    const file =
                      storedFiles[
                        `part:${part.client_id}`
                      ];


                    if (!file) {
                      return part;
                    }


                    return {
                      ...part,

                      file,

                      original_file_name:
                        file.name ||
                        part.original_file_name,
                    };
                  }
                )
            );


            setRichBlocks(
              (current) =>
                current.map(
                  (block) => {
                    const file =
                      storedFiles[
                        `rich:${block.client_id}`
                      ];


                    return file
                      ? {
                          ...block,
                          file,
                        }
                      : block;
                  }
                )
            );

          } catch (
            error
          ) {
            console.error(
              "Vraćanje lokalnih fajlova teksta:",
              error
            );


            reportStatus(
              "attention",
              {
                scope:
                  "Текстови",

                message:
                  "Текст је враћен, али један или више локалних фајлова није могло да се врати.",
              }
            );
          }
        },
        0
      );


    return () => {
      active =
        false;

      window.clearTimeout(
        timer
      );
    };
  }, [
    editorReady,
    draftKey,
    reportStatus,
  ]);


  async function persistDraftFile(
    fieldKey,
    file
  ) {
    if (
      !draftKey ||
      !editorReady
    ) {
      return;
    }


    try {
      if (file) {
        await saveAdminDraftFile(
          draftKey,
          fieldKey,
          file
        );


        reportStatus(
          "local",
          {
            scope:
              "Текстови",

            message:
              `Фајл „${file.name}“ је обезбеђен локално.`,
          }
        );

      } else {
        await removeAdminDraftFile(
          draftKey,
          fieldKey
        );
      }

    } catch (
      error
    ) {
      console.error(
        "Lokalno čuvanje fajla teksta:",
        error
      );


      reportStatus(
        "attention",
        {
          scope:
            "Текстови",

          message:
            "Текст је локално сачуван, али изабрани фајл није могао безбедно да се сачува.",
        }
      );
    }
  }


  function changeFormField(
    field,
    value
  ) {
    setForm(
      (current) => ({
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


  function changeContentType(
    type
  ) {
    changeFormField(
      "content_type",
      type
    );


    if (
      type === "pdf" &&
      parts.length === 0
    ) {
      setParts([
        createEmptyPart(0),
      ]);
    }


    if (
      type === "manual" &&
      richBlocks.length === 0
    ) {
      setRichBlocks([
        createRichBlock(
          "text"
        ),
      ]);
    }
  }


  async function handleCoverFile(
    file
  ) {
    setCoverFile(
      file
    );


    await persistDraftFile(
      "cover",
      file
    );
  }


  function addRichBlock(
    blockType
  ) {
    setRichBlocks(
      (current) => [
        ...current,

        {
          ...createRichBlock(
            blockType
          ),

          sort_order:
            current.length,
        },
      ]
    );
  }


  function updateRichBlock(
    clientId,
    changes
  ) {
    setRichBlocks(
      (current) =>
        current.map(
          (block) =>
            block.client_id ===
            clientId
              ? {
                  ...block,
                  ...changes,
                }
              : block
        )
    );


    setSuccessMessage(
      ""
    );
  }


  async function handleRichBlockFile(
    clientId,
    file
  ) {
    updateRichBlock(
      clientId,
      {
        file,
      }
    );


    await persistDraftFile(
      `rich:${clientId}`,
      file
    );
  }


  async function removeRichBlock(
    clientId
  ) {
    setRichBlocks(
      (current) =>
        sortRichBlocks(
          current.filter(
            (block) =>
              block.client_id !==
              clientId
          )
        )
    );


    if (draftKey) {
      await removeAdminDraftFile(
        draftKey,
        `rich:${clientId}`
      ).catch(
        () => {}
      );
    }
  }


  function moveRichBlock(
    index,
    direction
  ) {
    setRichBlocks(
      (current) => {
        const next = [
          ...current,
        ];

        const nextIndex =
          index +
          direction;


        if (
          nextIndex < 0 ||
          nextIndex >=
            next.length
        ) {
          return current;
        }


        const [
          moved,
        ] = next.splice(
          index,
          1
        );


        next.splice(
          nextIndex,
          0,
          moved
        );


        return sortRichBlocks(
          next
        );
      }
    );
  }


  async function resolveRichBlocks(
    uploadedPaths
  ) {
    const resolved =
      [];


    for (
      const sourceBlock
      of sortRichBlocks(
        richBlocks
      )
    ) {
      if (
        sourceBlock.block_type ===
        "text"
      ) {
        const textContent =
          String(
            sourceBlock.text_content ||
            ""
          ).trim();


        if (!textContent) {
          continue;
        }


        resolved.push({
          block_type:
            "text",

          position:
            "full",

          text_content:
            textContent,

          media_url:
            null,

          media_storage_path:
            null,

          caption:
            null,

          sort_order:
            resolved.length,
        });

        continue;
      }


      let mediaUrl =
        String(
          sourceBlock.media_url ||
          ""
        ).trim();

      let mediaStoragePath =
        sourceBlock.media_storage_path ||
        null;


      if (sourceBlock.file) {
        const uploaded =
          await uploadObalaBoardMedia(
            sourceBlock.file,
            "content"
          );


        if (
          sourceBlock.block_type ===
            "image" &&
          uploaded.mediaType !==
            "image"
        ) {
          await deleteObalaBoardMedia(
            uploaded.path
          );

          throw new Error(
            "За блок Фотографија изабери слику."
          );
        }


        if (
          sourceBlock.block_type ===
            "gif" &&
          uploaded.mediaType !==
            "gif"
        ) {
          await deleteObalaBoardMedia(
            uploaded.path
          );

          throw new Error(
            "За GIF блок изабери .gif фајл."
          );
        }


        if (
          sourceBlock.block_type ===
            "video" &&
          uploaded.mediaType !==
            "video"
        ) {
          await deleteObalaBoardMedia(
            uploaded.path
          );

          throw new Error(
            "За Видео блок изабери видео фајл."
          );
        }


        mediaUrl =
          uploaded.url;

        mediaStoragePath =
          uploaded.path;

        uploadedPaths.push(
          uploaded.path
        );
      }


      if (!mediaUrl) {
        continue;
      }


      resolved.push({
        block_type:
          sourceBlock.block_type,

        position:
          sourceBlock.position ||
          "right",

        text_content:
          null,

        media_url:
          mediaUrl,

        media_storage_path:
          mediaStoragePath,

        caption:
          String(
            sourceBlock.caption ||
            ""
          ).trim() ||
          null,

        sort_order:
          resolved.length,
      });
    }


    return resolved;
  }


  function addPart() {
    setParts(
      (current) => [
        ...current,

        createEmptyPart(
          current.length
        ),
      ]
    );
  }


  function updatePart(
    clientId,
    changes
  ) {
    setParts(
      (current) =>
        current.map(
          (part) =>
            part.client_id ===
            clientId
              ? {
                  ...part,
                  ...changes,
                }
              : part
        )
    );


    setSuccessMessage(
      ""
    );
  }


  async function handlePartFile(
    clientId,
    file
  ) {
    if (
      file &&
      file.size >
        MAX_PDF_BYTES
    ) {
      setErrorMessage(
        `PDF „${file.name}“ је већи од 50 MB. Подели га на још један део.`
      );

      return;
    }


    setErrorMessage(
      ""
    );


    updatePart(
      clientId,
      {
        file:
          file ||
          null,

        original_file_name:
          file?.name ||
          "",
      }
    );


    await persistDraftFile(
      `part:${clientId}`,
      file
    );
  }


  async function removePart(
    clientId
  ) {
    setParts(
      (current) =>
        sortParts(
          current.filter(
            (part) =>
              part.client_id !==
              clientId
          )
        )
    );


    if (draftKey) {
      await removeAdminDraftFile(
        draftKey,
        `part:${clientId}`
      ).catch(
        () => {}
      );
    }
  }


  function movePart(
    index,
    direction
  ) {
    setParts(
      (current) => {
        const next = [
          ...current,
        ];

        const nextIndex =
          index +
          direction;


        if (
          nextIndex < 0 ||
          nextIndex >=
            next.length
        ) {
          return current;
        }


        const [
          movedPart,
        ] = next.splice(
          index,
          1
        );


        next.splice(
          nextIndex,
          0,
          movedPart
        );


        return sortParts(
          next
        );
      }
    );
  }


  async function deleteUniquePdfPaths(
    paths
  ) {
    const uniquePaths = [
      ...new Set(
        paths.filter(
          Boolean
        )
      ),
    ];


    for (
      const path
      of uniquePaths
    ) {
      await deleteBlogPdf(
        path
      ).catch(
        () => {}
      );
    }
  }


  async function fetchArticleById(
    id
  ) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "articles"
      )
      .select(`
        *,
        categories (
          id,
          name,
          slug
        ),
        article_parts (
          id,
          title,
          sort_order,
          pdf_url,
          pdf_path,
          original_file_name,
          page_count,
          created_at
        )
      `)
      .eq(
        "id",
        id
      )
      .eq(
        "character_key",
        characterKey
      )
      .maybeSingle();


    if (error) {
      throw error;
    }


    return data;
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    if (
      saving ||
      !isEditorRoute
    ) {
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


    let uploadedCover =
      null;

    const newlyUploadedPaths =
      [];

    const newlyUploadedMediaPaths =
      [];

    let newArticleId =
      null;

    let articleWasSaved =
      false;


    try {
      const cleanTitle =
        form.title.trim();

      const isManual =
        form.content_type ===
        "manual";


      if (!cleanTitle) {
        throw new Error(
          "Упиши наслов рада."
        );
      }


      if (
        isManual &&
        !richBlocks.some(
          (block) =>
            block.block_type ===
              "text"
              ? Boolean(
                  String(
                    block.text_content ||
                    ""
                  ).trim()
                )
              : Boolean(
                  block.file ||
                  String(
                    block.media_url ||
                    ""
                  ).trim()
                )
        )
      ) {
        throw new Error(
          "Додај макар један садржајни блок."
        );
      }


      const cleanParts =
        sortParts(
          parts
        );


      if (
        !isManual &&
        cleanParts.length ===
          0
      ) {
        throw new Error(
          "Додај макар један PDF део."
        );
      }


      if (
        !isManual &&
        cleanParts.some(
          (part) =>
            !part.file &&
            !part.pdf_url
        )
      ) {
        throw new Error(
          "Сваки део мора имати PDF документ."
        );
      }


      if (coverFile) {
        uploadedCover =
          await uploadBlogImage(
            coverFile,
            "articles"
          );
      }


      const resolvedRichBlocks =
        isManual
          ? await resolveRichBlocks(
              newlyUploadedMediaPaths
            )
          : [];


      if (
        isManual &&
        resolvedRichBlocks.length ===
          0
      ) {
        throw new Error(
          "Додај макар један садржајни блок."
        );
      }


      const manualTextFallback =
        resolvedRichBlocks
          .filter(
            (block) =>
              block.block_type ===
              "text"
          )
          .map(
            (block) =>
              block.text_content
          )
          .filter(Boolean)
          .join("\n\n");


      const resolvedParts =
        [];


      if (!isManual) {
        for (
          let index = 0;
          index <
          cleanParts.length;
          index += 1
        ) {
          const part =
            cleanParts[
              index
            ];


          let nextPart = {
            ...part,

            title:
              part.title
                .trim() ||
              `Део ${index + 1}`,

            sort_order:
              index,
          };


          if (part.file) {
            const uploaded =
              await uploadBlogPdf(
                part.file
              );


            newlyUploadedPaths.push(
              uploaded.path
            );


            nextPart = {
              ...nextPart,

              pdf_url:
                uploaded.url,

              pdf_path:
                uploaded.path,

              original_file_name:
                uploaded
                  .originalFileName ||
                part.file.name,

              page_count:
                null,
            };
          }


          resolvedParts.push(
            nextPart
          );
        }
      }


      const firstPart =
        resolvedParts[0] ||
        null;

      const isPublished =
        form.status ===
        "published";


      const payload = {
        title:
          cleanTitle,

        slug:
          slugify(
            cleanTitle
          ),

        subtitle:
          form.subtitle.trim(),

        excerpt:
          form.excerpt.trim(),

        category_id:
          form.category_id ||
          null,

        character_key:
          characterKey,

        status:
          form.status,

        content_type:
          form.content_type,

        content:
          isManual
            ? manualTextFallback
            : "",

        content_blocks:
          isManual
            ? resolvedRichBlocks
            : [],

        pdf_url:
          isManual
            ? null
            : firstPart
                ?.pdf_url ||
              null,

        pdf_path:
          isManual
            ? null
            : firstPart
                ?.pdf_path ||
              null,

        original_file_name:
          isManual
            ? null
            : firstPart
                ?.original_file_name ||
              null,

        page_count:
          isManual
            ? null
            : firstPart
                ?.page_count ??
              null,

        cover_image_url:
          uploadedCover?.url ??
          editingArticle
            ?.cover_image_url ??
          null,

        cover_image_path:
          uploadedCover?.path ??
          editingArticle
            ?.cover_image_path ??
          null,

        published_at:
          isPublished
            ? (
                editingArticle
                  ?.published_at ||
                new Date()
                  .toISOString()
              )
            : null,
      };


      const savedArticleResult =
        editingArticle
          ? await supabase
              .from(
                "articles"
              )
              .update(
                payload
              )
              .eq(
                "id",
                editingArticle.id
              )
              .select(
                "id"
              )
              .single()

          : await supabase
              .from(
                "articles"
              )
              .insert(
                payload
              )
              .select(
                "id"
              )
              .single();


      if (
        savedArticleResult.error
      ) {
        throw savedArticleResult.error;
      }


      articleWasSaved =
        true;


      const savedArticleId =
        savedArticleResult
          .data.id;


      if (!editingArticle) {
        newArticleId =
          savedArticleId;
      }


      const previousParts =
        Array.isArray(
          editingArticle
            ?.article_parts
        )
          ? editingArticle
              .article_parts
          : [];

      const previousRichMediaPaths =
        Array.isArray(
          editingArticle
            ?.content_blocks
        )
          ? editingArticle
              .content_blocks
              .map(
                (block) =>
                  block
                    ?.media_storage_path
              )
              .filter(Boolean)
          : [];

      const pathsToDelete =
        [];


      if (isManual) {
        const {
          error:
            deletePartsError,
        } = await supabase
          .from(
            "article_parts"
          )
          .delete()
          .eq(
            "article_id",
            savedArticleId
          );


        if (
          deletePartsError
        ) {
          throw deletePartsError;
        }


        previousParts.forEach(
          (part) => {
            if (
              part.pdf_path
            ) {
              pathsToDelete.push(
                part.pdf_path
              );
            }
          }
        );


        if (
          editingArticle
            ?.pdf_path
        ) {
          pathsToDelete.push(
            editingArticle
              .pdf_path
          );
        }

      } else {
        const retainedIds =
          new Set(
            resolvedParts
              .map(
                (part) =>
                  part.id
              )
              .filter(Boolean)
          );


        const removedParts =
          previousParts.filter(
            (part) =>
              !retainedIds.has(
                part.id
              )
          );


        for (
          const removedPart
          of removedParts
        ) {
          const {
            error:
              removeError,
          } = await supabase
            .from(
              "article_parts"
            )
            .delete()
            .eq(
              "id",
              removedPart.id
            );


          if (removeError) {
            throw removeError;
          }


          if (
            removedPart.pdf_path
          ) {
            pathsToDelete.push(
              removedPart.pdf_path
            );
          }
        }


        for (
          const part
          of resolvedParts
        ) {
          const partPayload = {
            article_id:
              savedArticleId,

            title:
              part.title,

            sort_order:
              part.sort_order,

            pdf_url:
              part.pdf_url,

            pdf_path:
              part.pdf_path ||
              null,

            original_file_name:
              part
                .original_file_name ||
              null,

            page_count:
              part.page_count ??
              null,

            updated_at:
              new Date()
                .toISOString(),
          };


          if (part.id) {
            const oldPart =
              previousParts.find(
                (
                  storedPart
                ) =>
                  storedPart.id ===
                  part.id
              );


            const {
              error:
                updatePartError,
            } = await supabase
              .from(
                "article_parts"
              )
              .update(
                partPayload
              )
              .eq(
                "id",
                part.id
              );


            if (
              updatePartError
            ) {
              throw updatePartError;
            }


            if (
              part.file &&
              oldPart?.pdf_path &&
              oldPart.pdf_path !==
                part.pdf_path
            ) {
              pathsToDelete.push(
                oldPart.pdf_path
              );
            }

          } else {
            const {
              error:
                insertPartError,
            } = await supabase
              .from(
                "article_parts"
              )
              .insert(
                partPayload
              );


            if (
              insertPartError
            ) {
              throw insertPartError;
            }
          }
        }
      }


      const activePdfPaths =
        new Set(
          resolvedParts
            .map(
              (part) =>
                part.pdf_path
            )
            .filter(Boolean)
        );


      if (
        editingArticle
          ?.pdf_path &&
        !activePdfPaths.has(
          editingArticle
            .pdf_path
        )
      ) {
        pathsToDelete.push(
          editingArticle
            .pdf_path
        );
      }


      const activeRichMediaPaths =
        new Set(
          resolvedRichBlocks
            .map(
              (block) =>
                block
                  .media_storage_path
            )
            .filter(Boolean)
        );


      if (
        uploadedCover &&
        editingArticle
          ?.cover_image_path &&
        editingArticle
          .cover_image_path !==
        uploadedCover.path
      ) {
        await deleteBlogImage(
          editingArticle
            .cover_image_path
        ).catch(
          () => {}
        );
      }


      await deleteUniquePdfPaths(
        pathsToDelete.filter(
          (path) =>
            !activePdfPaths.has(
              path
            )
        )
      );


      for (
        const oldPath
        of previousRichMediaPaths
      ) {
        if (
          !activeRichMediaPaths.has(
            oldPath
          )
        ) {
          await deleteObalaBoardMedia(
            oldPath
          ).catch(
            () => {}
          );
        }
      }


      const refreshedArticle =
        await fetchArticleById(
          savedArticleId
        );


      if (!refreshedArticle) {
        throw new Error(
          "Рад је сачуван, али није могао поново да се учита."
        );
      }


      const refreshedState =
        createEditorStateFromArticle(
          refreshedArticle
        );


      await markCommitted(
        toDraftData(
          refreshedState
        ),
        {
          clearFiles:
            true,

          message:
            isPublished
              ? "Рад је објављен и сачуван."
              : "Нацрт је сачуван.",
        }
      );


      setCoverFile(
        null
      );

      setEditingArticle(
        refreshedArticle
      );

      applyEditorState(
        refreshedState
      );


      const freshData =
        await fetchData();

      setCategories(
        freshData.categories
      );

      setArticles(
        freshData.articles
      );


      setSuccessMessage(
        isPublished
          ? "Рад је успешно објављен."
          : "Нацрт је успешно сачуван."
      );


      if (isNewRoute) {
        setEditorReadyKey(
          ""
        );


        navigate(
          `${basePath}/${savedArticleId}`,
          {
            replace:
              true,
          }
        );
      }

    } catch (
      error
    ) {
      console.error(
        "Čuvanje rada:",
        error
      );


      if (
        !articleWasSaved
      ) {
        if (
          uploadedCover?.path
        ) {
          await deleteBlogImage(
            uploadedCover.path
          ).catch(
            () => {}
          );
        }


        await deleteUniquePdfPaths(
          newlyUploadedPaths
        );


        for (
          const path
          of newlyUploadedMediaPaths
        ) {
          await deleteObalaBoardMedia(
            path
          ).catch(
            () => {}
          );
        }
      }


      if (
        newArticleId &&
        articleWasSaved
      ) {
        await supabase
          .from(
            "articles"
          )
          .delete()
          .eq(
            "id",
            newArticleId
          );


        if (
          uploadedCover?.path
        ) {
          await deleteBlogImage(
            uploadedCover.path
          ).catch(
            () => {}
          );
        }


        await deleteUniquePdfPaths(
          newlyUploadedPaths
        );


        for (
          const path
          of newlyUploadedMediaPaths
        ) {
          await deleteObalaBoardMedia(
            path
          ).catch(
            () => {}
          );
        }
      }


      forceLocalSave();


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


  async function handleCancelEditor() {
    const baseline =
      editingArticle
        ? createEditorStateFromArticle(
            editingArticle
          )
        : createNewEditorState();


    await discardDraft(
      toDraftData(
        baseline
      ),
      {
        clearFiles:
          true,
      }
    );


    navigate(
      basePath
    );
  }


  async function handleDelete(
    article
  ) {
    if (deleting) {
      return;
    }


    const confirmed =
      window.confirm(
        `Трајно обрисати рад „${article.title}“?`
      );


    if (!confirmed) {
      return;
    }


    setDeleting(
      true
    );

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );


    try {
      const childPaths =
        Array.isArray(
          article.article_parts
        )
          ? article
              .article_parts
              .map(
                (part) =>
                  part.pdf_path
              )
              .filter(Boolean)
          : [];

      const richMediaPaths =
        Array.isArray(
          article.content_blocks
        )
          ? article.content_blocks
              .map(
                (block) =>
                  block
                    ?.media_storage_path
              )
              .filter(Boolean)
          : [];


      const {
        error,
      } = await supabase
        .from(
          "articles"
        )
        .delete()
        .eq(
          "id",
          article.id
        );


      if (error) {
        throw error;
      }


      if (
        article.cover_image_path
      ) {
        await deleteBlogImage(
          article.cover_image_path
        ).catch(
          () => {}
        );
      }


      await deleteUniquePdfPaths([
        article.pdf_path,
        ...childPaths,
      ]);


      for (
        const path
        of richMediaPaths
      ) {
        await deleteObalaBoardMedia(
          path
        ).catch(
          () => {}
        );
      }


      await clearAdminDraft(
        `articles:${characterKey}:${article.id}`
      ).catch(
        () => {}
      );


      if (
        String(
          article.id
        ) ===
        String(
          articleId
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


      const freshData =
        await fetchData();

      setCategories(
        freshData.categories
      );

      setArticles(
        freshData.articles
      );


      setSuccessMessage(
        "Рад је обрисан."
      );

    } catch (
      error
    ) {
      console.error(
        "Brisanje rada:",
        error
      );


      setErrorMessage(
        error?.message ||
        "Брисање није успело."
      );

    } finally {
      setDeleting(
        false
      );
    }
  }


  function openEditor(
    article
  ) {
    navigate(
      `${basePath}/${article.id}`
    );
  }


  function renderList() {
    return (
      <>
        {!isCharacterBranch ? (
          <div className="admin-page-heading">
            <p className="eyebrow">
              АУТОРСКИ СТО
            </p>

            <h1>
              Текстови
            </h1>

            <p>
              Пиши, чувај нацрте,
              састављај rich садржај
              или додај PDF радове.
            </p>
          </div>
        ) : null}


        <div className="form-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate(
                `${basePath}/novi`
              )
            }
          >
            + НОВИ РАД
          </button>
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


        <div className="admin-list">
          <h2>
            Сви радови
          </h2>


          {loading ? (
            <p>
              Учитавање...
            </p>

          ) : !articles.length ? (
            <p>
              Још нема ниједног рада.
            </p>

          ) : (
            articles.map(
              (article) => {
                const partCount =
                  Array.isArray(
                    article.article_parts
                  ) &&
                  article.article_parts.length
                    ? article.article_parts.length
                    : article.pdf_url
                      ? 1
                      : 0;


                return (
                  <article
                    className="admin-list-item"
                    key={
                      article.id
                    }
                  >
                    <div className="admin-list-info">
                      {article.cover_image_url ? (
                        <img
                          className="admin-list-thumb"
                          src={
                            article.cover_image_url
                          }
                          alt=""
                        />
                      ) : null}


                      <div>
                        <p className="admin-status">
                          {article.status ===
                          "published"
                            ? "ОБЈАВЉЕН"
                            : "НАЦРТ"}

                          {" · "}

                          {article.content_type ===
                          "pdf"
                            ? `PDF · ${partCount} ${
                                partCount ===
                                1
                                  ? "ДЕО"
                                  : "ДЕЛОВА"
                              }`
                            : "ТЕКСТ"}
                        </p>


                        <h3>
                          {article.title}
                        </h3>


                        <p>
                          {article.categories
                            ?.name ||
                            "Без категорије"}
                        </p>
                      </div>
                    </div>


                    <div className="item-actions">
                      <button
                        type="button"
                        onClick={() =>
                          openEditor(
                            article
                          )
                        }
                      >
                        Измени
                      </button>


                      <button
                        type="button"
                        className="danger-button"
                        disabled={
                          deleting
                        }
                        onClick={() =>
                          handleDelete(
                            article
                          )
                        }
                      >
                        Обриши
                      </button>
                    </div>
                  </article>
                );
              }
            )
          )}
        </div>
      </>
    );
  }


  function renderEditor() {
    if (
      !loading &&
      articleId &&
      !editingArticle &&
      editorReadyKey !==
        draftKey
    ) {
      return (
        <section>
          <p className="error-message">
            {errorMessage ||
              "Тражени рад не постоји."}
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(
                basePath
              )
            }
          >
            ← Назад на текстове
          </button>
        </section>
      );
    }


    if (
      loading ||
      !editorReady
    ) {
      return (
        <p>
          Учитавање едитора...
        </p>
      );
    }


    const recoveryTime =
      formatRecoveryTime(
        recoveredAt
      );


    return (
      <section>
        {!isCharacterBranch ? (
          <div className="admin-page-heading">
            <p className="eyebrow">
              АУТОРСКИ СТО
            </p>

            <h1>
              {editingArticle
                ? "Измена рада"
                : "Нови рад"}
            </h1>

            <p>
              Унос се локално чува
              док радиш. Јавна верзија
              се мења тек када кликнеш
              на дугме за чување.
            </p>
          </div>
        ) : null}


        <form
          className="admin-form article-form"
          onSubmit={
            handleSubmit
          }
        >
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate(
                  basePath
                )
              }
            >
              ← Назад на текстове
            </button>


            {editingArticle ? (
              <button
                type="button"
                className="danger-button"
                disabled={
                  deleting ||
                  saving
                }
                onClick={() =>
                  handleDelete(
                    editingArticle
                  )
                }
              >
                Обриши рад
              </button>
            ) : null}
          </div>


          <h2>
            {editingArticle
              ? "Измени рад"
              : "Нови рад"}
          </h2>


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
            Наслов

            <input
              type="text"
              value={
                form.title
              }
              onChange={
                (event) =>
                  changeFormField(
                    "title",
                    event.target.value
                  )
              }
              required
            />
          </label>


          <label>
            Поднаслов

            <input
              type="text"
              value={
                form.subtitle
              }
              onChange={
                (event) =>
                  changeFormField(
                    "subtitle",
                    event.target.value
                  )
              }
            />
          </label>


          <label>
            Категорија

            <select
              value={
                form.category_id
              }
              onChange={
                (event) =>
                  changeFormField(
                    "category_id",
                    event.target.value
                  )
              }
            >
              <option value="">
                Без категорије
              </option>


              {categories.map(
                (category) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>
          </label>


          <div className="admin-image-field">
            <strong>
              Насловна фотографија
            </strong>


            {editingArticle
              ?.cover_image_url &&
            !coverFile ? (
              <img
                className="admin-image-preview"
                src={
                  editingArticle
                    .cover_image_url
                }
                alt=""
              />
            ) : null}


            <input
              type="file"
              accept="image/*"
              onChange={
                (event) =>
                  handleCoverFile(
                    event.target
                      .files?.[0] ??
                    null
                  )
              }
            />


            {coverFile ? (
              <p>
                Локално обезбеђена фотографија:
                {" "}

                <strong>
                  {coverFile.name}
                </strong>
              </p>
            ) : null}
          </div>


          <label>
            Кратак опис

            <textarea
              rows="3"
              value={
                form.excerpt
              }
              onChange={
                (event) =>
                  changeFormField(
                    "excerpt",
                    event.target.value
                  )
              }
            />
          </label>


          <div className="content-type-panel">
            <p className="content-type-title">
              Садржај рада
            </p>


            <div className="content-type-options">
              <label className="content-type-option">
                <input
                  type="radio"
                  name="content-type"
                  checked={
                    form.content_type ===
                    "manual"
                  }
                  onChange={() =>
                    changeContentType(
                      "manual"
                    )
                  }
                />

                <span>
                  Пишем текст овде
                </span>
              </label>


              <label className="content-type-option">
                <input
                  type="radio"
                  name="content-type"
                  checked={
                    form.content_type ===
                    "pdf"
                  }
                  onChange={() =>
                    changeContentType(
                      "pdf"
                    )
                  }
                />

                <span>
                  Додајем PDF
                </span>
              </label>
            </div>
          </div>


          {form.content_type ===
          "manual" ? (
            <section className="admin-article-rich">
              <div className="admin-article-rich__heading">
                <div>
                  <strong>
                    Reader — блокови
                  </strong>

                  <p>
                    Текст, фотографија,
                    GIF, видео и YouTube
                    могу да се слажу редом.
                    Сваки унос и изабрани
                    локални фајл чувају се
                    док радиш.
                  </p>
                </div>


                <div className="admin-article-rich__add">
                  {RICH_BLOCK_TYPES.map(
                    (blockType) => (
                      <button
                        key={
                          blockType.value
                        }
                        type="button"
                        onClick={() =>
                          addRichBlock(
                            blockType.value
                          )
                        }
                      >
                        + {blockType.label}
                      </button>
                    )
                  )}
                </div>
              </div>


              <div className="admin-article-rich__blocks">
                {richBlocks.map(
                  (
                    block,
                    index
                  ) => (
                    <article
                      key={
                        block.client_id
                      }
                      className="admin-article-rich__block"
                    >
                      <header className="admin-article-rich__block-head">
                        <strong>
                          {RICH_BLOCK_TYPES
                            .find(
                              (type) =>
                                type.value ===
                                block.block_type
                            )
                            ?.label ||
                            block.block_type}
                        </strong>


                        <div>
                          <button
                            type="button"
                            disabled={
                              index === 0
                            }
                            onClick={() =>
                              moveRichBlock(
                                index,
                                -1
                              )
                            }
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            disabled={
                              index ===
                              richBlocks.length -
                                1
                            }
                            onClick={() =>
                              moveRichBlock(
                                index,
                                1
                              )
                            }
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            className="danger-button"
                            onClick={() =>
                              removeRichBlock(
                                block.client_id
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      </header>


                      {block.block_type ===
                      "text" ? (
                        <label>
                          Текст

                          <textarea
                            rows="10"
                            value={
                              block.text_content
                            }
                            onChange={
                              (event) =>
                                updateRichBlock(
                                  block.client_id,
                                  {
                                    text_content:
                                      event.target.value,
                                  }
                                )
                            }
                            placeholder="Пиши или налепи текст..."
                          />
                        </label>
                      ) : (
                        <>
                          <div className="admin-article-rich__grid">
                            <label>
                              Позиција

                              <select
                                value={
                                  block.position
                                }
                                onChange={
                                  (event) =>
                                    updateRichBlock(
                                      block.client_id,
                                      {
                                        position:
                                          event.target.value,
                                      }
                                    )
                                }
                              >
                                <option value="left">
                                  Лево
                                </option>

                                <option value="right">
                                  Десно
                                </option>

                                <option value="full">
                                  Преко ширине
                                </option>
                              </select>
                            </label>


                            <label>
                              Потпис — опционо

                              <input
                                type="text"
                                value={
                                  block.caption
                                }
                                onChange={
                                  (event) =>
                                    updateRichBlock(
                                      block.client_id,
                                      {
                                        caption:
                                          event.target.value,
                                      }
                                    )
                                }
                              />
                            </label>
                          </div>


                          <label>
                            Линк — опционо

                            <input
                              type="url"
                              value={
                                block.media_url
                              }
                              onChange={
                                (event) =>
                                  updateRichBlock(
                                    block.client_id,
                                    {
                                      media_url:
                                        event.target.value,
                                    }
                                  )
                              }
                              placeholder={
                                block.block_type ===
                                  "youtube"
                                  ? "https://youtube.com/..."
                                  : "https://..."
                              }
                            />
                          </label>


                          {block.block_type !==
                            "youtube" ? (
                            <label>
                              Или отпреми фајл

                              <input
                                type="file"
                                accept={
                                  block.block_type ===
                                    "video"
                                    ? "video/*"
                                    : block.block_type ===
                                      "gif"
                                      ? "image/gif"
                                      : "image/*"
                                }
                                onChange={
                                  (event) =>
                                    handleRichBlockFile(
                                      block.client_id,
                                      event.target
                                        .files?.[0] ||
                                      null
                                    )
                                }
                              />
                            </label>
                          ) : null}


                          {block.media_url &&
                          !block.file ? (
                            <small className="admin-article-rich__existing">
                              Постојећи медиј је повезан.
                            </small>
                          ) : null}


                          {block.file ? (
                            <small className="admin-article-rich__existing">
                              Локално обезбеђен фајл: {block.file.name}
                            </small>
                          ) : null}
                        </>
                      )}
                    </article>
                  )
                )}
              </div>
            </section>

          ) : (
            <section
              style={{
                display:
                  "grid",

                gap:
                  "16px",
              }}
            >
              <div>
                <strong>
                  PDF делови
                </strong>

                <p
                  style={{
                    marginBottom:
                      0,

                    opacity:
                      0.75,
                  }}
                >
                  Један део води право
                  у reader. Два или више
                  делова прво отварају
                  избор дела. Један PDF
                  не сме бити већи од
                  50 MB.
                </p>
              </div>


              {orderedParts.map(
                (
                  part,
                  index
                ) => (
                  <div
                    key={
                      part.client_id
                    }
                    className="admin-document-field"
                    style={{
                      display:
                        "grid",

                      gap:
                        "12px",

                      padding:
                        "16px",
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
                          "12px",

                        flexWrap:
                          "wrap",
                      }}
                    >
                      <strong>
                        ДЕО {index + 1}
                      </strong>


                      <div
                        style={{
                          display:
                            "flex",

                          gap:
                            "6px",

                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            index === 0
                          }
                          onClick={() =>
                            movePart(
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
                            orderedParts.length -
                              1
                          }
                          onClick={() =>
                            movePart(
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
                            removePart(
                              part.client_id
                            )
                          }
                        >
                          Обриши део
                        </button>
                      </div>
                    </div>


                    <label>
                      Назив дела

                      <input
                        type="text"
                        value={
                          part.title
                        }
                        onChange={
                          (event) =>
                            updatePart(
                              part.client_id,
                              {
                                title:
                                  event.target.value,
                              }
                            )
                        }
                        placeholder={
                          `Део ${index + 1}`
                        }
                      />
                    </label>


                    {part.pdf_url &&
                    !part.file ? (
                      <div className="current-document">
                        <p>
                          Тренутни документ:
                        </p>

                        <a
                          href={
                            part.pdf_url
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          {part.original_file_name ||
                            `Део ${index + 1}`}
                        </a>
                      </div>
                    ) : null}


                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={
                        (event) =>
                          handlePartFile(
                            part.client_id,
                            event.target
                              .files?.[0] ??
                            null
                          )
                      }
                    />


                    {part.file ? (
                      <p>
                        Локално обезбеђен PDF:
                        {" "}

                        <strong>
                          {part.file.name}
                        </strong>

                        {" · "}

                        {(
                          part.file.size /
                          1024 /
                          1024
                        ).toFixed(
                          1
                        )}

                        {" MB"}
                      </p>
                    ) : null}
                  </div>
                )
              )}


              <button
                type="button"
                className="secondary-button"
                onClick={
                  addPart
                }
              >
                + ДОДАЈ ДЕО
              </button>
            </section>
          )}


          <label>
            Статус

            <select
              value={
                form.status
              }
              onChange={
                (event) =>
                  changeFormField(
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
                saving ||
                deleting
              }
            >
              {saving
                ? "Чување..."
                : form.status ===
                  "published"
                  ? "Сачувај и објави"
                  : editingArticle
                    ? "Сачувај измене"
                    : "Сачувај нацрт"}
            </button>


            <button
              className="secondary-button"
              type="button"
              disabled={
                saving ||
                deleting
              }
              onClick={
                handleCancelEditor
              }
            >
              Одбаци локалне измене
            </button>
          </div>
        </form>
      </section>
    );
  }


  return (
    <section>
      {isEditorRoute
        ? renderEditor()
        : renderList()}
    </section>
  );
}


export default AdminArticles;