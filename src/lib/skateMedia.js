import * as tus
  from "tus-js-client";

import {
  supabase,
} from "./supabaseClient";


const BUCKET_NAME =
  "skate-videos";

const CHUNK_SIZE =
  6 * 1024 * 1024;


function getFileExtension(
  file
) {
  const parts =
    file.name.split(".");

  if (
    parts.length < 2
  ) {
    return "mp4";
  }

  return parts
    .at(-1)
    .toLowerCase();
}


function getUploadStorageKey(
  file,
  folder
) {
  return [
    "skate-video-upload",
    folder,
    file.name,
    file.size,
    file.lastModified,
  ].join(":");
}


function createUploadPath(
  file,
  folder
) {
  const extension =
    getFileExtension(
      file
    );

  return (
    `${folder}/` +
    `${crypto.randomUUID()}.` +
    `${extension}`
  );
}


function getProjectReference() {
  const configuredUrl =
    import.meta.env
      .VITE_SUPABASE_URL;

  if (!configuredUrl) {
    throw new Error(
      "Nije pronađen VITE_SUPABASE_URL."
    );
  }

  const url =
    new URL(
      configuredUrl
    );

  return url.hostname
    .split(".")[0];
}


export async function uploadSkateVideo(
  file,
  folder = "skate-videos",
  onProgress = null
) {
  if (!file) {
    return null;
  }


  if (
    !file.type.startsWith(
      "video/"
    )
  ) {
    throw new Error(
      "Možeš da postaviš samo video fajl."
    );
  }


  const {
    data: {
      session,
    },
    error:
      sessionError,
  } =
    await supabase.auth
      .getSession();


  if (
    sessionError ||
    !session
      ?.access_token
  ) {
    throw new Error(
      "Administratorska sesija nije dostupna."
    );
  }


  const projectReference =
    getProjectReference();


  const uploadStorageKey =
    getUploadStorageKey(
      file,
      folder
    );


  let path =
    window.localStorage
      .getItem(
        uploadStorageKey
      );


  if (!path) {
    path =
      createUploadPath(
        file,
        folder
      );

    window.localStorage
      .setItem(
        uploadStorageKey,
        path
      );
  }


  const endpoint =
    `https://${projectReference}.storage.supabase.co/storage/v1/upload/resumable`;


  return new Promise(
    (
      resolve,
      reject
    ) => {
      const upload =
        new tus.Upload(
          file,
          {
            endpoint,

            retryDelays: [
              0,
              3000,
              5000,
              10000,
              20000,
            ],

            headers: {
              authorization:
                `Bearer ${session.access_token}`,
            },

            uploadDataDuringCreation:
              true,

            removeFingerprintOnSuccess:
              true,

            metadata: {
              bucketName:
                BUCKET_NAME,

              objectName:
                path,

              contentType:
                file.type ||
                "video/mp4",

              cacheControl:
                "3600",
            },

            /*
              Supabase trenutno traži
              TUS chunk od tačno 6 MB.
            */
            chunkSize:
              CHUNK_SIZE,

            onError(
              error
            ) {
              console.error(
                "Skate video upload:",
                error
              );

              reject(
                error
              );
            },

            onProgress(
              bytesUploaded,
              bytesTotal
            ) {
              const percentage =
                bytesTotal > 0
                  ? (
                      bytesUploaded /
                      bytesTotal
                    ) * 100
                  : 0;

              if (
                typeof onProgress ===
                "function"
              ) {
                onProgress(
                  Math.min(
                    100,
                    Math.round(
                      percentage
                    )
                  )
                );
              }
            },

            onSuccess() {
              window.localStorage
                .removeItem(
                  uploadStorageKey
                );


              const {
                data,
              } =
                supabase.storage
                  .from(
                    BUCKET_NAME
                  )
                  .getPublicUrl(
                    path
                  );


              if (
                typeof onProgress ===
                "function"
              ) {
                onProgress(
                  100
                );
              }


              resolve({
                path,
                url:
                  data.publicUrl,
              });
            },
          }
        );


      upload
        .findPreviousUploads()
        .then(
          (
            previousUploads
          ) => {
            if (
              previousUploads
                .length
            ) {
              upload
                .resumeFromPreviousUpload(
                  previousUploads[0]
                );
            }


            upload.start();
          }
        )
        .catch(
          reject
        );
    }
  );
}


export async function deleteSkateVideo(
  path
) {
  if (!path) {
    return;
  }


  const {
    error,
  } =
    await supabase.storage
      .from(
        BUCKET_NAME
      )
      .remove([
        path,
      ]);


  if (error) {
    console.error(
      "Brisanje skate videa:",
      error
    );
  }
}