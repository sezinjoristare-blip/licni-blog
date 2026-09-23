import {
  useEffect,
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

import {
  playUiBack,
  playUiSelect,
} from "../audio/uiSounds";

import "../styles/HumanOneSkate.css";


const SECTION_ENTITY_TYPE =
  "skate_section";

const ENTRY_ENTITY_TYPE =
  "skate_entry";


const PERSON_NAMES = {
  seki:
    "Сергеј Ристић Секи",

  toka:
    "Тодор Павловић Тока",

  lento:
    "Огњен Леонтијевић Ленто",

  doske:
    "Доситеј Обрадовић Доске",

  vojin:
    "Лазар Војиновић Војин",

  caki:
    "Андреј Филиповић Чаки",
};


const PERSON_NAME_KEYS = {
  seki:
    "skate.people.seki.name",

  toka:
    "skate.people.toka.name",

  lento:
    "skate.people.lento.name",

  doske:
    "skate.people.doske.name",

  vojin:
    "skate.people.vojin.name",

  caki:
    "skate.people.caki.name",
};


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
        "medium",
    }
  ).format(
    date
  );
}


function getSectionDisplayName(
  sectionSlug,
  section,
  t
) {
  if (
    sectionSlug ===
    "ekipa-zid"
  ) {
    return t(
      "skate.zoneCrewWall",
      section?.name ||
        "ЕКИПА / ЗИД"
    );
  }


  if (
    sectionSlug ===
    "voznja"
  ) {
    return t(
      "skate.zoneRide",
      section?.name ||
        "ВОЖЊА"
    );
  }


  if (
    sectionSlug ===
    "ulica"
  ) {
    return t(
      "skate.zoneStreet",
      section?.name ||
        "УЛИЦА"
    );
  }


  if (
    sectionSlug ===
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
    t(
      "skate.archive",
      "АРХИВА"
    )
  );
}


function getSectionDisplayDescription(
  sectionSlug,
  section,
  language,
  t
) {
  /*
   * SR:
   * čuvamo opis iz baze tačno kako je unet.
   *
   * EN:
   * ako postoji objavljen content_translation,
   * applyContentTranslation dodaje __translation
   * i koristimo taj prevedeni description.
   *
   * Ako EN prevod još ne postoji,
   * tri stalne Skejt zone imaju svoj
   * ugrađeni engleski prevod.
   */

  if (
    language ===
    LANGUAGES.SR
  ) {
    if (
      section?.description
    ) {
      return section.description;
    }
  }


  if (
    language ===
      LANGUAGES.EN &&
    section?.__translation &&
    section?.description
  ) {
    return section.description;
  }


  if (
    sectionSlug ===
    "ekipa-zid"
  ) {
    return t(
      "skate.zoneCrewWallDescription",
      section?.description ||
        ""
    );
  }


  if (
    sectionSlug ===
    "voznja"
  ) {
    return t(
      "skate.zoneRideDescription",
      section?.description ||
        ""
    );
  }


  if (
    sectionSlug ===
    "ulica"
  ) {
    return t(
      "skate.zoneStreetDescription",
      section?.description ||
        ""
    );
  }


  return (
    section?.description ||
    ""
  );
}


