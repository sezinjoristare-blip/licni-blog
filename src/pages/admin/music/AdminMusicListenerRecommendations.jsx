import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  supabase,
} from "../../../lib/supabaseClient";

import {
  slugify,
} from "../../../utils/slugify";

import "../../../styles/admin/AdminMusicListenerRecommendations.css";


const STATUS_OPTIONS = [
  {
    value:
      "new",

    label:
      "НОВО",
  },

  {
    value:
      "accepted",

    label:
      "ОДОБРЕНО",
  },

  {
    value:
      "rejected",

    label:
      "ОДБИЈЕНО",
  },

  {
    value:
      "all",

    label:
      "СВЕ",
  },
];


const TYPE_LABELS = {
  music:
    "ПЕСМА",

  playlist:
    "ПЛЕЈЛИСТА",

  radio_drama:
    "РАДИО ДРАМА",
};


const STATUS_LABELS = {
  new:
    "НОВО",

  accepted:
    "ОДОБРЕНО",

  rejected:
    "ОДБИЈЕНО",
};


function getGenre(
  item
) {
  if (
    Array.isArray(
      item?.music_genres
    )
  ) {
    return (
      item.music_genres[0] ??
      null
    );
  }


  return (
    item?.music_genres ??
    null
  );
}


function formatDate(
  value
) {
  if (!value) {
    return "";
  }


  try {
    return new Date(
      value
    ).toLocaleString(
      "sr-RS",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",
      }
    );
  } catch {
    return value;
  }
}


function createApprovalSlug(
  item
) {
  const creator =
    String(
      item.creator ??
      ""
    ).trim();

  const title =
    String(
      item.title ??
      ""
    ).trim();


  const source =
    item.type ===
      "playlist"
      ? title
      : creator
        ? `${creator}-${title}`
        : title;


  const generated =
    slugify(
      source
    );


  if (generated) {
    return generated;
  }


  return (
    `predlog-${String(
      item.id
    )
      .replace(
        /-/g,
        ""
      )
      .slice(
        0,
        8
      )}`
  );
}


