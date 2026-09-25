const CORS_HEADERS = {
  "Access-Control-Allow-Origin":
    "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};


type YouTubePlaylistSummary = {
  id?: string;

  contentDetails?: {
    itemCount?: number;
  };
};


type YouTubePlaylistItem = {
  contentDetails?: {
    videoId?: string;
  };

  snippet?: {
    title?: string;

    position?: number;

    channelTitle?: string;

    videoOwnerChannelTitle?: string;

    resourceId?: {
      videoId?: string;
    };
  };
};


type YouTubePlaylistsResponse = {
  items?: YouTubePlaylistSummary[];
};


type YouTubePlaylistItemsResponse = {
  items?: YouTubePlaylistItem[];

  nextPageToken?: string;
};


type CleanYouTubeItem = {
  videoId: string;

  title: string;

  channelTitle: string;

  position: number;
};


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


function cleanPlaylistIds(
  value: unknown
) {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }


  return [
    ...new Set(
      value
        .filter(
          (
            item
          ): item is string =>
            typeof item ===
            "string"
        )
        .map(
          (
            item
          ) =>
            item.trim()
        )
        .filter(
          (
            item
          ) =>
            /^[A-Za-z0-9_-]{10,120}$/.test(
              item
            )
        )
    ),
  ].slice(
    0,
    20
  );
}


async function fetchJson<
  T
>(
  url: URL
): Promise<T> {
  const response =
    await fetch(
      url
    );


  const body =
    await response
      .json();


  if (
    !response.ok
  ) {
    console.error(
      "YouTube API:",
      body
    );


    const errorBody =
      body as {
        error?: {
          message?: string;
        };
      };


    throw new Error(
      errorBody
        ?.error
        ?.message ||
      "YouTube API greška."
    );
  }


  return body as T;
}


async function fetchAllPlaylistItems(
  playlistId: string,
  apiKey: string
) {
  const items:
    CleanYouTubeItem[] =
      [];


  let pageToken =
    "";


  do {
    const itemsUrl =
      new URL(
        "https://www.googleapis.com/youtube/v3/playlistItems"
      );


    itemsUrl.searchParams.set(
      "part",
      "snippet,contentDetails"
    );

    itemsUrl.searchParams.set(
      "playlistId",
      playlistId
    );

    itemsUrl.searchParams.set(
      "maxResults",
      "50"
    );

    itemsUrl.searchParams.set(
      "key",
      apiKey
    );


    if (
      pageToken
    ) {
      itemsUrl.searchParams.set(
        "pageToken",
        pageToken
      );
    }


    const response =
      await fetchJson<
        YouTubePlaylistItemsResponse
      >(
        itemsUrl
      );


    for (
      const item of
        response.items ??
        []
    ) {
      const videoId =
        String(
          item
            ?.contentDetails
            ?.videoId ??
          item
            ?.snippet
            ?.resourceId
            ?.videoId ??
          ""
        ).trim();


      const title =
        String(
          item
            ?.snippet
            ?.title ??
          ""
        ).trim();


      if (
        !videoId ||
        !title
      ) {
        continue;
      }


      items.push({
        videoId,

        title,

        channelTitle:
          String(
            item
              ?.snippet
              ?.videoOwnerChannelTitle ??
            item
              ?.snippet
              ?.channelTitle ??
            ""
          ).trim(),

        position:
          Number(
            item
              ?.snippet
              ?.position ??
            items.length
          ),
      });
    }


    pageToken =
      String(
        response
          .nextPageToken ??
        ""
      );

  } while (
    pageToken
  );


  return items.sort(
    (
      first,
      second
    ) =>
      first.position -
      second.position
  );
}


Deno.serve(
  async (
    req
  ) => {
    if (
      req.method ===
      "OPTIONS"
    ) {
      return new Response(
        null,
        {
          status:
            204,

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


    const apiKey =
      Deno.env.get(
        "YOUTUBE_API_KEY"
      );


    if (
      !apiKey
    ) {
      return jsonResponse(
        {
          error:
            "YouTube API ključ nije podešen.",
        },
        500
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
            "Neispravan JSON.",
        },
        400
      );
    }


    const playlistIds =
      cleanPlaylistIds(
        body.playlistIds
      );


    const includeItems =
      body.includeItems !==
      false;


    if (
      !playlistIds.length
    ) {
      return jsonResponse({
        playlists:
          [],
      });
    }


    /*
     * Full item čitanje nam u aplikaciji
     * treba samo za otvorenu playlistu.
     *
     * Sprečavamo da jedan javni zahtev
     * traži kompletan sadržaj gomile
     * playlisti odjednom.
     */
    if (
      includeItems &&
      playlistIds.length >
        3
    ) {
      return jsonResponse(
        {
          error:
            "Previše plejlista za jedan puni zahtev.",
        },
        400
      );
    }


    try {
      const playlistUrl =
        new URL(
          "https://www.googleapis.com/youtube/v3/playlists"
        );


      playlistUrl.searchParams.set(
        "part",
        "contentDetails"
      );

      playlistUrl.searchParams.set(
        "id",
        playlistIds.join(
          ","
        )
      );

      playlistUrl.searchParams.set(
        "key",
        apiKey
      );


      const playlistResponse =
        await fetchJson<
          YouTubePlaylistsResponse
        >(
          playlistUrl
        );


      const countMap =
        new Map<
          string,
          number
        >();


      for (
        const item of
          playlistResponse
            .items ??
          []
      ) {
        const playlistId =
          String(
            item.id ??
            ""
          );


        if (
          !playlistId
        ) {
          continue;
        }


        countMap.set(
          playlistId,

          Number(
            item
              ?.contentDetails
              ?.itemCount ??
            0
          )
        );
      }


      const playlists =
        await Promise.all(
          playlistIds.map(
            async (
              playlistId
            ) => {
              const items =
                includeItems
                  ? await fetchAllPlaylistItems(
                      playlistId,
                      apiKey
                    )
                  : [];


              return {
                playlistId,

                itemCount:
                  countMap.get(
                    playlistId
                  ) ??
                  items.length,

                items,
              };
            }
          )
        );


      return jsonResponse({
        playlists,
      });

    } catch (
      error
    ) {
      console.error(
        error
      );


      return jsonResponse(
        {
          error:
            error instanceof Error
              ? error.message
              : "YouTube plejlistu nije moguće učitati.",
        },
        502
      );
    }
  }
);