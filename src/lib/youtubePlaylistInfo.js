import {
  supabase,
} from "./supabaseClient";


const summaryCache =
  new Map();


const fullCache =
  new Map();


function normalizeIds(
  playlistIds
) {
  return [
    ...new Set(
      (
        Array.isArray(
          playlistIds
        )
          ? playlistIds
          : []
      )
        .map(
          (
            value
          ) =>
            String(
              value ??
              ""
            ).trim()
        )
        .filter(
          Boolean
        )
    ),
  ];
}


function normalizeInfo(
  playlistInfo
) {
  const playlistId =
    String(
      playlistInfo
        ?.playlistId ??
      ""
    ).trim();


  if (
    !playlistId
  ) {
    return null;
  }


  return {
    playlistId,

    itemCount:
      Number.isFinite(
        Number(
          playlistInfo
            ?.itemCount
        )
      )
        ? Number(
            playlistInfo
              .itemCount
          )
        : 0,

    items:
      Array.isArray(
        playlistInfo
          ?.items
      )
        ? playlistInfo
            .items
        : [],
  };
}


export async function loadYouTubePlaylistInfo(
  playlistIds,
  {
    includeItems =
      true,
  } = {}
) {
  const ids =
    normalizeIds(
      playlistIds
    );


  if (
    !ids.length
  ) {
    return {};
  }


  const cache =
    includeItems
      ? fullCache
      : summaryCache;


  const missingIds =
    ids.filter(
      (
        playlistId
      ) =>
        !cache.has(
          playlistId
        )
    );


  if (
    missingIds.length
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .functions
        .invoke(
          "youtube-playlist-info",
          {
            body: {
              playlistIds:
                missingIds,

              includeItems,
            },
          }
        );


    if (
      error
    ) {
      throw error;
    }


    const received =
      Array.isArray(
        data?.playlists
      )
        ? data.playlists
        : [];


    for (
      const rawInfo of
        received
    ) {
      const info =
        normalizeInfo(
          rawInfo
        );


      if (
        !info
      ) {
        continue;
      }


      cache.set(
        info.playlistId,
        info
      );


      /*
       * Puni odgovor automatski može
       * da posluži i kao summary.
       */
      if (
        includeItems
      ) {
        summaryCache.set(
          info.playlistId,
          {
            ...info,

            items:
              [],
          }
        );
      }
    }
  }


  return Object.fromEntries(
    ids.map(
      (
        playlistId
      ) => [
        playlistId,

        cache.get(
          playlistId
        ) ??
        null,
      ]
    )
  );
}