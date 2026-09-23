let youtubeApiPromise =
  null;


/* =====================================================
   EQUALIZER
   ===================================================== */

export const EQUALIZER_BARS = [
  {
    height: "48%",
    delay: "-0.11s",
    duration: "0.46s",
  },
  {
    height: "72%",
    delay: "-0.31s",
    duration: "0.59s",
  },
  {
    height: "38%",
    delay: "-0.22s",
    duration: "0.41s",
  },
  {
    height: "86%",
    delay: "-0.44s",
    duration: "0.53s",
  },
  {
    height: "61%",
    delay: "-0.17s",
    duration: "0.47s",
  },
  {
    height: "94%",
    delay: "-0.36s",
    duration: "0.64s",
  },
  {
    height: "55%",
    delay: "-0.08s",
    duration: "0.44s",
  },
  {
    height: "78%",
    delay: "-0.27s",
    duration: "0.56s",
  },
];


export const EQUALIZER_IDLE_LEVELS = [
  0.14,
  0.12,
  0.11,
  0.10,
  0.10,
  0.09,
  0.08,
  0.08,
];


export const EQUALIZER_BANDS_HZ = [
  [60, 140],
  [140, 280],
  [280, 560],
  [560, 1100],
  [1100, 2200],
  [2200, 4400],
  [4400, 8800],
  [8800, 16000],
];


/* =====================================================
   RADIO STANICE

   frequency:
   prava FM frekvencija kada je stanica FM.

   dialValue:
   fizička pozicija potenciometra.
   Kod WEB stanica NIJE prikazana kao FM frekvencija.
   ===================================================== */

export const RADIO_STATIONS = [
  {
    id:
      "karolina",

    name:
      "KAROLINA",

    frequency:
      106.3,

    dialValue:
      106.3,

    location:
      "БЕОГРАД",

    streamUrl:
      "https://streaming.karolina.rs/karolina.mp3",
  },

  {
    id:
      "pink",

    name:
      "PINK RADIO",

    frequency:
      91.3,

    dialValue:
      91.3,

    location:
      "БЕОГРАД",

    streamUrl:
      "https://edge9.pink.rs/pinkstream",
  },

  {
    id:
      "rock-radio",

    name:
      "ROCK RADIO",

    frequency:
      96.2,

    dialValue:
      96.2,

    location:
      "БЕОГРАД",

    streamUrl:
      "https://edge9.pink.rs/rockstream",
  },

  {
    id:
      "tdi",

    name:
      "TDI RADIO",

    frequency:
      91.8,

    dialValue:
      91.8,

    location:
      "БЕОГРАД",

    streamUrl:
      "https://streaming.tdiradio.com/tdiradio.mp3",
  },

  {
    id:
      "naxi-funk",

    name:
      "NAXI FUNK",

    frequency:
      null,

    dialValue:
      98.1,

    location:
      "WEB RADIO",

    streamUrl:
      "http://naxidigital128.kbcnet.rs:8360/;",

    lookupNames: [
      "Naxi Funk",
      "Naxi Funk Radio",
    ],
  },

  {
    id:
      "ok",

    name:
      "OK RADIO",

    frequency:
      94.2,

    dialValue:
      94.2,

    location:
      "БЕОГРАД",

    streamUrl:
      "https://sslstream.okradio.net/;?type=http&nocache=8804",
  },

  {
    id:
      "naxi-jazz",

    name:
      "NAXI JAZZ",

    frequency:
      null,

    dialValue:
      97.2,

    location:
      "WEB RADIO",

    lookupNames: [
      "Naxi Jazz",
      "Naxi Jazz Radio",
    ],
  },

  {
    id:
      "play",

    name:
      "PLAY RADIO",

    frequency:
      92.5,

    dialValue:
      92.5,

    location:
      "БЕОГРАД",

    streamUrl:
      "https://stream.playradio.rs:8443/play.mp3",
  },

  {
    id:
      "80s80s-reggae",

    name:
      "80s80s REGGAE",

    frequency:
      null,

    dialValue:
      100.8,

    location:
      "НЕМАЧКА • WEB",

    streamUrl:
      "https://streams.80s80s.de/reggae/mp3-128/streams.80s80s.de/",
  },

  {
    id:
      "naxi-016",

    name:
      "NAXI 016",

    frequency:
      101.5,

    dialValue:
      101.5,

    location:
      "ЛЕСКОВАЦ",

    streamUrl:
      "https://naxiradio016-naxinacional.streaming.rs:8637/;.mp3",
  },

  {
    id:
      "naxi-blues-rock",

    name:
      "NAXI BLUES-ROCK",

    frequency:
      null,

    dialValue:
      99.9,

    location:
      "WEB RADIO",

    streamUrl:
      "https://naxidigital-blues128ssl.streaming.rs:8312/;stream.nsv",

    lookupNames: [
      "Naxi Blues Rock",
      "Naxi Blues-Rock",
      "Naxi Blues-Rock Radio",
    ],
  },

  {
    id:
      "naxi-rock",

    name:
      "NAXI ROCK",

    frequency:
      null,

    dialValue:
      99,

    location:
      "WEB RADIO",

    streamUrl:
      "https://naxidigital-rock128ssl.streaming.rs:8182/;",

    lookupNames: [
      "Naxi Rock",
      "Naxi Rock Radio",
    ],
  },

  {
    id:
      "021-rock",

    name:
      "RADIO 021 ROCK",

    frequency:
      null,

    dialValue:
      102.7,

    location:
      "НОВИ САД • WEB",

    lookupNames: [
      "Radio 021 Rock",
      "021 Rock",
    ],
  },
];


