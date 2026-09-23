const DRAFT_VERSION = 2;

const DRAFT_PREFIX =
  "seki-admin-draft:v2:";

const FILE_DATABASE_NAME =
  "seki-admin-draft-files";

const FILE_DATABASE_VERSION =
  1;

const FILE_STORE_NAME =
  "draft_files";


function isBrowser() {
  return (
    typeof window !==
      "undefined" &&
    typeof document !==
      "undefined"
  );
}


function normalizeKey(
  value
) {
  return String(
    value || ""
  ).trim();
}


function getDraftStorageKey(
  draftKey
) {
  return (
    DRAFT_PREFIX +
    normalizeKey(
      draftKey
    )
  );
}


function getFileId(
  draftKey,
  fieldKey
) {
  return (
    `${normalizeKey(
      draftKey
    )}::${normalizeKey(
      fieldKey
    )}`
  );
}


export function saveAdminDraft(
  draftKey,
  payload
) {
  if (!isBrowser()) {
    return null;
  }


  const normalizedKey =
    normalizeKey(
      draftKey
    );


  if (!normalizedKey) {
    return null;
  }


  const record = {
    version:
      DRAFT_VERSION,

    draftKey:
      normalizedKey,

    updatedAt:
      new Date()
        .toISOString(),

    payload,
  };


  window.localStorage.setItem(
    getDraftStorageKey(
      normalizedKey
    ),

    JSON.stringify(
      record
    )
  );


  return record;
}


export function loadAdminDraft(
  draftKey
) {
  if (!isBrowser()) {
    return null;
  }


  const normalizedKey =
    normalizeKey(
      draftKey
    );


  if (!normalizedKey) {
    return null;
  }


  try {
    const raw =
      window.localStorage
        .getItem(
          getDraftStorageKey(
            normalizedKey
          )
        );


    if (!raw) {
      return null;
    }


    const parsed =
      JSON.parse(
        raw
      );


    if (
      !parsed ||
      parsed.version !==
        DRAFT_VERSION
    ) {
      return null;
    }


    return parsed;

  } catch (
    error
  ) {
    console.error(
      "Čitanje admin drafta:",
      error
    );


    return null;
  }
}


export function removeAdminDraft(
  draftKey
) {
  if (!isBrowser()) {
    return;
  }


  const normalizedKey =
    normalizeKey(
      draftKey
    );


  if (!normalizedKey) {
    return;
  }


  window.localStorage
    .removeItem(
      getDraftStorageKey(
        normalizedKey
      )
    );
}


function canUseIndexedDb() {
  return (
    isBrowser() &&
    typeof window
      .indexedDB !==
      "undefined"
  );
}


function openFileDatabase() {
  if (
    !canUseIndexedDb()
  ) {
    return Promise.resolve(
      null
    );
  }


  return new Promise(
    (
      resolve,
      reject
    ) => {
      const request =
        window.indexedDB
          .open(
            FILE_DATABASE_NAME,
            FILE_DATABASE_VERSION
          );


      request.onupgradeneeded =
        () => {
          const database =
            request.result;


          let store;


          if (
            !database
              .objectStoreNames
              .contains(
                FILE_STORE_NAME
              )
          ) {
            store =
              database
                .createObjectStore(
                  FILE_STORE_NAME,
                  {
                    keyPath:
                      "id",
                  }
                );

          } else {
            store =
              request
                .transaction
                .objectStore(
                  FILE_STORE_NAME
                );
          }


          if (
            !store
              .indexNames
              .contains(
                "draftKey"
              )
          ) {
            store
              .createIndex(
                "draftKey",
                "draftKey",
                {
                  unique:
                    false,
                }
              );
          }
        };


      request.onsuccess =
        () => {
          resolve(
            request.result
          );
        };


      request.onerror =
        () => {
          reject(
            request.error
          );
        };
    }
  );
}


export async function saveAdminDraftFile(
  draftKey,
  fieldKey,
  file
) {
  const normalizedDraftKey =
    normalizeKey(
      draftKey
    );

  const normalizedFieldKey =
    normalizeKey(
      fieldKey
    );


  if (
    !normalizedDraftKey ||
    !normalizedFieldKey
  ) {
    return null;
  }


  if (!file) {
    await removeAdminDraftFile(
      normalizedDraftKey,
      normalizedFieldKey
    );

    return null;
  }


  const database =
    await openFileDatabase();


  if (!database) {
    return null;
  }


  const record = {
    id:
      getFileId(
        normalizedDraftKey,
        normalizedFieldKey
      ),

    draftKey:
      normalizedDraftKey,

    fieldKey:
      normalizedFieldKey,

    file,

    name:
      file.name ||
      "",

    type:
      file.type ||
      "",

    size:
      file.size ||
      0,

    lastModified:
      file.lastModified ||
      null,

    updatedAt:
      new Date()
        .toISOString(),
  };


  return new Promise(
    (
      resolve,
      reject
    ) => {
      const transaction =
        database
          .transaction(
            FILE_STORE_NAME,
            "readwrite"
          );


      const store =
        transaction
          .objectStore(
            FILE_STORE_NAME
          );


      store.put(
        record
      );


      transaction.oncomplete =
        () => {
          database.close();

          resolve(
            record
          );
        };


      transaction.onerror =
        () => {
          const error =
            transaction.error;

          database.close();

          reject(
            error
          );
        };


      transaction.onabort =
        () => {
          const error =
            transaction.error;

          database.close();

          reject(
            error
          );
        };
    }
  );
}


