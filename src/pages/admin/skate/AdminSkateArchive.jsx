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
} from "../../../lib/supabaseClient";

import {
  deleteBlogImage,
  uploadBlogImage,
} from "../../../lib/blogImages";

import {
  deleteSkateVideo,
  uploadSkateVideo,
} from "../../../lib/skateMedia";

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


const FIXED_SECTION_SLUGS = [
  "ekipa-zid",
  "dogodovstine",
  "voznja",
  "ulica",
];


function createEmptyEntryForm() {
  return {
    section_id:
      "",

    title:
      "",

    excerpt:
      "",

    body:
      "",

    entry_date:
      "",

    location:
      "",

    sort_order:
      "0",

    status:
      "draft",
  };
}


function createEmptyMediaForm() {
  return {
    media_type:
      "image",

    url:
      "",

    caption:
      "",

    sort_order:
      "0",
  };
}


function formFromEntry(
  entry
) {
  return {
    section_id:
      entry?.section_id ||
      "",

    title:
      entry?.title ||
      "",

    excerpt:
      entry?.excerpt ||
      "",

    body:
      entry?.body ||
      "",

    entry_date:
      entry?.entry_date ||
      "",

    location:
      entry?.location ||
      "",

    sort_order:
      String(
        entry?.sort_order ??
        0
      ),

    status:
      entry?.status ||
      "draft",
  };
}


