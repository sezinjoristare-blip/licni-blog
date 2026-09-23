import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  supabase,
} from "../../lib/supabaseClient";

import "../../styles/admin/AdminContentExplorer.css";
import "../../styles/admin/AdminContentExplorerModal.css";


const SOURCES = [
  {
    key:
      "articles",

    label:
      "Текстови",

    singular:
      "Текст",

    table:
      "articles",

    select: `
      id,
      title,
      subtitle,
      slug,
      status,
      content_type,
      created_at,
      published_at,
      character_key,
      categories (
        id,
        name,
        slug
      )
    `,
  },

  {
    key:
      "music-recommendations",

    label:
      "Музичке препоруке",

    singular:
      "Препорука",

    table:
      "music_recommendations",

    select: `
      id,
      title,
      artist,
      slug,
      status,
      sort_order,
      created_at,
      music_genres (
        id,
        name,
        slug
      )
    `,
  },

  {
    key:
      "music-analyses",

    label:
      "Анализе и преводи",

    singular:
      "Анализа",

    table:
      "music_analysis_works",

    select: `
      id,
      title,
      artist,
      slug,
      status,
      sort_order,
      created_at
    `,
  },

  {
    key:
      "skate",

    label:
      "Скејт архива",

    singular:
      "Скејт запис",

    table:
      "skate_entries",

    select: `
      id,
      title,
      slug,
      status,
      created_at,
      entry_date,
      location,
      section_id,
      skate_sections (
        id,
        name,
        slug
      )
    `,
  },

  {
    key:
      "obala-notebook",

    label:
      "Обала — Свеска",

    singular:
      "Запис у Свесци",

    table:
      "obala_notebook_entries",

    select: `
      id,
      title,
      status,
      sort_order,
      media_type,
      created_at
    `,
  },

  {
    key:
      "obala-board",

    label:
      "Обала — Пано",

    singular:
      "Догађај",

    table:
      "obala_events",

    select: `
      id,
      title,
      category,
      location,
      status,
      event_date,
      visible_from,
      expires_at,
      created_at
    `,
  },
];


function normalizeText(
  value
) {
  return String(
    value ?? ""
  )
    .toLocaleLowerCase(
      "sr"
    )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}


function getStatusLabel(
  status
) {
  return status ===
    "published"
    ? "ОБЈАВЉЕН"
    : "НАЦРТ";
}


function getStatusClass(
  status
) {
  return status ===
    "published"
    ? "admin-content-explorer__status admin-content-explorer__status--published"
    : "admin-content-explorer__status admin-content-explorer__status--draft";
}


function getEditPath(
  sourceKey,
  row
) {
  if (
    sourceKey ===
    "articles"
  ) {
    const characterKey =
      row.character_key ||
      "covek-1";

    return `/admin/likovi/${characterKey}/tekstovi/${row.id}`;
  }


  if (
    sourceKey ===
    "music-recommendations"
  ) {
    return `/admin/likovi/covek-1/muzika/preporuke/${row.id}`;
  }


  if (
    sourceKey ===
    "music-analyses"
  ) {
    return `/admin/likovi/covek-1/muzika/analize/${row.id}`;
  }


  if (
    sourceKey ===
    "skate"
  ) {
    return `/admin/likovi/covek-1/skejt/arhiva/${row.id}`;
  }


  if (
    sourceKey ===
    "obala-notebook"
  ) {
    return `/admin/likovi/covek-1/obala-sveska/${row.id}`;
  }


  if (
    sourceKey ===
    "obala-board"
  ) {
    return `/admin/likovi/covek-1/obala-pano/${row.id}`;
  }


  return "/admin";
}


