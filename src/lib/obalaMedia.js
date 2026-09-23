import {
  supabase,
} from "./supabaseClient";


const OBALA_MEDIA_BUCKET =
  "obala-media";


const MAX_FILE_SIZE =
  50 *
  1024 *
  1024;


function sanitizeFileName(
  fileName
) {
  return String(
    fileName || "media"
  )
    .normalize(
      "NFKD"
    )
    .replace(
      /[^\w.-]+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    )
    .toLowerCase();
}


function getMediaType(
  file
) {
  if (
    file.type
      ?.startsWith(
        "audio/"
      )
  ) {
    return "audio";
  }


  if (
    file.type
      ?.startsWith(
        "video/"
      )
  ) {
    return "video";
  }


  return null;
}


export async function uploadObalaMedia(
  file
) {
  if (!file) {
    throw new Error(
      "Изабери аудио или видео фајл."
    );
  }


  const mediaType =
    getMediaType(
      file
    );


  if (!mediaType) {
    throw new Error(
      "Дозвољени су само аудио и видео фајлови."
    );
  }


  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    throw new Error(
      "Фајл је већи од 50 MB."
    );
  }


  const safeName =
    sanitizeFileName(
      file.name
    );


  const uniquePart =
    typeof crypto !==
      "undefined" &&
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;


  const path =
    `notebook/${uniquePart}-${safeName}`;


  const {
    error,
  } = await supabase
    .storage
    .from(
      OBALA_MEDIA_BUCKET
    )
    .upload(
      path,
      file,
      {
        cacheControl:
          "3600",

        upsert:
          false,

        contentType:
          file.type ||
          undefined,
      }
    );


  if (error) {
    throw error;
  }


  const {
    data,
  } = supabase
    .storage
    .from(
      OBALA_MEDIA_BUCKET
    )
    .getPublicUrl(
      path
    );


  if (
    !data
      ?.publicUrl
  ) {
    await supabase
      .storage
      .from(
        OBALA_MEDIA_BUCKET
      )
      .remove([
        path,
      ]);

    throw new Error(
      "Није добијен јавни URL за медиј."
    );
  }


  return {
    mediaType,

    path,

    url:
      data.publicUrl,
  };
}


export async function deleteObalaMedia(
  storagePath
) {
  if (!storagePath) {
    return;
  }


  const {
    error,
  } = await supabase
    .storage
    .from(
      OBALA_MEDIA_BUCKET
    )
    .remove([
      storagePath,
    ]);


  if (error) {
    throw error;
  }
}