function normalizeUrl(
  rawValue,
  errorMessage =
    "Унеси исправан линк."
) {
  const trimmedValue =
    String(
      rawValue ||
      ""
    ).trim();


  if (!trimmedValue) {
    return "";
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
      errorMessage
    );
  }


  if (
    url.protocol !==
      "https:" &&
    url.protocol !==
      "http:"
  ) {
    throw new Error(
      errorMessage
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


  if (!normalized) {
    return "";
  }


  const url =
    new URL(
      normalized
    );


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


  url.protocol =
    "https:";


  return url.toString();
}


async function deleteStoredMediaItem(
  mediaItem
) {
  if (
    !mediaItem
      ?.storage_path
  ) {
    return;
  }


  if (
    mediaItem
      .media_type ===
    "video"
  ) {
    await deleteSkateVideo(
      mediaItem
        .storage_path
    );

    return;
  }


  if (
    mediaItem
      .media_type ===
    "image"
  ) {
    await deleteBlogImage(
      mediaItem
        .storage_path
    );
  }
}


function AdminSkateArchive() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    characterKey =
      "covek-1",

    entryId,
  } = useParams();


  const basePath =
    `/admin/likovi/${characterKey}/skejt/arhiva`;


  const isNewRoute =
    location.pathname ===
    `${basePath}/novi`;


  const isMediaRoute =
    Boolean(
      entryId
    ) &&
    location.pathname ===
      `${basePath}/${entryId}/mediji`;


  const isEditRoute =
    Boolean(
      entryId
    ) &&
    !isMediaRoute;


  const isEditorRoute =
    isNewRoute ||
    isEditRoute;


  const entryDraftKey =
    isNewRoute
      ? `skate-entry:${characterKey}:new`
      : isEditRoute
        ? `skate-entry:${characterKey}:${entryId}`
        : "";


  const mediaDraftKey =
    isMediaRoute
      ? `skate-media:${characterKey}:${entryId}:new`
      : "";


  const [
    sections,
    setSections,
  ] = useState([]);


  const [
    entries,
    setEntries,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    form,
    setForm,
  ] = useState(
    createEmptyEntryForm
  );


  const [
    editingEntry,
    setEditingEntry,
  ] = useState(null);


  const [
    coverFile,
    setCoverFile,
  ] = useState(null);


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


  const [
    mediaEntry,
    setMediaEntry,
  ] = useState(null);


  const [
    mediaItems,
    setMediaItems,
  ] = useState([]);


  const [
    mediaForm,
    setMediaForm,
  ] = useState(
    createEmptyMediaForm
  );


  const [
    mediaFile,
    setMediaFile,
  ] = useState(null);


  const [
    mediaFileInputKey,
    setMediaFileInputKey,
  ] = useState(0);


  const [
    mediaReadyKey,
    setMediaReadyKey,
  ] = useState("");


  const [
    mediaSaving,
    setMediaSaving,
  ] = useState(false);


  const [
    mediaUploadProgress,
    setMediaUploadProgress,
  ] = useState(0);


  const [
    mediaError,
    setMediaError,
  ] = useState("");


  const sectionOptions =
    useMemo(
      () =>
        sections
          .filter(
            (
              section
            ) =>
              FIXED_SECTION_SLUGS
                .includes(
                  section.slug
                )
          )
          .map(
            (
              section
            ) => ({
              id:
                section.id,

              name:
                section.name,

              slug:
                section.slug,
            })
          ),
      [
        sections,
      ]
    );


  const entryEditorReady =
    isEditorRoute &&
    Boolean(
      entryDraftKey
    ) &&
    editorReadyKey ===
      entryDraftKey;


  const mediaReady =
    isMediaRoute &&
    Boolean(
      mediaDraftKey
    ) &&
    mediaReadyKey ===
      mediaDraftKey;


  const {
    recovered:
      entryRecovered,

    recoveredAt:
      entryRecoveredAt,

    forceLocalSave:
      forceEntryLocalSave,

    markCommitted:
      markEntryCommitted,

    discardDraft:
      discardEntryDraft,
  } = useAdminDraft({
    draftKey:
      entryDraftKey,

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
            ...createEmptyEntryForm(),
            ...savedForm,
          });
        }
      },

    ready:
      entryEditorReady,

    enabled:
      isEditorRoute,

    scope:
      "Скејт / архива",
  });


  useAdminDraftFile({
    draftKey:
      entryDraftKey,

    fieldKey:
      "cover",

    file:
      coverFile,

    setFile:
      setCoverFile,

    ready:
      entryEditorReady,

    enabled:
      isEditorRoute,

    scope:
      "Скејт / архива",
  });


  const {
    recovered:
      mediaRecovered,

    recoveredAt:
      mediaRecoveredAt,

    markCommitted:
      markMediaCommitted,

    discardDraft:
      discardMediaDraft,
  } = useAdminDraft({
    draftKey:
      mediaDraftKey,

    data:
      mediaForm,

    onRestore:
      (
        savedForm
      ) => {
        if (
          savedForm &&
          typeof savedForm ===
            "object"
        ) {
          setMediaForm({
            ...createEmptyMediaForm(),
            ...savedForm,
          });
        }
      },

    ready:
      mediaReady,

    enabled:
      isMediaRoute,

    scope:
      "Скејт / медији",
  });


  useAdminDraftFile({
    draftKey:
      mediaDraftKey,

    fieldKey:
      "media-file",

    file:
      mediaFile,

    setFile:
      setMediaFile,

    ready:
      mediaReady,

    enabled:
      isMediaRoute,

    scope:
      "Скејт / медији",
  });


  async function fetchSections() {
    const {
      data,
      error,
    } = await supabase
      .from(
        "skate_sections"
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
      throw error;
    }


    return data ?? [];
  }


  async function fetchEntries() {
    const {
      data,
      error,
    } = await supabase
      .from(
        "skate_entries"
      )
      .select(`
        *,
        skate_sections (
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
      );


    if (error) {
      throw error;
    }


    return data ?? [];
  }


  async function loadInitialData() {
    setLoading(
      true
    );

    setErrorMessage(
      ""
    );


    try {
      const [
        sectionsData,
        entriesData,
      ] = await Promise.all([
        fetchSections(),
        fetchEntries(),
      ]);


      setSections(
        sectionsData
      );

      setEntries(
        entriesData
      );

    } catch (
      error
    ) {
      console.error(
        "Učitavanje Skejt arhive:",
        error
      );


      setErrorMessage(
        error?.message ||
        "Скејт архива није могла да се учита."
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  async function refreshEntries() {
    try {
      const nextEntries =
        await fetchEntries();


      setEntries(
        nextEntries
      );


      return nextEntries;

    } catch (
      error
    ) {
      console.error(
        "Osvežavanje Skejt zapisa:",
        error
      );


      return entries;
    }
  }


  useEffect(() => {
    loadInitialData();
  }, []);


  useEffect(() => {
    if (
      loading ||
      !isEditorRoute
    ) {
      return;
    }


    setEditorReadyKey(
      ""
    );

    setCoverFile(
      null
    );

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );


    if (isNewRoute) {
      setEditingEntry(
        null
      );

      setForm(
        createEmptyEntryForm()
      );

      setEditorReadyKey(
        entryDraftKey
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
      entryDraftKey
    );
  }, [
    loading,
    isEditorRoute,
    isNewRoute,
    entryId,
    entries,
    entryDraftKey,
  ]);


  async function loadMediaItems(
    entry
  ) {
    if (!entry?.id) {
      return;
    }


    setMediaError(
      ""
    );


    const {
      data,
      error,
    } = await supabase
      .from(
        "skate_entry_media"
      )
      .select("*")
      .eq(
        "entry_id",
        entry.id
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
            true,
        }
      );


    if (error) {
      throw error;
    }


    setMediaItems(
      data ?? []
    );
  }


  useEffect(() => {
    if (
      loading ||
      !isMediaRoute
    ) {
      return;
    }


    let active =
      true;


    setMediaReadyKey(
      ""
    );

    setMediaError(
      ""
    );

    setMediaUploadProgress(
      0
    );

    setMediaForm(
      createEmptyMediaForm()
    );

    setMediaFile(
      null
    );


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
      setMediaEntry(
        null
      );

      setMediaError(
        "Тражени запис не постоји."
      );

      return;
    }


    setMediaEntry(
      entry
    );


    async function prepareMedia() {
      try {
        await loadMediaItems(
          entry
        );


        if (!active) {
          return;
        }


        setMediaReadyKey(
          mediaDraftKey
        );

      } catch (
        error
      ) {
        if (!active) {
          return;
        }


        setMediaError(
          error?.message ||
          "Медији нису могли да се учитају."
        );
      }
    }


    prepareMedia();


    return () => {
      active =
        false;
    };
  }, [
    loading,
    isMediaRoute,
    entryId,
    entries,
    mediaDraftKey,
  ]);


  function updateEntryField(
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


  function updateMediaField(
    field,
    value
  ) {
    setMediaForm(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );

    setMediaError(
      ""
    );
  }


  function handleMediaTypeChange(
    value
  ) {
    setMediaForm(
      (
        current
      ) => ({
        ...current,

        media_type:
          value,

        url:
          "",
      })
    );


    setMediaFile(
      null
    );

    setMediaFileInputKey(
      (
        current
      ) =>
        current + 1
    );

    setMediaUploadProgress(
      0
    );

    setMediaError(
      ""
    );
  }


  async function coverPathBelongsToMedia(
    currentEntryId,
    storagePath
  ) {
    if (
      !currentEntryId ||
      !storagePath
    ) {
      return false;
    }


    const {
      data,
      error,
    } = await supabase
      .from(
        "skate_entry_media"
      )
      .select("id")
      .eq(
        "entry_id",
        currentEntryId
      )
      .eq(
        "storage_path",
        storagePath
      )
      .limit(1);


    if (error) {
      console.error(
        "Provera naslovne fotografije:",
        error
      );

      return false;
    }


    return Boolean(
      data?.length
    );
  }


  async function handleEntrySubmit(
    event
  ) {
    event.preventDefault();


    if (saving) {
      return;
    }


    forceEntryLocalSave();


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

    let entrySaved =
      false;


    try {
      const cleanTitle =
        form.title
          .trim();


      if (
        !form.section_id
      ) {
        throw new Error(
          "Изабери зону."
        );
      }


      if (!cleanTitle) {
        throw new Error(
          "Упиши наслов записа."
        );
      }


      const selectedSection =
        sections.find(
          (
            section
          ) =>
            String(
              section.id
            ) ===
            String(
              form.section_id
            )
        ) ||
        null;


      if (!selectedSection) {
        throw new Error(
          "Изабрана зона није пронађена."
        );
      }


      if (coverFile) {
        uploadedCover =
          await uploadBlogImage(
            coverFile,
            "skate-entry-covers"
          );
      }


      const payload = {
        section_id:
          form.section_id,

        title:
          cleanTitle,

        slug:
          slugify(
            cleanTitle
          ),

        excerpt:
          form.excerpt
            .trim(),

        body:
          form.body
            .trim(),

        cover_url:
          uploadedCover?.url ??
          editingEntry
            ?.cover_url ??
          null,

        cover_path:
          uploadedCover?.path ??
          editingEntry
            ?.cover_path ??
          null,

        entry_date:
          form.entry_date ||
          null,

        location:
          form.location
            .trim() ||
          null,

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


      if (editingEntry) {
        const {
          error,
        } = await supabase
          .from(
            "skate_entries"
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


        entrySaved =
          true;


        if (
          uploadedCover &&
          editingEntry
            .cover_path
        ) {
          const oldCoverIsMedia =
            await coverPathBelongsToMedia(
              editingEntry.id,
              editingEntry
                .cover_path
            );


          if (
            !oldCoverIsMedia
          ) {
            await deleteBlogImage(
              editingEntry
                .cover_path
            ).catch(
              () => {}
            );
          }
        }


        const committedForm = {
          section_id:
            form.section_id,

          title:
            cleanTitle,

          excerpt:
            form.excerpt
              .trim(),

          body:
            form.body
              .trim(),

          entry_date:
            form.entry_date,

          location:
            form.location
              .trim(),

          sort_order:
            String(
              Number(
                form.sort_order
              ) || 0
            ),

          status:
            form.status,
        };


        await markEntryCommitted(
          committedForm,
          {
            clearFiles:
              true,

            message:
              "Скејт запис је сачуван.",
          }
        ).catch(
          (
            error
          ) => {
            console.error(
              "Čišćenje recovery drafta:",
              error
            );
          }
        );


        setCoverFile(
          null
        );


        await refreshEntries();


        setSuccessMessage(
          "Запис је успешно сачуван."
        );


        navigate(
          basePath
        );

        return;
      }


      const {
        data:
          createdEntry,

        error:
          createError,
      } = await supabase
        .from(
          "skate_entries"
        )
        .insert(
          payload
        )
        .select(`
          id,
          section_id,
          title,
          slug,
          excerpt,
          body,
          cover_url,
          cover_path,
          entry_date,
          location,
          sort_order,
          status,
          created_at,
          updated_at
        `)
        .single();


      if (createError) {
        throw createError;
      }


      entrySaved =
        true;


      await markEntryCommitted(
        createEmptyEntryForm(),
        {
          clearFiles:
            true,

          message:
            "Скејт запис је додат.",
        }
      ).catch(
        (
          error
        ) => {
          console.error(
            "Čišćenje recovery drafta:",
            error
          );
        }
      );


      setCoverFile(
        null
      );


      await refreshEntries();


      navigate(
        `${basePath}/${createdEntry.id}/mediji`,
        {
          replace:
            true,
        }
      );

    } catch (
      error
    ) {
      if (
        !entrySaved &&
        uploadedCover
          ?.path
      ) {
        await deleteBlogImage(
          uploadedCover.path
        ).catch(
          () => {}
        );
      }


      setErrorMessage(
        error?.message ||
        "Чување записа није успело. Локални нацрт је остао сачуван."
      );

    } finally {
      setSaving(
        false
      );
    }
  }


  async function handleCancelEntry() {
    const baseline =
      editingEntry
        ? formFromEntry(
            editingEntry
          )
        : createEmptyEntryForm();


    await discardEntryDraft(
      baseline,
      {
        clearFiles:
          true,
      }
    );


    setCoverFile(
      null
    );


    navigate(
      basePath
    );
  }


  async function handleAddMedia(
    event
  ) {
    event.preventDefault();


    if (
      !mediaEntry ||
      mediaSaving
    ) {
      return;
    }


    setMediaSaving(
      true
    );

    setMediaError(
      ""
    );

    setMediaUploadProgress(
      0
    );


    let uploadedMedia =
      null;


    try {
      const mediaType =
        mediaForm
          .media_type;


      let mediaUrl =
        "";

      let storagePath =
        null;


      if (
        mediaType ===
        "image"
      ) {
        if (!mediaFile) {
          throw new Error(
            "Изабери фотографију."
          );
        }


        uploadedMedia =
          await uploadBlogImage(
            mediaFile,
            `skate-entries/${mediaEntry.id}`
          );


        mediaUrl =
          uploadedMedia.url;

        storagePath =
          uploadedMedia.path;

      } else if (
        mediaType ===
        "video"
      ) {
        if (mediaFile) {
          uploadedMedia =
            await uploadSkateVideo(
              mediaFile,
              `entries/${mediaEntry.id}`,
              (
                percentage
              ) => {
                setMediaUploadProgress(
                  percentage
                );
              }
            );


          mediaUrl =
            uploadedMedia.url;

          storagePath =
            uploadedMedia.path;

        } else {
          mediaUrl =
            normalizeUrl(
              mediaForm.url,
              "Изабери видео фајл или унеси директан видео линк."
            );
        }

      } else if (
        mediaType ===
        "youtube"
      ) {
        mediaUrl =
          normalizeYouTubeUrl(
            mediaForm.url
          );

      } else {
        mediaUrl =
          normalizeUrl(
            mediaForm.url
          );
      }


      if (!mediaUrl) {
        throw new Error(
          "Медиј нема линк или фајл."
        );
      }


      const {
        error,
      } = await supabase
        .from(
          "skate_entry_media"
        )
        .insert({
          entry_id:
            mediaEntry.id,

          media_type:
            mediaType,

          url:
            mediaUrl,

          storage_path:
            storagePath,

          caption:
            mediaForm
              .caption
              .trim(),

          sort_order:
            Number(
              mediaForm
                .sort_order
            ) || 0,

          updated_at:
            new Date()
              .toISOString(),
        });


      if (error) {
        throw error;
      }


      let nextMediaEntry = {
        ...mediaEntry,
      };


      if (
        mediaType ===
          "image" &&
        !mediaEntry
          .cover_url
      ) {
        const {
          error:
            coverError,
        } = await supabase
          .from(
            "skate_entries"
          )
          .update({
            cover_url:
              mediaUrl,

            cover_path:
              storagePath,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            mediaEntry.id
          );


        if (!coverError) {
          nextMediaEntry = {
            ...mediaEntry,

            cover_url:
              mediaUrl,

            cover_path:
              storagePath,
          };


          setMediaEntry(
            nextMediaEntry
          );
        }
      }


      await markMediaCommitted(
        createEmptyMediaForm(),
        {
          clearFiles:
            true,

          message:
            "Медиј је додат.",
        }
      ).catch(
        (
          error
        ) => {
          console.error(
            "Čišćenje media recovery drafta:",
            error
          );
        }
      );


      setMediaForm(
        createEmptyMediaForm()
      );

      setMediaFile(
        null
      );

      setMediaFileInputKey(
        (
          current
        ) =>
          current + 1
      );

      setMediaUploadProgress(
        0
      );


      await loadMediaItems(
        nextMediaEntry
      );


      await refreshEntries();

    } catch (
      error
    ) {
      if (
        uploadedMedia
          ?.path
      ) {
        if (
          mediaForm
            .media_type ===
          "video"
        ) {
          await deleteSkateVideo(
            uploadedMedia.path
          ).catch(
            () => {}
          );

        } else {
          await deleteBlogImage(
            uploadedMedia.path
          ).catch(
            () => {}
          );
        }
      }


      setMediaError(
        error?.message ||
        "Додавање медија није успело. Локални нацрт је остао сачуван."
      );

    } finally {
      setMediaSaving(
        false
      );
    }
  }


  async function handleCancelMedia() {
    await discardMediaDraft(
      createEmptyMediaForm(),
      {
        clearFiles:
          true,
      }
    );


    setMediaForm(
      createEmptyMediaForm()
    );

    setMediaFile(
      null
    );

    setMediaFileInputKey(
      (
        current
      ) =>
        current + 1
    );

    setMediaUploadProgress(
      0
    );
  }


  async function handleDeleteMedia(
    mediaItem
  ) {
    const confirmed =
      window.confirm(
        "Обрисати овај медиј?"
      );


    if (!confirmed) {
      return;
    }


    setMediaError(
      ""
    );


    try {
      const mediaWasCover =
        mediaItem
          .media_type ===
          "image" &&
        Boolean(
          mediaItem
            .storage_path
        ) &&
        mediaEntry
          ?.cover_path ===
        mediaItem
          .storage_path;


      const {
        error,
      } = await supabase
        .from(
          "skate_entry_media"
        )
        .delete()
        .eq(
          "id",
          mediaItem.id
        );


      if (error) {
        throw error;
      }


      let nextMediaEntry = {
        ...mediaEntry,
      };


      if (
        mediaWasCover &&
        mediaEntry?.id
      ) {
        const {
          data:
            replacementImages,

          error:
            replacementError,
        } = await supabase
          .from(
            "skate_entry_media"
          )
          .select(`
            id,
            url,
            storage_path,
            sort_order,
            created_at
          `)
          .eq(
            "entry_id",
            mediaEntry.id
          )
          .eq(
            "media_type",
            "image"
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
                true,
            }
          )
          .limit(1);


        if (
          replacementError
        ) {
          throw replacementError;
        }


        const replacementImage =
          replacementImages
            ?.[0] ??
          null;


        const {
          error:
            coverUpdateError,
        } = await supabase
          .from(
            "skate_entries"
          )
          .update({
            cover_url:
              replacementImage
                ?.url ??
              null,

            cover_path:
              replacementImage
                ?.storage_path ??
              null,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            mediaEntry.id
          );


        if (
          coverUpdateError
        ) {
          throw coverUpdateError;
        }


        nextMediaEntry = {
          ...mediaEntry,

          cover_url:
            replacementImage
              ?.url ??
            null,

          cover_path:
            replacementImage
              ?.storage_path ??
            null,
        };


        setMediaEntry(
          nextMediaEntry
        );
      }


      await deleteStoredMediaItem(
        mediaItem
      );


      await loadMediaItems(
        nextMediaEntry
      );


      await refreshEntries();

    } catch (
      error
    ) {
      setMediaError(
        error?.message ||
        "Брисање медија није успело."
      );
    }
  }


  async function handleDeleteEntry(
    entry
  ) {
    const confirmed =
      window.confirm(
        `Трајно обрисати запис „${entry.title}“?`
      );


    if (!confirmed) {
      return;
    }


    setErrorMessage(
      ""
    );


    try {
      const {
        data:
          mediaData,

        error:
          mediaLoadError,
      } = await supabase
        .from(
          "skate_entry_media"
        )
        .select(`
          id,
          media_type,
          storage_path
        `)
        .eq(
          "entry_id",
          entry.id
        );


      if (
        mediaLoadError
      ) {
        throw mediaLoadError;
      }


      const {
        error,
      } = await supabase
        .from(
          "skate_entries"
        )
        .delete()
        .eq(
          "id",
          entry.id
        );


      if (error) {
        throw error;
      }


      const mediaStoragePaths =
        new Set(
          (
            mediaData ??
            []
          )
            .map(
              (
                mediaItem
              ) =>
                mediaItem
                  .storage_path
            )
            .filter(
              Boolean
            )
        );


      for (
        const mediaItem
        of mediaData ??
        []
      ) {
        await deleteStoredMediaItem(
          mediaItem
        ).catch(
          () => {}
        );
      }


      if (
        entry.cover_path &&
        !mediaStoragePaths.has(
          entry.cover_path
        )
      ) {
        await deleteBlogImage(
          entry.cover_path
        ).catch(
          () => {}
        );
      }


      await Promise.all([
        clearAdminDraft(
          `skate-entry:${characterKey}:${entry.id}`
        ),

        clearAdminDraft(
          `skate-media:${characterKey}:${entry.id}:new`
        ),
      ]).catch(
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


      await refreshEntries();

    } catch (
      error
    ) {
      setErrorMessage(
        error?.message ||
        "Брисање записа није успело."
      );
    }
  }


  const entryRecoveryTime =
    entryRecoveredAt
      ? new Date(
          entryRecoveredAt
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


  const mediaRecoveryTime =
    mediaRecoveredAt
      ? new Date(
          mediaRecoveredAt
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
      <section className="admin-skate__section">
        <div className="admin-skate__section-heading">
          <div>
            <p className="eyebrow">
              СКЕЈТ / АРХИВА
            </p>

            <h2>
              Приче, фотке и снимци
            </h2>
          </div>

          <p>
            Сваки запис има своју
            засебну страницу за текст
            и посебну страницу за
            фотографије и видео.
          </p>
        </div>


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
            + НОВИ ЗАПИС
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
          <h3>
            Сви записи
          </h3>


          {loading ? (
            <p>
              Учитавање...
            </p>

          ) : !entries.length ? (
            <p>
              Још нема записа.
            </p>

          ) : (
            entries.map(
              (
                entry
              ) => (
                <article
                  key={
                    entry.id
                  }
                  className="admin-list-item"
                >
                  <div className="admin-list-info">
                    {entry.cover_url ? (
                      <img
                        className="admin-list-thumb"
                        src={
                          entry.cover_url
                        }
                        alt=""
                      />
                    ) : null}


                    <div>
                      <p className="admin-status">
                        {entry.status ===
                        "published"
                          ? "ОБЈАВЉЕН"
                          : "НАЦРТ"}

                        {" · "}

                        {entry
                          .skate_sections
                          ?.name ||
                          "Без зоне"}

                        {" · РЕДОСЛЕД "}

                        {entry.sort_order}
                      </p>


                      <h3>
                        {entry.title}
                      </h3>

                      <p>
                        {entry.excerpt ||
                          "Без кратког описа"}
                      </p>
                    </div>
                  </div>


                  <div className="item-actions">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `${basePath}/${entry.id}/mediji`
                        )
                      }
                    >
                      Медији
                    </button>

                    <button
                      type="button"
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
                      className="danger-button"
                      onClick={() =>
                        handleDeleteEntry(
                          entry
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
        entryDraftKey
    ) {
      return (
        <section>
          <p className="error-message">
            {errorMessage ||
              "Тражени запис не постоји."}
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
            ← Назад на архиву
          </button>
        </section>
      );
    }


    if (
      !entryEditorReady
    ) {
      return (
        <p>
          Учитавање едитора...
        </p>
      );
    }


    return (
      <section className="admin-skate__section">
        <div className="admin-skate__section-heading">
          <div>
            <p className="eyebrow">
              СКЕЈТ / АРХИВА
            </p>

            <h2>
              {editingEntry
                ? "Измена записа"
                : "Нови запис"}
            </h2>
          </div>

          <p>
            Унос се локално чува
            док радиш. У базу иде
            тек када кликнеш
            „Сачувај“.
          </p>
        </div>


        <form
          className="admin-form admin-skate__form"
          onSubmit={
            handleEntrySubmit
          }
        >
          {entryRecovered ? (
            <p className="success-message">
              Враћен је локално
              сачуван нацрт
              {entryRecoveryTime
                ? ` од ${entryRecoveryTime}.`
                : "."}
            </p>
          ) : null}


          <label>
            Зона

            <select
              value={
                form.section_id
              }
              onChange={
                (
                  event
                ) =>
                  updateEntryField(
                    "section_id",
                    event
                      .target
                      .value
                  )
              }
              required
            >
              <option value="">
                Изабери зону
              </option>

              {sectionOptions.map(
                (
                  section
                ) => (
                  <option
                    key={
                      section.id
                    }
                    value={
                      section.id
                    }
                  >
                    {section.name}
                  </option>
                )
              )}
            </select>
          </label>


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
                  updateEntryField(
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
            Кратак опис за картицу

            <textarea
              rows="4"
              value={
                form.excerpt
              }
              onChange={
                (
                  event
                ) =>
                  updateEntryField(
                    "excerpt",
                    event
                      .target
                      .value
                  )
              }
            />
          </label>


          <label>
            Текст приче

            <textarea
              className="article-editor"
              rows="18"
              value={
                form.body
              }
              onChange={
                (
                  event
                ) =>
                  updateEntryField(
                    "body",
                    event
                      .target
                      .value
                  )
              }
              placeholder="Овде иде прича испод фотографије или снимка..."
            />
          </label>


          <div className="admin-image-field">
            <strong>
              Насловна фотографија
              картице
            </strong>

            <p>
              Опционо. Ако је не
              изабереш, прва
              фотографија коју
              касније додаш у
              Медије постаје cover.
            </p>


            {editingEntry
              ?.cover_url &&
            !coverFile ? (
              <img
                className="admin-image-preview"
                src={
                  editingEntry
                    .cover_url
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
                  setCoverFile(
                    event
                      .target
                      .files?.[0] ??
                    null
                  )
              }
            />


            {coverFile ? (
              <p>
                Локално обезбеђен
                фајл:
                {" "}

                <strong>
                  {coverFile.name}
                </strong>
              </p>
            ) : null}
          </div>


          <div className="admin-skate__form-grid">
            <label>
              Датум

              <input
                type="date"
                value={
                  form.entry_date
                }
                onChange={
                  (
                    event
                  ) =>
                    updateEntryField(
                      "entry_date",
                      event
                        .target
                        .value
                    )
                }
              />
            </label>


            <label>
              Локација

              <input
                type="text"
                value={
                  form.location
                }
                onChange={
                  (
                    event
                  ) =>
                    updateEntryField(
                      "location",
                      event
                        .target
                        .value
                    )
                }
                placeholder="нпр. Горњи Милановац"
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
                    updateEntryField(
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
                    updateEntryField(
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
          </div>


          {errorMessage ? (
            <p className="error-message">
              {errorMessage}
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
                : editingEntry
                  ? "Сачувај измене"
                  : "Додај запис"}
            </button>


            <button
              className="secondary-button"
              type="button"
              disabled={
                saving
              }
              onClick={
                handleCancelEntry
              }
            >
              Одбаци локалне измене
            </button>


            {editingEntry ? (
              <button
                type="button"
                className="danger-button"
                disabled={
                  saving
                }
                onClick={() =>
                  handleDeleteEntry(
                    editingEntry
                  )
                }
              >
                Обриши запис
              </button>
            ) : null}
          </div>
        </form>
      </section>
    );
  }


  function renderMediaManager() {
    if (
      loading ||
      !mediaReady
    ) {
      return (
        <p>
          Учитавање медија...
        </p>
      );
    }


    if (!mediaEntry) {
      return (
        <section>
          <p className="error-message">
            {mediaError ||
              "Тражени запис не постоји."}
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
            ← Назад на архиву
          </button>
        </section>
      );
    }


    return (
      <section className="admin-skate__section">
        <div className="admin-skate__media-manager">
          <div className="admin-skate__media-heading">
            <div>
              <p className="eyebrow">
                СКЕЈТ / МЕДИЈИ
              </p>

              <h3>
                {mediaEntry.title}
              </h3>
            </div>


            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  navigate(
                    `${basePath}/${mediaEntry.id}`
                  )
                }
              >
                Уреди текст
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  navigate(
                    basePath
                  )
                }
              >
                Назад на архиву
              </button>
            </div>
          </div>


          <form
            className="admin-form admin-skate__media-form"
            onSubmit={
              handleAddMedia
            }
          >
            {mediaRecovered ? (
              <p className="success-message">
                Враћен је локално
                сачуван медијски унос
                {mediaRecoveryTime
                  ? ` од ${mediaRecoveryTime}.`
                  : "."}
              </p>
            ) : null}


            <label>
              Тип медија

              <select
                value={
                  mediaForm
                    .media_type
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
                <option value="image">
                  Фотографија
                </option>

                <option value="video">
                  Видео
                </option>

                <option value="youtube">
                  YouTube
                </option>

                <option value="link">
                  Спољни линк
                </option>
              </select>
            </label>


            {mediaForm
              .media_type ===
              "image" ||
            mediaForm
              .media_type ===
              "video" ? (
              <label>
                {mediaForm
                  .media_type ===
                "image"
                  ? "Фајл фотографије"
                  : "Видео фајл"}

                <input
                  key={
                    mediaFileInputKey
                  }
                  type="file"
                  accept={
                    mediaForm
                      .media_type ===
                    "image"
                      ? "image/*"
                      : "video/*"
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setMediaFile(
                        event
                          .target
                          .files?.[0] ??
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
                ) : null}
              </label>
            ) : null}


            {mediaForm
              .media_type ===
              "youtube" ||
            mediaForm
              .media_type ===
              "link" ||
            mediaForm
              .media_type ===
              "video" ? (
              <label>
                {mediaForm
                  .media_type ===
                "youtube"
                  ? "YouTube линк"
                  : mediaForm
                        .media_type ===
                      "video"
                    ? "Или директан видео линк"
                    : "Спољни линк"}

                <input
                  type="text"
                  inputMode="url"
                  value={
                    mediaForm.url
                  }
                  onChange={
                    (
                      event
                    ) =>
                      updateMediaField(
                        "url",
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="https://..."
                />
              </label>
            ) : null}


            <label>
              Опис / caption

              <input
                type="text"
                value={
                  mediaForm
                    .caption
                }
                onChange={
                  (
                    event
                  ) =>
                    updateMediaField(
                      "caption",
                      event
                        .target
                        .value
                    )
                }
              />
            </label>


            <label>
              Редослед

              <input
                type="number"
                value={
                  mediaForm
                    .sort_order
                }
                onChange={
                  (
                    event
                  ) =>
                    updateMediaField(
                      "sort_order",
                      event
                        .target
                        .value
                    )
                }
              />
            </label>


            {mediaError ? (
              <p className="error-message">
                {mediaError}
              </p>
            ) : null}


            {mediaSaving &&
            mediaForm
              .media_type ===
              "video" &&
            mediaFile ? (
              <div className="admin-skate__upload-progress">
                <div>
                  <span>
                    Upload видеа
                  </span>

                  <strong>
                    {mediaUploadProgress}%
                  </strong>
                </div>

                <progress
                  max="100"
                  value={
                    mediaUploadProgress
                  }
                />
              </div>
            ) : null}


            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={
                  mediaSaving
                }
              >
                {mediaSaving
                  ? "Додавање..."
                  : "+ Додај медиј"}
              </button>


              <button
                type="button"
                className="secondary-button"
                disabled={
                  mediaSaving
                }
                onClick={
                  handleCancelMedia
                }
              >
                Очисти унос
              </button>
            </div>
          </form>


          <div className="admin-skate__media-list">
            {!mediaItems.length ? (
              <p>
                Овај запис још
                нема медије.
              </p>

            ) : (
              mediaItems.map(
                (
                  mediaItem
                ) => (
                  <article
                    key={
                      mediaItem.id
                    }
                    className="admin-skate__media-item"
                  >
                    <div>
                      {mediaItem
                        .media_type ===
                      "image" ? (
                        <img
                          src={
                            mediaItem.url
                          }
                          alt=""
                        />

                      ) : (
                        <span className="admin-skate__media-badge">
                          {mediaItem
                            .media_type
                            .toUpperCase()}
                        </span>
                      )}


                      <div>
                        <strong>
                          {mediaItem.caption ||
                            "Без описа"}
                        </strong>

                        <small>
                          РЕДОСЛЕД
                          {" "}
                          {mediaItem
                            .sort_order}
                        </small>
                      </div>
                    </div>


                    <button
                      type="button"
                      className="danger-button"
                      onClick={() =>
                        handleDeleteMedia(
                          mediaItem
                        )
                      }
                    >
                      Обриши
                    </button>
                  </article>
                )
              )
            )}
          </div>
        </div>
      </section>
    );
  }


  if (isMediaRoute) {
    return renderMediaManager();
  }


  if (isEditorRoute) {
    return renderEditor();
  }


  return renderList();
}


export default AdminSkateArchive;