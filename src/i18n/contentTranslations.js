import {
  supabase,
} from "../lib/supabaseClient";

import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
} from "./constants";


export function createTranslationKey(
  entityType,
  entityId,
  language
) {
  return [
    entityType,
    entityId,
    language,
  ].join(
    ":"
  );
}


export async function getContentTranslation({
  entityType,
  entityId,
  language,
}) {
  if (
    !entityType ||
    !entityId ||
    !language ||
    language ===
      DEFAULT_LANGUAGE
  ) {
    return null;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "content_translations"
      )
      .select(`
        id,
        entity_type,
        entity_id,
        language,
        fields,
        status,
        created_at,
        updated_at
      `)
      .eq(
        "entity_type",
        entityType
      )
      .eq(
        "entity_id",
        String(
          entityId
        )
      )
      .eq(
        "language",
        language
      )
      .eq(
        "status",
        "published"
      )
      .maybeSingle();


  if (error) {
    throw error;
  }


  return data;
}


export async function getContentTranslations({
  entityType,
  entityIds,
  language,
  includeDrafts = false,
}) {
  if (
    !entityType ||
    !Array.isArray(
      entityIds
    ) ||
    entityIds.length ===
      0 ||
    language ===
      DEFAULT_LANGUAGE
  ) {
    return new Map();
  }


  let query =
    supabase
      .from(
        "content_translations"
      )
      .select(`
        id,
        entity_type,
        entity_id,
        language,
        fields,
        status,
        created_at,
        updated_at
      `)
      .eq(
        "entity_type",
        entityType
      )
      .eq(
        "language",
        language
      )
      .in(
        "entity_id",
        entityIds.map(
          String
        )
      );


  if (!includeDrafts) {
    query =
      query.eq(
        "status",
        "published"
      );
  }


  const {
    data,
    error,
  } =
    await query;


  if (error) {
    throw error;
  }


  return new Map(
    (
      data ||
      []
    ).map(
      (
        translation
      ) => [
        String(
          translation
            .entity_id
        ),

        translation,
      ]
    )
  );
}


export async function saveContentTranslation({
  entityType,
  entityId,
  language = LANGUAGES.EN,
  fields,
  status = "draft",
}) {
  if (
    language ===
    DEFAULT_LANGUAGE
  ) {
    throw new Error(
      "Srpski original se ne čuva u tabeli prevoda."
    );
  }


  const payload = {
    entity_type:
      entityType,

    entity_id:
      String(
        entityId
      ),

    language,

    fields:
      fields ||
      {},

    status:
      status ===
        "published"
        ? "published"
        : "draft",

    updated_at:
      new Date()
        .toISOString(),
  };


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "content_translations"
      )
      .upsert(
        payload,
        {
          onConflict:
            "entity_type,entity_id,language",
        }
      )
      .select()
      .single();


  if (error) {
    throw error;
  }


  return data;
}


export function applyContentTranslation(
  original,
  translation
) {
  if (
    !original ||
    !translation?.fields
  ) {
    return original;
  }


  return {
    ...original,

    ...translation.fields,

    __translation:
      {
        language:
          translation
            .language,

        status:
          translation
            .status,

        updatedAt:
          translation
            .updated_at,
      },
  };
}


export function hasPublishedTranslation(
  translation
) {
  return Boolean(
    translation &&
    translation.status ===
      "published" &&
    translation.fields &&
    Object.keys(
      translation.fields
    ).length >
      0
  );
}