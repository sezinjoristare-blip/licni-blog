export const MUSIC_HUB_PATH =
  "/autor/covek/muzika";


function normalizeOrigin(
  origin
) {
  if (
    !origin ||
    typeof origin !==
      "object" ||
    typeof origin.path !==
      "string" ||
    !origin.path.startsWith(
      "/"
    )
  ) {
    return null;
  }


  return {
    path:
      origin.path,

    label:
      typeof origin.label ===
        "string" &&
      origin.label.trim()
        ? origin.label.trim()
        : "НАЗАД",

    state:
      origin.state ??
      null,
  };
}


export function normalizeMusicPlaybackTrack(
  track
) {
  if (
    !track ||
    typeof track !==
      "object"
  ) {
    return null;
  }


  const title =
    String(
      track.title ??
      ""
    ).trim();


  const youtubeUrl =
    String(
      track.youtube_url ??
      ""
    ).trim();


  if (
    !title ||
    !youtubeUrl
  ) {
    return null;
  }


  return {
    ...track,

    id:
      track.id ??
      `${track.source ?? "external"}:${track.slug ?? title}`,

    title,

    artist:
      String(
        track.artist ??
        ""
      ).trim(),

    youtube_url:
      youtubeUrl,

    source:
      track.source ??
      "external",

    sourceLabel:
      track.sourceLabel ??
      "СА ПОЛИЦЕ",

    readerPath:
      typeof track.readerPath ===
        "string" &&
      track.readerPath.startsWith(
        "/"
      )
        ? track.readerPath
        : null,
  };
}


export function createMusicPlaybackHandoff({
  queue,
  startIndex = 0,
  origin = null,
  autoplay = true,
}) {
  const cleanQueue =
    Array.isArray(
      queue
    )
      ? queue
          .map(
            normalizeMusicPlaybackTrack
          )
          .filter(
            Boolean
          )
      : [];


  const safeStartIndex =
    cleanQueue.length
      ? Math.min(
          Math.max(
            Number.isInteger(
              startIndex
            )
              ? startIndex
              : 0,
            0
          ),
          cleanQueue.length -
            1
        )
      : 0;


  return {
    queue:
      cleanQueue,

    startIndex:
      safeStartIndex,

    origin:
      normalizeOrigin(
        origin
      ),

    autoplay:
      autoplay !==
      false,
  };
}


export function getMusicPlaybackHandoff(
  state
) {
  const raw =
    state
      ?.musicPlaybackHandoff;


  if (
    !raw ||
    typeof raw !==
      "object"
  ) {
    return null;
  }


  const normalized =
    createMusicPlaybackHandoff(
      raw
    );


  return normalized
    .queue.length
      ? normalized
      : null;
}


export function createMusicPlaybackState(
  options
) {
  return {
    musicPlaybackHandoff:
      createMusicPlaybackHandoff(
        options
      ),
  };
}