import { supabase } from "./supabaseClient";

const BUCKET_NAME = "blog-images";

function getFileExtension(file) {
  const parts = file.name.split(".");

  if (parts.length < 2) {
    return "jpg";
  }

  return parts.at(-1).toLowerCase();
}

export async function uploadBlogImage(
  file,
  folder = "misc"
) {
  if (!file) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error(
      "Možeš da postaviš samo fotografiju."
    );
  }

  const maximumSize =
    10 * 1024 * 1024;

  if (file.size > maximumSize) {
    throw new Error(
      "Fotografija ne sme biti veća od 10 MB."
    );
  }

  const extension =
    getFileExtension(file);

  const fileName =
    `${crypto.randomUUID()}.${extension}`;

  const path =
    `${folder}/${fileName}`;

  const {
    error: uploadError,
  } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(
      path,
      file,
      {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      }
    );

  if (uploadError) {
    throw uploadError;
  }

  const {
    data,
  } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return {
    path,
    url: data.publicUrl,
  };
}

export async function deleteBlogImage(
  path
) {
  if (!path) {
    return;
  }

  const {
    error,
  } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error(
      "Brisanje fotografije:",
      error
    );
  }
}