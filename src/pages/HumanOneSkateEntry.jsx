import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import LanguageMenuControl
  from "../components/LanguageSwitcher/LanguageMenuControl";

import {
  LANGUAGES,
} from "../i18n/constants";

import {
  useLanguage,
} from "../i18n/LanguageContext";

import {
  applyContentTranslation,
  getContentTranslation,
  getContentTranslations,
} from "../i18n/contentTranslations";

import {
  supabase,
} from "../lib/supabaseClient";

import "../styles/HumanOneSkate.css";


const SECTION_ENTITY_TYPE =
  "skate_section";

const ENTRY_ENTITY_TYPE =
  "skate_entry";

const MEDIA_ENTITY_TYPE =
  "skate_entry_media";


function normalizeYouTubeEmbedUrl(
  rawValue
) {
  if (!rawValue) {
    return "";
  }


  let url;


  try {
    url =
      new URL(
        rawValue
      );
  } catch {
    return "";
  }


  const host =
    url.hostname
      .toLowerCase()
      .replace(
        /^www\./,
        ""
      );


  let videoId = "";


  if (
    host ===
    "youtu.be"
  ) {
    videoId =
      url.pathname
        .replace(
          /^\//,
          ""
        )
        .split("/")[0];
  }


  if (
    host ===
      "youtube.com" ||
    host.endsWith(
      ".youtube.com"
    )
  ) {
    if (
      url.pathname ===
      "/watch"
    ) {
      videoId =
        url.searchParams.get(
          "v"
        ) || "";

    } else if (
      url.pathname.startsWith(
        "/shorts/"
      )
    ) {
      videoId =
        url.pathname
          .split("/")[2] ||
        "";

    } else if (
      url.pathname.startsWith(
        "/embed/"
      )
    ) {
      videoId =
        url.pathname
          .split("/")[2] ||
        "";
    }
  }


  if (!videoId) {
    return "";
  }


  return (
    `https://www.youtube.com/embed/${encodeURIComponent(
      videoId
    )}`
  );
}


