import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  clearAdminDraftFiles,
  loadAdminDraft,
  removeAdminDraft,
  saveAdminDraft,
} from "./adminDraftStorage";

import {
  useAdminDraftStatus,
} from "./AdminDraftContext";


function serializeData(
  value
) {
  try {
    return JSON.stringify(
      value ?? null
    );

  } catch (
    error
  ) {
    console.error(
      "Admin draft nije moguće serijalizovati:",
      error
    );

    return null;
  }
}


function clearTimer(
  timerRef
) {
  if (
    timerRef.current
  ) {
    window.clearTimeout(
      timerRef.current
    );

    timerRef.current =
      null;
  }
}


export default function useAdminDraft({
  draftKey,

  data,

  onRestore,

  ready = true,

  enabled = true,

  localDebounceMs = 180,

  serverAutosave = null,

  serverAutosaveWhen = null,

  serverDebounceMs = 1400,

  scope = "",
}) {
  const {
    reportStatus,
  } =
    useAdminDraftStatus();


  const dataRef =
    useRef(
      data
    );

  const onRestoreRef =
    useRef(
      onRestore
    );

  const serverAutosaveRef =
    useRef(
      serverAutosave
    );

  const serverAutosaveWhenRef =
    useRef(
      serverAutosaveWhen
    );


  dataRef.current =
    data;

  onRestoreRef.current =
    onRestore;

  serverAutosaveRef.current =
    serverAutosave;

  serverAutosaveWhenRef.current =
    serverAutosaveWhen;


  const hydratedKeyRef =
    useRef(
      null
    );

  const skipNextDataEffectRef =
    useRef(
      false
    );

  const suppressNextCleanupRef =
    useRef(
      false
    );

  const lastLocalSerializedRef =
    useRef(
      null
    );

  const localTimerRef =
    useRef(
      null
    );

  const serverTimerRef =
    useRef(
      null
    );

  const serverSequenceRef =
    useRef(
      0
    );


  const [
    recoveredAt,
    setRecoveredAt,
  ] = useState(
    null
  );


  const persistLocal =
    useCallback(
      (
        snapshot =
          dataRef.current
      ) => {
        if (
          !enabled ||
          !ready ||
          !draftKey
        ) {
          return null;
        }


        const serialized =
          serializeData(
            snapshot
          );


        if (
          serialized ===
          null
        ) {
          reportStatus(
            "error",
            {
              scope,

              message:
                "Локални нацрт није могао да се сачува.",
            }
          );

          return null;
        }


        try {
          const record =
            saveAdminDraft(
              draftKey,
              snapshot
            );


          lastLocalSerializedRef
            .current =
              serialized;


          reportStatus(
            "local",
            {
              scope,

              message:
                "Измене су безбедно сачуване на овом уређају.",

              updatedAt:
                record
                  ?.updatedAt ||
                new Date()
                  .toISOString(),
            }
          );


          return record;

        } catch (
          error
        ) {
          console.error(
            "Lokalni admin autosave:",
            error
          );


          reportStatus(
            "error",
            {
              scope,

              message:
                "Локално чување није успело.",
            }
          );


          return null;
        }
      },
      [
        draftKey,
        enabled,
        ready,
        reportStatus,
        scope,
      ]
    );


  /*
   * ==========================================
   * HYDRATION
   *
   * Prvo učitavamo postojeći lokalni draft.
   * Ako postoji, on dobija prednost nad
   * učitanim server state-om.
   * ==========================================
   */

  useEffect(() => {
    clearTimer(
      localTimerRef
    );

    clearTimer(
      serverTimerRef
    );


    hydratedKeyRef.current =
      null;

    skipNextDataEffectRef.current =
      false;

    suppressNextCleanupRef.current =
      false;


    if (
      !enabled ||
      !ready ||
      !draftKey
    ) {
      return undefined;
    }


    const stored =
      loadAdminDraft(
        draftKey
      );


    if (
      stored &&
      Object.prototype
        .hasOwnProperty
        .call(
          stored,
          "payload"
        )
    ) {
      const serialized =
        serializeData(
          stored.payload
        );


      if (
        serialized !==
        null
      ) {
        /*
         * Važno:
         * sprečavamo sledeći data effect
         * da odmah pregazi upravo vraćeni
         * lokalni draft starim React state-om.
         */

        skipNextDataEffectRef.current =
          true;


        dataRef.current =
          stored.payload;


        lastLocalSerializedRef
          .current =
            serialized;


        if (
          typeof onRestoreRef
            .current ===
          "function"
        ) {
          onRestoreRef
            .current(
              stored.payload
            );
        }


        setRecoveredAt(
          stored.updatedAt ||
          null
        );


        reportStatus(
          "local",
          {
            scope,

            message:
              "Враћен је локално сачуван нацрт.",

            updatedAt:
              stored.updatedAt ||
              new Date()
                .toISOString(),
          }
        );

      } else {
        lastLocalSerializedRef
          .current =
            serializeData(
              dataRef.current
            );

        setRecoveredAt(
          null
        );
      }

    } else {
      lastLocalSerializedRef
        .current =
          serializeData(
            dataRef.current
          );

      setRecoveredAt(
        null
      );
    }


    hydratedKeyRef.current =
      draftKey;


    return () => {
      clearTimer(
        localTimerRef
      );

      clearTimer(
        serverTimerRef
      );
    };
  }, [
    draftKey,
    enabled,
    ready,
    reportStatus,
    scope,
  ]);


  /*
   * ==========================================
   * PROMENA PODATAKA
   *
   * - odmah prijavljujemo dirty stanje
   * - lokalno čuvanje posle 180ms
   * - opcioni server autosave kasnije
   *
   * Cleanup čuva snapshot iz baš tog rendera,
   * pa ni ultra-brz klik na drugu stranicu
   * ne može da pojede poslednje kucanje.
   * ==========================================
   */

  useEffect(() => {
    if (
      !enabled ||
      !ready ||
      !draftKey ||
      hydratedKeyRef
        .current !==
        draftKey
    ) {
      return undefined;
    }


    if (
      skipNextDataEffectRef
        .current
    ) {
      skipNextDataEffectRef.current =
        false;

      return undefined;
    }


    const serialized =
      serializeData(
        data
      );


    if (
      serialized ===
        null ||
      serialized ===
        lastLocalSerializedRef
          .current
    ) {
      return undefined;
    }


    reportStatus(
      "dirty",
      {
        scope,

        message:
          "Постоје нове измене.",
      }
    );


    clearTimer(
      localTimerRef
    );

    clearTimer(
      serverTimerRef
    );


    localTimerRef.current =
      window.setTimeout(
        () => {
          persistLocal(
            dataRef.current
          );
        },
        localDebounceMs
      );


    const canServerAutosave =
      typeof serverAutosaveRef
        .current ===
        "function" &&
      (
        typeof serverAutosaveWhenRef
          .current !==
          "function" ||
        serverAutosaveWhenRef
          .current(
            data
          )
      );


    if (
      canServerAutosave
    ) {
      const sequence =
        ++serverSequenceRef
          .current;


      serverTimerRef.current =
        window.setTimeout(
          async () => {
            const snapshot =
              dataRef.current;


            reportStatus(
              "saving",
              {
                scope,

                message:
                  "Чување у бази...",
              }
            );


            try {
              await serverAutosaveRef
                .current(
                  snapshot
                );


              if (
                sequence !==
                serverSequenceRef
                  .current
              ) {
                return;
              }


              reportStatus(
                "saved",
                {
                  scope,

                  message:
                    "Измене су сачуване.",
                }
              );

            } catch (
              error
            ) {
              if (
                sequence !==
                serverSequenceRef
                  .current
              ) {
                return;
              }


              console.error(
                "Admin server autosave:",
                error
              );


              reportStatus(
                "error",
                {
                  scope,

                  message:
                    "Серверско чување није успело. Локални нацрт је остао сачуван.",
                }
              );
            }
          },
          serverDebounceMs
        );
    }


    /*
     * Ako se data promeni ponovo ili
     * komponenta nestane pre debounce-a,
     * sinhrono čuvamo snapshot ovog rendera.
     */

    return () => {
      clearTimer(
        localTimerRef
      );

      clearTimer(
        serverTimerRef
      );


      if (
        suppressNextCleanupRef
          .current
      ) {
        suppressNextCleanupRef.current =
          false;

        return;
      }


      const snapshotSerialized =
        serializeData(
          data
        );


      if (
        snapshotSerialized ===
          null ||
        snapshotSerialized ===
          lastLocalSerializedRef
            .current
      ) {
        return;
      }


      try {
        saveAdminDraft(
          draftKey,
          data
        );


        lastLocalSerializedRef
          .current =
            snapshotSerialized;

      } catch (
        error
      ) {
        console.error(
          "Čuvanje admin drafta pri promeni/unmount-u:",
          error
        );
      }
    };
  }, [
    data,
    draftKey,
    enabled,
    ready,
    localDebounceMs,
    serverDebounceMs,
    persistLocal,
    reportStatus,
    scope,
  ]);


  /*
   * ==========================================
   * HARD REFRESH / ZATVARANJE TABA
   * ==========================================
   */

  useEffect(() => {
    if (
      !enabled ||
      !ready ||
      !draftKey
    ) {
      return undefined;
    }


    function handleBeforeUnload() {
      const snapshot =
        dataRef.current;

      const serialized =
        serializeData(
          snapshot
        );


      if (
        serialized ===
          null ||
        serialized ===
          lastLocalSerializedRef
            .current
      ) {
        return;
      }


      try {
        saveAdminDraft(
          draftKey,
          snapshot
        );

      } catch (
        error
      ) {
        console.error(
          "Emergency admin autosave:",
          error
        );
      }
    }


    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );


    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [
    draftKey,
    enabled,
    ready,
  ]);


  const forceLocalSave =
    useCallback(
      () => {
        return persistLocal(
          dataRef.current
        );
      },
      [
        persistLocal,
      ]
    );


  /*
   * Poziva se kada je korisnik eksplicitno
   * sačuvao sadržaj u Supabase-u.
   *
   * nextBaseline može biti isti sadržaj ili
   * npr. prazna forma posle uspešnog INSERT-a.
   */

  const markCommitted =
    useCallback(
      async (
        nextBaseline =
          dataRef.current,
        options = {}
      ) => {
        clearTimer(
          localTimerRef
        );

        clearTimer(
          serverTimerRef
        );


        const currentSerialized =
          serializeData(
            dataRef.current
          );

        const baselineSerialized =
          serializeData(
            nextBaseline
          );


        if (
          currentSerialized !==
          baselineSerialized
        ) {
          suppressNextCleanupRef.current =
            true;

          skipNextDataEffectRef.current =
            true;
        }


        removeAdminDraft(
          draftKey
        );


        if (
          options.clearFiles
        ) {
          await clearAdminDraftFiles(
            draftKey
          );
        }


        dataRef.current =
          nextBaseline;


        lastLocalSerializedRef
          .current =
            baselineSerialized;


        setRecoveredAt(
          null
        );


        reportStatus(
          "saved",
          {
            scope,

            message:
              options.message ||
              "Измене су сачуване.",
          }
        );
      },
      [
        draftKey,
        reportStatus,
        scope,
      ]
    );


  /*
   * Koristi se za OTKAŽI:
   * brišemo recovery za taj konkretan editor.
   */

  const discardDraft =
    useCallback(
      async (
        nextBaseline =
          dataRef.current,
        options = {}
      ) => {
        clearTimer(
          localTimerRef
        );

        clearTimer(
          serverTimerRef
        );


        const currentSerialized =
          serializeData(
            dataRef.current
          );

        const baselineSerialized =
          serializeData(
            nextBaseline
          );


        if (
          currentSerialized !==
          baselineSerialized
        ) {
          suppressNextCleanupRef.current =
            true;

          skipNextDataEffectRef.current =
            true;
        }


        removeAdminDraft(
          draftKey
        );


        if (
          options.clearFiles !==
          false
        ) {
          await clearAdminDraftFiles(
            draftKey
          );
        }


        dataRef.current =
          nextBaseline;


        lastLocalSerializedRef
          .current =
            baselineSerialized;


        setRecoveredAt(
          null
        );


        reportStatus(
          "idle",
          {
            scope,

            message:
              "",
          }
        );
      },
      [
        draftKey,
        reportStatus,
        scope,
      ]
    );


  return {
    recovered:
      Boolean(
        recoveredAt
      ),

    recoveredAt,

    forceLocalSave,

    markCommitted,

    discardDraft,
  };
}