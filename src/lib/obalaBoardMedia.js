import {
  supabase,
} from "./supabaseClient";


const BUCKET =
  "obala-media";


const MAX_FILE_SIZE =
  60 *
  1024 *
  1024;


function sanitizeFileName(
  fileName
) {
  return String(
    fileName ||
    "media"
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


function detectType(
  file
) {
  const mime =
    file.type ||
    "";


  if (
    mime ===
      "image/gif" ||
    file.name
      ?.toLowerCase()
      .endsWith(
        ".gif"
      )
  ) {
    return "gif";
  }


  if (
    mime.startsWith(
      "image/"
    )
  ) {
    return "image";
  }


  if (
    mime.startsWith(
      "video/"
    )
  ) {
    return "video";
  }


  return null;
}


export async function uploadObalaBoardMedia(
  file,
  folder =
    "content"
) {
  if (
    !file
  ) {
    throw new Error(
      "Изабери фајл."
    );
  }


  const mediaType =
    detectType(
      file
    );


  if (
    !mediaType
  ) {
    throw new Error(
      "Дозвољене су фотографије, GIF и видео фајлови."
    );
  }


  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    throw new Error(
      "Фајл је већи од 60 MB."
    );
  }


  const safeName =
    sanitizeFileName(
      file.name
    );


  const id =
    typeof crypto !==
      "undefined" &&
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;


  const path =
    `board/${folder}/${id}-${safeName}`;


  const {
    error,
  } = await supabase
    .storage
    .from(
      BUCKET
    )
    .upload(
      path,
      file,
      {
        upsert:
          false,

        cacheControl:
          "3600",

        contentType:
          file.type ||
          undefined,
      }
    );


  if (
    error
  ) {
    throw error;
  }


  const {
    data,
  } = supabase
    .storage
    .from(
      BUCKET
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
        BUCKET
      )
      .remove([
        path,
      ]);


    throw new Error(
      "Није добијен јавни URL."
    );
  }


  return {
    path,

    url:
      data.publicUrl,

    mediaType,
  };
}


export async function deleteObalaBoardMedia(
  path
) {
  if (
    !path
  ) {
    return;
  }


  const {
    error,
  } = await supabase
    .storage
    .from(
      BUCKET
    )
    .remove([
      path,
    ]);


  if (
    error
  ) {
    throw error;
  }
}