const RADIO_BROWSER_SERVERS = [
  "https://de1.api.radio-browser.info",
  "https://de2.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
];


/* =====================================================
   HELPERS
   ===================================================== */

export function clamp(
  value,
  min,
  max
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}


export function createPseudoSpectrum(
  timeMs,
  salt =
    0
) {
  const time =
    timeMs /
    1000;


  const beat =
    Math.pow(
      (
        Math.sin(
          time *
            5.15 +
          salt *
            0.31
        ) +
        1
      ) /
        2,
      3.2
    );


  const lowPulse =
    Math.pow(
      (
        Math.sin(
          time *
            2.55 +
          salt *
            0.17
        ) +
        1
      ) /
        2,
      1.7
    );


  return EQUALIZER_BARS.map(
    (
      _bar,
      index
    ) => {
      const speed =
        2.4 +
        index *
          0.72;


      const waveA =
        (
          Math.sin(
            time *
              speed +
            index *
              0.83 +
            salt *
              0.19
          ) +
          1
        ) /
        2;


      const waveB =
        (
          Math.sin(
            time *
              (
                speed *
                1.77
              ) +
            index *
              1.37
          ) +
          1
        ) /
        2;


      const lowWeight =
        Math.max(
          0,
          1 -
            index /
              5
        );


      const highWeight =
        index /
        Math.max(
          1,
          EQUALIZER_BARS.length -
            1
        );


      const value =
        0.08 +
        waveA *
          (
            0.20 +
            highWeight *
              0.13
          ) +
        waveB *
          0.16 +
        lowPulse *
          lowWeight *
          0.24 +
        beat *
          lowWeight *
          0.27;


      return clamp(
        value,
        0.08,
        1
      );
    }
  );
}


export function getAnalyserSpectrum(
  analyser,
  audioContext,
  dataArray
) {
  if (
    !analyser ||
    !audioContext ||
    !dataArray
  ) {
    return null;
  }


  analyser.getByteFrequencyData(
    dataArray
  );


  const sampleRate =
    audioContext.sampleRate ||
    48000;


  const binSize =
    sampleRate /
    analyser.fftSize;


  let signalSum =
    0;


  let signalPeak =
    0;


  const levels =
    EQUALIZER_BANDS_HZ.map(
      (
        [
          minHz,
          maxHz,
        ],
        index
      ) => {
        const startIndex =
          clamp(
            Math.floor(
              minHz /
              binSize
            ),
            0,
            dataArray.length -
              1
          );


        const endIndex =
          clamp(
            Math.ceil(
              maxHz /
              binSize
            ),
            startIndex +
              1,
            dataArray.length
          );


        let sum =
          0;


        let peak =
          0;


        for (
          let binIndex =
            startIndex;

          binIndex <
          endIndex;

          binIndex +=
            1
        ) {
          const sample =
            dataArray[
              binIndex
            ];


          sum +=
            sample;


          peak =
            Math.max(
              peak,
              sample
            );
        }


        const count =
          Math.max(
            1,
            endIndex -
              startIndex
          );


        const average =
          sum /
          count;


        signalSum +=
          average;


        signalPeak =
          Math.max(
            signalPeak,
            peak
          );


        const bandBoosts = [
          1.62,
          1.52,
          1.42,
          1.32,
          1.24,
          1.20,
          1.22,
          1.26,
        ];


        const normalized =
          (
            average /
            255
          ) *
          bandBoosts[
            index
          ];


        return clamp(
          0.06 +
            normalized,
          0.06,
          1
        );
      }
    );


  const averageSignal =
    signalSum /
    EQUALIZER_BANDS_HZ.length;


  return {
    levels,

    hasSignal:
      signalPeak >
        8 ||
      averageSignal >
        2.8,
  };
}