function formatEntryDate(
  value,
  language
) {
  if (!value) {
    return "";
  }


  const date =
    new Date(
      `${value}T12:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }


  return new Intl.DateTimeFormat(
    language ===
      LANGUAGES.EN
      ? "en-GB"
      : "sr-RS",
    {
      dateStyle:
        "long",
    }
  ).format(date);
}


function getSectionDisplayName(
  section,
  t
) {
  const slug =
    section?.slug ||
    "";


  if (
    slug ===
    "ekipa-zid"
  ) {
    return t(
      "skate.zoneCrewWall",
      section?.name ||
        "ЕКИПА / ЗИД"
    );
  }


  if (
    slug ===
    "voznja"
  ) {
    return t(
      "skate.zoneRide",
      section?.name ||
        "ВОЖЊА"
    );
  }


  if (
    slug ===
    "ulica"
  ) {
    return t(
      "skate.zoneStreet",
      section?.name ||
        "УЛИЦА"
    );
  }


  if (
    slug ===
    "dogodovstine"
  ) {
    return t(
      "skate.adventures",
      section?.name ||
        "ДОГОДОВШТИНЕ"
    );
  }


  return (
    section?.name ||
    "STREET ARCHIVE"
  );
}


function HumanOneSkateEntry() {
  const {
    sectionSlug,
    entrySlug,
  } = useParams();

  const [
    searchParams,
  ] = useSearchParams();

  const {
    language,
    t,
  } = useLanguage();

  const searchString =
    searchParams.toString();

  const archivePath =
    `/autor/covek/skejt/${sectionSlug}${searchString
      ? `?${searchString}`
      : ""}`;


  const [
    entry,
    setEntry,
  ] = useState(null);

  const [
    media,
    setMedia,
  ] = useState([]);

  const [
    activeMediaIndex,
    setActiveMediaIndex,
  ] = useState(0);

  const [
    lightboxOpen,
    setLightboxOpen,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    notFound,
    setNotFound,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  useEffect(() => {
    let active = true;


    async function loadEntry() {
      setLoading(true);

      setNotFound(false);

      setErrorMessage("");

      setActiveMediaIndex(
        0
      );

      setLightboxOpen(
        false
      );


      const {
        data,
        error,
      } = await supabase
        .from(
          "skate_entries"
        )
        .select(`
          id,
          title,
          slug,
          excerpt,
          body,
          cover_url,
          entry_date,
          location,
          status,
          skate_sections!inner (
            id,
            name,
            slug,
            status
          )
        `)
        .eq(
          "slug",
          entrySlug
        )
        .eq(
          "status",
          "published"
        )
        .eq(
          "skate_sections.slug",
          sectionSlug
        )
        .eq(
          "skate_sections.status",
          "published"
        )
        .maybeSingle();


      if (!active) {
        return;
      }


      if (error) {
        console.error(
          "Učitavanje skate zapisa:",
          error
        );

        setErrorMessage(
          "skate.entryUnavailable"
        );

        setLoading(false);

        return;
      }


      if (!data) {
        setNotFound(true);

        setLoading(false);

        return;
      }


      const {
        data:
          mediaData,

        error:
          mediaError,
      } = await supabase
        .from(
          "skate_entry_media"
        )
        .select(`
          id,
          media_type,
          url,
          caption,
          sort_order
        `)
        .eq(
          "entry_id",
          data.id
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


      if (!active) {
        return;
      }


      if (mediaError) {
        console.error(
          "Učitavanje skate medija:",
          mediaError
        );

        setErrorMessage(
          "skate.mediaUnavailable"
        );

        setLoading(false);

        return;
      }


      const originalMedia =
        mediaData ?? [];

      let nextEntry =
        data;

      let nextMedia =
        originalMedia;


      if (
        language !==
        LANGUAGES.SR
      ) {
        try {
          const [
            entryTranslation,
            sectionTranslation,
            mediaTranslationMap,
          ] =
            await Promise.all([
              getContentTranslation({
                entityType:
                  ENTRY_ENTITY_TYPE,

                entityId:
                  String(
                    data.id
                  ),

                language,
              }),

              getContentTranslation({
                entityType:
                  SECTION_ENTITY_TYPE,

                entityId:
                  String(
                    data.skate_sections.id
                  ),

                language,
              }),

              originalMedia.length >
                0
                ? getContentTranslations({
                    entityType:
                      MEDIA_ENTITY_TYPE,

                    entityIds:
                      originalMedia.map(
                        (
                          mediaItem
                        ) =>
                          String(
                            mediaItem.id
                          )
                      ),

                    language,
                  })
                : Promise.resolve(
                    new Map()
                  ),
            ]);


          if (!active) {
            return;
          }


          const translatedSection =
            applyContentTranslation(
              data.skate_sections,
              sectionTranslation
            );


          nextEntry = {
            ...applyContentTranslation(
              data,
              entryTranslation
            ),

            skate_sections:
              translatedSection,
          };


          nextMedia =
            originalMedia.map(
              (
                mediaItem
              ) =>
                applyContentTranslation(
                  mediaItem,
                  mediaTranslationMap.get(
                    String(
                      mediaItem.id
                    )
                  ) ||
                    null
                )
            );
        } catch (
          translationError
        ) {
          console.error(
            "Učitavanje skate prevoda:",
            translationError
          );
        }
      }


      setEntry(
        nextEntry
      );

      setMedia(
        nextMedia
      );

      setLoading(false);
    }


    loadEntry();


    return () => {
      active = false;
    };
  }, [
    sectionSlug,
    entrySlug,
    language,
  ]);


  useEffect(() => {
    if (!lightboxOpen) {
      return undefined;
    }


    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setLightboxOpen(
          false
        );
      }
    }


    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    lightboxOpen,
  ]);


  const activeMedia =
    media[
      activeMediaIndex
    ] || null;


  const youtubeEmbedUrl =
    useMemo(
      () =>
        activeMedia
          ?.media_type ===
        "youtube"
          ? normalizeYouTubeEmbedUrl(
              activeMedia.url
            )
          : "",
      [
        activeMedia,
      ]
    );


  if (notFound) {
    return (
      <Navigate
        to={
          archivePath
        }
        replace
      />
    );
  }


  function showPreviousMedia() {
    setActiveMediaIndex(
      (currentIndex) =>
        currentIndex <= 0
          ? media.length - 1
          : currentIndex - 1
    );
  }


  function showNextMedia() {
    setActiveMediaIndex(
      (currentIndex) =>
        currentIndex >=
        media.length - 1
          ? 0
          : currentIndex + 1
    );
  }


  function renderActiveMedia() {
    if (!activeMedia) {
      if (
        entry?.cover_url
      ) {
        return (
          <button
            type="button"
            className="human-one-skate__entry-image-button"
            onClick={() =>
              setLightboxOpen(
                true
              )
            }
          >
            <img
              src={
                entry.cover_url
              }
              alt=""
            />
          </button>
        );
      }


      return (
        <div className="human-one-skate__entry-media-empty">
          NO MEDIA
        </div>
      );
    }


    if (
      activeMedia
        .media_type ===
      "image"
    ) {
      return (
        <button
          type="button"
          className="human-one-skate__entry-image-button"
          onClick={() =>
            setLightboxOpen(
              true
            )
          }
        >
          <img
            src={
              activeMedia.url
            }
            alt={
              activeMedia
                .caption ||
              ""
            }
          />
        </button>
      );
    }


    if (
      activeMedia
        .media_type ===
      "video"
    ) {
      return (
        <video
          key={
            activeMedia.id
          }
          className="human-one-skate__video"
          controls
          preload="metadata"
          playsInline
        >
          <source
            src={
              activeMedia.url
            }
          />

          {t(
            "skate.videoUnsupported",
            language ===
              LANGUAGES.EN
              ? "Your browser does not support video."
              : "Твој прегледач не подржава видео."
          )}
        </video>
      );
    }


    if (
      activeMedia
        .media_type ===
        "youtube" &&
      youtubeEmbedUrl
    ) {
      return (
        <iframe
          className="human-one-skate__youtube"
          src={
            youtubeEmbedUrl
          }
          title={
            activeMedia.caption ||
            entry.title
          }
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      );
    }


    return (
      <a
        className="human-one-skate__external-media"
        href={
          activeMedia.url
        }
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>
          ↗
        </span>

        <strong>
          {t(
            "skate.openMediaLink",
            language ===
              LANGUAGES.EN
              ? "OPEN VIDEO / LINK"
              : "ОТВОРИ СНИМАК / ЛИНК"
          )}
        </strong>

        <small>
          {t(
            "skate.newTab",
            language ===
              LANGUAGES.EN
              ? "NEW TAB"
              : "НОВИ ТАБ"
          )}
        </small>
      </a>
    );
  }


  const lightboxImageUrl =
    activeMedia
      ?.media_type ===
    "image"
      ? activeMedia.url
      : entry
          ?.cover_url ||
        "";


  const sectionDisplayName =
    getSectionDisplayName(
      entry?.skate_sections,
      t
    );


  return (
    <main className="human-one-skate human-one-skate--entry">
      <Link
        to={
          archivePath
        }
        className="human-one-skate__back"
      >
        ← {t(
          "skate.archive",
          "АРХИВА"
        )}
      </Link>


      <LanguageMenuControl />


      {loading ? (
        <div className="human-one-skate__state">
          {t(
            "common.loading"
          )}
        </div>

      ) : errorMessage ? (
        <div className="human-one-skate__state">
          {t(
            errorMessage,
            language ===
              LANGUAGES.EN
              ? "THIS CONTENT IS CURRENTLY UNAVAILABLE."
              : "САДРЖАЈ ТРЕНУТНО НИЈЕ ДОСТУПАН."
          )}
        </div>

      ) : entry ? (
        <article className="human-one-skate__entry">
          <header className="human-one-skate__entry-heading">
            <p>
              {sectionDisplayName}
            </p>

            <h1>
              {
                entry.title
              }
            </h1>


            {(entry.entry_date ||
              entry.location) && (
              <div className="human-one-skate__entry-meta">
                {entry.entry_date && (
                  <span>
                    {
                      formatEntryDate(
                        entry.entry_date,
                        language
                      )
                    }
                  </span>
                )}

                {entry.location && (
                  <span>
                    {
                      entry.location
                    }
                  </span>
                )}
              </div>
            )}
          </header>


          <section className="human-one-skate__media-viewer">
            <div className="human-one-skate__media-stage">
              {
                renderActiveMedia()
              }
            </div>


            {activeMedia
              ?.caption && (
              <p className="human-one-skate__media-caption">
                {
                  activeMedia.caption
                }
              </p>
            )}


            {media.length > 1 && (
              <>
                <div className="human-one-skate__media-controls">
                  <button
                    type="button"
                    onClick={
                      showPreviousMedia
                    }
                    aria-label={
                      t(
                        "skate.previousMedia",
                        language ===
                          LANGUAGES.EN
                          ? "Previous media"
                          : "Претходни медиј"
                      )
                    }
                  >
                    ←
                  </button>

                  <span>
                    {activeMediaIndex +
                      1}

                    {" / "}

                    {media.length}
                  </span>

                  <button
                    type="button"
                    onClick={
                      showNextMedia
                    }
                    aria-label={
                      t(
                        "skate.nextMedia",
                        language ===
                          LANGUAGES.EN
                          ? "Next media"
                          : "Следећи медиј"
                      )
                    }
                  >
                    →
                  </button>
                </div>


                <div className="human-one-skate__media-strip">
                  {media.map(
                    (
                      mediaItem,
                      index
                    ) => (
                      <button
                        key={
                          mediaItem.id
                        }
                        type="button"
                        className={
                          index ===
                          activeMediaIndex
                            ? "human-one-skate__media-thumb human-one-skate__media-thumb--active"
                            : "human-one-skate__media-thumb"
                        }
                        onClick={() =>
                          setActiveMediaIndex(
                            index
                          )
                        }
                      >
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
                          <span>
                            {mediaItem
                              .media_type ===
                            "video"
                              ? "VIDEO"
                              : mediaItem
                                    .media_type ===
                                  "youtube"
                                ? "YT"
                                : "LINK"}
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </section>


          <section className="human-one-skate__entry-text">
            {entry.excerpt && (
              <p className="human-one-skate__entry-lead">
                {
                  entry.excerpt
                }
              </p>
            )}

            <div>
              {
                entry.body
              }
            </div>
          </section>
        </article>
      ) : null}


      {lightboxOpen &&
        lightboxImageUrl && (
        <div
          className="human-one-skate__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={
            t(
              "skate.enlargedPhoto",
              language ===
                LANGUAGES.EN
                ? "Enlarged photo"
                : "Увећана фотографија"
            )
          }
          onPointerDown={() =>
            setLightboxOpen(
              false
            )
          }
        >
          <button
            type="button"
            onClick={() =>
              setLightboxOpen(
                false
              )
            }
            aria-label={
              t(
                "skate.closePhoto",
                language ===
                  LANGUAGES.EN
                  ? "Close photo"
                  : "Затвори фотографију"
              )
            }
          >
            ×
          </button>

          <img
            src={
              lightboxImageUrl
            }
            alt=""
            onPointerDown={
              (event) =>
                event.stopPropagation()
            }
          />
        </div>
      )}
    </main>
  );
}


export default HumanOneSkateEntry;