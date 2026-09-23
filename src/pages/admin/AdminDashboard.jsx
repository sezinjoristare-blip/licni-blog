import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import AdminContentExplorer
  from "../../components/admin/AdminContentExplorer";

import "../../styles/admin/AdminDashboard.css";


const DRAFT_PREFIX =
  "seki-admin-draft:v2:";


const QUICK_LINKS = [
  {
    number:
      "01",

    eyebrow:
      "ЛИКОВИ",

    title:
      "Кабинет",

    description:
      "Главни улаз у садржај Човека 1 и будућих ликова.",

    to:
      "/admin/likovi/covek-1",
  },

  {
    number:
      "02",

    eyebrow:
      "ЧОВЕК 1",

    title:
      "О мени",

    description:
      "Лични текстови и секције профила.",

    to:
      "/admin/likovi/covek-1/o-meni",
  },

  {
    number:
      "03",

    eyebrow:
      "ЧОВЕК 1",

    title:
      "Музика",

    description:
      "Жанрови, препоруке, анализе и преводи.",

    to:
      "/admin/likovi/covek-1/muzika",
  },

  {
    number:
      "04",

    eyebrow:
      "ЧОВЕК 1",

    title:
      "Текстови",

    description:
      "Постери, категорије, текстови и PDF радови.",

    to:
      "/admin/likovi/covek-1/tekstovi",
  },

  {
    number:
      "05",

    eyebrow:
      "ЧОВЕК 1",

    title:
      "Скејт",

    description:
      "Зоне, догодовштине и street архива.",

    to:
      "/admin/likovi/covek-1/skejt",
  },

  {
    number:
      "06",

    eyebrow:
      "АКЦ ОБАЛА",

    title:
      "Свеска",

    description:
      "Текстови, инспирације и пратећи медији.",

    to:
      "/admin/likovi/covek-1/obala-sveska",
  },

  {
    number:
      "07",

    eyebrow:
      "АКЦ ОБАЛА",

    title:
      "Пано",

    description:
      "Догађаји, постери, reader блокови и архива.",

    to:
      "/admin/likovi/covek-1/obala-pano",
  },

  {
    number:
      "08",

    eyebrow:
      "СИСТЕМ",

    title:
      "Изглед сајта",

    description:
      "Почетне слике, ликови и основна подешавања.",

    to:
      "/admin/izgled",
  },
];


function readLocalDrafts() {
  if (
    typeof window ===
    "undefined"
  ) {
    return [];
  }


  const results =
    [];


  for (
    let index = 0;
    index <
      window.localStorage.length;
    index += 1
  ) {
    const storageKey =
      window.localStorage
        .key(
          index
        );


    if (
      !storageKey ||
      !storageKey.startsWith(
        DRAFT_PREFIX
      )
    ) {
      continue;
    }


    try {
      const rawValue =
        window.localStorage
          .getItem(
            storageKey
          );


      if (!rawValue) {
        continue;
      }


      const parsed =
        JSON.parse(
          rawValue
        );


      const draftKey =
        parsed.draftKey ||
        storageKey.slice(
          DRAFT_PREFIX.length
        );


      results.push({
        storageKey,

        draftKey,

        updatedAt:
          parsed.updatedAt ||
          null,

        payload:
          parsed.payload ??
          null,
      });

    } catch {
      // Pokvaren lokalni zapis
      // ne sme da obori dashboard.
    }
  }


  return results.sort(
    (
      first,
      second
    ) => {
      const firstTime =
        new Date(
          first.updatedAt ||
          0
        ).getTime();


      const secondTime =
        new Date(
          second.updatedAt ||
          0
        ).getTime();


      return (
        secondTime -
        firstTime
      );
    }
  );
}


function getDraftContentTitle(
  draft
) {
  const payload =
    draft.payload;


  if (
    !payload ||
    typeof payload !==
      "object"
  ) {
    return "";
  }


  const candidates = [
    payload.title,

    payload.name,

    payload.form?.title,

    payload.form?.name,

    payload.settings
      ?.about_heading,

    payload.about_heading,
  ];


  const title =
    candidates.find(
      (
        value
      ) =>
        typeof value ===
          "string" &&
        value.trim()
    );


  return title
    ? title.trim()
    : "";
}


