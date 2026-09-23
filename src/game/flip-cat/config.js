export const CHEESE_POSITIONS = [
  {
    x: "50.0%",
    y: "29.8%",
    mobileX: "50.0%",
    mobileY: "37.6%",
    rotation: "0deg",
  },
  {
    x: "59.1%",
    y: "34.6%",
    mobileX: "61.9%",
    mobileY: "40.6%",
    rotation: "40deg",
  },
  {
    x: "64.0%",
    y: "46.9%",
    mobileX: "68.2%",
    mobileY: "48.1%",
    rotation: "80deg",
  },
  {
    x: "62.3%",
    y: "60.8%",
    mobileX: "66.0%",
    mobileY: "56.6%",
    rotation: "120deg",
  },
  {
    x: "54.9%",
    y: "70.0%",
    mobileX: "56.3%",
    mobileY: "62.3%",
    rotation: "160deg",
  },
  {
    x: "45.1%",
    y: "70.0%",
    mobileX: "43.7%",
    mobileY: "62.3%",
    rotation: "200deg",
  },
  {
    x: "37.7%",
    y: "60.8%",
    mobileX: "34.0%",
    mobileY: "56.6%",
    rotation: "240deg",
  },
  {
    x: "36.0%",
    y: "46.9%",
    mobileX: "31.8%",
    mobileY: "48.1%",
    rotation: "280deg",
  },
  {
    x: "40.9%",
    y: "34.6%",
    mobileX: "38.1%",
    mobileY: "40.6%",
    rotation: "320deg",
  },
];


export const CAT_START_POSITION = {
  x: 50,
  y: 50,
};


export const CAT_BOUNDS = {
  landscape: {
    minX: 9.5,
    maxX: 90.5,
    minY: 13,
    maxY: 87,
  },

  portrait: {
    minX: 13,
    maxX: 87,
    minY: 7.5,
    maxY: 92.5,
  },
};


/*
 * =====================================================
 * RUPE
 * =====================================================
 *
 * Maksimum:
 *
 * 10 gore
 * 10 dole
 * 6 levo
 * 6 desno
 *
 * UKUPNO = 32
 *
 * HARD kreće sa četiri centralne rupe.
 * Posle toga progresija aktivira po jednu
 * novu rupu na svakih 20 poena.
 */


const TOP_X_POSITIONS = [
  10,
  18,
  26,
  34,
  42,
  50,
  60,
  70,
  80,
  90,
];


const SIDE_Y_POSITIONS = [
  14,
  27,
  40,
  50,
  64,
  79,
];


const TOP_IDS = [
  "top-01",
  "top-02",
  "top-03",
  "top-04",
  "top-05",
  "top-center",
  "top-06",
  "top-07",
  "top-08",
  "top-09",
];


const BOTTOM_IDS = [
  "bottom-01",
  "bottom-02",
  "bottom-03",
  "bottom-04",
  "bottom-05",
  "bottom-center",
  "bottom-06",
  "bottom-07",
  "bottom-08",
  "bottom-09",
];


const LEFT_IDS = [
  "left-01",
  "left-02",
  "left-03",
  "left-center",
  "left-04",
  "left-05",
];


const RIGHT_IDS = [
  "right-01",
  "right-02",
  "right-03",
  "right-center",
  "right-04",
  "right-05",
];


function createTopHole(
  id,
  x
) {
  return {
    id,

    side:
      "top",

    image:
      "/images/human-one/game/holes/hole-top.webp",

    x,
    y:
      6.5,

    mobileX:
      x,

    mobileY:
      4.8,

    spawnX:
      x,

    spawnY:
      11.2,

    mobileSpawnX:
      x,

    mobileSpawnY:
      8.8,

    width:
      "7.4%",

    mobileWidth:
      "7.8%",
  };
}


function createBottomHole(
  id,
  x
) {
  return {
    id,

    side:
      "bottom",

    image:
      "/images/human-one/game/holes/hole-bottom.webp",

    x,
    y:
      91.7,

    mobileX:
      x,

    mobileY:
      93.2,

    spawnX:
      x,

    spawnY:
      87.7,

    mobileSpawnX:
      x,

    mobileSpawnY:
      89.6,

    width:
      "7.4%",

    mobileWidth:
      "7.8%",
  };
}


function createLeftHole(
  id,
  y
) {
  return {
    id,

    side:
      "left",

    image:
      "/images/human-one/game/holes/hole-left.webp",

    x:
      3.8,

    y,

    mobileX:
      5.8,

    mobileY:
      y,

    spawnX:
      9.3,

    spawnY:
      y,

    mobileSpawnX:
      12.5,

    mobileSpawnY:
      y,

    width:
      "2.3%",

    mobileWidth:
      "3.2%",
  };
}


