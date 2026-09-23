const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};


type NowPlayingResult = {
  artist: string;
  title: string;
  raw: string;
  source: string;
};


type RequestBody = {
  stationId?: string;
};


const STATION_STREAMS: Record<string, string> = {
  karolina:
    "https://streaming.karolina.rs/karolina.mp3",

  pink:
    "https://edge9.pink.rs/pinkstream",

  "rock-radio":
    "https://edge9.pink.rs/rockstream",

  tdi:
    "https://streaming.tdiradio.com/tdiradio.mp3",

  "naxi-funk":
    "http://naxidigital128.kbcnet.rs:8360/;",

  ok:
    "https://sslstream.okradio.net/;?type=http&nocache=8804",

  play:
    "https://stream.playradio.rs:8443/play.mp3",

  "80s80s-reggae":
    "https://streams.80s80s.de/reggae/mp3-128/streams.80s80s.de/",

  "naxi-016":
    "https://naxiradio016-naxinacional.streaming.rs:8637/;.mp3",

  "naxi-blues-rock":
    "https://naxidigital-blues128ssl.streaming.rs:8312/;stream.nsv",

  "naxi-rock":
    "https://naxidigital-rock128ssl.streaming.rs:8182/;",
};


/*
 * Naxi digitalne stanice na zvaničnim stranicama javno prikazuju
 * "trenutno u programu". Ovo nam je pouzdaniji fallback od ICY-ja,
 * posebno kada stream ne šalje icy-metaint ili ga proxy ukloni.
 */


/*
 * Odvojeni metadata streamovi.
 * Za nekoliko Naxi digitalnih kanala stari HTTP endpoint i dalje
 * šalje ICY StreamTitle pouzdanije od SSL playback endpointa.
 * Ovo se izvršava server-side u Edge Function-u, pa nema browser
 * mixed-content problema.
 */
const STATION_METADATA_STREAMS: Record<string, string> = {
  "naxi-funk":
    "http://naxidigital128.kbcnet.rs:8360/;",

  "naxi-jazz":
    "http://naxidigital-jazz128.streaming.rs:8170/;stream.nsv",

  "naxi-blues-rock":
    "http://naxidigital-blues128.streaming.rs:8310/;stream.nsv",

  "naxi-rock":
    "http://naxidigital-rock128.streaming.rs:8180/;stream.nsv",
};

const STATION_PAGES: Record<string, string> = {
  "naxi-funk":
    "https://www.naxi.rs/funk",

  "naxi-jazz":
    "https://www.naxi.rs/jazz",

  "naxi-blues-rock":
    "https://www.naxi.rs/blues-rock",

  "naxi-rock":
    "https://www.naxi.rs/rock",
};


function jsonResponse(
  body: unknown,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control":
          "no-store, max-age=0",
      },
    }
  );
}