function resolveDraftMeta(
  draftKey
) {
  const key =
    String(
      draftKey ||
      ""
    );


  if (
    key.startsWith(
      "character-about:"
    )
  ) {
    const parts =
      key.split(
        ":"
      );


    const characterKey =
      parts[1] ||
      "covek-1";


    const sectionKey =
      parts
        .slice(
          2
        )
        .join(
          ":"
        );


    return {
      section:
        "О МЕНИ",

      label:
        sectionKey
          ? `Секција: ${sectionKey}`
          : "О мени",

      to:
        sectionKey
          ? `/admin/likovi/${characterKey}/o-meni/${sectionKey}`
          : `/admin/likovi/${characterKey}/o-meni`,
    };
  }


  if (
    key ===
    "site-settings:main"
  ) {
    return {
      section:
        "СИСТЕМ",

      label:
        "Изглед сајта",

      to:
        "/admin/izgled",
    };
  }


  if (
    key.startsWith(
      "articles:"
    )
  ) {
    const [
      ,
      characterKey =
        "covek-1",
      articleId,
    ] =
      key.split(
        ":"
      );


    return {
      section:
        "ТЕКСТОВИ",

      label:
        articleId ===
          "new"
          ? "Нови текст"
          : "Уређивање текста",

      to:
        articleId ===
          "new"
          ? `/admin/likovi/${characterKey}/tekstovi/novi`
          : `/admin/likovi/${characterKey}/tekstovi/${articleId}`,
    };
  }


  if (
    key.startsWith(
      "obala-notebook:"
    )
  ) {
    const [
      ,
      characterKey =
        "covek-1",
      entryId,
    ] =
      key.split(
        ":"
      );


    return {
      section:
        "ОБАЛА / СВЕСКА",

      label:
        entryId ===
          "new"
          ? "Нови запис"
          : "Уређивање записа",

      to:
        entryId ===
          "new"
          ? `/admin/likovi/${characterKey}/obala-sveska/novi`
          : `/admin/likovi/${characterKey}/obala-sveska/${entryId}`,
    };
  }


  if (
    key.startsWith(
      "obala-board:"
    )
  ) {
    const [
      ,
      characterKey =
        "covek-1",
      eventId,
    ] =
      key.split(
        ":"
      );


    return {
      section:
        "ОБАЛА / ПАНО",

      label:
        eventId ===
          "new"
          ? "Нови догађај"
          : "Уређивање догађаја",

      to:
        eventId ===
          "new"
          ? `/admin/likovi/${characterKey}/obala-pano/novi`
          : `/admin/likovi/${characterKey}/obala-pano/${eventId}`,
    };
  }


  if (
    key.includes(
      "music"
    ) ||
    key.includes(
      "muzika"
    )
  ) {
    if (
      key.includes(
        "anal"
      )
    ) {
      return {
        section:
          "МУЗИКА",

        label:
          "Анализа / превод",

        to:
          "/admin/likovi/covek-1/muzika/analize",
      };
    }


    if (
      key.includes(
        "recommend"
      ) ||
      key.includes(
        "prepor"
      )
    ) {
      return {
        section:
          "МУЗИКА",

        label:
          "Препорука",

        to:
          "/admin/likovi/covek-1/muzika/preporuke",
      };
    }


    return {
      section:
        "МУЗИКА",

      label:
        "Жанр",

      to:
        "/admin/likovi/covek-1/muzika/zanrovi",
    };
  }


  if (
    key.includes(
      "skate"
    ) ||
    key.includes(
      "skejt"
    )
  ) {
    return {
      section:
        "СКЕЈТ",

      label:
        "Архивски запис",

      to:
        "/admin/likovi/covek-1/skejt/arhiva",
    };
  }


  if (
    key.includes(
      "poster"
    ) &&
    key.includes(
      "categor"
    )
  ) {
    return {
      section:
        "ТЕКСТОВИ",

      label:
        "Категорија постера",

      to:
        "/admin/likovi/covek-1/tekstovi/kategorije",
    };
  }


  if (
    key.includes(
      "categor"
    )
  ) {
    return {
      section:
        "САДРЖАЈ",

      label:
        "Категорија",

      to:
        "/admin/kategorije",
    };
  }


  return {
    section:
      "ЛОКАЛНИ НАЦРТ",

    label:
      "Незавршене измене",

    to:
      null,
  };
}