function createRightHole(
  id,
  y
) {
  return {
    id,

    side:
      "right",

    image:
      "/images/human-one/game/holes/hole-right.webp",

    x:
      96.2,

    y,

    mobileX:
      94.2,

    mobileY:
      y,

    spawnX:
      90.7,

    spawnY:
      y,

    mobileSpawnX:
      87.5,

    mobileSpawnY:
      y,

    width:
      "2.3%",

    mobileWidth:
      "3.2%",
  };
}


const TOP_HOLES =
  TOP_X_POSITIONS.map(
    (
      x,
      index
    ) =>
      createTopHole(
        TOP_IDS[index],
        x
      )
  );


const BOTTOM_HOLES =
  TOP_X_POSITIONS.map(
    (
      x,
      index
    ) =>
      createBottomHole(
        BOTTOM_IDS[index],
        x
      )
  );


const LEFT_HOLES =
  SIDE_Y_POSITIONS.map(
    (
      y,
      index
    ) =>
      createLeftHole(
        LEFT_IDS[index],
        y
      )
  );


const RIGHT_HOLES =
  SIDE_Y_POSITIONS.map(
    (
      y,
      index
    ) =>
      createRightHole(
        RIGHT_IDS[index],
        y
      )
  );


export const HOLES = [
  ...TOP_HOLES,
  ...BOTTOM_HOLES,
  ...LEFT_HOLES,
  ...RIGHT_HOLES,
];


/*
 * Redosled otključavanja.
 *
 * Prve četiri:
 * jedna sa svake strane.
 *
 * Posle toga rupe se dodaju oko cele martinele,
 * umesto da se prvo napuni samo jedna strana.
 */
export const HOLE_UNLOCK_ORDER = [
  "top-center",
  "left-center",
  "right-center",
  "bottom-center",

  "top-05",
  "bottom-06",
  "left-03",
  "right-04",

  "top-06",
  "bottom-05",
  "left-04",
  "right-03",

  "top-04",
  "bottom-07",
  "left-02",
  "right-05",

  "top-07",
  "bottom-04",
  "left-05",
  "right-02",

  "top-03",
  "bottom-08",
  "left-01",
  "right-01",

  "top-08",
  "bottom-03",

  "top-02",
  "bottom-09",

  "top-09",
  "bottom-02",

  "top-01",
  "bottom-01",
];


export const ORDINARY_MOUSE = {
  speed:
    0.19,

  frameDuration:
    90,

  score:
    1,

  hitPoints:
    1,

  frames: [
    "/images/human-one/game/mouse/mouse-run-1.webp",
    "/images/human-one/game/mouse/mouse-run-2.webp",
    "/images/human-one/game/mouse/mouse-run-3.webp",
    "/images/human-one/game/mouse/mouse-run-4.webp",
    "/images/human-one/game/mouse/mouse-run-5.webp",
    "/images/human-one/game/mouse/mouse-run-6.webp",
  ],
};


export const FAST_MOUSE = {
  speed:
    ORDINARY_MOUSE.speed *
    1.55,

  frameDuration:
    62,

  score:
    2,

  hitPoints:
    1,

  frames: [
    "/images/human-one/game/fast-mouse/fast-mouse-run-1.webp",
    "/images/human-one/game/fast-mouse/fast-mouse-run-2.webp",
    "/images/human-one/game/fast-mouse/fast-mouse-run-3.webp",
    "/images/human-one/game/fast-mouse/fast-mouse-run-4.webp",
    "/images/human-one/game/fast-mouse/fast-mouse-run-5.webp",
    "/images/human-one/game/fast-mouse/fast-mouse-run-6.webp",
  ],
};


export const BIG_MOUSE = {
  /*
   * Veliki miš je sporiji,
   * ali traži TRI uspešna udarca.
   */
  speed:
    ORDINARY_MOUSE.speed *
    0.88,

  frameDuration:
    90,

  score:
    3,

  hitPoints:
    3,

  frames: [
    "/images/human-one/game/big-mouse/big-mouse-run-1.webp",
    "/images/human-one/game/big-mouse/big-mouse-run-2.webp",
    "/images/human-one/game/big-mouse/big-mouse-run-3.webp",
    "/images/human-one/game/big-mouse/big-mouse-run-4.webp",
    "/images/human-one/game/big-mouse/big-mouse-run-5.webp",
    "/images/human-one/game/big-mouse/big-mouse-run-6.webp",
  ],
};


export const COLLISION_RADII = {
  catMouse:
    0.085,

  catBigMouse:
    0.105,

  catDroppedCheese:
    0.075,
};