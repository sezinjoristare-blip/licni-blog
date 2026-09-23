import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../../lib/supabaseClient";

import {
  deleteBlogImage,
  uploadBlogImage,
} from "../../lib/blogImages";

import {
  deleteSkateVideo,
  uploadSkateVideo,
} from "../../lib/skateMedia";

import {
  slugify,
} from "../../utils/slugify";

import "../../styles/admin/AdminSkate.css";
import "../../styles/ContributorSkate.css";


function createEmptyEntryForm() {
  return {
    title: "",
    excerpt: "",
    body: "",
    entry_date: "",
    location: "",
    sort_order: "0",
    status: "draft",
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


function normalizeUrl(
  rawValue,
  errorMessage =
    "Унеси исправан линк."
) {
  const trimmed =
    String(
      rawValue || ""
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


  const valid =
    hostname ===
      "youtu.be" ||
    hostname ===
      "youtube.com" ||
    hostname.endsWith(
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


function ContributorSkatePanel() {
  const navigate =
    useNavigate();

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    contributor,
    setContributor,
  ] = useState(null);

  const [
    dogodovstineSection,
    setDogodovstineSection,
  ] = useState(null);

  const [
    entries,
    setEntries,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

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
    coverInputKey,
    setCoverInputKey,
  ] = useState(0);

  const [
    saving,
    setSaving,
  ] = useState(false);

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
    mediaInputKey,
    setMediaInputKey,
  ] = useState(0);

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


  async function loadEntries(
    currentUser = user,
    currentContributor =
      contributor
  ) {
    if (
      !currentUser?.id ||
      !currentContributor
        ?.person_key
    ) {
      return;
    }


    const {
      data,
      error,
    } = await supabase
      .from(
        "skate_entries"
      )
      .select("*")
      .eq(
        "owner_user_id",
        currentUser.id
      )
      .eq(
        "person_key",
        currentContributor
          .person_key
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );


    if (error) {
      throw error;
    }


    setEntries(
      data ?? []
    );
  }


  useEffect(() => {
    let active = true;


    async function bootstrap() {
      setLoading(true);
      setErrorMessage("");


      try {
        const {
          data: userData,
          error: userError,
        } =
          await supabase.auth
            .getUser();


        if (
          userError ||
          !userData?.user
        ) {
          navigate(
            "/saradnik/prijava",
            {
              replace: true,
            }
          );

          return;
        }


        const currentUser =
          userData.user;


        const {
          data:
            contributorData,

          error:
            contributorError,
        } = await supabase
          .from(
            "skate_contributors"
          )
          .select(`
            user_id,
            person_key,
            display_name
          `)
          .eq(
            "user_id",
            currentUser.id
          )
          .maybeSingle();


        if (
          contributorError ||
          !contributorData
        ) {
          throw new Error(
            "Овај налог није повезан са сарадничким ликом."
          );
        }


        const {
          data:
            sectionData,

          error:
            sectionError,
        } = await supabase
          .from(
            "skate_sections"
          )
          .select(`
            id,
            name,
            slug
          `)
          .eq(
            "slug",
            "dogodovstine"
          )
          .maybeSingle();


        if (
          sectionError ||
          !sectionData
        ) {
          throw new Error(
            "Зона „Личне догодовштине“ није пронађена."
          );
        }


        if (!active) {
          return;
        }


        setUser(
          currentUser
        );

        setContributor(
          contributorData
        );

        setDogodovstineSection(
          sectionData
        );


        await loadEntries(
          currentUser,
          contributorData
        );

      } catch (error) {
        if (!active) {
          return;
        }


        console.error(
          "Saradnički panel:",
          error
        );

        setErrorMessage(
          error?.message ||
          "Панел тренутно није доступан."
        );

      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }


    bootstrap();


    return () => {
      active = false;
    };
  }, []);


  function resetEntryForm() {
    setForm(
      createEmptyEntryForm()
    );

    setEditingEntry(
      null
    );

    setCoverFile(
      null
    );

    setCoverInputKey(
      (key) =>
        key + 1
    );

    setErrorMessage("");
  }


  function handleEditEntry(
    entry
  ) {
    setEditingEntry(
      entry
    );

    setCoverFile(
      null
    );

    setCoverInputKey(
      (key) =>
        key + 1
    );

    setForm({
      title:
        entry.title ?? "",

      excerpt:
        entry.excerpt ?? "",

      body:
        entry.body ?? "",

      entry_date:
        entry.entry_date ?? "",

      location:
        entry.location ?? "",

      sort_order:
        String(
          entry.sort_order ??
          0
        ),

      status:
        entry.status ??
        "draft",
    });


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  async function handleEntrySubmit(
    event
  ) {
    event.preventDefault();


    if (
      !user?.id ||
      !contributor
        ?.person_key ||
      !dogodovstineSection
        ?.id
    ) {
      return;
    }


    setSaving(true);
    setErrorMessage("");


    let uploadedCover =
      null;

    let entrySaved =
      false;


    try {
      const cleanTitle =
        form.title.trim();


      if (!cleanTitle) {
        throw new Error(
          "Упиши наслов догодовштине."
        );
      }


      if (coverFile) {
        uploadedCover =
          await uploadBlogImage(
            coverFile,
            `skate-contributors/${user.id}/covers`
          );
      }


      const commonPayload = {
        title:
          cleanTitle,

        /*
          Prefix person_key ostavlja postojeći
          globalni UNIQUE(section_id, slug)
          bez konflikta između različitih ljudi.
        */
        slug:
          slugify(
            `${contributor.person_key}-${cleanTitle}`
          ),

        excerpt:
          form.excerpt
            .trim(),

        body:
          form.body
            .trim(),

        cover_url:
          uploadedCover
            ?.url ??
          editingEntry
            ?.cover_url ??
          null,

        cover_path:
          uploadedCover
            ?.path ??
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


      let savedEntry;


      if (editingEntry) {
        const {
          data,
          error,
        } = await supabase
          .from(
            "skate_entries"
          )
          .update(
            commonPayload
          )
          .eq(
            "id",
            editingEntry.id
          )
          .eq(
            "owner_user_id",
            user.id
          )
          .select("*")
          .single();


        if (error) {
          throw error;
        }


        savedEntry =
          data;

      } else {
        const {
          data,
          error,
        } = await supabase
          .from(
            "skate_entries"
          )
          .insert({
            ...commonPayload,

            section_id:
              dogodovstineSection
                .id,

            owner_user_id:
              user.id,

            person_key:
              contributor
                .person_key,
          })
          .select("*")
          .single();


        if (error) {
          throw error;
        }


        savedEntry =
          data;
      }


      entrySaved =
        true;


      /*
        Ako je ručno postavljen novi cover,
        brišemo stari SAMO ako stari cover
        nije ujedno fotografija iz media liste.
      */
      if (
        uploadedCover &&
        editingEntry
          ?.cover_path &&
        editingEntry
          .cover_path !==
        uploadedCover.path
      ) {
        const {
          count,
        } = await supabase
          .from(
            "skate_entry_media"
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "entry_id",
            editingEntry.id
          )
          .eq(
            "storage_path",
            editingEntry
              .cover_path
          );


        if (!count) {
          await deleteBlogImage(
            editingEntry
              .cover_path
          );
        }
      }


      resetEntryForm();

      await loadEntries();


      if (
        !editingEntry &&
        savedEntry
      ) {
        await loadMedia(
          savedEntry
        );

        window.setTimeout(
          () => {
            document
              .querySelector(
                ".admin-skate__media-manager"
              )
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "start",
              });
          },
          0
        );
      }

    } catch (error) {
      if (
        !entrySaved &&
        uploadedCover?.path
      ) {
        await deleteBlogImage(
          uploadedCover.path
        );
      }


      console.error(
        "Čuvanje saradničke dogodovštine:",
        error
      );

      setErrorMessage(
        error?.message ||
        "Чување догодовштине није успело."
      );

    } finally {
      setSaving(false);
    }
  }


  async function loadMedia(
    entry
  ) {
    if (!entry?.id) {
      return;
    }


    setMediaEntry(
      entry
    );

    setMediaError("");
    setMediaUploadProgress(
      0
    );

    setMediaForm(
      createEmptyMediaForm()
    );

    setMediaFile(
      null
    );

    setMediaInputKey(
      (key) =>
        key + 1
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
          ascending: true,
        }
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );


    if (error) {
      setMediaError(
        error.message
      );

      return;
    }


    setMediaItems(
      data ?? []
    );
  }


  async function handleAddMedia(
    event
  ) {
    event.preventDefault();


    if (
      !mediaEntry ||
      !user?.id
    ) {
      return;
    }


    setMediaSaving(
      true
    );

    setMediaError("");
    setMediaUploadProgress(
      0
    );


    let uploadedMedia =
      null;


    try {
      const mediaType =
        mediaForm
          .media_type;


      let mediaUrl = "";
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
            `skate-contributors/${user.id}/entries/${mediaEntry.id}`
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

              /*
                Isti prefiks koristimo bez obzira
                da li tvoj helper šalje video u
                skate-videos ili blog-images bucket.
              */
              `skate-contributors/${user.id}/videos/${mediaEntry.id}`,

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


      let nextMediaEntry =
        mediaEntry;


      /*
        Prva dodata fotografija automatski
        postaje naslovna ako je nema.
      */
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
          )
          .eq(
            "owner_user_id",
            user.id
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


      setMediaForm(
        createEmptyMediaForm()
      );

      setMediaFile(
        null
      );

      setMediaInputKey(
        (key) =>
          key + 1
      );

      setMediaUploadProgress(
        0
      );


      await loadMedia(
        nextMediaEntry
      );

      await loadEntries();

    } catch (error) {
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
          );

        } else {
          await deleteBlogImage(
            uploadedMedia.path
          );
        }
      }


      setMediaError(
        error?.message ||
        "Додавање медија није успело."
      );

    } finally {
      setMediaSaving(
        false
      );
    }
  }


  async function handleDeleteMedia(
    mediaItem
  ) {
    if (!mediaEntry) {
      return;
    }


    const confirmed =
      window.confirm(
        "Обрисати овај медиј?"
      );


    if (!confirmed) {
      return;
    }


    setMediaError("");


    try {
      const isCurrentCover =
        Boolean(
          mediaItem
            .storage_path &&
          mediaEntry
            .cover_path ===
          mediaItem
            .storage_path
        );


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


      await deleteStoredMediaItem(
        mediaItem
      );


      let nextMediaEntry =
        mediaEntry;


      if (isCurrentCover) {
        const remaining =
          mediaItems.filter(
            (item) =>
              item.id !==
              mediaItem.id
          );


        const replacement =
          remaining.find(
            (item) =>
              item.media_type ===
                "image" &&
              item.url
          ) || null;


        const {
          error:
            coverError,
        } = await supabase
          .from(
            "skate_entries"
          )
          .update({
            cover_url:
              replacement
                ?.url ??
              null,

            cover_path:
              replacement
                ?.storage_path ??
              null,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            mediaEntry.id
          )
          .eq(
            "owner_user_id",
            user.id
          );


        if (!coverError) {
          nextMediaEntry = {
            ...mediaEntry,

            cover_url:
              replacement
                ?.url ??
              null,

            cover_path:
              replacement
                ?.storage_path ??
              null,
          };


          setMediaEntry(
            nextMediaEntry
          );
        }
      }


      await loadMedia(
        nextMediaEntry
      );

      await loadEntries();

    } catch (error) {
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
        `Трајно обрисати догодовштину „${entry.title}“?`
      );


    if (!confirmed) {
      return;
    }


    setErrorMessage("");


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


      if (mediaLoadError) {
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
        )
        .eq(
          "owner_user_id",
          user.id
        );


      if (error) {
        throw error;
      }


      for (
        const mediaItem of
        mediaData ?? []
      ) {
        await deleteStoredMediaItem(
          mediaItem
        );
      }


      /*
        Ako je cover poseban upload i nije već
        obrisan kao media item, uklanjamo i njega.
      */
      if (entry.cover_path) {
        const coverWasMedia =
          (mediaData ?? [])
            .some(
              (item) =>
                item.storage_path ===
                entry.cover_path
            );


        if (!coverWasMedia) {
          await deleteBlogImage(
            entry.cover_path
          );
        }
      }


      if (
        editingEntry
          ?.id ===
        entry.id
      ) {
        resetEntryForm();
      }


      if (
        mediaEntry
          ?.id ===
        entry.id
      ) {
        setMediaEntry(
          null
        );

        setMediaItems([]);
      }


      await loadEntries();

    } catch (error) {
      setErrorMessage(
        error?.message ||
        "Брисање догодовштине није успело."
      );
    }
  }


  async function handleLogout() {
    await supabase.auth
      .signOut();

    navigate(
      "/saradnik/prijava",
      {
        replace: true,
      }
    );
  }


  if (loading) {
    return (
      <main className="contributor-panel">
        <div className="contributor-panel__state">
          УЧИТАВАЊЕ ПАНЕЛА...
        </div>
      </main>
    );
  }


  if (
    errorMessage &&
    !contributor
  ) {
    return (
      <main className="contributor-panel">
        <div className="contributor-panel__state">
          {errorMessage}
        </div>
      </main>
    );
  }


  return (
    <main className="contributor-panel">
      <header className="contributor-panel__header">
        <div>
          <p>
            SKEJT / MOJ PROSTOR
          </p>

          <h1>
            МОЈЕ ДОГОДОВШТИНЕ
          </h1>

          <strong>
            {
              contributor
                ?.display_name
            }
          </strong>
        </div>


        <div className="contributor-panel__header-actions">
          <Link
            to={
              `/autor/covek/skejt/dogodovstine?osoba=${encodeURIComponent(
                contributor
                  ?.person_key ||
                ""
              )}`
            }
          >
            ВИДИ МОЈУ ЈАВНУ СТРАНУ
          </Link>

          <button
            type="button"
            onClick={
              handleLogout
            }
          >
            ОДЈАВИ СЕ
          </button>
        </div>
      </header>


      <section className="admin-skate__section contributor-panel__content">
        <div className="admin-skate__section-heading">
          <div>
            <p className="eyebrow">
              МОЈА АРХИВА
            </p>

            <h2>
              Додај догодовштину
            </h2>
          </div>

          <p>
            Овде видиш и мењаш само своје записе.
            Други сарадници и администратор сајта
            не могу кроз апликацију да мењају твој садржај.
          </p>
        </div>


        <form
          className="admin-form admin-skate__form"
          onSubmit={
            handleEntrySubmit
          }
        >
          <h3>
            {editingEntry
              ? "Измени догодовштину"
              : "Нова догодовштина"}
          </h3>


          <label>
            Наслов

            <input
              type="text"
              value={
                form.title
              }
              onChange={
                (event) =>
                  setForm({
                    ...form,

                    title:
                      event.target
                        .value,
                  })
              }
              required
            />
          </label>


          <label>
            Кратак опис

            <textarea
              rows="3"
              value={
                form.excerpt
              }
              onChange={
                (event) =>
                  setForm({
                    ...form,

                    excerpt:
                      event.target
                        .value,
                  })
              }
            />
          </label>


          <label>
            Текст догодовштине

            <textarea
              rows="10"
              value={
                form.body
              }
              onChange={
                (event) =>
                  setForm({
                    ...form,

                    body:
                      event.target
                        .value,
                  })
              }
            />
          </label>


          <div className="admin-form-grid">
            <label>
              Датум

              <input
                type="date"
                value={
                  form.entry_date
                }
                onChange={
                  (event) =>
                    setForm({
                      ...form,

                      entry_date:
                        event.target
                          .value,
                    })
                }
              />
            </label>


            <label>
              Место

              <input
                type="text"
                value={
                  form.location
                }
                onChange={
                  (event) =>
                    setForm({
                      ...form,

                      location:
                        event.target
                          .value,
                    })
                }
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
                  (event) =>
                    setForm({
                      ...form,

                      sort_order:
                        event.target
                          .value,
                    })
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
                  (event) =>
                    setForm({
                      ...form,

                      status:
                        event.target
                          .value,
                    })
                }
              >
                <option value="draft">
                  Нацрт
                </option>

                <option value="published">
                  Објављено
                </option>
              </select>
            </label>
          </div>


          <div className="admin-image-field">
            <strong>
              Насловна фотографија
            </strong>

            {editingEntry
              ?.cover_url &&
              !coverFile && (
              <img
                className="admin-image-preview"
                src={
                  editingEntry
                    .cover_url
                }
                alt=""
              />
            )}

            <input
              key={
                coverInputKey
              }
              type="file"
              accept="image/*"
              onChange={
                (event) =>
                  setCoverFile(
                    event.target
                      .files?.[0] ??
                    null
                  )
              }
            />

            <small>
              Није обавезна. Ако је нема,
              прва додата фотографија може
              аутоматски постати насловна.
            </small>
          </div>


          {errorMessage && (
            <p className="error-message">
              {errorMessage}
            </p>
          )}


          <div className="item-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "ЧУВАМ..."
                : editingEntry
                  ? "САЧУВАЈ ИЗМЕНЕ"
                  : "ДОДАЈ ДОГОДОВШТИНУ"}
            </button>


            {editingEntry && (
              <button
                type="button"
                className="secondary-button"
                onClick={
                  resetEntryForm
                }
              >
                ОТКАЖИ ИЗМЕНУ
              </button>
            )}
          </div>
        </form>


        {mediaEntry && (
          <section className="admin-skate__media-manager">
            <div className="admin-skate__media-heading">
              <div>
                <p className="eyebrow">
                  МЕДИЈИ
                </p>

                <h3>
                  {mediaEntry.title}
                </h3>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setMediaEntry(
                    null
                  );

                  setMediaItems(
                    []
                  );

                  setMediaError(
                    ""
                  );
                }}
              >
                ЗАТВОРИ
              </button>
            </div>


            <form
              className="admin-form admin-skate__media-form"
              onSubmit={
                handleAddMedia
              }
            >
              <label>
                Тип медија

                <select
                  value={
                    mediaForm
                      .media_type
                  }
                  onChange={
                    (event) => {
                      setMediaForm({
                        ...mediaForm,

                        media_type:
                          event.target
                            .value,

                        url:
                          "",
                      });

                      setMediaFile(
                        null
                      );

                      setMediaInputKey(
                        (key) =>
                          key + 1
                      );

                      setMediaUploadProgress(
                        0
                      );
                    }
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


              {(mediaForm
                .media_type ===
                "image" ||
                mediaForm
                  .media_type ===
                "video") && (
                <label>
                  {mediaForm
                    .media_type ===
                  "image"
                    ? "Фајл фотографије"
                    : "Видео фајл"}

                  <input
                    key={
                      mediaInputKey
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
                      (event) =>
                        setMediaFile(
                          event.target
                            .files?.[0] ??
                          null
                        )
                    }
                  />
                </label>
              )}


              {(mediaForm
                .media_type ===
                "youtube" ||
                mediaForm
                  .media_type ===
                "link" ||
                mediaForm
                  .media_type ===
                "video") && (
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
                      (event) =>
                        setMediaForm({
                          ...mediaForm,

                          url:
                            event.target
                              .value,
                        })
                    }
                    placeholder="https://..."
                  />
                </label>
              )}


              <label>
                Опис / caption

                <input
                  type="text"
                  value={
                    mediaForm
                      .caption
                  }
                  onChange={
                    (event) =>
                      setMediaForm({
                        ...mediaForm,

                        caption:
                          event.target
                            .value,
                      })
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
                    (event) =>
                      setMediaForm({
                        ...mediaForm,

                        sort_order:
                          event.target
                            .value,
                      })
                  }
                />
              </label>


              {mediaForm
                .media_type ===
                "video" &&
                mediaSaving &&
                mediaUploadProgress >
                  0 && (
                <p className="contributor-panel__progress">
                  UPLOAD:
                  {" "}
                  {Math.round(
                    mediaUploadProgress
                  )}
                  %
                </p>
              )}


              {mediaError && (
                <p className="error-message">
                  {mediaError}
                </p>
              )}


              <button
                type="submit"
                className="primary-button"
                disabled={
                  mediaSaving
                }
              >
                {mediaSaving
                  ? "ДОДАЈЕМ..."
                  : "+ ДОДАЈ МЕДИЈ"}
              </button>
            </form>


            <div className="admin-skate__media-list">
              {!mediaItems.length ? (
                <p>
                  Ова догодовштина још нема медије.
                </p>

              ) : (
                mediaItems.map(
                  (mediaItem) => (
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
                            {
                              mediaItem
                                .sort_order
                            }
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
                        ОБРИШИ
                      </button>
                    </article>
                  )
                )
              )}
            </div>
          </section>
        )}


        <div className="admin-skate__section-heading contributor-panel__list-heading">
          <div>
            <p className="eyebrow">
              МОЈИ ЗАПИСИ
            </p>

            <h2>
              Моје догодовштине
            </h2>
          </div>
        </div>


        <div className="admin-list">
          {!entries.length ? (
            <p className="contributor-panel__empty">
              Још немаш ниједну догодовштину.
            </p>

          ) : (
            entries.map(
              (entry) => (
                <article
                  key={
                    entry.id
                  }
                  className="admin-list-item"
                >
                  <div className="admin-list-info">
                    {entry.cover_url && (
                      <img
                        className="admin-list-thumb"
                        src={
                          entry.cover_url
                        }
                        alt=""
                      />
                    )}

                    <div>
                      <p className="admin-status">
                        {entry.status ===
                        "published"
                          ? "ОБЈАВЉЕНО"
                          : "НАЦРТ"}
                      </p>

                      <h3>
                        {entry.title}
                      </h3>

                      {entry.excerpt && (
                        <p>
                          {entry.excerpt}
                        </p>
                      )}
                    </div>
                  </div>


                  <div className="item-actions">
                    <button
                      type="button"
                      onClick={() =>
                        loadMedia(
                          entry
                        )
                      }
                    >
                      МЕДИЈИ
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleEditEntry(
                          entry
                        )
                      }
                    >
                      ИЗМЕНИ
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
                      ОБРИШИ
                    </button>
                  </div>
                </article>
              )
            )
          )}
        </div>
      </section>
    </main>
  );
}


export default ContributorSkatePanel;