function cleanText(
  value: string
) {
  return value
    .replace(/\0/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function decodeHtmlEntities(
  value: string
) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(
      /&#(\d+);/g,
      (
        _match,
        code
      ) => {
        const valueNumber =
          Number(code);


        return Number.isFinite(
          valueNumber
        )
          ? String.fromCodePoint(
              valueNumber
            )
          : "";
      }
    )
    .replace(
      /&#x([0-9a-f]+);/gi,
      (
        _match,
        code
      ) => {
        const valueNumber =
          Number.parseInt(
            code,
            16
          );


        return Number.isFinite(
          valueNumber
        )
          ? String.fromCodePoint(
              valueNumber
            )
          : "";
      }
    );
}


function splitStreamTitle(
  rawValue: string,
  source =
    "icy"
): NowPlayingResult {
  const raw =
    cleanText(
      rawValue
    );


  if (
    !raw
  ) {
    return {
      artist: "",
      title: "",
      raw: "",
      source,
    };
  }


  const separatorMatch =
    raw.match(
      /\s[-–—]\s/
    );


  if (
    !separatorMatch ||
    separatorMatch.index ===
      undefined
  ) {
    return {
      artist: "",
      title: "",
      raw,
      source,
    };
  }


  const separatorIndex =
    separatorMatch.index;


  const separatorLength =
    separatorMatch[0]
      .length;


  const artist =
    cleanText(
      raw.slice(
        0,
        separatorIndex
      )
    );


  const title =
    cleanText(
      raw.slice(
        separatorIndex +
          separatorLength
      )
    );


  return {
    artist,
    title,
    raw,
    source,
  };
}


function htmlToTextLines(
  html: string
) {
  const withoutHidden =
    html
      .replace(
        /<script\b[^>]*>[\s\S]*?<\/script>/gi,
        "\n"
      )
      .replace(
        /<style\b[^>]*>[\s\S]*?<\/style>/gi,
        "\n"
      )
      .replace(
        /<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,
        "\n"
      );


  const withBreaks =
    withoutHidden
      .replace(
        /<br\s*\/?\s*>/gi,
        "\n"
      )
      .replace(
        /<\/(?:p|div|section|article|h[1-6]|li|header|footer|main)>/gi,
        "\n"
      );


  const text =
    decodeHtmlEntities(
      withBreaks
        .replace(
          /<[^>]+>/g,
          ""
        )
    );


  return text
    .split(/\r?\n/)
    .map(
      (
        line
      ) =>
        cleanText(
          line
        )
    )
    .filter(Boolean);
}


function extractNaxiPageNowPlaying(
  html: string
): NowPlayingResult | null {
  const lines =
    htmlToTextLines(
      html
    );


  const markerIndex =
    lines.findIndex(
      (
        line
      ) =>
        line
          .toLocaleLowerCase()
          .includes(
            "trenutno u programu"
          )
    );


  if (
    markerIndex ===
    -1
  ) {
    return null;
  }


  const candidates:
    string[] =
      [];


  for (
    let index =
      markerIndex +
      1;

    index <
    lines.length;

    index +=
      1
  ) {
    const line =
      cleanText(
        lines[index]
      );


    const lower =
      line
        .toLocaleLowerCase();


    if (
      lower.includes(
        "poslednjih 5 pesama"
      ) ||
      lower.includes(
        "poslednjih pet pesama"
      )
    ) {
      break;
    }


    if (
      !line ||
      lower ===
        "trenutno slušate" ||
      lower ===
        "trenutno u programu" ||
      lower ===
        "update required"
    ) {
      continue;
    }


    if (
      !candidates.includes(
        line
      )
    ) {
      candidates.push(
        line
      );
    }


    if (
      candidates.length >=
      2
    ) {
      break;
    }
  }


  if (
    candidates.length <
    2
  ) {
    return null;
  }


  const artist =
    candidates[0];


  const title =
    candidates[1];


  return {
    artist,
    title,
    raw:
      `${artist} - ${title}`,
    source:
      "official-page",
  };
}


async function fetchPageNowPlaying(
  pageUrl: string
): Promise<NowPlayingResult | null> {
  const controller =
    new AbortController();


  const timeoutId =
    setTimeout(
      () => {
        controller.abort();
      },
      8000
    );


  try {
    const response =
      await fetch(
        pageUrl,
        {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 SergejMusicRadio/1.0",
            Accept:
              "text/html,application/xhtml+xml",
          },
          signal:
            controller.signal,
        }
      );


    if (
      !response.ok
    ) {
      return null;
    }


    const html =
      await response.text();


    return extractNaxiPageNowPlaying(
      html
    );

  } catch {
    return null;

  } finally {
    clearTimeout(
      timeoutId
    );
  }
}


class ByteReader {
  private reader:
    ReadableStreamDefaultReader<Uint8Array>;

  private buffer =
    new Uint8Array(0);


  constructor(
    reader:
      ReadableStreamDefaultReader<Uint8Array>
  ) {
    this.reader =
      reader;
  }


  private append(
    chunk: Uint8Array
  ) {
    if (
      !this.buffer.length
    ) {
      /*
       * Pravimo novu instancu da TypeScript/Deno ne meša
       * Uint8Array<ArrayBufferLike> sa našim buffer tipom.
       */
      this.buffer =
        new Uint8Array(
          chunk
        );


      return;
    }


    const merged =
      new Uint8Array(
        this.buffer.length +
          chunk.length
      );


    merged.set(
      this.buffer,
      0
    );


    merged.set(
      chunk,
      this.buffer.length
    );


    this.buffer =
      merged;
  }


  async take(
    length: number
  ) {
    while (
      this.buffer.length <
      length
    ) {
      const {
        value,
        done,
      } =
        await this.reader
          .read();


      if (
        done ||
        !value
      ) {
        return null;
      }


      this.append(
        value
      );
    }


    const result =
      this.buffer.slice(
        0,
        length
      );


    this.buffer =
      this.buffer.slice(
        length
      );


    return result;
  }
}


function decodeIcyMetadata(
  metadataBytes:
    Uint8Array
) {
  let metadataText =
    "";


  try {
    metadataText =
      new TextDecoder(
        "utf-8",
        {
          fatal:
            true,
        }
      ).decode(
        metadataBytes
      );

  } catch {
    try {
      metadataText =
        new TextDecoder(
          "windows-1252"
        ).decode(
          metadataBytes
        );

    } catch {
      metadataText =
        new TextDecoder()
          .decode(
            metadataBytes
          );
    }
  }


  return metadataText;
}


