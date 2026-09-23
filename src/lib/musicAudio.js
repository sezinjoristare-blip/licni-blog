import {
  supabase,
} from "./supabaseClient";


const MUSIC_AUDIO_BUCKET =
  "music-audio";


const MAX_AUDIO_SIZE =
  50 *
  1024 *
  1024;


function sanitizeFileName(
  fileName
) {
  return String(
    fileName ||
    "audio"
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


export async function uploadMusicAudio(
  file
) {
  if (!file) {
    throw new Error(
      "Изабери аудио фајл."
    );
  }


  if (
    !file.type
      ?.startsWith(
        "audio/"
      )
  ) {
    throw new Error(
      "Дозвољени су само аудио фајлови."
    );
  }


  if (
    file.size >
    MAX_AUDIO_SIZE
  ) {
    throw new Error(
      "Аудио фајл је већи од 50 MB. За дужи снимак користи компримовани MP3 или директан HTTPS линк."
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
    `radio-dramas/${uniquePart}-${safeName}`;


  const {
    error,
  } = await supabase
    .storage
    .from(
      MUSIC_AUDIO_BUCKET
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
      MUSIC_AUDIO_BUCKET
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
        MUSIC_AUDIO_BUCKET
      )
      .remove([
        path,
      ]);

    throw new Error(
      "Није добијен јавни URL за аудио."
    );
  }


  return {
    path,

    url:
      data.publicUrl,
  };
}


export async function deleteMusicAudio(
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
      MUSIC_AUDIO_BUCKET
    )
    .remove([
      storagePath,
    ]);


  if (error) {
    throw error;
  }
}