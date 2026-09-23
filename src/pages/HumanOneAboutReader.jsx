import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  Navigate,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import "../styles/HumanOneAboutReader.css";


const VALID_SECTIONS = [
  "licni-principi",
  "filozofija",
  "sudbina",
  "put",
  "zelje",
];


const READER_STICKERS = [
  {
    key: "baby",
    src: "/images/human-one/stickers/01-baby-sock.png",
    className:
      "human-one-about-reader__sticker--baby",
  },

  {
    key: "skeleton",
    src: "/images/human-one/stickers/02-full-skeleton.png",
    className:
      "human-one-about-reader__sticker--skeleton",
  },

  {
    key: "astronaut",
    src: "/images/human-one/stickers/03-astronaut.png",
    className:
      "human-one-about-reader__sticker--astronaut",
  },

  {
    key: "guitar",
    src: "/images/human-one/stickers/04-acoustic-guitar.png",
    className:
      "human-one-about-reader__sticker--guitar",
  },

  {
    key: "lollipops",
    src: "/images/human-one/stickers/05-lollipops.png",
    className:
      "human-one-about-reader__sticker--lollipops",
  },

  {
    key: "ice-cream",
    src: "/images/human-one/stickers/06-ice-cream.png",
    className:
      "human-one-about-reader__sticker--ice-cream",
  },

  {
    key: "puppy",
    src: "/images/human-one/stickers/07-puppy.png",
    className:
      "human-one-about-reader__sticker--puppy",
  },

  {
    key: "coffin",
    src: "/images/human-one/stickers/08-black-coffin-red-cross.png",
    className:
      "human-one-about-reader__sticker--coffin",
  },

  {
    key: "orange",
    src: "/images/human-one/stickers/09-orange-round.png",
    className:
      "human-one-about-reader__sticker--orange",
  },
];


function createSeed(value) {
  let seed = 2166136261;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    seed ^=
      value.charCodeAt(index);

    seed = Math.imul(
      seed,
      16777619
    );
  }

  return seed >>> 0;
}


function createRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6D2B79F5;

    let value = state;

    value = Math.imul(
      value ^
        (value >>> 15),
      value | 1
    );

    value ^=
      value +
      Math.imul(
        value ^
          (value >>> 7),
        value | 61
      );

    return (
      (
        value ^
        (value >>> 14)
      ) >>> 0
    ) / 4294967296;
  };
}


function shuffleItems(
  items,
  random
) {
  const result = [
    ...items,
  ];

  for (
    let index =
      result.length - 1;
    index > 0;
    index -= 1
  ) {
    const swapIndex =
      Math.floor(
        random() *
        (index + 1)
      );

    [
      result[index],
      result[swapIndex],
    ] = [
      result[swapIndex],
      result[index],
    ];
  }

  return result;
}


function getParagraphs(content) {
  const source =
    (
      content ||
      "Овај текст још није написан."
    )
      .replace(/\r\n/g, "\n")
      .trim();

  if (!source) {
    return [
      "Овај текст још није написан.",
    ];
  }

  return source
    .split(/\n\s*\n+/)
    .map(
      (paragraph) =>
        paragraph.trim()
    )
    .filter(Boolean);
}


function createMobileStickerPlacements(
  sectionKey,
  paragraphs
) {
  const seed =
    createSeed(
      `${sectionKey}:${paragraphs.join("|")}`
    );

  const random =
    createRandom(seed);

  const shuffled =
    shuffleItems(
      READER_STICKERS,
      random
    );

  const textLength =
    paragraphs.join(" ").length;

  let stickerCount = 2;

  if (
    textLength > 1200 ||
    paragraphs.length >= 5
  ) {
    stickerCount = 4;
  } else if (
    textLength > 600 ||
    paragraphs.length >= 3
  ) {
    stickerCount = 3;
  }

  stickerCount = Math.min(
    stickerCount,
    Math.max(
      1,
      paragraphs.length
    ),
    READER_STICKERS.length
  );

  const placements = [];

  for (
    let index = 0;
    index < stickerCount;
    index += 1
  ) {
    const rawPosition =
      Math.floor(
        (
          (
            index + 1
          ) *
          paragraphs.length
        ) /
        (
          stickerCount + 1
        )
      );

    const paragraphIndex =
      Math.min(
        paragraphs.length - 1,
        Math.max(
          0,
          rawPosition
        )
      );

    const side =
      index % 2 === 0
        ? random() > 0.35
          ? "left"
          : "right"
        : random() > 0.35
          ? "right"
          : "left";

    const rotation =
      Math.round(
        -8 +
        random() * 16
      );

    const scale =
      (
        0.88 +
        random() * 0.18
      ).toFixed(2);

    placements.push({
      ...shuffled[index],
      paragraphIndex,
      side,
      rotation,
      scale,
    });
  }

  return placements;
}