function HumanOneSkateSection() {
  const {
    sectionSlug,
  } = useParams();


  const [
    searchParams,
  ] = useSearchParams();


  const {
    language,
    t,
  } =
    useLanguage();


  const requestedPersonKey =
    searchParams.get(
      "osoba"
    ) || "";


  const personKey =
    sectionSlug ===
      "dogodovstine" &&
    PERSON_NAMES[
      requestedPersonKey
    ]
      ? requestedPersonKey
      : "";


  const personName =
    personKey
      ? t(
          PERSON_NAME_KEYS[
            personKey
          ],
          PERSON_NAMES[
            personKey
          ]
        )
      : "";


  const [
    section,
    setSection,
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
    notFound,
    setNotFound,
  ] = useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  useEffect(() => {
    let active =
      true;


    async function loadArchive() {
      setLoading(
        true
      );


      setNotFound(
        false
      );


      setErrorMessage(
        ""
      );


      const {
        data:
          sectionData,

        error:
          sectionError,
      } =
        await supabase
          .from(
            "skate_sections"
          )
          .select(`
            id,
            name,
            slug,
            description,
            image_url
          `)
          .eq(
            "slug",
            sectionSlug
          )
          .eq(
            "status",
            "published"
          )
          .maybeSingle();


      if (!active) {
        return;
      }


      if (sectionError) {
        console.error(
          "Učitavanje skate arhive:",
          sectionError
        );


        setErrorMessage(
          "skate.archiveUnavailable"
        );


        setLoading(
          false
        );


        return;
      }


      if (!sectionData) {
        setNotFound(
          true
        );


        setLoading(
          false
        );


        return;
      }


      let entryQuery =
        supabase
          .from(
            "skate_entries"
          )
          .select(`
            id,
            title,
            slug,
            excerpt,
            cover_url,
            entry_date,
            location,
            sort_order,
            person_key
          `)
          .eq(
            "section_id",
            sectionData.id
          )
          .eq(
            "status",
            "published"
          );


      if (personKey) {
        entryQuery =
          entryQuery.eq(
            "person_key",
            personKey
          );
      }


      const {
        data:
          entryData,

        error:
          entryError,
      } =
        await entryQuery
          .order(
            "sort_order",
            {
              ascending:
                true,
            }
          )
          .order(
            "entry_date",
            {
              ascending:
                false,

              nullsFirst:
                false,
            }
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );


      if (!active) {
        return;
      }


      if (entryError) {
        console.error(
          "Učitavanje skate zapisa:",
          entryError
        );


        setErrorMessage(
          "skate.entriesUnavailable"
        );


        setLoading(
          false
        );


        return;
      }


      const originalEntries =
        entryData ?? [];


      let nextSection =
        sectionData;


      let nextEntries =
        originalEntries;


      if (
        language !==
        LANGUAGES.SR
      ) {
        try {
          const [
            sectionTranslation,
            entryTranslationMap,
          ] =
            await Promise.all([
              getContentTranslation({
                entityType:
                  SECTION_ENTITY_TYPE,

                entityId:
                  String(
                    sectionData.id
                  ),

                language,
              }),

              originalEntries.length >
                0
                ? getContentTranslations({
                    entityType:
                      ENTRY_ENTITY_TYPE,

                    entityIds:
                      originalEntries.map(
                        (
                          entry
                        ) =>
                          String(
                            entry.id
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


          nextSection =
            applyContentTranslation(
              sectionData,
              sectionTranslation
            );


          nextEntries =
            originalEntries.map(
              (
                entry
              ) =>
                applyContentTranslation(
                  entry,
                  entryTranslationMap.get(
                    String(
                      entry.id
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


      setSection(
        nextSection
      );


      setEntries(
        nextEntries
      );


      setLoading(
        false
      );
    }


    loadArchive();


    return () => {
      active =
        false;
    };
  }, [
    sectionSlug,
    personKey,
    language,
  ]);


  if (notFound) {
    return (
      <Navigate
        to="/autor/covek/skejt"
        replace
      />
    );
  }


  const sectionDisplayName =
    getSectionDisplayName(
      sectionSlug,
      section,
      t
    );


  const sectionDisplayDescription =
    getSectionDisplayDescription(
      sectionSlug,
      section,
      language,
      t
    );


  return (
    <main className="human-one-skate human-one-skate--archive">
      <Link
        to="/autor/covek/skejt"
        className="human-one-skate__back"
        onClick={
          playUiBack
        }
      >
        {t(
          "skate.backToWorld",
          "← СКЕЈТ СВЕТ"
        )}
      </Link>


      <LanguageMenuControl />


      <section className="human-one-skate__archive-shell">
        <header className="human-one-skate__archive-heading">
          <p>
            {personName
              ? `${t(
                  "skate.personalAdventures",
                  "ЛИЧНЕ ДОГОДОВШТИНЕ"
                )} / HUMAN_01`
              : "STREET ARCHIVE / HUMAN_01"}
          </p>


          <h1>
            {personName ||
              sectionDisplayName}
          </h1>


          {personName ? (
            <span>
              {t(
                "skate.personArchiveDescription",
                "Само догодовштине које је објавио овај лик."
              )}
            </span>

          ) : sectionDisplayDescription ? (
            <span>
              {
                sectionDisplayDescription
              }
            </span>

          ) : null}
        </header>


        {loading ? (
          <div className="human-one-skate__state">
            {t(
              "common.loading"
            )}
          </div>

        ) : errorMessage ? (
          <div className="human-one-skate__state">
            {t(
              errorMessage
            )}
          </div>

        ) : !entries.length ? (
          <div className="human-one-skate__state">
            {t(
              "skate.archiveEmpty"
            )}
          </div>

        ) : (
          <div className="human-one-skate__archive-grid">
            {entries.map(
              (
                entry
              ) => (
                <Link
                  key={
                    entry.id
                  }
                  to={
                    `/autor/covek/skejt/${sectionSlug}/${entry.slug}${personKey
                      ? `?osoba=${encodeURIComponent(
                          personKey
                        )}`
                      : ""}`
                  }
                  className="human-one-skate__archive-card"
                  onClick={
                    playUiSelect
                  }
                >
                  <div className="human-one-skate__archive-photo">
                    {entry.cover_url ? (
                      <img
                        src={
                          entry.cover_url
                        }
                        alt=""
                      />
                    ) : (
                      <div className="human-one-skate__archive-photo-fallback">
                        NO IMAGE
                      </div>
                    )}
                  </div>


                  <div className="human-one-skate__archive-card-body">
                    <h2>
                      {
                        entry.title
                      }
                    </h2>


                    {(entry.entry_date ||
                      entry.location) && (
                      <p className="human-one-skate__meta">
                        {entry.entry_date && (
                          <span>
                            {formatEntryDate(
                              entry.entry_date,
                              language
                            )}
                          </span>
                        )}


                        {entry.location && (
                          <span>
                            {
                              entry.location
                            }
                          </span>
                        )}
                      </p>
                    )}


                    {entry.excerpt && (
                      <p>
                        {
                          entry.excerpt
                        }
                      </p>
                    )}
                  </div>
                </Link>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}


export default HumanOneSkateSection;