function formatRelativeTime(
  value
) {
  if (!value) {
    return "раније";
  }


  const time =
    new Date(
      value
    ).getTime();


  if (
    Number.isNaN(
      time
    )
  ) {
    return "раније";
  }


  const difference =
    Date.now() -
    time;


  const seconds =
    Math.max(
      0,
      Math.floor(
        difference /
        1000
      )
    );


  if (
    seconds <
    60
  ) {
    return "управо";
  }


  const minutes =
    Math.floor(
      seconds /
      60
    );


  if (
    minutes <
    60
  ) {
    return `пре ${minutes} мин`;
  }


  const hours =
    Math.floor(
      minutes /
      60
    );


  if (
    hours <
    24
  ) {
    return `пре ${hours} ч`;
  }


  const days =
    Math.floor(
      hours /
      24
    );


  return `пре ${days} д`;
}


function AdminDashboard() {
  const [
    drafts,
    setDrafts,
  ] = useState([]);


  useEffect(() => {
    function refreshDrafts() {
      setDrafts(
        readLocalDrafts()
      );
    }


    refreshDrafts();


    window.addEventListener(
      "storage",
      refreshDrafts
    );


    window.addEventListener(
      "focus",
      refreshDrafts
    );


    return () => {
      window.removeEventListener(
        "storage",
        refreshDrafts
      );


      window.removeEventListener(
        "focus",
        refreshDrafts
      );
    };
  }, []);


  const recentDrafts =
    useMemo(
      () =>
        drafts
          .map(
            (
              draft
            ) => ({
              ...draft,

              ...resolveDraftMeta(
                draft.draftKey
              ),

              contentTitle:
                getDraftContentTitle(
                  draft
                ),
            })
          )
          .slice(
            0,
            5
          ),
      [
        drafts,
      ]
    );


  return (
    <section className="admin-dashboard-v3">
      <header className="admin-dashboard-v3__hero">
        <div>
          <p className="eyebrow">
            АУТОРСКИ СТО
          </p>

          <h1>
            Контролна
            <br />
            табла
          </h1>

          <p className="admin-dashboard-v3__intro">
            Једно место за
            садржај, ликове,
            светове и незавршене
            радове.
          </p>
        </div>


        <div className="admin-dashboard-v3__hero-stamp">
          <small>
            CMS
          </small>

          <strong>
            SR
          </strong>

          <span>
            PRIVATE
          </span>
        </div>
      </header>


      <section
        className="admin-dashboard-v3__stats"
        aria-label="Статус администрације"
      >
        <article className="admin-dashboard-v3__stat">
          <p>
            ЛОКАЛНИ НАЦРТИ
          </p>

          <strong>
            {drafts.length}
          </strong>

          <span>
            {drafts.length ===
            0
              ? "Нема незавршених локалних измена."
              : "Измене које чекају коначно чување."}
          </span>
        </article>


        <article className="admin-dashboard-v3__stat">
          <p>
            ЗАШТИТА УНОСА
          </p>

          <strong className="admin-dashboard-v3__stat-word">
            АКТИВНА
          </strong>

          <span>
            Текст и изабрани
            фајлови имају локални
            recovery.
          </span>
        </article>


        <article className="admin-dashboard-v3__stat">
          <p>
            БРЗИ УЛАЗИ
          </p>

          <strong>
            {QUICK_LINKS.length}
          </strong>

          <span>
            Главне радне целине
            доступне су испод.
          </span>
        </article>
      </section>


      <AdminContentExplorer />


      <section className="admin-dashboard-v3__section">
        <div className="admin-dashboard-v3__section-heading">
          <div>
            <p className="eyebrow">
              RECOVERY
            </p>

            <h2>
              Настави рад
            </h2>

            <p>
              Последњи локално
              сачувани уноси.
            </p>
          </div>


          {drafts.length >
          0 ? (
            <span className="admin-badge admin-badge--accent">
              {drafts.length}
              {" "}
              {drafts.length ===
              1
                ? "НАЦРТ"
                : "НАЦРТА"}
            </span>
          ) : null}
        </div>


        {recentDrafts.length ===
        0 ? (
          <div className="admin-dashboard-v3__empty">
            <div className="admin-dashboard-v3__empty-mark">
              ✓
            </div>

            <div>
              <strong>
                Радни сто је чист.
              </strong>

              <p>
                Тренутно немаш
                незавршене локалне
                нацрте.
              </p>
            </div>
          </div>

        ) : (
          <div className="admin-dashboard-v3__drafts">
            {recentDrafts.map(
              (
                draft
              ) => {
                const content = (
                  <>
                    <div className="admin-dashboard-v3__draft-index">
                      •
                    </div>


                    <div className="admin-dashboard-v3__draft-copy">
                      <div className="admin-dashboard-v3__draft-meta">
                        <span>
                          {draft.section}
                        </span>

                        <time>
                          {formatRelativeTime(
                            draft.updatedAt
                          )}
                        </time>
                      </div>


                      <strong>
                        {draft.contentTitle ||
                          draft.label}
                      </strong>


                      {draft.contentTitle ? (
                        <small>
                          {draft.label}
                        </small>
                      ) : null}
                    </div>


                    {draft.to ? (
                      <span
                        className="admin-dashboard-v3__draft-arrow"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    ) : null}
                  </>
                );


                return draft.to ? (
                  <Link
                    key={
                      draft.storageKey
                    }
                    to={
                      draft.to
                    }
                    className="admin-dashboard-v3__draft"
                  >
                    {content}
                  </Link>

                ) : (
                  <div
                    key={
                      draft.storageKey
                    }
                    className="admin-dashboard-v3__draft admin-dashboard-v3__draft--disabled"
                  >
                    {content}
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>


      <section className="admin-dashboard-v3__section">
        <div className="admin-dashboard-v3__section-heading">
          <div>
            <p className="eyebrow">
              РАДНИ ПРОСТОР
            </p>

            <h2>
              Уређивање
            </h2>

            <p>
              Брз приступ главним
              деловима сајта.
            </p>
          </div>
        </div>


        <div className="admin-dashboard-v3__quick-grid">
          {QUICK_LINKS.map(
            (
              item
            ) => (
              <Link
                key={
                  item.to
                }
                to={
                  item.to
                }
                className="admin-dashboard-v3__quick-card"
              >
                <div className="admin-dashboard-v3__quick-top">
                  <span className="admin-dashboard-v3__quick-number">
                    {item.number}
                  </span>

                  <span className="admin-dashboard-v3__quick-arrow">
                    ↗
                  </span>
                </div>


                <div>
                  <p>
                    {item.eyebrow}
                  </p>

                  <h3>
                    {item.title}
                  </h3>

                  <span>
                    {item.description}
                  </span>
                </div>
              </Link>
            )
          )}
        </div>
      </section>


      <footer className="admin-dashboard-v3__footer">
        <div>
          <span>
            SEKИ / ADMIN
          </span>

          <strong>
            Садржај се објављује
            тек када га изричито
            сачуваш.
          </strong>
        </div>


        <a
          href="/"
          target="_blank"
          rel="noreferrer"
        >
          ПРЕГЛЕД САЈТА ↗
        </a>
      </footer>
    </section>
  );
}


export default AdminDashboard;