export function wrapIndex(
  value,
  length
) {
  return (
    (
      value %
      length
    ) +
    length
  ) %
    length;
}


export function volumeToAngle(
  volume
) {
  return (
    -135 +
    (
      volume /
      100
    ) *
      270
  );
}


export function frequencyToAngle(
  frequency
) {
  const minFrequency =
    88;

  const maxFrequency =
    108;


  const normalized =
    (
      clamp(
        frequency,
        minFrequency,
        maxFrequency
      ) -
      minFrequency
    ) /
    (
      maxFrequency -
      minFrequency
    );


  return (
    -135 +
    normalized *
      270
  );
}


export function getStationBandLabel(
  station
) {
  if (
    Number.isFinite(
      station
        ?.frequency
    )
  ) {
    return `${station.frequency.toFixed(1)} FM`;
  }


  return "WEB RADIO";
}


/* =====================================================
   RADIO BROWSER

   Koristi se samo kada nemamo siguran direktan
   streamUrl za digitalnu stanicu.
   ===================================================== */

export async function searchRadioBrowser(
  query
) {
  for (
    const server
    of RADIO_BROWSER_SERVERS
  ) {
    try {
      const url =
        `${server}/json/stations/search?name=${encodeURIComponent(
          query
        )}&hidebroken=true&limit=25&order=clickcount&reverse=true`;


      const response =
        await fetch(
          url
        );


      if (
        !response.ok
      ) {
        continue;
      }


      const data =
        await response.json();


      if (
        !Array.isArray(
          data
        )
      ) {
        continue;
      }


      const candidates =
        data
          .map(
            (
              station
            ) => ({
              ...station,

              resolvedUrl:
                station
                  .url_resolved ||
                station.url ||
                "",
            })
          )
          .filter(
            (
              station
            ) =>
              station
                .resolvedUrl
          );


      if (
        !candidates.length
      ) {
        continue;
      }


      const normalizedQuery =
        query
          .toLocaleLowerCase();


      const exact =
        candidates.find(
          (
            station
          ) =>
            station.name
              ?.trim()
              .toLocaleLowerCase() ===
            normalizedQuery
        );


      const serbian =
        candidates.find(
          (
            station
          ) =>
            station
              .countrycode ===
            "RS"
        );


      const httpsCandidate =
        candidates.find(
          (
            station
          ) =>
            station
              .resolvedUrl
              .startsWith(
                "https://"
              )
        );


      const chosen =
        exact &&
        exact
          .resolvedUrl
          .startsWith(
            "https://"
          )
          ? exact
          : (
              serbian &&
              serbian
                .resolvedUrl
                .startsWith(
                  "https://"
                )
                ? serbian
                : httpsCandidate
            );


      if (
        chosen
      ) {
        return chosen
          .resolvedUrl;
      }


      /*
       * Na localhost/http možemo pustiti i HTTP stream.
       * Na produkcionom HTTPS sajtu browser bi ga
       * svakako blokirao kao mixed content.
       */

      if (
        typeof window !==
          "undefined" &&
        window.location
          .protocol !==
          "https:"
      ) {
        return (
          exact ||
          serbian ||
          candidates[0]
        ).resolvedUrl;
      }

    } catch (
      error
    ) {
      console.warn(
        "Radio Browser server:",
        server,
        error
      );
    }
  }


  return null;
}


export async function resolveStationStream(
  station
) {
  if (
    station.streamUrl
  ) {
    return station
      .streamUrl;
  }


  const queries =
    station.lookupNames ??
    [
      station.name,
    ];


  for (
    const query
    of queries
  ) {
    const resolved =
      await searchRadioBrowser(
        query
      );


    if (
      resolved
    ) {
      return resolved;
    }
  }


  return null;
}


/* =====================================================
   YOUTUBE API
   ===================================================== */

