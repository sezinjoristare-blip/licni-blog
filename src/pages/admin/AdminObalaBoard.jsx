import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../../lib/supabaseClient";

import {
  deleteObalaBoardMedia,
  uploadObalaBoardMedia,
} from "../../lib/obalaBoardMedia";

import useAdminDraft
  from "../../admin-safety/useAdminDraft";

import useAdminDraftFile
  from "../../admin-safety/useAdminDraftFile";

import {
  clearAdminDraft,
  loadAdminDraftFiles,
  removeAdminDraftFile,
  saveAdminDraftFile,
} from "../../admin-safety/adminDraftStorage";

import {
  useAdminDraftStatus,
} from "../../admin-safety/AdminDraftContext";

import "../../styles/admin/AdminObalaBoard.css";


const CATEGORY_SUGGESTIONS = [
  "Изложбе",
  "Пројекције",
  "Свирке",
  "Књижевне вечери",
  "Радионице",
  "Перформанси",
  "Остало",
];


const BLOCK_TYPES = [
  {
    value:
      "text",

    label:
      "Текст",
  },

  {
    value:
      "image",

    label:
      "Фотографија",
  },

  {
    value:
      "gif",

    label:
      "GIF",
  },

  {
    value:
      "video",

    label:
      "Видео",
  },

  {
    value:
      "youtube",

    label:
      "YouTube",
  },
];


function createClientId() {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }


  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}


function toLocalInput(
  value
) {
  if (!value) {
    return "";
  }


  const date =
    new Date(
      value
    );


  const offset =
    date.getTimezoneOffset();


  return new Date(
    date.getTime() -
    offset *
      60 *
      1000
  )
    .toISOString()
    .slice(
      0,
      16
    );
}


function defaultLocalDateTime(
  offsetHours = 0
) {
  const date =
    new Date(
      Date.now() +
      offsetHours *
        60 *
        60 *
        1000
    );


  return toLocalInput(
    date
  );
}


function createEmptyEvent() {
  return {
    title:
      "",

    category:
      "Остало",

    location:
      "",

    event_date:
      "",

    visible_from:
      defaultLocalDateTime(
        0
      ),

    expires_at:
      defaultLocalDateTime(
        24
      ),

    status:
      "draft",

    sort_order:
      "0",

    poster_url:
      "",

    poster_storage_path:
      "",
  };
}


function formFromEvent(
  event
) {
  return {
    title:
      event?.title ||
      "",

    category:
      event?.category ||
      "Остало",

    location:
      event?.location ||
      "",

    event_date:
      toLocalInput(
        event?.event_date
      ),

    visible_from:
      toLocalInput(
        event?.visible_from
      ),

    expires_at:
      toLocalInput(
        event?.expires_at
      ),

    status:
      event?.status ||
      "draft",

    sort_order:
      String(
        event?.sort_order ??
        0
      ),

    poster_url:
      event?.poster_url ||
      "",

    poster_storage_path:
      event?.poster_storage_path ||
      "",
  };
}


function createBlock(
  blockType =
    "text"
) {
  return {
    clientId:
      createClientId(),

    id:
      null,

    block_type:
      blockType,

    position:
      blockType ===
        "text"
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

    file:
      null,
  };
}


function normalizeStoredBlocks(
  blocks
) {
  if (
    !Array.isArray(
      blocks
    ) ||
    !blocks.length
  ) {
    return [
      createBlock(
        "text"
      ),
    ];
  }


  return blocks.map(
    (
      block
    ) => ({
      ...createBlock(
        block.block_type ||
        "text"
      ),

      ...block,

      clientId:
        block.clientId ||
        block.id ||
        createClientId(),

      file:
        null,
    })
  );
}


function stripBlockFiles(
  blocks
) {
  return blocks.map(
    (
      block
    ) => ({
      ...block,

      file:
        null,
    })
  );
}


function createEmptyEditorState() {
  return {
    form:
      createEmptyEvent(),

    blocks: [
      createBlock(
        "text"
      ),
    ],
  };
}


function normalizeRecoveredState(
  saved
) {
  if (
    !saved ||
    typeof saved !==
      "object"
  ) {
    return createEmptyEditorState();
  }


  return {
    form: {
      ...createEmptyEvent(),
      ...(saved.form ||
        {}),
    },

    blocks:
      normalizeStoredBlocks(
        saved.blocks
      ),
  };
}


