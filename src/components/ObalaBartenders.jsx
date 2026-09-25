import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLanguage,
} from "../i18n/LanguageContext";

import {
  supabase,
} from "../lib/supabaseClient";

import "../styles/components/ObalaBartenders.css";


/* =====================================================
   REŽIM

   "payment" = stvarni NBS IPS QR tok
   "test"    = isti game sistem bez plaćanja

   Sada je uključeno pravo plaćanje.
   ===================================================== */

const BARTENDER_MODE =
  "payment";


/* =====================================================
   100% FOTOGRAFIJA
   ===================================================== */

const FINAL_IMAGE_AVAILABLE =
  true;


/* =====================================================
   LOCAL STORAGE

   Ovo čuva game progres ovog posetioca.
   ===================================================== */

const STORAGE_KEY =
  "obala-bartenders-game-v2";

const TWENTY_FOUR_HOURS_MS =
  24 * 60 * 60 * 1000;


/* =====================================================
   PIĆA + VARIJANTE + CENE

   Progres se računa prema VRSTI pića,
   ne prema njegovoj ceni.
   ===================================================== */

const DRINKS = {
  rakija: {
    id:
      "rakija",

    labelKey:
      "obala.bartendersGame.drinks.rakija",

    label:
      "Ракија",

    icon:
      "🥃",

    baseEffect:
      10,

    variants: [
      {
        id:
          "brlja",

        labelKey:
          "obala.bartendersGame.variants.brlja",

        label:
          "Брља",

        price:
          50,
      },

      {
        id:
          "dobra",

        labelKey:
          "obala.bartendersGame.variants.dobra",

        label:
          "Добра",

        price:
          100,
      },
    ],
  },


  beer: {
    id:
      "beer",

    labelKey:
      "obala.bartendersGame.drinks.beer",

    label:
      "Пиво",

    icon:
      "🍺",

    baseEffect:
      5,

    variants: [
      {
        id:
          "beer",

        labelKey:
          "obala.bartendersGame.variants.beer",

        label:
          "Пиво",

        price:
          100,
      },
    ],
  },


  wine: {
    id:
      "wine",

    labelKey:
      "obala.bartendersGame.drinks.wine",

    label:
      "Вино",

    icon:
      "🍷",

    baseEffect:
      15,

    variants: [
      {
        id:
          "red",

        labelKey:
          "obala.bartendersGame.variants.red",

        label:
          "Црвено",

        price:
          150,
      },

      {
        id:
          "white",

        labelKey:
          "obala.bartendersGame.variants.white",

        label:
          "Бело",

        price:
          150,
      },
    ],
  },


  whiskey: {
    id:
      "whiskey",

    labelKey:
      "obala.bartendersGame.drinks.whiskey",

    label:
      "Виски",

    icon:
      "🥃",

    baseEffect:
      15,

    variants: [
      {
        id:
          "jack",

        labelKey:
          "obala.bartendersGame.variants.jack",

        label:
          "Џек",

        price:
          200,
      },

      {
        id:
          "johnnie",

        labelKey:
          "obala.bartendersGame.variants.johnnie",

        label:
          "Џони",

        price:
          200,
      },
    ],
  },
};


/* =====================================================
   REPLIKE

   Svaka završena tura zatvara prozor,
   vraća pogled na konobare i prikazuje
   jednu repliku prema NOVOM progresu.

   Ovde sada čuvamo KEY, a ne gotov tekst.
   Zbog toga već otvoren oblačić može odmah
   da pređe SR ↔ EN.
   ===================================================== */

const BARTENDER_REPLY_KEYS = [
  "obala.bartendersGame.replies.one",
  "obala.bartendersGame.replies.two",
  "obala.bartendersGame.replies.three",
  "obala.bartendersGame.replies.four",
  "obala.bartendersGame.replies.five",
  "obala.bartendersGame.replies.six",
  "obala.bartendersGame.replies.seven",
  "obala.bartendersGame.replies.eight",
  "obala.bartendersGame.replies.nine",
  "obala.bartendersGame.replies.ten",
];


