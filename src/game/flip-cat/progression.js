import {
  BIG_MOUSE,
  FAST_MOUSE,
  HOLE_UNLOCK_ORDER,
  ORDINARY_MOUSE,
} from "./config";


export const DIFFICULTIES = {
  EASY:
    "easy",

  MEDIUM:
    "medium",

  HARD:
    "hard",
};


export function normalizeDifficulty(
  value
) {
  const normalized =
    String(
      value ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    normalized ===
      "hard"
  ) {
    return DIFFICULTIES.HARD;
  }


  /*
   * NORMAL iz menija tretiramo
   * potpuno isto kao MEDIUM.
   */
  if (
    normalized ===
      "medium" ||
    normalized ===
      "normal"
  ) {
    return DIFFICULTIES.MEDIUM;
  }


  return DIFFICULTIES.EASY;
}


export const MOUSE_TYPES = {
  ordinary: {
    id:
      "ordinary",

    ...ORDINARY_MOUSE,
  },

  fast: {
    id:
      "fast",

    ...FAST_MOUSE,
  },

  big: {
    id:
      "big",

    ...BIG_MOUSE,
  },
};


export function getMouseTypeConfig(
  type
) {
  return (
    MOUSE_TYPES[
      type
    ] ||
    MOUSE_TYPES.ordinary
  );
}


/*
 * =====================================================
 * RUPE
 * =====================================================
 *
 * HARD:
 * 0 poena = 4
 * 20 = 5
 * 40 = 6
 * ...
 * 500 = 29
 * 560 = svih 32
 *
 * Posle 32 više se ne dodaju nove rupe.
 */
function getUnlockedHoleCount(
  difficulty,
  score
) {
  const mode =
    normalizeDifficulty(
      difficulty
    );


  const safeScore =
    Math.max(
      0,
      Number(
        score
      ) ||
        0
    );


  if (
    mode ===
      DIFFICULTIES.HARD
  ) {
    return Math.min(
      HOLE_UNLOCK_ORDER.length,

      4 +
      Math.floor(
        safeScore /
        20
      )
    );
  }


  /*
   * NORMAL / MEDIUM:
   * kreće sa 3.
   */
  if (
    mode ===
      DIFFICULTIES.MEDIUM
  ) {
    return Math.min(
      HOLE_UNLOCK_ORDER.length,

      3 +
      Math.floor(
        safeScore /
        20
      )
    );
  }


  /*
   * EASY:
   *
   * 0–5 = 2
   * 6–19 = 3
   * od 20 nadalje +1 na svakih 20.
   */
  if (
    safeScore <
    6
  ) {
    return 2;
  }


  if (
    safeScore <
    20
  ) {
    return 3;
  }


  return Math.min(
    HOLE_UNLOCK_ORDER.length,

    4 +
    Math.floor(
      (
        safeScore -
        20
      ) /
      20
    )
  );
}


/*
 * =====================================================
 * BROJ ISTOVREMENIH MIŠEVA
 * =====================================================
 *
 * Broj sireva ovde NE POSTOJI.
 *
 * Što je score veći,
 * više miševa može istovremeno biti na terenu.
 */
function getBaseConcurrentMice(
  difficulty,
  score
) {
  const mode =
    normalizeDifficulty(
      difficulty
    );


  const safeScore =
    Math.max(
      0,
      Number(
        score
      ) ||
        0
    );


  if (
    mode ===
      DIFFICULTIES.HARD
  ) {
    if (
      safeScore <
      6
    ) {
      return 2;
    }


    if (
      safeScore <
      20
    ) {
      return 3;
    }


    return Math.min(
      14,

      4 +
      Math.floor(
        (
          safeScore -
          20
        ) /
        50
      )
    );
  }


  if (
    mode ===
      DIFFICULTIES.MEDIUM
  ) {
    if (
      safeScore <
      6
    ) {
      return 1;
    }


    if (
      safeScore <
      20
    ) {
      return 2;
    }


    return Math.min(
      12,

      3 +
      Math.floor(
        (
          safeScore -
          20
        ) /
        55
      )
    );
  }


  if (
    safeScore <
    6
  ) {
    return 1;
  }


  if (
    safeScore <
    20
  ) {
    return 2;
  }


  return Math.min(
    10,

    3 +
    Math.floor(
      (
        safeScore -
        20
      ) /
      65
    )
  );
}


/*
 * =====================================================
 * UČESTALOST SPAWNA
 * =====================================================
 *
 * Što score raste,
 * razmak između novih miševa postaje manji.
 */
function getSpawnInterval(
  difficulty,
  score
) {
  const mode =
    normalizeDifficulty(
      difficulty
    );


  const safeScore =
    Math.max(
      0,
      Number(
        score
      ) ||
        0
    );


  const steps =
    Math.floor(
      safeScore /
      20
    );


  if (
    mode ===
      DIFFICULTIES.HARD
  ) {
    const base =
      safeScore <
      6
        ? 650
        : 560;


    return Math.max(
      200,

      base -
      steps *
        16
    );
  }


  if (
    mode ===
      DIFFICULTIES.MEDIUM
  ) {
    const base =
      safeScore <
      6
        ? 950
        : 720;


    return Math.max(
      280,

      base -
      steps *
        14
    );
  }


  const base =
    safeScore <
    6
      ? 1080
      : 820;


  return Math.max(
    350,

    base -
    steps *
      12
  );
}