async function readIcyNowPlaying(
  streamUrl: string
): Promise<NowPlayingResult | null> {
  const controller =
    new AbortController();


  const timeoutId =
    setTimeout(
      () => {
        controller.abort();
      },
      12000
    );


  let reader:
    ReadableStreamDefaultReader<Uint8Array> |
    null =
      null;


  try {
    const response =
      await fetch(
        streamUrl,
        {
          method: "GET",
          redirect: "follow",
          headers: {
            "Icy-MetaData":
              "1",
            "User-Agent":
              "Mozilla/5.0 SergejMusicRadio/1.0",
            Accept:
              "audio/mpeg,audio/aac,audio/*;q=0.9,*/*;q=0.1",
          },
          signal:
            controller.signal,
        }
      );


    if (
      !response.ok ||
      !response.body
    ) {
      return null;
    }


    const metaInterval =
      Number(
        response.headers.get(
          "icy-metaint"
        )
      );


    if (
      !Number.isFinite(
        metaInterval
      ) ||
      metaInterval <=
        0 ||
      metaInterval >
        1024 *
          1024
    ) {
      return null;
    }


    reader =
      response.body
        .getReader();


    const bytes =
      new ByteReader(
        reader
      );


    /*
     * Neki Icecast/Shoutcast streamovi prvi metadata blok pošalju
     * prazan. Zato proveravamo nekoliko uzastopnih blokova umesto
     * da odustanemo posle prvog nultog length-byte-a.
     */
    for (
      let attempt =
        0;

      attempt <
      6;

      attempt +=
        1
    ) {
      const audioChunk =
        await bytes.take(
          metaInterval
        );


      if (
        !audioChunk
      ) {
        return null;
      }


      const lengthByte =
        await bytes.take(
          1
        );


      if (
        !lengthByte
      ) {
        return null;
      }


      const metadataLength =
        lengthByte[0] *
        16;


      if (
        metadataLength <=
        0
      ) {
        continue;
      }


      const metadataBytes =
        await bytes.take(
          metadataLength
        );


      if (
        !metadataBytes
      ) {
        return null;
      }


      const metadataText =
        decodeIcyMetadata(
          metadataBytes
        );


      const titleMatch =
        metadataText.match(
          /StreamTitle=['"]([^'"]*)['"];?/i
        );


      if (
        !titleMatch?.[1]
      ) {
        continue;
      }


      const result =
        splitStreamTitle(
          titleMatch[1],
          "icy"
        );


      if (
        result.raw
      ) {
        return result;
      }
    }


    return null;

  } catch {
    return null;

  } finally {
    clearTimeout(
      timeoutId
    );


    try {
      await reader
        ?.cancel();
    } catch {
      // stream je već zatvoren
    }
  }
}


async function getNowPlaying(
  stationId: string
) {
  const metadataStreamUrl =
    STATION_METADATA_STREAMS[
      stationId
    ];


  /*
   * 1) Za Naxi digitalne stanice prvo probamo njihov metadata-rich
   *    HTTP stream. On često šalje ICY StreamTitle čak i kada SSL
   *    playback endpoint ne šalje icy-metaint.
   */
  if (
    metadataStreamUrl
  ) {
    const metadataResult =
      await readIcyNowPlaying(
        metadataStreamUrl
      );


    if (
      metadataResult
    ) {
      return {
        ...metadataResult,
        source:
          "icy-metadata-stream",
      };
    }
  }


  /*
   * 2) Zvanična stranica je drugi fallback za Naxi kanale.
   */
  const pageUrl =
    STATION_PAGES[
      stationId
    ];


  if (
    pageUrl
  ) {
    const pageResult =
      await fetchPageNowPlaying(
        pageUrl
      );


    if (
      pageResult
    ) {
      return pageResult;
    }
  }


  /*
   * 3) Na kraju probamo isti stream koji browser koristi za slušanje.
   */
  const streamUrl =
    STATION_STREAMS[
      stationId
    ];


  if (
    streamUrl &&
    streamUrl !==
      metadataStreamUrl
  ) {
    const icyResult =
      await readIcyNowPlaying(
        streamUrl
      );


    if (
      icyResult
    ) {
      return icyResult;
    }
  }


  return null;
}


Deno.serve(
  async (
    request
  ) => {
    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        }
      );
    }


    if (
      request.method !==
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
      RequestBody =
        {};


    try {
      body =
        await request
          .json();
    } catch {
      return jsonResponse(
        {
          error:
            "Invalid JSON body",
        },
        400
      );
    }


    const stationId =
      typeof body.stationId ===
        "string"
        ? body.stationId
            .trim()
        : "";


    if (
      !stationId
    ) {
      return jsonResponse(
        {
          error:
            "Missing stationId",
        },
        400
      );
    }


    const knownStation =
      Boolean(
        STATION_STREAMS[
          stationId
        ] ||
        STATION_METADATA_STREAMS[
          stationId
        ] ||
        STATION_PAGES[
          stationId
        ]
      );


    if (
      !knownStation
    ) {
      return jsonResponse({
        available:
          false,
        artist:
          "",
        title:
          "",
        raw:
          "",
        source:
          "none",
      });
    }


    const nowPlaying =
      await getNowPlaying(
        stationId
      );


    if (
      !nowPlaying
    ) {
      return jsonResponse({
        available:
          false,
        artist:
          "",
        title:
          "",
        raw:
          "",
        source:
          "none",
      });
    }


    return jsonResponse({
      available:
        true,
      ...nowPlaying,
    });
  }
);