function getSecondaryText(
  sourceKey,
  row
) {
  if (
    sourceKey ===
    "articles"
  ) {
    return [
      row.categories
        ?.name ||
        "Без категорије",

      row.content_type ===
        "pdf"
        ? "PDF"
        : "Текст",
    ].join(
      " · "
    );
  }


  if (
    sourceKey ===
    "music-recommendations"
  ) {
    return [
      row.artist ||
        "Без извођача",

      row.music_genres
        ?.name ||
        "Без жанра",
    ].join(
      " · "
    );
  }


  if (
    sourceKey ===
    "music-analyses"
  ) {
    return (
      row.artist ||
      "Без извођача"
    );
  }


  if (
    sourceKey ===
    "skate"
  ) {
    return [
      row.skate_sections
        ?.name ||
        "Без зоне",

      row.location,
    ]
      .filter(
        Boolean
      )
      .join(
        " · "
      );
  }


  if (
    sourceKey ===
    "obala-notebook"
  ) {
    if (
      row.media_type &&
      row.media_type !==
        "none"
    ) {
      return `Медиј: ${row.media_type.toUpperCase()}`;
    }

    return "Текст";
  }


  if (
    sourceKey ===
    "obala-board"
  ) {
    return [
      row.category ||
        "Остало",

      row.location,
    ]
      .filter(
        Boolean
      )
      .join(
        " · "
      );
  }


  return "";
}


function getRelevantDate(
  sourceKey,
  row
) {
  if (
    sourceKey ===
      "skate" &&
    row.entry_date
  ) {
    return row.entry_date;
  }


  if (
    sourceKey ===
      "obala-board" &&
    row.event_date
  ) {
    return row.event_date;
  }


  return (
    row.created_at ||
    null
  );
}


function formatDate(
  value
) {
  if (!value) {
    return "—";
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }


  return date
    .toLocaleDateString(
      "sr-RS",
      {
        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric",
      }
    );
}


function normalizeItem(
  source,
  row
) {
  const secondary =
    getSecondaryText(
      source.key,
      row
    );


  const date =
    getRelevantDate(
      source.key,
      row
    );


  return {
    key:
      `${source.key}:${row.id}`,

    id:
      row.id,

    sourceKey:
      source.key,

    sourceLabel:
      source.label,

    singular:
      source.singular,

    table:
      source.table,

    title:
      row.title ||
      "Без наслова",

    secondary,

    status:
      row.status ===
        "published"
        ? "published"
        : "draft",

    date,

    createdAt:
      row.created_at ||
      null,

    editPath:
      getEditPath(
        source.key,
        row
      ),

    searchText:
      normalizeText(
        [
          row.title,
          row.subtitle,
          row.artist,
          row.category,
          row.location,
          row.slug,
          row.content_type,
          row.media_type,
          row.categories
            ?.name,
          row.music_genres
            ?.name,
          row.skate_sections
            ?.name,
          source.label,
          secondary,
        ]
          .filter(
            Boolean
          )
          .join(
            " "
          )
      ),

    raw:
      row,
  };
}