/*
 * =====================================================
 * BRZINA MIŠEVA
 * =====================================================
 *
 * Ponovo raste sa rezultatom.
 *
 * Broj sireva nema nikakav uticaj.
 */
function getSpeedMultiplier(
  difficulty,
  score
) {
  const mode =
    normalizeDifficulty(
      difficulty
    );


  const safeScore =
    Math.max(
      0,
      Number(
        score
      ) ||
        0
    );


  const startingMultiplier =
    mode ===
      DIFFICULTIES.EASY
      ? 0.92
      : mode ===
        DIFFICULTIES.MEDIUM
        ? 1
        : 1.08;


  const earlyBoost =
    safeScore >=
    6
      ? 0.06
      : 0;


  /*
   * +0.02 na svakih 20 poena.
   *
   * Maksimalni dodatni boost = +0.60.
   */
  const scoreBoost =
    Math.min(
      0.6,

      Math.floor(
        safeScore /
        20
      ) *
        0.02
    );


  return (
    startingMultiplier +
    earlyBoost +
    scoreBoost
  );
}


/*
 * =====================================================
 * BRZI MIŠ
 * =====================================================
 */
function getFastMouseChance(
  difficulty,
  score
) {
  const mode =
    normalizeDifficulty(
      difficulty
    );


  const safeScore =
    Math.max(
      0,
      Number(
        score
      ) ||
        0
    );


  /*
   * EASY nema brzog.
   */
  if (
    mode ===
      DIFFICULTIES.EASY
  ) {
    return 0;
  }


  /*
   * NORMAL:
   * od 20 poena.
   */
  if (
    mode ===
      DIFFICULTIES.MEDIUM &&
    safeScore <
      20
  ) {
    return 0;
  }


  /*
   * HARD:
   * dostupan od početka.
   *
   * Kada je dostupan:
   * 1 / 15.
   */
  return 1 / 15;
}


/*
 * =====================================================
 * VELIKI MIŠ
 * =====================================================
 */
function getBigMouseChance(
  difficulty,
  score
) {
  const mode =
    normalizeDifficulty(
      difficulty
    );


  const safeScore =
    Math.max(
      0,
      Number(
        score
      ) ||
        0
    );


  /*
   * Samo HARD
   * i tek od 20 poena.
   */
  if (
    mode !==
      DIFFICULTIES.HARD ||
    safeScore <
      20
  ) {
    return 0;
  }


  /*
   * Fiksno:
   * 1 / 25.
   */
  return 1 / 25;
}


/*
 * =====================================================
 * STANJE TEŽINE
 * =====================================================
 */
export function getDifficultyState({
  difficulty,
  score,
}) {
  const mode =
    normalizeDifficulty(
      difficulty
    );


  const safeScore =
    Math.max(
      0,
      Number(
        score
      ) ||
        0
    );


  const holeCount =
    getUnlockedHoleCount(
      mode,
      safeScore
    );


  const activeHoleIds =
    HOLE_UNLOCK_ORDER.slice(
      0,
      holeCount
    );


  const maxActiveMice =
    getBaseConcurrentMice(
      mode,
      safeScore
    );


  const spawnInterval =
    getSpawnInterval(
      mode,
      safeScore
    );


  const speedMultiplier =
    getSpeedMultiplier(
      mode,
      safeScore
    );


  return {
    difficulty:
      mode,

    activeHoleIds,

    holeCount,

    maxActiveMice,

    spawnInterval,

    speedMultiplier,

    fastMouseChance:
      getFastMouseChance(
        mode,
        safeScore
      ),

    bigMouseChance:
      getBigMouseChance(
        mode,
        safeScore
      ),

    /*
     * VEOMA BITNO:
     *
     * više miševa sme da napada isti sir.
     *
     * Zato broj sireva više ne ograničava
     * broj miševa na terenu.
     */
    allowSharedLastCheese:
      true,

    /*
     * Ostavljamo ova polja samo zbog
     * kompatibilnosti sa postojećim hookom.
     */
    cheesePressureStage:
      "off",

    lastCheeseSiege:
      false,
  };
}


/*
 * =====================================================
 * IZBOR TIPA MIŠA
 * =====================================================
 */
export function chooseMouseType(
  difficultyState
) {
  const bigChance =
    difficultyState
      .bigMouseChance ||
    0;


  const fastChance =
    difficultyState
      .fastMouseChance ||
    0;


  /*
   * Koristimo jedno random bacanje
   * da šanse ostanu stvarno:
   *
   * veliki = 1 / 25
   * brzi = 1 / 15
   */
  const roll =
    Math.random();


  if (
    roll <
    bigChance
  ) {
    return "big";
  }


  if (
    roll <
    bigChance +
      fastChance
  ) {
    return "fast";
  }


  return "ordinary";
}