function getStateLabel(
  event
) {
  if (
    event.status !==
    "published"
  ) {
    return "НАЦРТ";
  }


  const now =
    Date.now();


  const visible =
    new Date(
      event.visible_from
    ).getTime();


  const expires =
    new Date(
      event.expires_at
    ).getTime();


  if (
    now <
    visible
  ) {
    return "ЗАКАЗАН";
  }


  if (
    now >
    expires
  ) {
    return "АРХИВА";
  }


  return "АКТУЕЛАН";
}


function formatAdminDate(
  value
) {
  if (!value) {
    return "";
  }


  return new Intl
    .DateTimeFormat(
      "sr-RS",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",
      }
    )
    .format(
      new Date(
        value
      )
    );
}


function AdminObalaBoard() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    characterKey,

    eventId,
  } = useParams();


  const {
    reportStatus,
  } =
    useAdminDraftStatus();


  const basePath =
    `/admin/likovi/${characterKey}/obala-pano`;


  const isNewRoute =
    location.pathname ===
    `${basePath}/novi`;


  const isEditRoute =
    Boolean(
      eventId
    );


  const isEditorRoute =
    isNewRoute ||
    isEditRoute;


  const draftKey =
    isNewRoute
      ? `obala-board:${characterKey}:new`
      : isEditRoute
        ? `obala-board:${characterKey}:${eventId}`
        : "";


  const [
    events,
    setEvents,
  ] = useState([]);


  const [
    form,
    setForm,
  ] = useState(
    createEmptyEvent
  );


  const [
    blocks,
    setBlocks,
  ] = useState([
    createBlock(
      "text"
    ),
  ]);


  const [
    posterFile,
    setPosterFile,
  ] = useState(null);


  const [
    editingEvent,
    setEditingEvent,
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
    message,
    setMessage,
  ] = useState({
    type:
      "",

    text:
      "",
  });


  const draftData =
    useMemo(
      () => ({
        form,

        blocks:
          stripBlockFiles(
            blocks
          ),
      }),
      [
        form,
        blocks,
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
        savedState
      ) => {
        const restored =
          normalizeRecoveredState(
            savedState
          );


        setForm(
          restored.form
        );

        setBlocks(
          restored.blocks
        );
      },

    ready:
      editorReady,

    enabled:
      isEditorRoute,

    scope:
      "Обала / пано",
  });


  useAdminDraftFile({
    draftKey,

    fieldKey:
      "poster",

    file:
      posterFile,

    setFile:
      setPosterFile,

    ready:
      editorReady,

    enabled:
      isEditorRoute,

    scope:
      "Обала / пано",
  });


  async function loadEvents() {
    setLoading(
      true
    );


    const {
      data,
      error,
    } = await supabase
      .from(
        "obala_events"
      )
      .select("*")
      .order(
        "event_date",
        {
          ascending:
            false,
        }
      );


    if (error) {
      setEvents(
        []
      );

      setMessage({
        type:
          "error",

        text:
          error.message,
      });

      setLoading(
        false
      );

      return [];
    }


    const nextEvents =
      data ?? [];


    setEvents(
      nextEvents
    );

    setLoading(
      false
    );


    return nextEvents;
  }


  useEffect(() => {
    if (
      characterKey ===
      "covek-1"
    ) {
      loadEvents();
    }
  }, [
    characterKey,
  ]);


  useEffect(() => {
    if (
      loading ||
      !isEditorRoute ||
      !draftKey ||
      editorReadyKey ===
        draftKey
    ) {
      return;
    }


    let active =
      true;


    setEditorReadyKey(
      ""
    );

    setPosterFile(
      null
    );

    setMessage({
      type:
        "",

      text:
        "",
    });


    if (isNewRoute) {
      const emptyState =
        createEmptyEditorState();


      setEditingEvent(
        null
      );

      setForm(
        emptyState.form
      );

      setBlocks(
        emptyState.blocks
      );

      setEditorReadyKey(
        draftKey
      );


      return () => {
        active =
          false;
      };
    }


    const event =
      events.find(
        (
          item
        ) =>
          String(
            item.id
          ) ===
          String(
            eventId
          )
      );


    if (!event) {
      setEditingEvent(
        null
      );

      setMessage({
        type:
          "error",

        text:
          "Тражени догађај не постоји.",
      });


      return () => {
        active =
          false;
      };
    }


    setEditingEvent(
      event
    );

    setForm(
      formFromEvent(
        event
      )
    );


    async function loadBlocks() {
      const {
        data,
        error,
      } = await supabase
        .from(
          "obala_event_blocks"
        )
        .select("*")
        .eq(
          "event_id",
          event.id
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        );


      if (!active) {
        return;
      }


      if (error) {
        setMessage({
          type:
            "error",

          text:
            error.message,
        });

        return;
      }


      setBlocks(
        normalizeStoredBlocks(
          data ?? []
        )
      );


      setEditorReadyKey(
        draftKey
      );
    }


    loadBlocks();


    return () => {
      active =
        false;
    };
  }, [
    loading,
    isEditorRoute,
    isNewRoute,
    eventId,
    events,
    draftKey,
    editorReadyKey,
  ]);


  useEffect(() => {
    if (
      !editorReady ||
      !draftKey
    ) {
      return;
    }


    let active =
      true;


    async function restoreBlockFiles() {
      try {
        const storedFiles =
          await loadAdminDraftFiles(
            draftKey
          );


        if (!active) {
          return;
        }


        setBlocks(
          (
            current
          ) =>
            current.map(
              (
                block
              ) => {
                const file =
                  storedFiles[
                    `block:${block.clientId}`
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
          "Vraćanje Obala block fajlova:",
          error
        );


        reportStatus(
          "attention",
          {
            scope:
              "Обала / пано",

            message:
              "Текст је враћен, али један од локалних медијских фајлова није могао да се врати.",
          }
        );
      }
    }


    restoreBlockFiles();


    return () => {
      active =
        false;
    };
  }, [
    editorReady,
    draftKey,
    reportStatus,
  ]);


  if (
    characterKey !==
    "covek-1"
  ) {
    return (
      <Navigate
        to={
          `/admin/likovi/${characterKey}`
        }
        replace
      />
    );
  }


  function updateField(
    key,
    value
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        [key]:
          value,
      })
    );


    setMessage({
      type:
        "",

      text:
        "",
    });
  }


  function updateBlock(
    clientId,
    key,
    value
  ) {
    setBlocks(
      (
        current
      ) =>
        current.map(
          (
            block
          ) =>
            block.clientId ===
              clientId
              ? {
                  ...block,

                  [key]:
                    value,
                }
              : block
        )
    );


    setMessage({
      type:
        "",

      text:
        "",
    });
  }


  function addBlock(
    blockType
  ) {
    setBlocks(
      (
        current
      ) => [
        ...current,

        createBlock(
          blockType
        ),
      ]
    );
  }


  async function removeBlock(
    clientId
  ) {
    setBlocks(
      (
        current
      ) => {
        const next =
          current.filter(
            (
              block
            ) =>
              block.clientId !==
              clientId
          );


        return next.length
          ? next
          : [
              createBlock(
                "text"
              ),
            ];
      }
    );


    if (draftKey) {
      await removeAdminDraftFile(
        draftKey,
        `block:${clientId}`
      ).catch(
        () => {}
      );
    }
  }


  function moveBlock(
    index,
    direction
  ) {
    setBlocks(
      (
        current
      ) => {
        const targetIndex =
          index +
          direction;


        if (
          targetIndex <
            0 ||
          targetIndex >=
            current.length
        ) {
          return current;
        }


        const next = [
          ...current,
        ];


        const [
          moved
        ] =
          next.splice(
            index,
            1
          );


        next.splice(
          targetIndex,
          0,
          moved
        );


        return next;
      }
    );
  }


  async function handleBlockFile(
    clientId,
    file
  ) {
    updateBlock(
      clientId,
      "file",
      file
    );


    if (!draftKey) {
      return;
    }


    try {
      if (file) {
        await saveAdminDraftFile(
          draftKey,
          `block:${clientId}`,
          file
        );


        reportStatus(
          "local",
          {
            scope:
              "Обала / пано",

            message:
              `Фајл „${file.name}“ је обезбеђен локално.`,
          }
        );

      } else {
        await removeAdminDraftFile(
          draftKey,
          `block:${clientId}`
        );
      }

    } catch (
      error
    ) {
      console.error(
        "Čuvanje Pano block fajla:",
        error
      );


      reportStatus(
        "attention",
        {
          scope:
            "Обала / пано",

          message:
            "Текст је сачуван, али медијски фајл није могао безбедно да се сачува локално.",
        }
      );
    }
  }


  async function prepareBlock(
    block,
    eventIdValue,
    sortOrder,
    uploadedPaths
  ) {
    if (
      block.block_type ===
      "text"
    ) {
      const text =
        String(
          block.text_content ||
          ""
        ).trim();


      if (!text) {
        return null;
      }


      return {
        event_id:
          eventIdValue,

        block_type:
          "text",

        position:
          "full",

        text_content:
          text,

        media_url:
          null,

        media_storage_path:
          null,

        caption:
          null,

        sort_order:
          sortOrder,
      };
    }


    let mediaUrl =
      String(
        block.media_url ||
        ""
      ).trim();


    let mediaStoragePath =
      block.media_storage_path ||
      null;


    if (block.file) {
      const uploaded =
        await uploadObalaBoardMedia(
          block.file,
          "content"
        );


      if (
        block.block_type ===
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
        block.block_type ===
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
        block.block_type ===
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
      return null;
    }


    return {
      event_id:
        eventIdValue,

      block_type:
        block.block_type,

      position:
        block.position ||
        "right",

      text_content:
        null,

      media_url:
        mediaUrl,

      media_storage_path:
        mediaStoragePath,

      caption:
        String(
          block.caption ||
          ""
        ).trim() ||
        null,

      sort_order:
        sortOrder,
    };
  }


  async function replaceEventBlocks({
    currentEventId,
    preparedBlocks,
    oldBlocks,
  }) {
    let insertedBlocks =
      [];


    if (
      preparedBlocks.length
    ) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "obala_event_blocks"
        )
        .insert(
          preparedBlocks
        )
        .select(
          "id, media_storage_path"
        );


      if (error) {
        throw error;
      }


      insertedBlocks =
        data ?? [];
    }


    const oldIds =
      (oldBlocks ??
        [])
        .map(
          (
            block
          ) =>
            block.id
        )
        .filter(
          Boolean
        );


    if (
      oldIds.length
    ) {
      const {
        error,
      } = await supabase
        .from(
          "obala_event_blocks"
        )
        .delete()
        .in(
          "id",
          oldIds
        );


      if (error) {
        const newIds =
          insertedBlocks
            .map(
              (
                block
              ) =>
                block.id
            )
            .filter(
              Boolean
            );


        if (
          newIds.length
        ) {
          await supabase
            .from(
              "obala_event_blocks"
            )
            .delete()
            .in(
              "id",
              newIds
            );
        }


        throw error;
      }
    }


    return insertedBlocks;
  }


  async function saveEvent(
    browserEvent
  ) {
    browserEvent
      .preventDefault();


    if (saving) {
      return;
    }


    forceLocalSave();


    setSaving(
      true
    );


    setMessage({
      type:
        "",

      text:
        "",
    });


    const uploadedPaths =
      [];


    let createdEventId =
      null;

    let eventMetadataSaved =
      false;

    let completeSave =
      false;


    try {
      const title =
        form.title
          .trim();

      const category =
        form.category
          .trim();

      const eventLocation =
        form.location
          .trim();


      if (!title) {
        throw new Error(
          "Унеси наслов догађаја."
        );
      }


      if (!category) {
        throw new Error(
          "Унеси врсту догађаја / назив фасцикле."
        );
      }


      if (
        !form.event_date ||
        !form.visible_from ||
        !form.expires_at
      ) {
        throw new Error(
          "Унеси датум догађаја, почетак приказивања и рок."
        );
      }


      const eventDate =
        new Date(
          form.event_date
        );

      const visibleFrom =
        new Date(
          form.visible_from
        );

      const expiresAt =
        new Date(
          form.expires_at
        );


      if (
        Number.isNaN(
          eventDate.getTime()
        ) ||
        Number.isNaN(
          visibleFrom.getTime()
        ) ||
        Number.isNaN(
          expiresAt.getTime()
        )
      ) {
        throw new Error(
          "Један од датума није исправан."
        );
      }


      if (
        expiresAt <=
        visibleFrom
      ) {
        throw new Error(
          "Рок мора бити после почетка приказивања."
        );
      }


      const oldEvent =
        editingEvent;


      let posterUrl =
        form.poster_url ||
        null;

      let posterStoragePath =
        form.poster_storage_path ||
        null;


      if (posterFile) {
        const uploaded =
          await uploadObalaBoardMedia(
            posterFile,
            "posters"
          );


        if (
          ![
            "image",
            "gif",
          ].includes(
            uploaded.mediaType
          )
        ) {
          await deleteObalaBoardMedia(
            uploaded.path
          );


          throw new Error(
            "Постер мора бити слика или GIF."
          );
        }


        posterUrl =
          uploaded.url;

        posterStoragePath =
          uploaded.path;


        uploadedPaths.push(
          uploaded.path
        );
      }


      if (
        form.status ===
          "published" &&
        !posterUrl
      ) {
        throw new Error(
          "Објављен догађај мора да има постер."
        );
      }


      const eventPayload = {
        title,

        category,

        location:
          eventLocation ||
          null,

        event_date:
          eventDate
            .toISOString(),

        visible_from:
          visibleFrom
            .toISOString(),

        expires_at:
          expiresAt
            .toISOString(),

        status:
          form.status ===
            "published"
            ? "published"
            : "draft",

        sort_order:
          Number(
            form.sort_order
          ) || 0,

        poster_url:
          posterUrl,

        poster_storage_path:
          posterStoragePath,

        updated_at:
          new Date()
            .toISOString(),
      };


      let currentEventId =
        editingEvent
          ?.id ||
        null;


      let oldBlocks =
        [];


      if (editingEvent) {
        const {
          data,
          error,
        } = await supabase
          .from(
            "obala_event_blocks"
          )
          .select(`
            id,
            media_storage_path
          `)
          .eq(
            "event_id",
            editingEvent.id
          );


        if (error) {
          throw error;
        }


        oldBlocks =
          data ?? [];


        /*
         * Kod izmene pripremamo sve blokove
         * pre promene glavnog event reda.
         * Tako pogrešan fajl ne može da
         * promeni već objavljen događaj.
         */

        const preparedBlocks =
          [];


        for (
          const block
          of blocks
        ) {
          const prepared =
            await prepareBlock(
              block,
              editingEvent.id,
              preparedBlocks.length,
              uploadedPaths
            );


          if (prepared) {
            preparedBlocks.push(
              prepared
            );
          }
        }


        const {
          error:
            updateError,
        } = await supabase
          .from(
            "obala_events"
          )
          .update(
            eventPayload
          )
          .eq(
            "id",
            editingEvent.id
          );


        if (
          updateError
        ) {
          throw updateError;
        }


        eventMetadataSaved =
          true;


        await replaceEventBlocks({
          currentEventId:
            editingEvent.id,

          preparedBlocks,

          oldBlocks,
        });


        const usedStoragePaths =
          new Set(
            preparedBlocks
              .map(
                (
                  block
                ) =>
                  block
                    .media_storage_path
              )
              .filter(
                Boolean
              )
          );


        for (
          const oldBlock
          of oldBlocks
        ) {
          const oldPath =
            oldBlock
              .media_storage_path;


          if (
            oldPath &&
            !usedStoragePaths.has(
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

      } else {
        const {
          data,
          error,
        } = await supabase
          .from(
            "obala_events"
          )
          .insert({
            ...eventPayload,

            created_at:
              new Date()
                .toISOString(),
          })
          .select(
            "id"
          )
          .single();


        if (error) {
          throw error;
        }


        currentEventId =
          data.id;

        createdEventId =
          data.id;

        eventMetadataSaved =
          true;


        const preparedBlocks =
          [];


        for (
          const block
          of blocks
        ) {
          const prepared =
            await prepareBlock(
              block,
              currentEventId,
              preparedBlocks.length,
              uploadedPaths
            );


          if (prepared) {
            preparedBlocks.push(
              prepared
            );
          }
        }


        if (
          preparedBlocks.length
        ) {
          const {
            error:
              insertError,
          } = await supabase
            .from(
              "obala_event_blocks"
            )
            .insert(
              preparedBlocks
            );


          if (
            insertError
          ) {
            throw insertError;
          }
        }
      }


      completeSave =
        true;


      if (
        oldEvent
          ?.poster_storage_path &&
        oldEvent
          .poster_storage_path !==
          posterStoragePath
      ) {
        await deleteObalaBoardMedia(
          oldEvent
            .poster_storage_path
        ).catch(
          () => {}
        );
      }


      await markCommitted(
        createEmptyEditorState(),
        {
          clearFiles:
            true,

          message:
            editingEvent
              ? "Догађај је сачуван."
              : "Догађај је додат.",
        }
      ).catch(
        (
          error
        ) => {
          console.error(
            "Čišćenje recovery drafta Panoa:",
            error
          );
        }
      );


      setPosterFile(
        null
      );


      setMessage({
        type:
          "success",

        text:
          editingEvent
            ? "Догађај је измењен."
            : "Догађај је додат.",
      });


      await loadEvents();


      navigate(
        basePath
      );

    } catch (
      error
    ) {
      let safeToDeleteUploads =
        !eventMetadataSaved;


      /*
       * Novi događaj koji nije kompletno
       * sačuvan uklanjamo iz baze.
       */

      if (
        createdEventId &&
        !completeSave
      ) {
        const {
          error:
            cleanupError,
        } = await supabase
          .from(
            "obala_events"
          )
          .delete()
          .eq(
            "id",
            createdEventId
          );


        if (!cleanupError) {
          safeToDeleteUploads =
            true;
        }
      }


      /*
       * Kod postojeće objave pokušavamo
       * da vratimo prethodni glavni red
       * ako je problem nastao pri zameni
       * reader blokova.
       */

      if (
        editingEvent &&
        eventMetadataSaved &&
        !completeSave
      ) {
        const {
          error:
            rollbackError,
        } = await supabase
          .from(
            "obala_events"
          )
          .update({
            title:
              editingEvent.title,

            category:
              editingEvent.category,

            location:
              editingEvent.location,

            event_date:
              editingEvent.event_date,

            visible_from:
              editingEvent.visible_from,

            expires_at:
              editingEvent.expires_at,

            status:
              editingEvent.status,

            sort_order:
              editingEvent.sort_order,

            poster_url:
              editingEvent.poster_url,

            poster_storage_path:
              editingEvent
                .poster_storage_path,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            editingEvent.id
          );


        if (!rollbackError) {
          safeToDeleteUploads =
            true;

        } else {
          console.error(
            "Pano rollback nije uspeo:",
            rollbackError
          );
        }
      }


      if (
        safeToDeleteUploads
      ) {
        for (
          const path
          of uploadedPaths
        ) {
          await deleteObalaBoardMedia(
            path
          ).catch(
            () => {}
          );
        }
      }


      setMessage({
        type:
          "error",

        text:
          error?.message ||
          "Чување није успело. Локални нацрт је остао сачуван.",
      });

    } finally {
      setSaving(
        false
      );
    }
  }


  async function handleCancel() {
    const baseline =
      editingEvent
        ? {
            form:
              formFromEvent(
                editingEvent
              ),

            blocks:
              stripBlockFiles(
                blocks
              ),
          }

        : createEmptyEditorState();


    await discardDraft(
      baseline,
      {
        clearFiles:
          true,
      }
    );


    setPosterFile(
      null
    );


    navigate(
      basePath
    );
  }


  async function deleteEvent(
    event
  ) {
    const confirmed =
      window.confirm(
        `Трајно обрисати „${event.title}“?`
      );


    if (!confirmed) {
      return;
    }


    setMessage({
      type:
        "",

      text:
        "",
    });


    try {
      const {
        data:
          blockData,

        error:
          blockError,
      } = await supabase
        .from(
          "obala_event_blocks"
        )
        .select(
          "media_storage_path"
        )
        .eq(
          "event_id",
          event.id
        );


      if (blockError) {
        throw blockError;
      }


      const {
        error,
      } = await supabase
        .from(
          "obala_events"
        )
        .delete()
        .eq(
          "id",
          event.id
        );


      if (error) {
        throw error;
      }


      if (
        event
          .poster_storage_path
      ) {
        await deleteObalaBoardMedia(
          event
            .poster_storage_path
        ).catch(
          () => {}
        );
      }


      for (
        const block
        of blockData ??
        []
      ) {
        if (
          block
            .media_storage_path
        ) {
          await deleteObalaBoardMedia(
            block
              .media_storage_path
          ).catch(
            () => {}
          );
        }
      }


      await clearAdminDraft(
        `obala-board:${characterKey}:${event.id}`
      ).catch(
        () => {}
      );


      if (
        String(
          eventId
        ) ===
        String(
          event.id
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


      setMessage({
        type:
          "success",

        text:
          "Догађај је обрисан.",
      });


      await loadEvents();

    } catch (
      error
    ) {
      setMessage({
        type:
          "error",

        text:
          error?.message ||
          "Брисање није успело.",
      });
    }
  }


  const currentCount =
    useMemo(
      () =>
        events.filter(
          (
            event
          ) =>
            getStateLabel(
              event
            ) ===
            "АКТУЕЛАН"
        ).length,
      [
        events,
      ]
    );


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


  function renderList() {
    return (
      <>
        <div className="form-actions">
          <button
            type="button"
            className="admin-obala-board__save"
            onClick={() =>
              navigate(
                `${basePath}/novi`
              )
            }
          >
            + НОВИ ДОГАЂАЈ
          </button>
        </div>


        <section className="admin-obala-board__list">
          <h2>
            Сви догађаји
          </h2>


          {loading ? (
            <p>
              Учитавање...
            </p>

          ) : events.length ===
            0 ? (
            <p>
              Још нема догађаја.
            </p>

          ) : (
            <div className="admin-obala-board__cards">
              {events.map(
                (
                  event
                ) => (
                  <article
                    key={
                      event.id
                    }
                    className="admin-obala-board__card"
                  >
                    {event.poster_url ? (
                      <img
                        src={
                          event.poster_url
                        }
                        alt=""
                      />
                    ) : null}


                    <div className="admin-obala-board__card-copy">
                      <span>
                        {getStateLabel(
                          event
                        )}

                        {" · "}

                        {event.category}
                      </span>


                      <h3>
                        {event.title}
                      </h3>


                      <p>
                        {formatAdminDate(
                          event.event_date
                        )}
                      </p>
                    </div>


                    <div className="admin-obala-board__card-actions">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `${basePath}/${event.id}`
                          )
                        }
                      >
                        Измени
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          deleteEvent(
                            event
                          )
                        }
                      >
                        Обриши
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </>
    );
  }


  function renderEditor() {
    if (loading) {
      return (
        <p>
          Учитавање едитора...
        </p>
      );
    }


    if (
      isEditRoute &&
      !editingEvent &&
      editorReadyKey !==
        draftKey
    ) {
      return (
        <div>
          <p className="error-message">
            {message.text ||
              "Тражени догађај не постоји."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                basePath
              )
            }
          >
            ← Назад на Пано
          </button>
        </div>
      );
    }


    if (!editorReady) {
      return (
        <p>
          Учитавање едитора...
        </p>
      );
    }


    return (
      <form
        className="admin-obala-board__form"
        onSubmit={
          saveEvent
        }
      >
        <div className="admin-obala-board__form-heading">
          <div>
            <p className="eyebrow">
              {editingEvent
                ? "ИЗМЕНА ДОГАЂАЈА"
                : "НОВИ ДОГАЂАЈ"}
            </p>

            <h2>
              {editingEvent
                ? form.title ||
                  "Измена догађаја"
                : "Додај на Пано"}
            </h2>
          </div>


          <button
            type="button"
            onClick={
              handleCancel
            }
          >
            Назад / одбаци измене
          </button>
        </div>


        {recovered ? (
          <p className="admin-obala-board__message admin-obala-board__message--success">
            Враћен је локално
            сачуван нацрт
            {recoveryTime
              ? ` од ${recoveryTime}.`
              : "."}
          </p>
        ) : null}


        <div className="admin-obala-board__grid">
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
            Врста догађаја /
            фасцикла

            <input
              type="text"
              list="obala-event-categories"
              value={
                form.category
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "category",
                    event
                      .target
                      .value
                  )
              }
              required
            />


            <datalist id="obala-event-categories">
              {CATEGORY_SUGGESTIONS.map(
                (
                  category
                ) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  />
                )
              )}
            </datalist>
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
                  updateField(
                    "location",
                    event
                      .target
                      .value
                  )
              }
            />
          </label>


          <label>
            Редослед на
            актуелном паноу

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
            Датум догађаја

            <input
              type="datetime-local"
              value={
                form.event_date
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "event_date",
                    event
                      .target
                      .value
                  )
              }
              required
            />
          </label>


          <label>
            Појави се на паноу од

            <input
              type="datetime-local"
              value={
                form.visible_from
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "visible_from",
                    event
                      .target
                      .value
                  )
              }
              required
            />
          </label>


          <label>
            Аутоматски пређе у
            архиву после

            <input
              type="datetime-local"
              value={
                form.expires_at
              }
              onChange={
                (
                  event
                ) =>
                  updateField(
                    "expires_at",
                    event
                      .target
                      .value
                  )
              }
              required
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
        </div>


        <fieldset className="admin-obala-board__fieldset">
          <legend>
            Постер за физички Пано
          </legend>


          {form.poster_url &&
          !posterFile ? (
            <img
              className="admin-obala-board__poster-preview"
              src={
                form.poster_url
              }
              alt=""
            />
          ) : null}


          <label>
            Отпреми постер

            <input
              type="file"
              accept="image/*"
              onChange={
                (
                  event
                ) =>
                  setPosterFile(
                    event
                      .target
                      .files?.[0] ||
                    null
                  )
              }
            />


            {posterFile ? (
              <small>
                Локално обезбеђен
                постер:{" "}

                <strong>
                  {posterFile.name}
                </strong>
              </small>
            ) : null}
          </label>
        </fieldset>


        <fieldset className="admin-obala-board__fieldset">
          <legend>
            Reader — блокови
          </legend>


          <p className="admin-obala-board__help">
            Редослед блокова је
            редослед у readeru.
            Сваки текст и сваки
            изабрани локални фајл
            сада има recovery.
          </p>


          <div className="admin-obala-board__add-blocks">
            {BLOCK_TYPES.map(
              (
                blockType
              ) => (
                <button
                  key={
                    blockType.value
                  }
                  type="button"
                  onClick={() =>
                    addBlock(
                      blockType.value
                    )
                  }
                >
                  + {blockType.label}
                </button>
              )
            )}
          </div>


          <div className="admin-obala-board__blocks">
            {blocks.map(
              (
                block,
                index
              ) => (
                <article
                  key={
                    block.clientId
                  }
                  className="admin-obala-board__block"
                >
                  <div className="admin-obala-board__block-head">
                    <strong>
                      {BLOCK_TYPES
                        .find(
                          (
                            type
                          ) =>
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
                          index ===
                          0
                        }
                        onClick={() =>
                          moveBlock(
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
                          blocks.length -
                            1
                        }
                        onClick={() =>
                          moveBlock(
                            index,
                            1
                          )
                        }
                      >
                        ↓
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          removeBlock(
                            block.clientId
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  </div>


                  {block.block_type ===
                    "text" ? (
                    <label>
                      Текст

                      <textarea
                        rows="8"
                        value={
                          block.text_content
                        }
                        onChange={
                          (
                            event
                          ) =>
                            updateBlock(
                              block.clientId,
                              "text_content",
                              event
                                .target
                                .value
                            )
                        }
                        placeholder="Пиши текст како желиш да стоји у readeru."
                      />
                    </label>

                  ) : (
                    <>
                      <div className="admin-obala-board__block-grid">
                        <label>
                          Позиција

                          <select
                            value={
                              block.position
                            }
                            onChange={
                              (
                                event
                              ) =>
                                updateBlock(
                                  block.clientId,
                                  "position",
                                  event
                                    .target
                                    .value
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
                          Потпис —
                          опционо

                          <input
                            type="text"
                            value={
                              block.caption
                            }
                            onChange={
                              (
                                event
                              ) =>
                                updateBlock(
                                  block.clientId,
                                  "caption",
                                  event
                                    .target
                                    .value
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
                            (
                              event
                            ) =>
                              updateBlock(
                                block.clientId,
                                "media_url",
                                event
                                  .target
                                  .value
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
                          Или отпреми
                          фајл

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
                              (
                                event
                              ) =>
                                handleBlockFile(
                                  block.clientId,
                                  event
                                    .target
                                    .files?.[0] ||
                                  null
                                )
                            }
                          />


                          {block.file ? (
                            <small>
                              Локално
                              обезбеђен фајл:
                              {" "}

                              <strong>
                                {block.file.name}
                              </strong>
                            </small>
                          ) : null}
                        </label>
                      ) : null}


                      {block.media_url &&
                      !block.file ? (
                        <small className="admin-obala-board__existing-media">
                          Постојећи медиј
                          је повезан.
                        </small>
                      ) : null}
                    </>
                  )}
                </article>
              )
            )}
          </div>
        </fieldset>


        {message.text ? (
          <p
            className={
              `admin-obala-board__message admin-obala-board__message--${message.type}`
            }
          >
            {message.text}
          </p>
        ) : null}


        <button
          type="submit"
          className="admin-obala-board__save"
          disabled={
            saving
          }
        >
          {saving
            ? "ЧУВАМ..."
            : editingEvent
              ? "САЧУВАЈ ИЗМЕНЕ"
              : "ДОДАЈ ДОГАЂАЈ"}
        </button>
      </form>
    );
  }


  return (
    <section className="admin-obala-board">
      <Link
        to="/admin/likovi/covek-1"
        className="admin-obala-board__back"
      >
        ← ЧОВЕК 1
      </Link>


      <header className="admin-obala-board__heading">
        <div>
          <p className="eyebrow">
            ЧОВЕК 1 / АКЦ ОБАЛА
          </p>

          <h1>
            Пано
          </h1>

          <p>
            Актуелна дешавања се
            сама појављују на паноу,
            а после рока аутоматски
            одлазе у архиву.
          </p>
        </div>


        <div className="admin-obala-board__heading-actions">
          <span>
            АКТУЕЛНО:{" "}
            {currentCount}
          </span>

          <Link to="/autor/covek/obala/pano">
            Отвори јавни Пано ↗
          </Link>
        </div>
      </header>


      {!isEditorRoute &&
      message.text ? (
        <p
          className={
            `admin-obala-board__message admin-obala-board__message--${message.type}`
          }
        >
          {message.text}
        </p>
      ) : null}


      {isEditorRoute
        ? renderEditor()
        : renderList()}
    </section>
  );
}


export default AdminObalaBoard;