function HumanOneAboutReader() {
  const {
    sectionKey,
  } = useParams();


  const [
    section,
    setSection,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  const isValidSection =
    VALID_SECTIONS.includes(
      sectionKey
    );


  useEffect(() => {
    if (!isValidSection) {
      return undefined;
    }


    let active = true;


    async function loadSection() {
      setLoading(true);
      setErrorMessage("");


      const {
        data,
        error,
      } = await supabase
        .from(
          "character_about_sections"
        )
        .select(
          "title, content"
        )
        .eq(
          "character_key",
          "covek-1"
        )
        .eq(
          "section_key",
          sectionKey
        )
        .maybeSingle();


      if (!active) {
        return;
      }


      if (error) {
        console.error(
          "Učitavanje O meni teksta:",
          error
        );

        setErrorMessage(
          "Текст тренутно није могуће учитати."
        );

        setLoading(false);

        return;
      }


      setSection(data);
      setLoading(false);
    }


    loadSection();


    return () => {
      active = false;
    };
  }, [
    sectionKey,
    isValidSection,
  ]);


  const paragraphs =
    useMemo(
      () =>
        getParagraphs(
          section?.content
        ),
      [
        section?.content,
      ]
    );


  const mobileStickerPlacements =
    useMemo(
      () =>
        createMobileStickerPlacements(
          sectionKey || "about",
          paragraphs
        ),
      [
        sectionKey,
        paragraphs,
      ]
    );


  const mobileStickersByParagraph =
    useMemo(
      () => {
        const result =
          new Map();

        mobileStickerPlacements.forEach(
          (sticker) => {
            const current =
              result.get(
                sticker.paragraphIndex
              ) || [];

            current.push(
              sticker
            );

            result.set(
              sticker.paragraphIndex,
              current
            );
          }
        );

        return result;
      },
      [
        mobileStickerPlacements,
      ]
    );


  if (!isValidSection) {
    return (
      <Navigate
        to="/autor/covek/o-meni"
        replace
      />
    );
  }


  return (
    <main className="human-one-about-reader">
      <Link
        to="/autor/covek/o-meni"
        className="human-one-about-reader__back"
      >
        ← МАПА
      </Link>


      {loading ? (
        <div className="human-one-about-reader__state">
          Учитавање...
        </div>
      ) : errorMessage ? (
        <div className="human-one-about-reader__state">
          {errorMessage}
        </div>
      ) : !section ? (
        <div className="human-one-about-reader__state">
          Овај текст још није објављен.
        </div>
      ) : (
        <div className="human-one-about-reader__scene">
          <div
            className="human-one-about-reader__stickers"
            aria-hidden="true"
          >
            {READER_STICKERS.map(
              (sticker) => (
                <img
                  key={
                    sticker.key
                  }
                  src={
                    sticker.src
                  }
                  alt=""
                  draggable="false"
                  className={
                    `human-one-about-reader__sticker ${sticker.className}`
                  }
                />
              )
            )}
          </div>


          <article className="human-one-about-reader__article">
            <header className="human-one-about-reader__header">
              <p>
                СЕКИ / О МЕНИ
              </p>

              <h1>
                {section.title}
              </h1>
            </header>


            <div className="human-one-about-reader__content">
              <div className="human-one-about-reader__desktop-text">
                {
                  section.content ||
                  "Овај текст још није написан."
                }
              </div>


              <div className="human-one-about-reader__mobile-text-flow">
                {paragraphs.map(
                  (
                    paragraph,
                    paragraphIndex
                  ) => {
                    const paragraphStickers =
                      mobileStickersByParagraph.get(
                        paragraphIndex
                      ) || [];

                    return (
                      <div
                        key={
                          `${sectionKey}-${paragraphIndex}`
                        }
                        className="human-one-about-reader__paragraph-block"
                      >
                        {paragraphStickers.map(
                          (sticker) => (
                            <img
                              key={
                                sticker.key
                              }
                              src={
                                sticker.src
                              }
                              alt=""
                              draggable="false"
                              aria-hidden="true"
                              className={`human-one-about-reader__paper-sticker human-one-about-reader__paper-sticker--${sticker.side}`}
                              style={{
                                "--paper-sticker-rotate":
                                  `${sticker.rotation}deg`,

                                "--paper-sticker-scale":
                                  sticker.scale,
                              }}
                            />
                          )
                        )}

                        <p>
                          {paragraph}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}


export default HumanOneAboutReader;