function getBartenderReply(
  progress
) {
  const safeProgress =
    Math.min(
      100,
      Math.max(
        1,
        progress
      )
    );


  const replyIndex =
    Math.min(
      9,
      Math.ceil(
        safeProgress /
          10
      ) -
        1
    );


  return BARTENDER_REPLY_KEYS[
    replyIndex
  ];
}


/* =====================================================
   BONUS ZA MEŠANJE

   Ovo ostaje game logika.
   Cena ne utiče na procenat.
   ===================================================== */

const MIX_BONUSES = {
  "wine-rakija":
    20,

  "beer-rakija":
    10,

  "whiskey-rakija":
    15,

  "rakija-wine":
    10,

  "whiskey-wine":
    10,

  "beer-whiskey":
    10,

  "wine-whiskey":
    10,

  "rakija-whiskey":
    15,

  "rakija-beer":
    0,

  "wine-beer":
    0,

  "whiskey-beer":
    0,
};


/* =====================================================
   POMOĆNE FUNKCIJE
   ===================================================== */

function clampProgress(
  value
) {
  return Math.min(
    100,
    Math.max(
      0,
      value
    )
  );
}


function getConsecutiveCount(
  history,
  drinkId
) {
  let count =
    0;


  for (
    let index =
      history.length -
      1;

    index >=
    0;

    index -=
    1
  ) {
    if (
      history[
        index
      ] !==
      drinkId
    ) {
      break;
    }


    count +=
      1;
  }


  return count;
}


function calculateOneDrink(
  history,
  drinkId
) {
  const drink =
    DRINKS[
      drinkId
    ];


  if (
    !drink
  ) {
    return 0;
  }


  const previousDrink =
    history.length >
    0
      ? history[
          history.length -
            1
        ]
      : null;


  const consecutiveCount =
    getConsecutiveCount(
      history,
      drinkId
    );


  /*
   * isto piće:
   * prvo = base
   * drugo = base +5
   * treće = base +10
   * četvrto i dalje = najviše base +15
   */

  const repeatBonus =
    Math.min(
      consecutiveCount *
        5,
      15
    );


  let mixBonus =
    0;


  if (
    previousDrink &&
    previousDrink !==
      drinkId
  ) {
    const mixKey =
      `${previousDrink}-${drinkId}`;


    mixBonus =
      MIX_BONUSES[
        mixKey
      ] ||
      0;
  }


  return (
    drink.baseEffect +
    repeatBonus +
    mixBonus
  );
}


function calculateRound(
  currentHistory,
  drinkId,
  quantity
) {
  const nextHistory = [
    ...currentHistory,
  ];


  let addedProgress =
    0;


  for (
    let index =
      0;

    index <
    quantity;

    index +=
    1
  ) {
    addedProgress +=
      calculateOneDrink(
        nextHistory,
        drinkId
      );


    nextHistory.push(
      drinkId
    );
  }


  return {
    addedProgress,

    nextHistory:
      nextHistory.slice(
        -40
      ),
  };
}


