import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  supabase,
} from "../../../lib/supabaseClient";

import {
  slugify,
} from "../../../utils/slugify";

import useAdminDraft
  from "../../../admin-safety/useAdminDraft";

import {
  clearAdminDraft,
} from "../../../admin-safety/adminDraftStorage";


function createEmptyForm() {
  return {
    title:
      "",

    description:
      "",

    sort_order:
      "0",

    status:
      "draft",

    track_ids:
      [],
  };
}


function formFromPlaylist(
  playlist
) {
  const items =
    Array.isArray(
      playlist
        ?.music_playlist_items
    )
      ? [
          ...playlist
            .music_playlist_items,
        ].sort(
          (
            first,
            second
          ) =>
            (
              first.position ??
              0
            ) -
            (
              second.position ??
              0
            )
        )
      : [];


  return {
    title:
      playlist?.title ??
      "",

    description:
      playlist
        ?.description ??
      "",

    sort_order:
      String(
        playlist
          ?.sort_order ??
        0
      ),

    status:
      playlist
        ?.status ??
      "draft",

    track_ids:
      items
        .map(
          (
            item
          ) =>
            item
              .recommendation_id
        )
        .filter(
          Boolean
        ),
  };
}


function AdminMusicPlaylists() {
  const navigate =
    useNavigate();

  const {
    characterKey =
      "covek-1",
  } = useParams();

  const [
    searchParams,
  ] = useSearchParams();


  const playlistId =
    searchParams.get(
      "id"
    );


  const basePath =
    `/admin/likovi/${characterKey}/muzika/preporuke?tip=plejliste`;


  const draftKey =
    playlistId
      ? `music-playlists:${playlistId}`
      : "music-playlists:new";


  const [
    playlists,
    setPlaylists,
  ] = useState([]);


  const [
    recommendations,
    setRecommendations,
  ] = useState([]);


  const [
    form,
    setForm,
  ] = useState(
    createEmptyForm
  );


  const [
    editingPlaylist,
    setEditingPlaylist,
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
        if (
          savedForm &&
          typeof savedForm ===
            "object"
        ) {
          setForm({
            ...createEmptyForm(),
            ...savedForm,

            track_ids:
              Array.isArray(
                savedForm
                  .track_ids
              )
                ? savedForm
                    .track_ids
                : [],
          });
        }
      },

    ready:
      editorReady,

    scope:
      "Музика / плејлисте",
  });


  async function loadData() {
    setLoading(
      true
    );

    setErrorMessage(
      ""
    );


    const [
      playlistsResult,
      recommendationsResult,
    ] = await Promise.all([
      supabase
        .from(
          "music_playlists"
        )
        .select(`
          *,
          music_playlist_items (
            id,
            recommendation_id,
            position
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
        ),

      supabase
        .from(
          "music_recommendations"
        )
        .select(`
          id,
          title,
          artist,
          status,
          release_year,
          sort_order,
          music_genres (
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
        ),
    ]);


    if (
      playlistsResult.error
    ) {
      setErrorMessage(
        playlistsResult
          .error.message
      );
    }


    if (
      recommendationsResult.error
    ) {
      setErrorMessage(
        recommendationsResult
          .error.message
      );
    }


    setPlaylists(
      playlistsResult.data ??
      []
    );

    setRecommendations(
      recommendationsResult.data ??
      []
    );

    setLoading(
      false
    );
  }


  useEffect(() => {
    loadData();
  }, []);


  useEffect(() => {
    if (loading) {
      return;
    }


    setEditorReadyKey(
      ""
    );

    setSuccessMessage(
      ""
    );


    if (!playlistId) {
      setEditingPlaylist(
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


    const playlist =
      playlists.find(
        (
          item
        ) =>
          String(
            item.id
          ) ===
          String(
            playlistId
          )
      );


    if (!playlist) {
      setEditingPlaylist(
        null
      );

      setErrorMessage(
        "Тражена плејлиста не постоји."
      );

      return;
    }


    setEditingPlaylist(
      playlist
    );

    setForm(
      formFromPlaylist(
        playlist
      )
    );

    setEditorReadyKey(
      draftKey
    );
  }, [
    playlistId,
    playlists,
    loading,
    draftKey,
  ]);


  const recommendationMap =
    useMemo(
      () =>
        new Map(
          recommendations.map(
            (
              recommendation
            ) => [
              String(
                recommendation.id
              ),
              recommendation,
            ]
          )
        ),
      [
        recommendations,
      ]
    );


  const selectedTracks =
    useMemo(
      () =>
        form.track_ids
          .map(
            (
              id
            ) =>
              recommendationMap.get(
                String(
                  id
                )
              )
          )
          .filter(
            Boolean
          ),
      [
        form.track_ids,
        recommendationMap,
      ]
    );


  const availableTracks =
    useMemo(
      () => {
        const selected =
          new Set(
            form.track_ids.map(
              String
            )
          );


        return recommendations.filter(
          (
            recommendation
          ) =>
            !selected.has(
              String(
                recommendation.id
              )
            )
        );
      },
      [
        recommendations,
        form.track_ids,
      ]
    );


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


  function addTrack(
    recommendationId
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        track_ids:
          current
            .track_ids
            .includes(
              recommendationId
            )
            ? current
                .track_ids
            : [
                ...current
                  .track_ids,
                recommendationId,
              ],
      })
    );

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );
  }


  function removeTrack(
    recommendationId
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        track_ids:
          current
            .track_ids
            .filter(
              (
                id
              ) =>
                String(
                  id
                ) !==
                String(
                  recommendationId
                )
            ),
      })
    );

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );
  }


  function moveTrack(
    index,
    direction
  ) {
    setForm(
      (
        current
      ) => {
        const nextIndex =
          index +
          direction;


        if (
          nextIndex < 0 ||
          nextIndex >=
            current
              .track_ids
              .length
        ) {
          return current;
        }


        const nextIds = [
          ...current
            .track_ids,
        ];


        [
          nextIds[index],
          nextIds[nextIndex],
        ] = [
          nextIds[nextIndex],
          nextIds[index],
        ];


        return {
          ...current,

          track_ids:
            nextIds,
        };
      }
    );

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );
  }


  function handleEdit(
    playlist
  ) {
    navigate(
      `${basePath}&id=${encodeURIComponent(
        playlist.id
      )}`
    );

    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }


  async function handleCancel() {
    const baseline =
      editingPlaylist
        ? formFromPlaylist(
            editingPlaylist
          )
        : createEmptyForm();


    await discardDraft(
      baseline
    );


    if (playlistId) {
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


    try {
      const cleanTitle =
        form.title
          .trim();

      const cleanDescription =
        form.description
          .trim();


      if (!cleanTitle) {
        throw new Error(
          "Упиши назив плејлисте."
        );
      }


      if (
        form.status ===
          "published" &&
        !form.track_ids.length
      ) {
        throw new Error(
          "Објављена плејлиста мора имати бар једну песму."
        );
      }


      if (
        form.status ===
        "published"
      ) {
        const unpublished =
          selectedTracks.filter(
            (
              track
            ) =>
              track.status !==
              "published"
          );


        if (
          unpublished.length
        ) {
          throw new Error(
            "Пре објављивања плејлисте објави све песме које су у њој."
          );
        }
      }


      const payload = {
        title:
          cleanTitle,

        slug:
          slugify(
            cleanTitle
          ),

        description:
          cleanDescription ||
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


      let savedId =
        editingPlaylist
          ?.id ??
        null;


      if (editingPlaylist) {
        const {
          error,
        } = await supabase
          .from(
            "music_playlists"
          )
          .update(
            payload
          )
          .eq(
            "id",
            editingPlaylist.id
          );


        if (error) {
          throw error;
        }

      } else {
        const {
          data,
          error,
        } = await supabase
          .from(
            "music_playlists"
          )
          .insert(
            payload
          )
          .select(
            "id"
          )
          .single();


        if (error) {
          throw error;
        }


        savedId =
          data.id;
      }


      const {
        error:
          itemsError,
      } = await supabase
        .rpc(
          "replace_music_playlist_items",
          {
            p_playlist_id:
              savedId,

            p_recommendation_ids:
              form.track_ids,
          }
        );


      if (itemsError) {
        throw itemsError;
      }


      const committedForm = {
        title:
          cleanTitle,

        description:
          cleanDescription,

        sort_order:
          String(
            Number(
              form.sort_order
            ) || 0
          ),

        status:
          form.status,

        track_ids:
          [
            ...form.track_ids,
          ],
      };


      const nextEmptyForm =
        createEmptyForm();


      await markCommitted(
        editingPlaylist
          ? committedForm
          : nextEmptyForm,
        {
          message:
            editingPlaylist
              ? "Плејлиста је сачувана."
              : "Плејлиста је додата.",
        }
      );


      await loadData();


      if (editingPlaylist) {
        navigate(
          basePath
        );

      } else {
        setForm(
          nextEmptyForm
        );
      }


      setSuccessMessage(
        editingPlaylist
          ? "Плејлиста је успешно измењена."
          : "Плејлиста је успешно додата."
      );

    } catch (
      error
    ) {
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
    playlist
  ) {
    const confirmed =
      window.confirm(
        `Трајно обрисати плејлисту „${playlist.title}“?`
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
        "music_playlists"
      )
      .delete()
      .eq(
        "id",
        playlist.id
      );


    if (error) {
      setErrorMessage(
        error.message
      );

      return;
    }


    await clearAdminDraft(
      `music-playlists:${playlist.id}`
    ).catch(
      () => {}
    );


    if (
      String(
        playlistId
      ) ===
      String(
        playlist.id
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
      "Плејлиста је обрисана."
    );


    await loadData();
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
            ПРЕПОРУКЕ
          </p>

          <h2>
            Плејлисте
          </h2>
        </div>

        <p>
          Састави сет од већ унетих
          дискова и намести њихов
          редослед. Недовршена
          плејлиста се аутоматски
          чува локално.
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
            {editingPlaylist
              ? "Измени плејлисту"
              : "Нова плејлиста"}
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


          <p className="admin-music__draft-note">
            Аутоматско чување је
            укључено. Можеш да пређеш
            у другу секцију и касније
            наставиш где си стао.
          </p>


          <label>
            Назив плејлисте

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
            Опис

            <textarea
              rows="6"
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
              placeholder="Кратко објасни идеју плејлисте..."
            />
          </label>


          <div className="admin-music-track-picker">
            <section className="admin-music-track-picker__selected">
              <div className="admin-music-track-picker__heading">
                <div>
                  <span>
                    ИЗАБРАНО
                  </span>

                  <strong>
                    {form
                      .track_ids
                      .length}
                  </strong>
                </div>

                <small>
                  Ово је редослед
                  који ће посетилац
                  видети.
                </small>
              </div>


              {!selectedTracks.length ? (
                <p className="admin-music__empty-note">
                  Још ниси додао
                  ниједну песму.
                </p>

              ) : (
                <div className="admin-music-track-list">
                  {selectedTracks.map(
                    (
                      track,
                      index
                    ) => (
                      <article
                        className="admin-music-track-row"
                        key={
                          track.id
                        }
                      >
                        <span className="admin-music-track-row__number">
                          {String(
                            index +
                            1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <div className="admin-music-track-row__copy">
                          <strong>
                            {track.title}
                          </strong>

                          <small>
                            {track.artist ||
                              "Без извођача"}

                            {track
                              .release_year
                              ? ` · ${track.release_year}`
                              : ""}

                            {track
                              .music_genres
                              ?.name
                              ? ` · ${track.music_genres.name}`
                              : ""}
                          </small>

                          {track.status !==
                          "published" ? (
                            <em>
                              НАЦРТ
                            </em>
                          ) : null}
                        </div>

                        <div className="admin-music-track-row__actions">
                          <button
                            type="button"
                            disabled={
                              index ===
                              0
                            }
                            onClick={() =>
                              moveTrack(
                                index,
                                -1
                              )
                            }
                            aria-label="Помери песму нагоре"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            disabled={
                              index ===
                              selectedTracks.length -
                                1
                            }
                            onClick={() =>
                              moveTrack(
                                index,
                                1
                              )
                            }
                            aria-label="Помери песму надоле"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            className="danger-button"
                            onClick={() =>
                              removeTrack(
                                track.id
                              )
                            }
                          >
                            УКЛОНИ
                          </button>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>


            <section className="admin-music-track-picker__available">
              <div className="admin-music-track-picker__heading">
                <div>
                  <span>
                    ДИСКОВИ
                  </span>

                  <strong>
                    {availableTracks.length}
                  </strong>
                </div>

                <small>
                  Додај постојећу
                  препоруку у сет.
                </small>
              </div>


              {!availableTracks.length ? (
                <p className="admin-music__empty-note">
                  Нема више дискова
                  за додавање.
                </p>

              ) : (
                <div className="admin-music-track-list">
                  {availableTracks.map(
                    (
                      track
                    ) => (
                      <article
                        className="admin-music-track-row"
                        key={
                          track.id
                        }
                      >
                        <div className="admin-music-track-row__copy">
                          <strong>
                            {track.title}
                          </strong>

                          <small>
                            {track.artist ||
                              "Без извођача"}

                            {track
                              .release_year
                              ? ` · ${track.release_year}`
                              : ""}

                            {track
                              .music_genres
                              ?.name
                              ? ` · ${track.music_genres.name}`
                              : ""}
                          </small>

                          {track.status !==
                          "published" ? (
                            <em>
                              НАЦРТ
                            </em>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            addTrack(
                              track.id
                            )
                          }
                        >
                          + ДОДАЈ
                        </button>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          </div>


          <label>
            Редослед плејлисте

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
                : editingPlaylist
                  ? "Сачувај измене"
                  : "Додај плејлисту"}
            </button>


            {editingPlaylist ||
            recovered ||
            form.title ||
            form.description ||
            form.track_ids.length ? (
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
                {editingPlaylist
                  ? "Откажи измену"
                  : "Очисти форму"}
              </button>
            ) : null}
          </div>
        </form>
      )}


      <div className="admin-list">
        <h3>
          Све плејлисте
        </h3>


        {!playlists.length &&
        !loading ? (
          <p>
            Још нема плејлиста.
          </p>

        ) : (
          playlists.map(
            (
              playlist
            ) => {
              const itemCount =
                Array.isArray(
                  playlist
                    .music_playlist_items
                )
                  ? playlist
                      .music_playlist_items
                      .length
                  : 0;


              return (
                <article
                  className="admin-list-item"
                  key={
                    playlist.id
                  }
                >
                  <div className="admin-list-info">
                    <div>
                      <p className="admin-status">
                        {playlist.status ===
                        "published"
                          ? "ОБЈАВЉЕН"
                          : "НАЦРТ"}

                        {" · "}

                        {itemCount}
                        {" "}
                        {itemCount === 1
                          ? "ПЕСМА"
                          : "ПЕСАМА"}

                        {" · РЕДОСЛЕД "}

                        {playlist.sort_order}
                      </p>

                      <h3>
                        {playlist.title}
                      </h3>

                      <p>
                        {playlist.description ||
                          "Без описа"}
                      </p>
                    </div>
                  </div>


                  <div className="item-actions">
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(
                          playlist
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
                          playlist
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
    </section>
  );
}


export default AdminMusicPlaylists;