function AdminContentExplorer() {
  const searchInputRef =
    useRef(null);


  const loadedOnceRef =
    useRef(false);


  const [
    isOpen,
    setIsOpen,
  ] = useState(false);


  const [
    items,
    setItems,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    errors,
    setErrors,
  ] = useState([]);


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    query,
    setQuery,
  ] = useState("");


  const [
    typeFilter,
    setTypeFilter,
  ] = useState("all");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");


  const [
    sortMode,
    setSortMode,
  ] = useState(
    "newest"
  );


  const [
    selectedKeys,
    setSelectedKeys,
  ] = useState(
    () => new Set()
  );


  const [
    bulkSaving,
    setBulkSaving,
  ] = useState(false);


  const openExplorer =
    useCallback(
      () => {
        setIsOpen(
          true
        );


        window.setTimeout(
          () => {
            searchInputRef
              .current
              ?.focus();
          },
          80
        );
      },
      []
    );


  const closeExplorer =
    useCallback(
      () => {
        setIsOpen(
          false
        );
      },
      []
    );


  const loadContent =
    useCallback(
      async (
        quiet = false
      ) => {
        if (quiet) {
          setRefreshing(
            true
          );
        } else {
          setLoading(
            true
          );
        }


        setErrors([]);
        setMessage("");


        try {
          const results =
            await Promise.all(
              SOURCES.map(
                async (
                  source
                ) => {
                  const {
                    data,
                    error,
                  } =
                    await supabase
                      .from(
                        source.table
                      )
                      .select(
                        source.select
                      )
                      .order(
                        "created_at",
                        {
                          ascending:
                            false,
                        }
                      )
                      .limit(
                        500
                      );


                  return {
                    source,

                    data:
                      data ??
                      [],

                    error,
                  };
                }
              )
            );


          const nextItems =
            [];


          const nextErrors =
            [];


          results.forEach(
            (
              result
            ) => {
              if (
                result.error
              ) {
                nextErrors.push(
                  `${result.source.label}: ${result.error.message}`
                );

                return;
              }


              result.data
                .forEach(
                  (
                    row
                  ) => {
                    nextItems.push(
                      normalizeItem(
                        result.source,
                        row
                      )
                    );
                  }
                );
            }
          );


          setItems(
            nextItems
          );


          setErrors(
            nextErrors
          );


          setSelectedKeys(
            new Set()
          );


          loadedOnceRef
            .current =
            true;

        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      []
    );


  useEffect(() => {
    if (
      !isOpen ||
      loadedOnceRef.current
    ) {
      return;
    }


    loadContent();
  }, [
    isOpen,
    loadContent,
  ]);


  useEffect(() => {
    function handleKeyDown(
      event
    ) {
      const isShortcut =
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        event.key
          .toLowerCase() ===
          "k";


      if (
        isShortcut
      ) {
        event.preventDefault();

        openExplorer();

        return;
      }


      if (
        event.key !==
          "Escape" ||
        !isOpen
      ) {
        return;
      }


      if (
        document.activeElement ===
          searchInputRef.current &&
        query
      ) {
        setQuery("");

        return;
      }


      closeExplorer();
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
    closeExplorer,
    isOpen,
    openExplorer,
    query,
  ]);


  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }


    const previousOverflow =
      document.body
        .style
        .overflow;


    document.body
      .style
      .overflow =
      "hidden";


    return () => {
      document.body
        .style
        .overflow =
        previousOverflow;
    };
  }, [
    isOpen,
  ]);


  const filteredItems =
    useMemo(
      () => {
        const cleanQuery =
          normalizeText(
            query.trim()
          );


        const filtered =
          items.filter(
            (
              item
            ) => {
              if (
                typeFilter !==
                  "all" &&
                item.sourceKey !==
                  typeFilter
              ) {
                return false;
              }


              if (
                statusFilter !==
                  "all" &&
                item.status !==
                  statusFilter
              ) {
                return false;
              }


              if (
                cleanQuery &&
                !item.searchText
                  .includes(
                    cleanQuery
                  )
              ) {
                return false;
              }


              return true;
            }
          );


        return [
          ...filtered,
        ].sort(
          (
            first,
            second
          ) => {
            if (
              sortMode ===
              "title"
            ) {
              return first.title
                .localeCompare(
                  second.title,
                  "sr"
                );
            }


            if (
              sortMode ===
              "type"
            ) {
              const byType =
                first.sourceLabel
                  .localeCompare(
                    second.sourceLabel,
                    "sr"
                  );


              if (
                byType !==
                0
              ) {
                return byType;
              }


              return first.title
                .localeCompare(
                  second.title,
                  "sr"
                );
            }


            const firstTime =
              new Date(
                first.date ||
                first.createdAt ||
                0
              ).getTime();


            const secondTime =
              new Date(
                second.date ||
                second.createdAt ||
                0
              ).getTime();


            if (
              sortMode ===
              "oldest"
            ) {
              return (
                firstTime -
                secondTime
              );
            }


            return (
              secondTime -
              firstTime
            );
          }
        );
      },
      [
        items,
        query,
        sortMode,
        statusFilter,
        typeFilter,
      ]
    );


  const publishedCount =
    useMemo(
      () =>
        items.filter(
          (
            item
          ) =>
            item.status ===
            "published"
        ).length,
      [
        items,
      ]
    );


  const draftCount =
    items.length -
    publishedCount;


  const selectedItems =
    useMemo(
      () =>
        items.filter(
          (
            item
          ) =>
            selectedKeys.has(
              item.key
            )
        ),
      [
        items,
        selectedKeys,
      ]
    );


  const visibleKeys =
    useMemo(
      () =>
        filteredItems.map(
          (
            item
          ) =>
            item.key
        ),
      [
        filteredItems,
      ]
    );


  const allVisibleSelected =
    visibleKeys.length >
      0 &&
    visibleKeys.every(
      (
        key
      ) =>
        selectedKeys.has(
          key
        )
    );


  function toggleItem(
    key
  ) {
    setSelectedKeys(
      (
        current
      ) => {
        const next =
          new Set(
            current
          );


        if (
          next.has(
            key
          )
        ) {
          next.delete(
            key
          );
        } else {
          next.add(
            key
          );
        }


        return next;
      }
    );
  }


  function toggleVisible() {
    setSelectedKeys(
      (
        current
      ) => {
        const next =
          new Set(
            current
          );


        if (
          allVisibleSelected
        ) {
          visibleKeys
            .forEach(
              (
                key
              ) =>
                next.delete(
                  key
                )
            );
        } else {
          visibleKeys
            .forEach(
              (
                key
              ) =>
                next.add(
                  key
                )
            );
        }


        return next;
      }
    );
  }


  async function applyBulkStatus(
    nextStatus
  ) {
    if (
      !selectedItems.length ||
      bulkSaving
    ) {
      return;
    }


    const actionLabel =
      nextStatus ===
        "published"
        ? "објавити"
        : "вратити у нацрт";


    const confirmed =
      window.confirm(
        `${actionLabel.charAt(0).toUpperCase()}${actionLabel.slice(1)} ${selectedItems.length} изабраних ставки?`
      );


    if (!confirmed) {
      return;
    }


    setBulkSaving(
      true
    );

    setErrors([]);
    setMessage("");


    try {
      const groups =
        new Map();


      selectedItems.forEach(
        (
          item
        ) => {
          if (
            !groups.has(
              item.sourceKey
            )
          ) {
            groups.set(
              item.sourceKey,
              []
            );
          }


          groups.get(
            item.sourceKey
          ).push(
            item
          );
        }
      );


      const operations =
        [];


      for (
        const [
          sourceKey,
          groupItems,
        ] of groups
      ) {
        const source =
          SOURCES.find(
            (
              entry
            ) =>
              entry.key ===
              sourceKey
          );


        if (!source) {
          continue;
        }


        const ids =
          groupItems.map(
            (
              item
            ) =>
              item.id
          );


        const payload =
          sourceKey ===
          "articles"
            ? {
                status:
                  nextStatus,

                published_at:
                  nextStatus ===
                    "published"
                    ? new Date()
                        .toISOString()
                    : null,
              }
            : {
                status:
                  nextStatus,
              };


        operations.push(
          supabase
            .from(
              source.table
            )
            .update(
              payload
            )
            .in(
              "id",
              ids
            )
        );
      }


      const results =
        await Promise.all(
          operations
        );


      const failures =
        results.filter(
          (
            result
          ) =>
            result.error
        );


      if (
        failures.length
      ) {
        throw new Error(
          failures
            .map(
              (
                result
              ) =>
                result.error
                  .message
            )
            .join(
              " | "
            )
        );
      }


      setMessage(
        nextStatus ===
          "published"
          ? `${selectedItems.length} ставки је објављено.`
          : `${selectedItems.length} ставки је враћено у нацрт.`
      );


      await loadContent(
        true
      );

    } catch (
      error
    ) {
      setErrors([
        error?.message ||
          "Bulk измена није успела.",
      ]);

    } finally {
      setBulkSaving(
        false
      );
    }
  }


  function resetFilters() {
    setQuery("");

    setTypeFilter(
      "all"
    );

    setStatusFilter(
      "all"
    );

    setSortMode(
      "newest"
    );
  }


  return (
    <>
      <div className="admin-content-explorer-launcher">
        <button
          type="button"
          className="admin-content-explorer-launcher__button"
          onClick={
            openExplorer
          }
        >
          <span
            className="admin-content-explorer-launcher__icon"
            aria-hidden="true"
          >
            ⌕
          </span>

          <span>
            ПРЕТРАГА CMS-А
          </span>

          <kbd>
            Ctrl K
          </kbd>
        </button>
      </div>


      {isOpen ? (
        <div
          className="admin-content-explorer-modal"
          onMouseDown={
            (
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeExplorer();
              }
            }
          }
        >
          <section
            className="admin-content-explorer-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Претрага CMS садржаја"
          >
            <header className="admin-content-explorer-modal__topbar">
              <div>
                <span>
                  CMS АЛАТИ
                </span>

                <strong>
                  Претрага садржаја
                </strong>
              </div>


              <button
                type="button"
                onClick={
                  closeExplorer
                }
                aria-label="Затвори претрагу"
              >
                ЗАТВОРИ
                <span
                  aria-hidden="true"
                >
                  ×
                </span>
              </button>
            </header>


            <div className="admin-content-explorer-modal__body">
              <section className="admin-content-explorer">
                <header className="admin-content-explorer__heading">
                  <div>
                    <p className="eyebrow">
                      CONTENT EXPLORER
                    </p>

                    <h2>
                      Претрага целог CMS-а
                    </h2>

                    <p>
                      Пронађи садржај
                      без уласка у
                      сваку секцију
                      посебно.
                    </p>
                  </div>


                  <button
                    type="button"
                    className="admin-content-explorer__refresh"
                    onClick={() =>
                      loadContent(
                        true
                      )
                    }
                    disabled={
                      refreshing ||
                      loading
                    }
                  >
                    {refreshing
                      ? "ОСВЕЖАВАМ..."
                      : "ОСВЕЖИ"}
                  </button>
                </header>


                <div className="admin-content-explorer__summary">
                  <div>
                    <span>
                      УКУПНО
                    </span>

                    <strong>
                      {items.length}
                    </strong>
                  </div>


                  <div>
                    <span>
                      ОБЈАВЉЕНО
                    </span>

                    <strong>
                      {publishedCount}
                    </strong>
                  </div>


                  <div>
                    <span>
                      НАЦРТИ
                    </span>

                    <strong>
                      {draftCount}
                    </strong>
                  </div>


                  <div>
                    <span>
                      ПРИКАЗАНО
                    </span>

                    <strong>
                      {filteredItems.length}
                    </strong>
                  </div>
                </div>


                <div className="admin-content-explorer__toolbar">
                  <label className="admin-content-explorer__search">
                    <span>
                      Претрага
                    </span>

                    <div>
                      <input
                        ref={
                          searchInputRef
                        }
                        type="search"
                        value={
                          query
                        }
                        onChange={
                          (
                            event
                          ) =>
                            setQuery(
                              event.target
                                .value
                            )
                        }
                        placeholder="Наслов, извођач, категорија, локација..."
                      />

                      <kbd>
                        Ctrl K
                      </kbd>
                    </div>
                  </label>


                  <label>
                    <span>
                      Врста
                    </span>

                    <select
                      value={
                        typeFilter
                      }
                      onChange={
                        (
                          event
                        ) =>
                          setTypeFilter(
                            event.target
                              .value
                          )
                      }
                    >
                      <option value="all">
                        Све врсте
                      </option>

                      {SOURCES.map(
                        (
                          source
                        ) => (
                          <option
                            key={
                              source.key
                            }
                            value={
                              source.key
                            }
                          >
                            {source.label}
                          </option>
                        )
                      )}
                    </select>
                  </label>


                  <label>
                    <span>
                      Статус
                    </span>

                    <select
                      value={
                        statusFilter
                      }
                      onChange={
                        (
                          event
                        ) =>
                          setStatusFilter(
                            event.target
                              .value
                          )
                      }
                    >
                      <option value="all">
                        Сви статуси
                      </option>

                      <option value="published">
                        Објављено
                      </option>

                      <option value="draft">
                        Нацрти
                      </option>
                    </select>
                  </label>


                  <label>
                    <span>
                      Сортирање
                    </span>

                    <select
                      value={
                        sortMode
                      }
                      onChange={
                        (
                          event
                        ) =>
                          setSortMode(
                            event.target
                              .value
                          )
                      }
                    >
                      <option value="newest">
                        Најновије
                      </option>

                      <option value="oldest">
                        Најстарије
                      </option>

                      <option value="title">
                        Наслов А–Ш
                      </option>

                      <option value="type">
                        По врсти
                      </option>
                    </select>
                  </label>


                  <button
                    type="button"
                    className="admin-content-explorer__clear"
                    onClick={
                      resetFilters
                    }
                  >
                    РЕСЕТ
                  </button>
                </div>


                {selectedItems.length >
                0 ? (
                  <div className="admin-content-explorer__bulk">
                    <div>
                      <strong>
                        {selectedItems.length}
                      </strong>

                      <span>
                        изабрано
                      </span>
                    </div>


                    <div className="admin-content-explorer__bulk-actions">
                      <button
                        type="button"
                        onClick={() =>
                          applyBulkStatus(
                            "published"
                          )
                        }
                        disabled={
                          bulkSaving
                        }
                      >
                        ОБЈАВИ
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          applyBulkStatus(
                            "draft"
                          )
                        }
                        disabled={
                          bulkSaving
                        }
                      >
                        У НАЦРТ
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedKeys(
                            new Set()
                          )
                        }
                        disabled={
                          bulkSaving
                        }
                      >
                        ПОНИШТИ ИЗБОР
                      </button>
                    </div>
                  </div>
                ) : null}


                {message ? (
                  <p className="admin-content-explorer__message admin-content-explorer__message--success">
                    {message}
                  </p>
                ) : null}


                {errors.length >
                0 ? (
                  <div className="admin-content-explorer__message admin-content-explorer__message--error">
                    <strong>
                      Неке секције
                      нису учитане:
                    </strong>

                    {errors.map(
                      (
                        error
                      ) => (
                        <span
                          key={
                            error
                          }
                        >
                          {error}
                        </span>
                      )
                    )}
                  </div>
                ) : null}


                <div className="admin-content-explorer__table">
                  <div className="admin-content-explorer__table-head">
                    <label>
                      <input
                        type="checkbox"
                        checked={
                          allVisibleSelected
                        }
                        onChange={
                          toggleVisible
                        }
                        disabled={
                          !visibleKeys.length
                        }
                      />

                      <span>
                        СВЕ
                      </span>
                    </label>

                    <span>
                      САДРЖАЈ
                    </span>

                    <span>
                      ВРСТА
                    </span>

                    <span>
                      СТАТУС
                    </span>

                    <span>
                      ДАТУМ
                    </span>

                    <span />
                  </div>


                  {loading ? (
                    <div className="admin-content-explorer__state">
                      Учитавање
                      садржаја...
                    </div>

                  ) : filteredItems.length ===
                  0 ? (
                    <div className="admin-content-explorer__state">
                      Нема резултата
                      за изабране
                      филтере.
                    </div>

                  ) : (
                    <div className="admin-content-explorer__rows">
                      {filteredItems.map(
                        (
                          item
                        ) => (
                          <article
                            key={
                              item.key
                            }
                            className={
                              selectedKeys.has(
                                item.key
                              )
                                ? "admin-content-explorer__row admin-content-explorer__row--selected"
                                : "admin-content-explorer__row"
                            }
                          >
                            <label className="admin-content-explorer__check">
                              <input
                                type="checkbox"
                                checked={
                                  selectedKeys.has(
                                    item.key
                                  )
                                }
                                onChange={() =>
                                  toggleItem(
                                    item.key
                                  )
                                }
                                aria-label={`Изабери ${item.title}`}
                              />
                            </label>


                            <div className="admin-content-explorer__item">
                              <strong>
                                {item.title}
                              </strong>

                              <span>
                                {item.secondary}
                              </span>
                            </div>


                            <span className="admin-content-explorer__type">
                              {item.sourceLabel}
                            </span>


                            <span
                              className={
                                getStatusClass(
                                  item.status
                                )
                              }
                            >
                              {getStatusLabel(
                                item.status
                              )}
                            </span>


                            <time>
                              {formatDate(
                                item.date
                              )}
                            </time>


                            <Link
                              to={
                                item.editPath
                              }
                              className="admin-content-explorer__edit"
                              onClick={
                                closeExplorer
                              }
                            >
                              УРЕДИ →
                            </Link>
                          </article>
                        )
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}


export default AdminContentExplorer;