function getSavedGame() {
  const emptyGame = {
    progress:
      0,

    history:
      [],

    drinkingStartedAt:
      null,

    drunkUntil:
      null,
  };


  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (
      !raw
    ) {
      return emptyGame;
    }


    const parsed =
      JSON.parse(
        raw
      );


    const now =
      Date.now();


    const savedProgress =
      clampProgress(
        Number(
          parsed.progress
        ) ||
          0
      );


    const savedHistory =
      Array.isArray(
        parsed.history
      )
        ? parsed.history.filter(
            (
              drinkId
            ) =>
              Boolean(
                DRINKS[
                  drinkId
                ]
              )
          )
        : [];


    const savedDrinkingStartedAt =
      Number.isFinite(
        Number(
          parsed.drinkingStartedAt
        )
      ) &&
      Number(
        parsed.drinkingStartedAt
      ) >
        0
        ? Number(
            parsed.drinkingStartedAt
          )
        : null;


    const savedDrunkUntil =
      Number.isFinite(
        Number(
          parsed.drunkUntil
        )
      ) &&
      Number(
        parsed.drunkUntil
      ) >
        0
        ? Number(
            parsed.drunkUntil
          )
        : null;


    /*
     * 100%:
     * pijani su 24 sata.
     *
     * Ako je ovo stari save bez drunkUntil,
     * dajemo mu jedan novi 24h period od sada,
     * kako se postojeći progres ne bi izgubio
     * pri prelasku na novi sistem.
     */

    if (
      savedProgress >=
      100
    ) {
      if (
        savedDrunkUntil &&
        savedDrunkUntil <=
          now
      ) {
        return emptyGame;
      }


      return {
        progress:
          100,

        history:
          savedHistory,

        drinkingStartedAt:
          null,

        drunkUntil:
          savedDrunkUntil ||
          (
            now +
            TWENTY_FOUR_HOURS_MS
          ),
      };
    }


    /*
     * 1–99%:
     * od prve ture ima 24 sata
     * da ih dovede do 100%.
     */

    if (
      savedProgress >
      0
    ) {
      if (
        savedDrinkingStartedAt &&
        (
          savedDrinkingStartedAt +
          TWENTY_FOUR_HOURS_MS
        ) <=
          now
      ) {
        return emptyGame;
      }


      return {
        progress:
          savedProgress,

        history:
          savedHistory,

        drinkingStartedAt:
          savedDrinkingStartedAt ||
          now,

        drunkUntil:
          null,
      };
    }


    return emptyGame;
  } catch {
    return emptyGame;
  }
}


function getVariant(
  drinkId,
  variantId
) {
  const drink =
    DRINKS[
      drinkId
    ];


  if (
    !drink
  ) {
    return null;
  }


  return (
    drink.variants.find(
      (
        variant
      ) =>
        variant.id ===
        variantId
    ) ||
    null
  );
}


/* =====================================================
   KOMPONENTA
   ===================================================== */