export function loadYouTubeApi() {
  if (
    typeof window ===
    "undefined"
  ) {
    return Promise.reject(
      new Error(
        "YouTube API nije dostupan."
      )
    );
  }


  if (
    window.YT?.Player
  ) {
    return Promise.resolve(
      window.YT
    );
  }


  if (
    youtubeApiPromise
  ) {
    return youtubeApiPromise;
  }


  youtubeApiPromise =
    new Promise(
      (
        resolve,
        reject
      ) => {
        const previousCallback =
          window
            .onYouTubeIframeAPIReady;


        const timeoutId =
          window.setTimeout(
            () => {
              reject(
                new Error(
                  "YouTube API timeout."
                )
              );
            },
            15000
          );


        window
          .onYouTubeIframeAPIReady =
          () => {
            window.clearTimeout(
              timeoutId
            );


            if (
              typeof previousCallback ===
              "function"
            ) {
              previousCallback();
            }


            resolve(
              window.YT
            );
          };


        const existingScript =
          document.querySelector(
            'script[src="https://www.youtube.com/iframe_api"]'
          );


        if (
          existingScript
        ) {
          return;
        }


        const script =
          document.createElement(
            "script"
          );


        script.src =
          "https://www.youtube.com/iframe_api";


        script.async =
          true;


        script.onerror =
          () => {
            window.clearTimeout(
              timeoutId
            );


            youtubeApiPromise =
              null;


            reject(
              new Error(
                "YouTube API nije učitan."
              )
            );
          };


        document.head.appendChild(
          script
        );
      }
    );


  return youtubeApiPromise;
}


/* =====================================================
   YOUTUBE VIDEO ID
   ===================================================== */

export function getYouTubeVideoId(
  value
) {
  if (
    !value ||
    typeof value !==
      "string"
  ) {
    return null;
  }


  const cleanValue =
    value.trim();


  if (
    /^[A-Za-z0-9_-]{11}$/.test(
      cleanValue
    )
  ) {
    return cleanValue;
  }


  try {
    const url =
      new URL(
        cleanValue
      );


    const hostname =
      url.hostname
        .replace(
          /^www\./,
          ""
        )
        .toLowerCase();


    if (
      hostname ===
      "youtu.be"
    ) {
      const shortId =
        url.pathname
          .split("/")
          .filter(Boolean)[0];


      if (
        /^[A-Za-z0-9_-]{11}$/.test(
          shortId ??
            ""
        )
      ) {
        return shortId;
      }
    }


    const queryId =
      url.searchParams.get(
        "v"
      );


    if (
      /^[A-Za-z0-9_-]{11}$/.test(
        queryId ??
          ""
      )
    ) {
      return queryId;
    }


    const parts =
      url.pathname
        .split("/")
        .filter(Boolean);


    const markerIndex =
      parts.findIndex(
        (
          part
        ) =>
          [
            "embed",
            "shorts",
            "live",
          ].includes(
            part
          )
      );


    if (
      markerIndex !==
        -1 &&
      /^[A-Za-z0-9_-]{11}$/.test(
        parts[
          markerIndex +
            1
        ] ??
          ""
      )
    ) {
      return parts[
        markerIndex +
          1
      ];
    }

  } catch {
    // regex fallback
  }


  const match =
    cleanValue.match(
      /(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/
    );


  return match?.[1] ??
    null;
}


/* =====================================================
   FORMAT VREMENA
   ===================================================== */

export function formatTime(
  value
) {
  const safeValue =
    Number.isFinite(
      value
    )
      ? Math.max(
          0,
          Math.floor(
            value
          )
        )
      : 0;


  const minutes =
    Math.floor(
      safeValue /
        60
    );


  const seconds =
    String(
      safeValue %
        60
    ).padStart(
      2,
      "0"
    );


  return `${minutes}:${seconds}`;
}


/* =====================================================
   SPAJANJE PREPORUKA + ANALIZA
   ===================================================== */

export function mergeTracks(
  recommendations,
  analyses
) {
  const merged =
    [];


  const maxLength =
    Math.max(
      recommendations.length,
      analyses.length
    );


  for (
    let index =
      0;

    index <
    maxLength;

    index +=
    1
  ) {
    if (
      recommendations[
        index
      ]
    ) {
      merged.push({
        ...recommendations[
          index
        ],

        source:
          "recommendation",

        sourceLabel:
          "ПРЕПОРУКА",
      });
    }


    if (
      analyses[
        index
      ]
    ) {
      merged.push({
        ...analyses[
          index
        ],

        source:
          "analysis",

        sourceLabel:
          "ПРЕВОД / АНАЛИЗА",
      });
    }
  }


  const seen =
    new Set();


  return merged.filter(
    (
      track
    ) => {
      const key =
        `${track.title ?? ""}::${track.artist ?? ""}`
          .trim()
          .toLocaleLowerCase();


      if (
        seen.has(
          key
        )
      ) {
        return false;
      }


      seen.add(
        key
      );


      return true;
    }
  );
}