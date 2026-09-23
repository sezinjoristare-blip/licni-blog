import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  loadAdminDraftFile,
  removeAdminDraftFile,
  saveAdminDraftFile,
} from "./adminDraftStorage";

import {
  useAdminDraftStatus,
} from "./AdminDraftContext";


export default function useAdminDraftFile({
  draftKey,

  fieldKey,

  file,

  setFile,

  ready = true,

  enabled = true,

  scope = "",
}) {
  const {
    reportStatus,
  } =
    useAdminDraftStatus();


  const hydratedRef =
    useRef(
      ""
    );

  const skipNextPersistenceRef =
    useRef(
      false
    );


  const pairKey =
    `${draftKey || ""}::${
      fieldKey || ""
    }`;


  /*
   * ==========================================
   * RESTORE FILE-A
   * ==========================================
   */

  useEffect(() => {
    let cancelled =
      false;


    hydratedRef.current =
      "";

    skipNextPersistenceRef.current =
      false;


    if (
      !enabled ||
      !ready ||
      !draftKey ||
      !fieldKey
    ) {
      return undefined;
    }


    async function restoreFile() {
      try {
        const stored =
          await loadAdminDraftFile(
            draftKey,
            fieldKey
          );


        if (
          cancelled
        ) {
          return;
        }


        if (
          stored?.file &&
          typeof setFile ===
            "function"
        ) {
          /*
           * Sprečavamo sledeći effect da
           * vidi staro file=null stanje
           * i obriše upravo vraćen fajl.
           */

          skipNextPersistenceRef.current =
            true;


          setFile(
            stored.file
          );


          reportStatus(
            "local",
            {
              scope,

              message:
                `Враћен је локални фајл: ${stored.file.name}`,
            }
          );
        }


        hydratedRef.current =
          pairKey;

      } catch (
        error
      ) {
        console.error(
          "Vraćanje admin fajla:",
          error
        );


        hydratedRef.current =
          pairKey;


        reportStatus(
          "attention",
          {
            scope,

            message:
              "Локални фајл није могао да се врати.",
          }
        );
      }
    }


    restoreFile();


    return () => {
      cancelled =
        true;
    };
  }, [
    draftKey,
    fieldKey,
    pairKey,
    ready,
    enabled,
    setFile,
    reportStatus,
    scope,
  ]);


  /*
   * ==========================================
   * ČUVANJE FILE-A U INDEXED DB
   * ==========================================
   */

  useEffect(() => {
    if (
      !enabled ||
      !ready ||
      !draftKey ||
      !fieldKey ||
      hydratedRef.current !==
        pairKey
    ) {
      return;
    }


    if (
      skipNextPersistenceRef
        .current
    ) {
      skipNextPersistenceRef.current =
        false;

      return;
    }


    let cancelled =
      false;


    async function persistFile() {
      try {
        if (file) {
          await saveAdminDraftFile(
            draftKey,
            fieldKey,
            file
          );


          if (
            !cancelled
          ) {
            reportStatus(
              "local",
              {
                scope,

                message:
                  `Фајл „${file.name}“ је обезбеђен локално.`,
              }
            );
          }

        } else {
          await removeAdminDraftFile(
            draftKey,
            fieldKey
          );
        }

      } catch (
        error
      ) {
        console.error(
          "Čuvanje admin fajla:",
          error
        );


        if (
          !cancelled
        ) {
          reportStatus(
            "attention",
            {
              scope,

              message:
                "Текст је сачуван, али изабрани фајл није могао безбедно да се сачува локално.",
            }
          );
        }
      }
    }


    persistFile();


    return () => {
      cancelled =
        true;
    };
  }, [
    file,
    draftKey,
    fieldKey,
    pairKey,
    ready,
    enabled,
    reportStatus,
    scope,
  ]);


  const clearStoredFile =
    useCallback(
      async () => {
        if (
          !draftKey ||
          !fieldKey
        ) {
          return;
        }


        await removeAdminDraftFile(
          draftKey,
          fieldKey
        );
      },
      [
        draftKey,
        fieldKey,
      ]
    );


  return {
    clearStoredFile,
  };
}