function ObalaBartenders() {
  const {
    t,
  } =
    useLanguage();


  const savedGame =
    useMemo(
      () =>
        getSavedGame(),
      []
    );


  const [
    progress,
    setProgress,
  ] =
    useState(
      savedGame.progress
    );


  const [
    history,
    setHistory,
  ] =
    useState(
      savedGame.history
    );


  const [
    drinkingStartedAt,
    setDrinkingStartedAt,
  ] =
    useState(
      savedGame.drinkingStartedAt
    );


  const [
    drunkUntil,
    setDrunkUntil,
  ] =
    useState(
      savedGame.drunkUntil
    );


  const [
    isOpen,
    setIsOpen,
  ] =
    useState(
      false
    );


  const [
    selectedDrinkId,
    setSelectedDrinkId,
  ] =
    useState(
      null
    );


  const [
    selectedVariantId,
    setSelectedVariantId,
  ] =
    useState(
      null
    );


  const [
    quantity,
    setQuantity,
  ] =
    useState(
      1
    );


  const [
    paymentStep,
    setPaymentStep,
  ] =
    useState(
      "choose"
    );


  const [
    qrUrl,
    setQrUrl,
  ] =
    useState(
      ""
    );


  const [
    paymentError,
    setPaymentError,
  ] =
    useState(
      ""
    );


  const [
    isCreatingQr,
    setIsCreatingQr,
  ] =
    useState(
      false
    );


  const [
    lastReply,
    setLastReply,
  ] =
    useState(
      ""
    );


  const selectedDrink =
    selectedDrinkId
      ? DRINKS[
          selectedDrinkId
        ]
      : null;


  const selectedVariant =
    selectedDrinkId &&
    selectedVariantId
      ? getVariant(
          selectedDrinkId,
          selectedVariantId
        )
      : null;


  const totalPrice =
    selectedVariant
      ? selectedVariant.price *
        quantity
      : 0;


  /* ===================================================
     ČUVANJE PROGRESA
     =================================================== */

  useEffect(
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          progress,
          history,
          drinkingStartedAt,
          drunkUntil,
        })
      );
    },
    [
      progress,
      history,
      drinkingStartedAt,
      drunkUntil,
    ]
  );


  /* ===================================================
     AUTOMATSKI RESET POSLE 24 SATA

     1–99%:
     24h od prve završene ture.

     100%:
     pijani su narednih 24h.
     =================================================== */

  useEffect(
    () => {
      let expiresAt =
        null;


      if (
        progress >=
          100 &&
        drunkUntil
      ) {
        expiresAt =
          drunkUntil;

      } else if (
        progress >
          0 &&
        progress <
          100 &&
        drinkingStartedAt
      ) {
        expiresAt =
          drinkingStartedAt +
          TWENTY_FOUR_HOURS_MS;
      }


      if (
        !expiresAt
      ) {
        return undefined;
      }


      const remainingMs =
        expiresAt -
        Date.now();


      function resetExpiredGame() {
        setProgress(
          0
        );


        setHistory(
          []
        );


        setDrinkingStartedAt(
          null
        );


        setDrunkUntil(
          null
        );


        setLastReply(
          ""
        );


        setSelectedDrinkId(
          null
        );


        setSelectedVariantId(
          null
        );


        setQuantity(
          1
        );


        setPaymentStep(
          "choose"
        );


        setPaymentError(
          ""
        );


        setIsOpen(
          false
        );
      }


      if (
        remainingMs <=
        0
      ) {
        resetExpiredGame();

        return undefined;
      }


      const timeoutId =
        window.setTimeout(
          resetExpiredGame,
          remainingMs
        );


      return () => {
        window.clearTimeout(
          timeoutId
        );
      };
    },
    [
      progress,
      drinkingStartedAt,
      drunkUntil,
    ]
  );


  /* ===================================================
     ČIŠĆENJE QR URL-a
     =================================================== */

  useEffect(
    () => {
      return () => {
        if (
          qrUrl
        ) {
          URL.revokeObjectURL(
            qrUrl
          );
        }
      };
    },
    [
      qrUrl,
    ]
  );


  /* ===================================================
     FOTOGRAFIJA KONOBARA
     =================================================== */

  let bartenderImage =
    "/images/human-one/obala/obala-bartenders.webp";


  let bartenderStateClass =
    "human-one-obala__bartenders--sober";


  let speechStateClass =
    "obala-bartenders__speech--sober";


  if (
    progress >=
      100 &&
    FINAL_IMAGE_AVAILABLE
  ) {
    bartenderImage =
      "/images/human-one/obala/obala-bartenders-100.webp";


    bartenderStateClass =
      "human-one-obala__bartenders--100";


    speechStateClass =
      "obala-bartenders__speech--100";

  } else if (
    progress >=
    50
  ) {
    bartenderImage =
      "/images/human-one/obala/obala-bartenders-50.webp";


    bartenderStateClass =
      "human-one-obala__bartenders--50";


    speechStateClass =
      "obala-bartenders__speech--50";
  }


  /* ===================================================
     OTVORI / ZATVORI
     =================================================== */

  function openBartenders() {
    const now =
      Date.now();


    const progressWindowExpired =
      progress >
        0 &&
      progress <
        100 &&
      drinkingStartedAt &&
      (
        drinkingStartedAt +
        TWENTY_FOUR_HOURS_MS
      ) <=
        now;


    const drunkWindowExpired =
      progress >=
        100 &&
      drunkUntil &&
      drunkUntil <=
        now;


    if (
      progressWindowExpired ||
      drunkWindowExpired
    ) {
      setProgress(
        0
      );


      setHistory(
        []
      );


      setDrinkingStartedAt(
        null
      );


      setDrunkUntil(
        null
      );
    }


    setLastReply(
      ""
    );


    setPaymentError(
      ""
    );


    setPaymentStep(
      "choose"
    );


    setIsOpen(
      true
    );
  }


  function closeBartenders() {
    setPaymentError(
      ""
    );


    setPaymentStep(
      "choose"
    );


    setIsOpen(
      false
    );
  }


  /* ===================================================
     IZBOR PIĆA
     =================================================== */

  function selectDrink(
    drinkId
  ) {
    const drink =
      DRINKS[
        drinkId
      ];


    setSelectedDrinkId(
      drinkId
    );


    setPaymentError(
      ""
    );


    if (
      drink.variants.length ===
      1
    ) {
      setSelectedVariantId(
        drink
          .variants[
            0
          ]
          .id
      );

    } else {
      setSelectedVariantId(
        null
      );
    }
  }


  /* ===================================================
     KOLIČINA
     =================================================== */

  function decreaseQuantity() {
    setQuantity(
      (
        current
      ) =>
        Math.max(
          1,
          current -
            1
        )
    );
  }


  function increaseQuantity() {
    setQuantity(
      (
        current
      ) =>
        Math.min(
          10,
          current +
            1
        )
    );
  }


  /* ===================================================
     ZAVRŠI TURU

     Ovde se:
     1. računa progres
     2. zatvara prozor
     3. prikazuju konobari
     4. prikazuje njihova replika
     =================================================== */

  function finishRound() {
    if (
      !selectedDrinkId ||
      !selectedVariant ||
      (
        progress >=
          100 &&
        drunkUntil &&
        drunkUntil >
          Date.now()
      )
    ) {
      return;
    }


    const now =
      Date.now();


    let baseProgress =
      progress;


    let baseHistory =
      history;


    let baseDrinkingStartedAt =
      drinkingStartedAt;


    /*
     * Ako je rok za napijanje istekao
     * dok je korisnik bio na QR ekranu,
     * ova upravo završena tura postaje
     * PRVA tura novog 24h ciklusa.
     */

    if (
      baseProgress >
        0 &&
      baseProgress <
        100 &&
      baseDrinkingStartedAt &&
      (
        baseDrinkingStartedAt +
        TWENTY_FOUR_HOURS_MS
      ) <=
        now
    ) {
      baseProgress =
        0;


      baseHistory =
        [];


      baseDrinkingStartedAt =
        null;
    }


    const result =
      calculateRound(
        baseHistory,
        selectedDrinkId,
        quantity
      );


    const nextProgress =
      clampProgress(
        baseProgress +
        result.addedProgress
      );


    const nextReply =
      getBartenderReply(
        nextProgress
      );


    setHistory(
      result.nextHistory
    );


    setProgress(
      nextProgress
    );


    setLastReply(
      nextReply
    );


    /*
     * PRVA TURA:
     * od ovog trenutka kreće 24h
     * da ih dovede do 100%.
     */

    if (
      nextProgress <
      100
    ) {
      if (
        baseProgress ===
          0 ||
        !baseDrinkingStartedAt
      ) {
        setDrinkingStartedAt(
          now
        );

      } else {
        setDrinkingStartedAt(
          baseDrinkingStartedAt
        );
      }


      setDrunkUntil(
        null
      );

    } else {
      /*
       * 100%:
       * završava se rok za napijanje
       * i počinje NOVIH 24h pijanstva.
       */

      setDrinkingStartedAt(
        null
      );


      setDrunkUntil(
        now +
        TWENTY_FOUR_HOURS_MS
      );
    }


    setPaymentStep(
      "choose"
    );


    setPaymentError(
      ""
    );


    setQuantity(
      1
    );


    setSelectedDrinkId(
      null
    );


    setSelectedVariantId(
      null
    );


    if (
      qrUrl
    ) {
      URL.revokeObjectURL(
        qrUrl
      );


      setQrUrl(
        ""
      );
    }


    setIsOpen(
      false
    );
  }


  /* ===================================================
     TEST MODE
     =================================================== */

  function handleTestRound() {
    finishRound();
  }


  function resetTestGame() {
    setProgress(
      0
    );


    setHistory(
      []
    );


    setDrinkingStartedAt(
      null
    );


    setDrunkUntil(
      null
    );


    setLastReply(
      ""
    );


    setSelectedDrinkId(
      null
    );


    setSelectedVariantId(
      null
    );


    setQuantity(
      1
    );


    setPaymentStep(
      "choose"
    );


    setPaymentError(
      ""
    );


    if (
      qrUrl
    ) {
      URL.revokeObjectURL(
        qrUrl
      );


      setQrUrl(
        ""
      );
    }
  }


  /* ===================================================
     PAYMENT MODE — POTVRDA
     =================================================== */

  function beginPayment() {
    if (
      !selectedDrinkId ||
      !selectedVariant
    ) {
      setPaymentError(
        "obala.bartendersGame.errors.chooseDrink"
      );


      return;
    }


    setPaymentError(
      ""
    );


    setPaymentStep(
      "confirm"
    );
  }


  /* ===================================================
     STVARNI NBS IPS QR
     =================================================== */

  async function createIpsQr() {
    if (
      !selectedDrinkId ||
      !selectedVariant ||
      totalPrice <=
        0
    ) {
      return;
    }


    setIsCreatingQr(
      true
    );


    setPaymentError(
      ""
    );


    try {
      const {
        data,
        error,
      } =
        await supabase
          .functions
          .invoke(
            "obala-ips-qr",
            {
              body: {
                drinkId:
                  selectedDrinkId,

                variantId:
                  selectedVariantId,

                quantity,
              },
            }
          );


      if (
        error
      ) {
        throw error;
      }


      let blob =
        null;


      if (
        data instanceof
        Blob
      ) {
        blob =
          data;

      } else if (
        data instanceof
        ArrayBuffer
      ) {
        blob =
          new Blob(
            [
              data,
            ],
            {
              type:
                "image/png",
            }
          );

      } else if (
        data &&
        data.base64
      ) {
        const binary =
          atob(
            data.base64
          );


        const bytes =
          new Uint8Array(
            binary.length
          );


        for (
          let index =
            0;

          index <
          binary.length;

          index +=
          1
        ) {
          bytes[
            index
          ] =
            binary.charCodeAt(
              index
            );
        }


        blob =
          new Blob(
            [
              bytes,
            ],
            {
              type:
                "image/png",
            }
          );
      }


      if (
        !blob
      ) {
        throw new Error(
          "QR odgovor nije prepoznat."
        );
      }


      if (
        qrUrl
      ) {
        URL.revokeObjectURL(
          qrUrl
        );
      }


      setQrUrl(
        URL.createObjectURL(
          blob
        )
      );


      setPaymentStep(
        "qr"
      );

    } catch (
      error
    ) {
      console.error(
        error
      );


      setPaymentError(
        "obala.bartendersGame.errors.qrUnavailable"
      );

    } finally {
      setIsCreatingQr(
        false
      );
    }
  }


  /* ===================================================
     PRIMARNA AKCIJA
     =================================================== */

  function handlePrimaryAction() {
    if (
      BARTENDER_MODE ===
      "test"
    ) {
      handleTestRound();


      return;
    }


    beginPayment();
  }


  /* ===================================================
     RENDER
     =================================================== */

  return (
    <>
      <button
        type="button"
        className={`
          human-one-obala__object
          human-one-obala__bartenders
          ${bartenderStateClass}
        `}
        onClick={
          openBartenders
        }
        aria-label={
          t(
            "obala.bartendersGame.openAria"
          )
        }
      >
        <img
          src={
            bartenderImage
          }
          alt=""
          draggable="false"
        />
      </button>


      {lastReply && (
        <button
          type="button"
          className={`
            obala-bartenders__speech
            ${speechStateClass}
          `}
          onClick={
            () =>
              setLastReply(
                ""
              )
          }
          aria-label={
            t(
              "obala.bartendersGame.closeReply"
            )
          }
        >
          {
            t(
              lastReply,
              lastReply
            )
          }
        </button>
      )}


      {isOpen && (
        <div
          className="obala-bar-game"
          role="presentation"
          onMouseDown={
            (
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeBartenders();
              }
            }
          }
        >
          <section
            className="obala-bar-game__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="obala-bar-game-title"
          >
            <button
              type="button"
              className="obala-bar-game__close"
              onClick={
                closeBartenders
              }
              aria-label={
                t(
                  "common.close"
                )
              }
            >
              ×
            </button>


            <h2
              id="obala-bar-game-title"
              className="obala-bar-game__title"
            >
              {t(
                "obala.bartendersGame.title"
              )}
            </h2>


            <div className="obala-bar-game__progress-head">
              <span>
                {t(
                  "obala.bartendersGame.progress"
                )}
              </span>

              <strong>
                {progress}%
              </strong>
            </div>


            <div
              className="obala-bar-game__progress"
              aria-label={
                `${t(
                  "obala.bartendersGame.progress"
                )} ${progress}%`
              }
            >
              <span
                style={{
                  width:
                    `${progress}%`,
                }}
              />
            </div>


            {progress <
            100 ? (
              <>
                {paymentStep ===
                  "choose" && (
                  <>
                    <div className="obala-bar-game__drinks">
                      {Object.values(
                        DRINKS
                      ).map(
                        (
                          drink
                        ) => {
                          const minimumPrice =
                            Math.min(
                              ...drink
                                .variants
                                .map(
                                  (
                                    variant
                                  ) =>
                                    variant
                                      .price
                                )
                            );


                          return (
                            <button
                              key={
                                drink.id
                              }
                              type="button"
                              className={
                                selectedDrinkId ===
                                drink.id
                                  ? "obala-bar-game__drink obala-bar-game__drink--active"
                                  : "obala-bar-game__drink"
                              }
                              onClick={
                                () =>
                                  selectDrink(
                                    drink.id
                                  )
                              }
                            >
                              <span
                                className="obala-bar-game__drink-icon"
                                aria-hidden="true"
                              >
                                {
                                  drink.icon
                                }
                              </span>


                              <span className="obala-bar-game__drink-copy">
                                <strong>
                                  {
                                    t(
                                      drink.labelKey,
                                      drink.label
                                    )
                                  }
                                </strong>


                                <small>
                                  {drink
                                    .variants
                                    .length ===
                                  1
                                    ? `${minimumPrice} ${t(
                                        "obala.bartendersGame.currencyShort"
                                      )}`
                                    : `${t(
                                        "obala.bartendersGame.from"
                                      )} ${minimumPrice} ${t(
                                        "obala.bartendersGame.currencyShort"
                                      )}`}
                                </small>
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>


                    {selectedDrink &&
                      selectedDrink
                        .variants
                        .length >
                        1 && (
                        <div className="obala-bar-game__variants">
                          <span className="obala-bar-game__section-label">
                            {t(
                              "obala.bartendersGame.choose"
                            )}
                          </span>


                          <div className="obala-bar-game__variant-grid">
                            {selectedDrink
                              .variants
                              .map(
                                (
                                  variant
                                ) => (
                                  <button
                                    key={
                                      variant.id
                                    }
                                    type="button"
                                    className={
                                      selectedVariantId ===
                                      variant.id
                                        ? "obala-bar-game__variant obala-bar-game__variant--active"
                                        : "obala-bar-game__variant"
                                    }
                                    onClick={
                                      () =>
                                        setSelectedVariantId(
                                          variant.id
                                        )
                                    }
                                  >
                                    <strong>
                                      {
                                        t(
                                          variant.labelKey,
                                          variant.label
                                        )
                                      }
                                    </strong>


                                    <span>
                                      {
                                        variant.price
                                      }{" "}
                                      {t(
                                        "obala.bartendersGame.currencyShort"
                                      )}
                                    </span>
                                  </button>
                                )
                              )}
                          </div>
                        </div>
                      )}


                    {selectedVariant && (
                      <>
                        <div className="obala-bar-game__quantity">
                          <span>
                            {t(
                              "obala.bartendersGame.quantity"
                            )}
                          </span>


                          <div className="obala-bar-game__quantity-controls">
                            <button
                              type="button"
                              onClick={
                                decreaseQuantity
                              }
                              aria-label={
                                t(
                                  "obala.bartendersGame.decreaseQuantity"
                                )
                              }
                            >
                              −
                            </button>


                            <strong>
                              {
                                quantity
                              }
                            </strong>


                            <button
                              type="button"
                              onClick={
                                increaseQuantity
                              }
                              aria-label={
                                t(
                                  "obala.bartendersGame.increaseQuantity"
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>


                        <div className="obala-bar-game__total">
                          <span>
                            {
                              selectedDrink
                                .icon
                            }{" "}
                            {
                              t(
                                selectedDrink
                                  .labelKey,
                                selectedDrink
                                  .label
                              )
                            }

                            {selectedDrink
                              .variants
                              .length >
                            1
                              ? ` — ${t(
                                  selectedVariant
                                    .labelKey,
                                  selectedVariant
                                    .label
                                )}`
                              : ""}
                          </span>


                          <strong>
                            {
                              totalPrice
                            }{" "}
                            {t(
                              "obala.bartendersGame.currencyShort"
                            )}
                          </strong>
                        </div>


                        <button
                          type="button"
                          className="obala-bar-game__primary"
                          onClick={
                            handlePrimaryAction
                          }
                        >
                          {BARTENDER_MODE ===
                            "test"
                            ? t(
                                "obala.bartendersGame.testRound"
                              )
                            : t(
                                "obala.bartendersGame.title"
                              )}
                        </button>
                      </>
                    )}
                  </>
                )}


                {paymentStep ===
                  "confirm" && (
                  <div className="obala-bar-game__confirm">
                    <p>
                      {t(
                        "obala.bartendersGame.confirmBefore"
                      )}{" "}

                      <strong>
                        {
                          totalPrice
                        }{" "}
                        {t(
                          "obala.bartendersGame.currencyLong"
                        )}
                      </strong>

                      {t(
                        "obala.bartendersGame.confirmAfter"
                      )}
                    </p>


                    <div className="obala-bar-game__order-summary">
                      <span
                        aria-hidden="true"
                      >
                        {
                          selectedDrink
                            ?.icon
                        }
                      </span>


                      <strong>
                        {
                          quantity
                        }×{" "}

                        {
                          selectedDrink
                            ? t(
                                selectedDrink
                                  .labelKey,
                                selectedDrink
                                  .label
                              )
                            : ""
                        }

                        {selectedDrink
                          ?.variants
                          .length >
                        1
                          ? ` — ${selectedVariant
                              ? t(
                                  selectedVariant
                                    .labelKey,
                                  selectedVariant
                                    .label
                                )
                              : ""}`
                          : ""}
                      </strong>
                    </div>


                    <div className="obala-bar-game__confirm-actions">
                      <button
                        type="button"
                        onClick={
                          () =>
                            setPaymentStep(
                              "choose"
                            )
                        }
                      >
                        {t(
                          "obala.bartendersGame.no"
                        )}
                      </button>


                      <button
                        type="button"
                        className="obala-bar-game__primary"
                        onClick={
                          createIpsQr
                        }
                        disabled={
                          isCreatingQr
                        }
                      >
                        {isCreatingQr
                          ? t(
                              "obala.bartendersGame.creatingQr"
                            )
                          : t(
                              "obala.bartendersGame.yesTreat"
                            )}
                      </button>
                    </div>
                  </div>
                )}


                {paymentStep ===
                  "qr" && (
                  <div className="obala-bar-game__payment">
                    <p>
                      {t(
                        "obala.bartendersGame.scanQr"
                      )}
                    </p>


                    {qrUrl && (
                      <img
                        className="obala-bar-game__qr"
                        src={
                          qrUrl
                        }
                        alt={
                          t(
                            "obala.bartendersGame.qrAlt"
                          )
                        }
                      />
                    )}


                    <strong className="obala-bar-game__payment-amount">
                      {
                        totalPrice
                      }{" "}
                      {t(
                        "obala.bartendersGame.currencyShort"
                      )}
                    </strong>


                    <button
                      type="button"
                      className="obala-bar-game__primary"
                      onClick={
                        finishRound
                      }
                    >
                      {t(
                        "obala.bartendersGame.paid"
                      )}
                    </button>


                    <p className="obala-bar-game__payment-note">
                      {t(
                        "obala.bartendersGame.paymentNote"
                      )}
                    </p>
                  </div>
                )}


                {paymentError && (
                  <p
                    className="obala-bar-game__error"
                    role="alert"
                  >
                    {
                      t(
                        paymentError,
                        paymentError
                      )
                    }
                  </p>
                )}
              </>
            ) : (
              <div className="obala-bar-game__max">
                <strong>
                  100%
                </strong>
              </div>
            )}


            {BARTENDER_MODE ===
              "test" && (
              <button
                type="button"
                className="obala-bar-game__reset"
                onClick={
                  resetTestGame
                }
              >
                {t(
                  "obala.bartendersGame.resetTest"
                )}
              </button>
            )}
          </section>
        </div>
      )}
    </>
  );
}


export default ObalaBartenders;