function AdminMusicListenerRecommendations() {
  const [
    items,
    setItems,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    "new"
  );


  const [
    workingId,
    setWorkingId,
  ] = useState(null);


  const [
    notice,
    setNotice,
  ] = useState("");


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  async function loadItems() {
    setLoading(
      true
    );

    setErrorMessage(
      ""
    );


    const {
      data,
      error,
    } =
      await supabase
        .from(
          "music_listener_recommendations"
        )
        .select(`
          id,
          type,
          title,
          creator,
          url,
          sender_name,
          reason,
          status,
          genre_id,
          youtube_playlist_id,
          published_item_id,
          approved_at,
          created_at,
          updated_at,
          music_genres (
            id,
            name,
            slug
          )
        `)
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );


    if (error) {
      console.error(
        "Predlozi slušalaca:",
        error
      );


      setItems(
        []
      );

      setErrorMessage(
        "Предлоге тренутно није могуће учитати."
      );

      setLoading(
        false
      );

      return;
    }


    setItems(
      data ??
      []
    );


    setLoading(
      false
    );
  }


  useEffect(
    () => {
      loadItems();
    },
    []
  );


  const counts =
    useMemo(
      () => {
        return items.reduce(
          (
            result,
            item
          ) => {
            result.all +=
              1;


            if (
              Object.prototype
                .hasOwnProperty
                .call(
                  result,
                  item.status
                )
            ) {
              result[
                item.status
              ] +=
                1;
            }


            return result;
          },
          {
            all:
              0,

            new:
              0,

            accepted:
              0,

            rejected:
              0,
          }
        );
      },
      [
        items,
      ]
    );


  const visibleItems =
    useMemo(
      () => {
        if (
          statusFilter ===
          "all"
        ) {
          return items;
        }


        return items.filter(
          (
            item
          ) =>
            item.status ===
            statusFilter
        );
      },
      [
        items,
        statusFilter,
      ]
    );


  async function handleApprove(
    item
  ) {
    if (
      workingId
    ) {
      return;
    }


    setWorkingId(
      item.id
    );

    setNotice(
      ""
    );

    setErrorMessage(
      ""
    );


    try {
      if (
        item.type ===
          "music" &&
        !item.genre_id
      ) {
        throw new Error(
          "Ова песма нема изабран жанр и не може бити објављена."
        );
      }


      if (
        item.type ===
          "playlist" &&
        !item.youtube_playlist_id
      ) {
        throw new Error(
          "Ова плејлиста нема исправан YouTube playlist ID."
        );
      }


      const slug =
        createApprovalSlug(
          item
        );


      const {
        data,
        error,
      } =
        await supabase
          .rpc(
            "approve_music_listener_recommendation",
            {
              p_submission_id:
                item.id,

              p_slug:
                slug,
            }
          );


      if (error) {
        throw error;
      }


      if (
        data?.ok ===
        false
      ) {
        throw new Error(
          "Препорука није објављена."
        );
      }


      setNotice(
        `„${item.title}“ је одобрено и објављено.`
      );


      await loadItems();

    } catch (
      error
    ) {
      console.error(
        "Odobravanje preporuke:",
        error
      );


      setErrorMessage(
        error?.message ||
        "Препорука није одобрена."
      );

    } finally {
      setWorkingId(
        null
      );
    }
  }


  async function handleReject(
    item
  ) {
    if (
      workingId
    ) {
      return;
    }


    setWorkingId(
      item.id
    );

    setNotice(
      ""
    );

    setErrorMessage(
      ""
    );


    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "music_listener_recommendations"
          )
          .update({
            status:
              "rejected",

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            item.id
          )
          .eq(
            "status",
            "new"
          )
          .select(
            "id"
          )
          .maybeSingle();


      if (error) {
        throw error;
      }


      if (!data) {
        throw new Error(
          "Предлог је већ обрађен."
        );
      }


      setNotice(
        `„${item.title}“ је одбијено.`
      );


      await loadItems();

    } catch (
      error
    ) {
      console.error(
        "Odbijanje preporuke:",
        error
      );


      setErrorMessage(
        error?.message ||
        "Предлог није одбијен."
      );

    } finally {
      setWorkingId(
        null
      );
    }
  }


  return (
    <section className="admin-listener-recommendations">
      <div className="admin-music-section__heading">
        <div>
          <p className="eyebrow">
            ПРЕПОРУКЕ
          </p>

          <h2>
            Предлози слушалаца
          </h2>
        </div>


        <p>
          Послушај шта је послато,
          па једним кликом одобри
          или одбиј.
        </p>
      </div>


      <div className="admin-listener-recommendations__toolbar">
        <div className="admin-listener-recommendations__filters">
          {STATUS_OPTIONS.map(
            (
              option
            ) => (
              <button
                key={
                  option.value
                }
                type="button"
                className={
                  statusFilter ===
                  option.value
                    ? "admin-listener-recommendations__filter admin-listener-recommendations__filter--active"
                    : "admin-listener-recommendations__filter"
                }
                onClick={
                  () =>
                    setStatusFilter(
                      option.value
                    )
                }
              >
                <span>
                  {option.label}
                </span>

                <strong>
                  {counts[
                    option.value
                  ]}
                </strong>
              </button>
            )
          )}
        </div>


        <button
          type="button"
          className="admin-listener-recommendations__refresh"
          onClick={
            loadItems
          }
          disabled={
            loading
          }
        >
          {loading
            ? "УЧИТАВАМ..."
            : "ОСВЕЖИ"}
        </button>
      </div>


      {notice ? (
        <p className="success-message">
          {notice}
        </p>
      ) : null}


      {errorMessage ? (
        <p className="error-message">
          {errorMessage}
        </p>
      ) : null}


      {loading ? (
        <p className="admin-music__empty-note">
          Учитавање...
        </p>

      ) : visibleItems.length ===
        0 ? (
        <p className="admin-music__empty-note">
          Нема предлога у овој
          категорији.
        </p>

      ) : (
        <div className="admin-listener-recommendations__list">
          {visibleItems.map(
            (
              item
            ) => {
              const isWorking =
                workingId ===
                item.id;

              const genre =
                getGenre(
                  item
                );


              return (
                <article
                  key={
                    item.id
                  }
                  className={`admin-listener-recommendations__card admin-listener-recommendations__card--${item.status}`}
                >
                  <div className="admin-listener-recommendations__card-top">
                    <div className="admin-listener-recommendations__badges">
                      <span className="admin-listener-recommendations__type">
                        {TYPE_LABELS[
                          item.type
                        ] ??
                        item.type}
                      </span>


                      {genre ? (
                        <span className="admin-listener-recommendations__type">
                          {genre.name}
                        </span>
                      ) : null}


                      <span
                        className={`admin-listener-recommendations__status admin-listener-recommendations__status--${item.status}`}
                      >
                        {STATUS_LABELS[
                          item.status
                        ] ??
                        item.status}
                      </span>
                    </div>


                    <time
                      dateTime={
                        item.created_at
                      }
                    >
                      {formatDate(
                        item.created_at
                      )}
                    </time>
                  </div>


                  <div className="admin-listener-recommendations__main">
                    <div className="admin-listener-recommendations__title">
                      <h3>
                        {item.title}
                      </h3>

                      {item.creator ? (
                        <p>
                          {item.creator}
                        </p>
                      ) : null}
                    </div>


                    <div className="admin-listener-recommendations__sender">
                      <span>
                        ПОТПИС
                      </span>

                      <strong>
                        {item.sender_name}
                      </strong>
                    </div>
                  </div>


                  <div className="admin-listener-recommendations__reason">
                    <span>
                      ЗАШТО МУ / ЈОЈ СЕ СВИЂА
                    </span>

                    <p>
                      {item.reason}
                    </p>
                  </div>


                  {item.status ===
                  "accepted" ? (
                    <p className="admin-music__draft-note">
                      Ова препорука је
                      већ објављена.
                    </p>
                  ) : null}


                  <div className="admin-listener-recommendations__actions">
                    <a
                      className="admin-listener-recommendations__listen"
                      href={
                        item.url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ▶ ПОСЛУШАЈ
                    </a>


                    {item.status ===
                    "new" ? (
                      <>
                        <button
                          type="button"
                          className="admin-listener-recommendations__accept"
                          disabled={
                            isWorking
                          }
                          onClick={
                            () =>
                              handleApprove(
                                item
                              )
                          }
                        >
                          {isWorking
                            ? "РАДИМ..."
                            : "✓ ОДОБРИ"}
                        </button>


                        <button
                          type="button"
                          className="admin-listener-recommendations__reject"
                          disabled={
                            isWorking
                          }
                          onClick={
                            () =>
                              handleReject(
                                item
                              )
                          }
                        >
                          ✕ ОДБИЈ
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}


export default AdminMusicListenerRecommendations;