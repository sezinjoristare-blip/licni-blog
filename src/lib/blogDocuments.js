import { supabase } from "./supabaseClient";

const BUCKET_NAME = "blog-documents";

export async function uploadBlogPdf(file) {
  if (!file) {
    return null;
  }

  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new Error(
      "Možeš da postaviš samo PDF dokument."
    );
  }

  const fileName =
    `${crypto.randomUUID()}.pdf`;

  const path =
    `articles/${fileName}`;

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
        contentType: "application/pdf",
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
    originalFileName: file.name,
  };
}

export async function deleteBlogPdf(path) {
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
      "Brisanje PDF dokumenta:",
      error
    );
  }
}