export async function loadAdminDraftFile(
  draftKey,
  fieldKey
) {
  const normalizedDraftKey =
    normalizeKey(
      draftKey
    );

  const normalizedFieldKey =
    normalizeKey(
      fieldKey
    );


  if (
    !normalizedDraftKey ||
    !normalizedFieldKey
  ) {
    return null;
  }


  const database =
    await openFileDatabase();


  if (!database) {
    return null;
  }


  return new Promise(
    (
      resolve,
      reject
    ) => {
      const transaction =
        database
          .transaction(
            FILE_STORE_NAME,
            "readonly"
          );


      const store =
        transaction
          .objectStore(
            FILE_STORE_NAME
          );


      const request =
        store.get(
          getFileId(
            normalizedDraftKey,
            normalizedFieldKey
          )
        );


      request.onsuccess =
        () => {
          const record =
            request.result ||
            null;


          database.close();

          resolve(
            record
          );
        };


      request.onerror =
        () => {
          const error =
            request.error;

          database.close();

          reject(
            error
          );
        };
    }
  );
}


export async function loadAdminDraftFiles(
  draftKey
) {
  const normalizedDraftKey =
    normalizeKey(
      draftKey
    );


  if (
    !normalizedDraftKey
  ) {
    return {};
  }


  const database =
    await openFileDatabase();


  if (!database) {
    return {};
  }


  return new Promise(
    (
      resolve,
      reject
    ) => {
      const transaction =
        database
          .transaction(
            FILE_STORE_NAME,
            "readonly"
          );


      const store =
        transaction
          .objectStore(
            FILE_STORE_NAME
          );


      const index =
        store.index(
          "draftKey"
        );


      const request =
        index.getAll(
          normalizedDraftKey
        );


      request.onsuccess =
        () => {
          const result =
            {};


          (
            request.result ||
            []
          ).forEach(
            (
              record
            ) => {
              result[
                record.fieldKey
              ] =
                record.file;
            }
          );


          database.close();

          resolve(
            result
          );
        };


      request.onerror =
        () => {
          const error =
            request.error;

          database.close();

          reject(
            error
          );
        };
    }
  );
}


export async function removeAdminDraftFile(
  draftKey,
  fieldKey
) {
  const normalizedDraftKey =
    normalizeKey(
      draftKey
    );

  const normalizedFieldKey =
    normalizeKey(
      fieldKey
    );


  if (
    !normalizedDraftKey ||
    !normalizedFieldKey
  ) {
    return;
  }


  const database =
    await openFileDatabase();


  if (!database) {
    return;
  }


  return new Promise(
    (
      resolve,
      reject
    ) => {
      const transaction =
        database
          .transaction(
            FILE_STORE_NAME,
            "readwrite"
          );


      transaction
        .objectStore(
          FILE_STORE_NAME
        )
        .delete(
          getFileId(
            normalizedDraftKey,
            normalizedFieldKey
          )
        );


      transaction.oncomplete =
        () => {
          database.close();

          resolve();
        };


      transaction.onerror =
        () => {
          const error =
            transaction.error;

          database.close();

          reject(
            error
          );
        };
    }
  );
}


export async function clearAdminDraftFiles(
  draftKey
) {
  const normalizedDraftKey =
    normalizeKey(
      draftKey
    );


  if (
    !normalizedDraftKey
  ) {
    return;
  }


  const database =
    await openFileDatabase();


  if (!database) {
    return;
  }


  return new Promise(
    (
      resolve,
      reject
    ) => {
      const transaction =
        database
          .transaction(
            FILE_STORE_NAME,
            "readwrite"
          );


      const store =
        transaction
          .objectStore(
            FILE_STORE_NAME
          );


      const index =
        store.index(
          "draftKey"
        );


      const request =
        index.openCursor(
          normalizedDraftKey
        );


      request.onsuccess =
        (
          event
        ) => {
          const cursor =
            event
              .target
              .result;


          if (cursor) {
            cursor.delete();

            cursor.continue();
          }
        };


      transaction.oncomplete =
        () => {
          database.close();

          resolve();
        };


      transaction.onerror =
        () => {
          const error =
            transaction.error;

          database.close();

          reject(
            error
          );
        };
    }
  );
}


export async function clearAdminDraft(
  draftKey
) {
  removeAdminDraft(
    draftKey
  );


  await clearAdminDraftFiles(
    draftKey
  );
}