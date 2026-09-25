import {
  withSupabase,
} from "@supabase/server";


const CORS_HEADERS = {
  "Access-Control-Allow-Origin":
    "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};


const ALLOWED_TYPES =
  new Set([
    "music",
    "playlist",
    "radio_drama",
  ]);


const MAX_TITLE_LENGTH =
  180;

const MAX_CREATOR_LENGTH =
  180;

const MAX_SENDER_LENGTH =
  80;

const MAX_REASON_LENGTH =
  2000;


function jsonResponse(
  body: unknown,
  status = 200
) {
  return Response.json(
    body,
    {
      status,

      headers:
        CORS_HEADERS,
    }
  );
}


function cleanText(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


function normalizeYouTubeUrl(
  rawValue: unknown
) {
  const raw =
    cleanText(
      rawValue
    );


  if (!raw) {
    throw new Error(
      "Недостаје YouTube линк."
    );
  }


  let value =
    raw;


  if (
    !/^https?:\/\//i.test(
      value
    )
  ) {
    value =
      `https://${value}`;
  }


  let url: URL;


  try {
    url =
      new URL(
        value
      );
  } catch {
    throw new Error(
      "YouTube линк није исправан."
    );
  }


  const hostname =
    url.hostname
      .toLowerCase()
      .replace(
        /^www\./,
        ""
      );


  const isYouTube =
    hostname ===
      "youtu.be" ||
    hostname ===
      "youtube.com" ||
    hostname.endsWith(
      ".youtube.com"
    );


  if (!isYouTube) {
    throw new Error(
      "Линк мора да води на YouTube."
    );
  }


  url.protocol =
    "https:";


  return url;
}


function getYouTubeVideoId(
  url: URL
) {
  const hostname =
    url.hostname
      .toLowerCase()
      .replace(
        /^www\./,
        ""
      );


  if (
    hostname ===
    "youtu.be"
  ) {
    return (
      url.pathname
        .split("/")
        .filter(Boolean)[0] ||
      ""
    );
  }


  const queryId =
    url.searchParams.get(
      "v"
    );


  if (queryId) {
    return queryId;
  }


  const parts =
    url.pathname
      .split("/")
      .filter(Boolean);


  if (
    [
      "embed",
      "shorts",
      "live",
    ].includes(
      parts[0]
    ) &&
    parts[1]
  ) {
    return parts[1];
  }


  return "";
}


function getYouTubePlaylistId(
  url: URL
) {
  const playlistId =
    cleanText(
      url.searchParams.get(
        "list"
      )
    );


  if (
    !playlistId ||
    !/^[A-Za-z0-9_-]{10,120}$/.test(
      playlistId
    )
  ) {
    return "";
  }


  return playlistId;
}


function validateLength(
  value: string,
  maximum: number,
  message: string
) {
  if (
    value.length >
    maximum
  ) {
    throw new Error(
      message
    );
  }
}


export default {
  fetch:
    withSupabase(
      {
        auth:
          "publishable",
      },

      async (
        req,
        ctx
      ) => {
        if (
          req.method ===
          "OPTIONS"
        ) {
          return new Response(
            null,
            {
              status: 204,

              headers:
                CORS_HEADERS,
            }
          );
        }


        if (
          req.method !==
          "POST"
        ) {
          return jsonResponse(
            {
              error:
                "Method not allowed",
            },
            405
          );
        }


        let body:
          Record<
            string,
            unknown
          >;


        try {
          body =
            await req.json();
        } catch {
          return jsonResponse(
            {
              error:
                "Неисправан JSON.",
            },
            400
          );
        }


        /*
         * Honeypot.
         *
         * Pravi korisnik ovo polje
         * nikada ne vidi.
         */
        if (
          cleanText(
            body.website
          )
        ) {
          return jsonResponse({
            ok: true,
          });
        }


        const type =
          cleanText(
            body.type
          );

        const title =
          cleanText(
            body.title
          );

        const creator =
          cleanText(
            body.creator
          );

        const senderName =
          cleanText(
            body.senderName
          );

        const reason =
          cleanText(
            body.reason
          );

        const genreId =
          cleanText(
            body.genreId
          );


        if (
          !ALLOWED_TYPES.has(
            type
          )
        ) {
          return jsonResponse(
            {
              error:
                "Непознат тип препоруке.",
            },
            400
          );
        }


        if (!title) {
          return jsonResponse(
            {
              error:
                "Упиши назив.",
            },
            400
          );
        }


        if (!senderName) {
          return jsonResponse(
            {
              error:
                "Упиши име или надимак.",
            },
            400
          );
        }


        if (!reason) {
          return jsonResponse(
            {
              error:
                "Напиши зашто ти се ово свиђа.",
            },
            400
          );
        }


        try {
          validateLength(
            title,
            MAX_TITLE_LENGTH,
            "Назив је предугачак."
          );

          validateLength(
            creator,
            MAX_CREATOR_LENGTH,
            "Име извођача или аутора је предугачко."
          );

          validateLength(
            senderName,
            MAX_SENDER_LENGTH,
            "Име или надимак је предугачак."
          );

          validateLength(
            reason,
            MAX_REASON_LENGTH,
            "Текст препоруке је предугачак."
          );
        } catch (
          error
        ) {
          return jsonResponse(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Неисправан унос.",
            },
            400
          );
        }


        let youtubeUrl:
          URL;


        try {
          youtubeUrl =
            normalizeYouTubeUrl(
              body.url
            );
        } catch (
          error
        ) {
          return jsonResponse(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "YouTube линк није исправан.",
            },
            400
          );
        }


        let playlistId:
          string | null =
          null;


        if (
          type ===
          "playlist"
        ) {
          playlistId =
            getYouTubePlaylistId(
              youtubeUrl
            );


          if (
            !playlistId
          ) {
            return jsonResponse(
              {
                error:
                  "За плејлисту пошаљи YouTube playlist линк који садржи list=...",
              },
              400
            );
          }
        } else {
          const videoId =
            getYouTubeVideoId(
              youtubeUrl
            );


          if (
            !videoId
          ) {
            return jsonResponse(
              {
                error:
                  type ===
                  "radio_drama"
                    ? "За радио драму пошаљи директан YouTube видео линк."
                    : "За песму пошаљи директан YouTube видео линк.",
              },
              400
            );
          }
        }


        /*
         * Pesma mora da pripada
         * postojećem žanru.
         */
        if (
          type ===
          "music"
        ) {
          if (!genreId) {
            return jsonResponse(
              {
                error:
                  "Изабери жанр.",
              },
              400
            );
          }


          const {
            data:
              genre,
            error:
              genreError,
          } =
            await ctx
              .supabaseAdmin
              .from(
                "music_genres"
              )
              .select(
                "id"
              )
              .eq(
                "id",
                genreId
              )
              .maybeSingle();


          if (
            genreError ||
            !genre
          ) {
            return jsonResponse(
              {
                error:
                  "Изабрани жанр не постоји.",
              },
              400
            );
          }
        }


        const {
          error,
        } =
          await ctx
            .supabaseAdmin
            .from(
              "music_listener_recommendations"
            )
            .insert({
              type,

              title,

              creator:
                creator ||
                null,

              url:
                youtubeUrl
                  .toString(),

              sender_name:
                senderName,

              reason,

              genre_id:
                type ===
                  "music"
                  ? genreId
                  : null,

              youtube_playlist_id:
                type ===
                  "playlist"
                  ? playlistId
                  : null,

              status:
                "new",

              updated_at:
                new Date()
                  .toISOString(),
            });


        if (error) {
          console.error(
            "Čuvanje muzičke preporuke:",
            error
          );


          return jsonResponse(
            {
              error:
                "Препоруку тренутно није могуће послати.",
            },
            500
          );
        }


        return jsonResponse({
          ok: true,
        });
      }
    ),
};