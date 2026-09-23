import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";


import FlipCatArena
  from "../components/flip-cat/FlipCatArena";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  startGameConsoleExitTransition,
  syncGameConsoleLayout,
} from "../transitions/gameConsoleTransition.js";

import "../styles/pages/HumanOneGame.css";


const DIFFICULTIES = [
  {
    key: "easy",
    label: "EASY",
  },
  {
    key: "normal",
    label: "NORMAL",
  },
  {
    key: "hard",
    label: "HARD",
  },
];


const STORAGE_KEYS = {
  difficulty:
    "flip-cat-difficulty",

  sfx:
    "flip-cat-sfx",

  playerName:
    "flip-cat-player-name",
};


const MENU_MUSIC_SRC =
  "/audio/human-one/flip-cat/flip-cat-theme.mp3";


let anonymousSessionPromise =
  null;


function getSavedDifficulty() {
  try {
    const saved =
      localStorage.getItem(
        STORAGE_KEYS.difficulty
      );

    const exists =
      DIFFICULTIES.some(
        (difficulty) =>
          difficulty.key ===
          saved
      );

    return exists
      ? saved
      : "normal";
  } catch {
    return "normal";
  }
}


function getSavedSfx() {
  try {
    return (
      localStorage.getItem(
        STORAGE_KEYS.sfx
      ) !== "off"
    );
  } catch {
    return true;
  }
}


function getSavedPlayerName() {
  try {
    return (
      localStorage.getItem(
        STORAGE_KEYS.playerName
      ) || ""
    )
      .toUpperCase()
      .slice(
        0,
        12
      );
  } catch {
    return "";
  }
}


async function ensureAnonymousSession() {
  const {
    data: sessionData,
    error: sessionError,
  } =
    await supabase
      .auth
      .getSession();


  if (sessionError) {
    throw sessionError;
  }


  if (
    sessionData.session?.user
  ) {
    return sessionData.session;
  }


  if (
    !anonymousSessionPromise
  ) {
    anonymousSessionPromise =
      supabase
        .auth
        .signInAnonymously()
        .then(
          ({
            data,
            error,
          }) => {
            if (error) {
              throw error;
            }

            if (!data.session) {
              throw new Error(
                "Anonymous session was not created."
              );
            }

            return data.session;
          }
        )
        .finally(
          () => {
            anonymousSessionPromise =
              null;
          }
        );
  }


  return anonymousSessionPromise;
}


function HumanOneGame() {
  const navigate =
    useNavigate();


  const musicRef =
    useRef(null);


  const machineRef =
    useRef(null);


  const [
    screen,
    setScreen,
  ] = useState(
    "menu"
  );


  const [
    difficulty,
    setDifficulty,
  ] = useState(
    getSavedDifficulty
  );


  const [
    sfxEnabled,
    setSfxEnabled,
  ] = useState(
    getSavedSfx
  );


  const [
    playerName,
    setPlayerName,
  ] = useState(
    getSavedPlayerName
  );


  const [
    authStatus,
    setAuthStatus,
  ] = useState(
    "loading"
  );


  const [
    scores,
    setScores,
  ] = useState(
    []
  );


  const [
    scoresStatus,
    setScoresStatus,
  ] = useState(
    "idle"
  );


  const [
    scoresError,
    setScoresError,
  ] = useState(
    ""
  );


  const [
    isClosing,
    setIsClosing,
  ] = useState(
    false
  );


  const currentDifficulty =
    useMemo(
      () =>
        DIFFICULTIES.find(
          (item) =>
            item.key ===
            difficulty
        ) ||
        DIFFICULTIES[1],
      [
        difficulty,
      ]
    );


  const trimmedPlayerName =
    playerName.trim();


  const hardModeNeedsConnection =
    difficulty ===
      "hard" &&
    authStatus !==
      "ready";


  const canStart =
    trimmedPlayerName.length >
      0 &&
    !hardModeNeedsConnection;


  /* =====================================
     MUZIKA MENIJA
     SFX kontroliše i muziku.
     ===================================== */

  useEffect(() => {
    const audio =
      new Audio(
        MENU_MUSIC_SRC
      );


    audio.loop =
      true;

    audio.preload =
      "auto";

    audio.volume =
      0.42;


    musicRef.current =
      audio;


    return () => {
      audio.pause();

      audio.currentTime =
        0;

      musicRef.current =
        null;
    };
  }, []);


  useEffect(() => {
    const audio =
      musicRef.current;


    if (!audio) {
      return;
    }


    if (
      !sfxEnabled ||
      screen ===
        "playing"
    ) {
      audio.pause();

      if (
        screen ===
          "playing"
      ) {
        audio.currentTime =
          0;
      }

      return;
    }


    function tryPlayMusic() {
      audio
        .play()
        .catch(
          () => {
            /*
             * Browser može da blokira autoplay.
             * Prvi klik/tap/taster će ponovo
             * pokušati da pokrene muziku.
             */
          }
        );
    }


    tryPlayMusic();


    window.addEventListener(
      "pointerdown",
      tryPlayMusic,
      {
        once: true,
      }
    );

    window.addEventListener(
      "keydown",
      tryPlayMusic,
      {
        once: true,
      }
    );


    return () => {
      window.removeEventListener(
        "pointerdown",
        tryPlayMusic
      );

      window.removeEventListener(
        "keydown",
        tryPlayMusic
      );
    };
  }, [
    screen,
    sfxEnabled,
  ]);


  /* =====================================
     ANONIMNA SUPABASE SESIJA
     ===================================== */

  useEffect(() => {
    let cancelled =
      false;


    async function bootAuth() {
      try {
        await ensureAnonymousSession();

        if (!cancelled) {
          setAuthStatus(
            "ready"
          );
        }
      } catch (error) {
        console.error(
          "FLIP CAT anonymous auth:",
          error
        );

        if (!cancelled) {
          setAuthStatus(
            "error"
          );
        }
      }
    }


    bootAuth();


    return () => {
      cancelled =
        true;
    };
  }, []);


  /* =====================================
     GLOBALNI TOP 5 — SUPABASE
     ===================================== */

  async function loadLeaderboard() {
    setScoresStatus(
      "loading"
    );

    setScoresError(
      ""
    );


    const {
      data,
      error,
    } =
      await supabase
        .from(
          "flip_cat_scores"
        )
        .select(
          "player_name, score, updated_at"
        )
        .order(
          "score",
          {
            ascending:
              false,
          }
        )
        .order(
          "updated_at",
          {
            ascending:
              true,
          }
        )
        .limit(
          5
        );


    if (error) {
      console.error(
        "FLIP CAT leaderboard:",
        error
      );

      setScores(
        []
      );

      setScoresStatus(
        "error"
      );

      setScoresError(
        "SCORES UNAVAILABLE"
      );

      return;
    }


    setScores(
      data || []
    );

    setScoresStatus(
      "ready"
    );
  }


  async function handleGameOver(
    result
  ) {
    if (
      result?.difficulty !==
        "hard"
    ) {
      return;
    }


    const finalScore =
      Number(
        result?.score
      );


    if (
      !Number.isFinite(
        finalScore
      ) ||
      finalScore < 0
    ) {
      return;
    }


    const name =
      trimmedPlayerName
        .toUpperCase()
        .slice(
          0,
          12
        );


    if (!name) {
      return;
    }


    try {
      await ensureAnonymousSession();


      const {
        error,
      } =
        await supabase.rpc(
          "save_flip_cat_high_score",
          {
            p_player_name:
              name,

            p_score:
              Math.floor(
                finalScore
              ),
          }
        );


      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(
        "FLIP CAT score save:",
        error
      );
    }
  }


  /* =====================================
     MENI
     ===================================== */

  function handleQuit() {
    if (isClosing) {
      return;
    }


    setIsClosing(
      true
    );


    startGameConsoleExitTransition({
      sourceElement:
        machineRef.current,

      navigate: () => {
        navigate(
          "/autor/covek"
        );
      },
    });
  }


  function handleStart() {
    if (!canStart) {
      return;
    }


    try {
      localStorage.setItem(
        STORAGE_KEYS.playerName,
        trimmedPlayerName
      );
    } catch {
      // Igra radi i bez localStorage-a.
    }


    setPlayerName(
      trimmedPlayerName
    );

    setScreen(
      "playing"
    );
  }


  function handlePlayerNameChange(
    event
  ) {
    const nextValue =
      event
        .target
        .value
        .toUpperCase()
        .slice(
          0,
          12
        );


    setPlayerName(
      nextValue
    );


    try {
      localStorage.setItem(
        STORAGE_KEYS.playerName,
        nextValue
      );
    } catch {
      // Igra radi i bez localStorage-a.
    }
  }


  function handleDifficulty() {
    setScreen(
      "difficulty"
    );
  }


  function handleScores() {
    setScreen(
      "scores"
    );

    loadLeaderboard();
  }


  function handleBackToMenu() {
    setScreen(
      "menu"
    );
  }


  function chooseDifficulty(
    nextDifficulty
  ) {
    setDifficulty(
      nextDifficulty
    );


    try {
      localStorage.setItem(
        STORAGE_KEYS.difficulty,
        nextDifficulty
      );
    } catch {
      // Igra radi i bez localStorage-a.
    }


    setScreen(
      "menu"
    );
  }


  function toggleSfx() {
    const nextValue =
      !sfxEnabled;


    setSfxEnabled(
      nextValue
    );


    const audio =
      musicRef.current;


    if (audio) {
      if (nextValue) {
        audio
          .play()
          .catch(
            () => {
              // Sledeća korisnička interakcija
              // će ponovo pokušati play.
            }
          );
      } else {
        audio.pause();
      }
    }


    try {
      localStorage.setItem(
        STORAGE_KEYS.sfx,
        nextValue
          ? "on"
          : "off"
      );
    } catch {
      // Igra radi i bez localStorage-a.
    }
  }


  /* =====================================
     RESPONSIVE GAMEBOY LAYOUT

     Ako se FLIP CAT otvori dok je telefon
     uspravan, a korisnik ga zatim okrene,
     prethodno izračunate pixel vrednosti više
     nisu validne.

     Zato posle promene orijentacije čekamo da
     mobilni viewport stvarno završi resize,
     pa istom matematikom ponovo postavljamo
     konzolu na pravo mesto.
     ===================================== */

  useEffect(() => {
    if (
      screen === "playing" ||
      isClosing
    ) {
      return undefined;
    }

    let frameOne = null;
    let frameTwo = null;

    let settleTimerOne = null;
    let settleTimerTwo = null;
    let settleTimerFinal = null;

    let hiddenMachine = null;
    let previousVisibility = "";

    const orientationMedia =
      window.matchMedia(
        "(orientation: landscape)"
      );

    let lastLandscape =
      orientationMedia.matches;


    function clearScheduledSync() {
      if (frameOne !== null) {
        cancelAnimationFrame(
          frameOne
        );

        frameOne = null;
      }

      if (frameTwo !== null) {
        cancelAnimationFrame(
          frameTwo
        );

        frameTwo = null;
      }

      if (settleTimerOne !== null) {
        clearTimeout(
          settleTimerOne
        );

        settleTimerOne = null;
      }

      if (settleTimerTwo !== null) {
        clearTimeout(
          settleTimerTwo
        );

        settleTimerTwo = null;
      }

      if (settleTimerFinal !== null) {
        clearTimeout(
          settleTimerFinal
        );

        settleTimerFinal = null;
      }
    }


    function restoreMachineVisibility() {
      if (
        hiddenMachine &&
        hiddenMachine.isConnected
      ) {
        hiddenMachine.style.visibility =
          previousVisibility;
      }

      hiddenMachine = null;
      previousVisibility = "";
    }


    function syncNow() {
      const machine =
        machineRef.current;

      if (
        !machine ||
        isClosing
      ) {
        return;
      }

      syncGameConsoleLayout(
        machine
      );
    }


    function scheduleSettledSync(
      hideDuringSettle = false
    ) {
      clearScheduledSync();

      const machine =
        machineRef.current;

      if (!machine) {
        return;
      }

      if (
        hideDuringSettle &&
        hiddenMachine !== machine
      ) {
        restoreMachineVisibility();

        hiddenMachine =
          machine;

        previousVisibility =
          machine.style.visibility;

        machine.style.visibility =
          "hidden";
      }

      frameOne =
        requestAnimationFrame(
          () => {
            frameTwo =
              requestAnimationFrame(
                () => {
                  syncNow();

                  settleTimerOne =
                    window.setTimeout(
                      syncNow,
                      80
                    );

                  settleTimerTwo =
                    window.setTimeout(
                      syncNow,
                      180
                    );

                  settleTimerFinal =
                    window.setTimeout(
                      () => {
                        syncNow();

                        restoreMachineVisibility();
                      },
                      320
                    );
                }
              );
          }
        );
    }


    function currentOrientationChanged() {
      const nextLandscape =
        orientationMedia.matches;

      if (
        nextLandscape ===
        lastLandscape
      ) {
        return false;
      }

      lastLandscape =
        nextLandscape;

      return true;
    }


    function handleOrientationChange() {
      lastLandscape =
        orientationMedia.matches;

      scheduleSettledSync(
        true
      );
    }


    function handleWindowResize() {
      if (
        currentOrientationChanged()
      ) {
        scheduleSettledSync(
          true
        );

        return;
      }

      const activeElement =
        document.activeElement;

      const editingText =
        activeElement &&
        (
          activeElement.tagName ===
            "INPUT" ||
          activeElement.tagName ===
            "TEXTAREA" ||
          activeElement.tagName ===
            "SELECT"
        );

      /*
       * Otvaranje mobilne tastature menja viewport,
       * ali ne želimo da zbog toga Gameboy skače.
       */
      if (editingText) {
        return;
      }

      scheduleSettledSync(
        false
      );
    }


    function handleVisualViewportResize() {
      if (
        currentOrientationChanged()
      ) {
        scheduleSettledSync(
          true
        );
      }
    }


    /*
     * I pri prvom mount-u poravnaj layout sa
     * trenutno stvarnim viewportom.
     */
    scheduleSettledSync(
      false
    );


    window.addEventListener(
      "resize",
      handleWindowResize
    );


    const visualViewport =
      window.visualViewport;

    if (visualViewport) {
      visualViewport.addEventListener(
        "resize",
        handleVisualViewportResize
      );
    }


    const screenOrientation =
      window.screen?.orientation;

    if (
      screenOrientation &&
      typeof screenOrientation
        .addEventListener ===
        "function"
    ) {
      screenOrientation.addEventListener(
        "change",
        handleOrientationChange
      );
    }


    if (
      typeof orientationMedia
        .addEventListener ===
        "function"
    ) {
      orientationMedia.addEventListener(
        "change",
        handleOrientationChange
      );
    } else if (
      typeof orientationMedia
        .addListener ===
        "function"
    ) {
      orientationMedia.addListener(
        handleOrientationChange
      );
    }


    return () => {
      clearScheduledSync();

      restoreMachineVisibility();

      window.removeEventListener(
        "resize",
        handleWindowResize
      );

      if (visualViewport) {
        visualViewport.removeEventListener(
          "resize",
          handleVisualViewportResize
        );
      }

      if (
        screenOrientation &&
        typeof screenOrientation
          .removeEventListener ===
          "function"
      ) {
        screenOrientation.removeEventListener(
          "change",
          handleOrientationChange
        );
      }

      if (
        typeof orientationMedia
          .removeEventListener ===
          "function"
      ) {
        orientationMedia.removeEventListener(
          "change",
          handleOrientationChange
        );
      } else if (
        typeof orientationMedia
          .removeListener ===
          "function"
      ) {
        orientationMedia.removeListener(
          handleOrientationChange
        );
      }
    };
  }, [
    screen,
    isClosing,
  ]);


  /* =====================================
     ESC
     ===================================== */

  useEffect(() => {
    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        if (
          screen ===
          "menu"
        ) {
          handleQuit();
        } else {
          handleBackToMenu();
        }
      }
    }


    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    screen,
    isClosing,
  ]);


  /* =====================================
     GAMEPLAY
     ===================================== */

  if (
    screen ===
    "playing"
  ) {
    return (
      <FlipCatArena
        difficulty={
          difficulty
        }
        sfxEnabled={
          sfxEnabled
        }
        onExit={
          handleBackToMenu
        }
        onGameOver={
          handleGameOver
        }
      />
    );
  }


  /* =====================================
     GAMEBOY / MENI
     ===================================== */

  return (
    <main className="human-one-game">
      <div
        className="human-one-game__noise"
        aria-hidden="true"
      />


      <section
        ref={
          machineRef
        }
        className={
          isClosing
            ? "human-one-game__machine human-one-game__machine--closing"
            : "human-one-game__machine"
        }
        data-game-console-transition-target="game-console"
        aria-label="FLIP CAT"
      >
        <div className="human-one-game__bezel">
          <div className="human-one-game__lcd">
            <div
              className="human-one-game__scanlines"
              aria-hidden="true"
            />

            <div
              className="human-one-game__screen-glare"
              aria-hidden="true"
            />


            <header className="human-one-game__header">
              <span>
                FLIP CAT
              </span>

              <small>
                {
                  currentDifficulty.label
                }
              </small>
            </header>


            {screen ===
              "menu" && (
              <section className="human-one-game__menu">
                <div className="human-one-game__player">
                  <label
                    htmlFor="flip-cat-player-name"
                  >
                    <span>
                      PLAYER
                    </span>

                    <small>
                      {
                        trimmedPlayerName.length
                      }
                      /12
                    </small>
                  </label>

                  <input
                    id="flip-cat-player-name"
                    type="text"
                    value={
                      playerName
                    }
                    onChange={
                      handlePlayerNameChange
                    }
                    maxLength={
                      12
                    }
                    autoComplete="off"
                    spellCheck="false"
                    placeholder="ENTER NAME"
                    aria-label="Player name"
                  />

                  {difficulty ===
                    "hard" &&
                    authStatus ===
                      "loading" && (
                    <p className="human-one-game__connection">
                      CONNECTING...
                    </p>
                  )}

                  {difficulty ===
                    "hard" &&
                    authStatus ===
                      "error" && (
                    <p className="human-one-game__connection human-one-game__connection--error">
                      HARD REQUIRES ONLINE
                    </p>
                  )}
                </div>


                <button
                  type="button"
                  className="human-one-game__menu-button human-one-game__menu-button--primary"
                  onClick={
                    handleStart
                  }
                  disabled={
                    !canStart
                  }
                >
                  <span>
                    ▶
                  </span>

                  START
                </button>


                <button
                  type="button"
                  className="human-one-game__menu-button"
                  onClick={
                    handleScores
                  }
                >
                  SCORES
                </button>


                <button
                  type="button"
                  className="human-one-game__menu-button"
                  onClick={
                    handleDifficulty
                  }
                >
                  DIFFICULTY

                  <small>
                    {
                      currentDifficulty.label
                    }
                  </small>
                </button>


                <button
                  type="button"
                  className="human-one-game__menu-button"
                  onClick={
                    toggleSfx
                  }
                  aria-pressed={
                    sfxEnabled
                  }
                >
                  SFX

                  <small>
                    {sfxEnabled
                      ? "ON"
                      : "OFF"}
                  </small>
                </button>


                <button
                  type="button"
                  className="human-one-game__menu-button"
                  onClick={
                    handleQuit
                  }
                  disabled={
                    isClosing
                  }
                >
                  QUIT
                </button>
              </section>
            )}


            {screen ===
              "difficulty" && (
              <section className="human-one-game__panel">
                <h1>
                  DIFFICULTY
                </h1>

                <div className="human-one-game__difficulty-list">
                  {DIFFICULTIES.map(
                    (
                      item
                    ) => (
                      <button
                        key={
                          item.key
                        }
                        type="button"
                        className={
                          item.key ===
                          difficulty
                            ? "human-one-game__choice human-one-game__choice--active"
                            : "human-one-game__choice"
                        }
                        onClick={() =>
                          chooseDifficulty(
                            item.key
                          )
                        }
                      >
                        {item.key ===
                          difficulty && (
                          <span>
                            ▶
                          </span>
                        )}

                        {
                          item.label
                        }
                      </button>
                    )
                  )}
                </div>

                <p className="human-one-game__difficulty-note">
                  HARD = TOP 5
                </p>

                <button
                  type="button"
                  className="human-one-game__back-button"
                  onClick={
                    handleBackToMenu
                  }
                >
                  ← BACK
                </button>
              </section>
            )}


            {screen ===
              "scores" && (
              <section className="human-one-game__panel">
                <h1>
                  TOP 5 — HARD
                </h1>

                {scoresStatus ===
                  "loading" && (
                  <p className="human-one-game__empty">
                    LOADING...
                  </p>
                )}


                {scoresStatus ===
                  "error" && (
                  <>
                    <p className="human-one-game__empty">
                      {
                        scoresError
                      }
                    </p>

                    <button
                      type="button"
                      className="human-one-game__back-button"
                      onClick={
                        loadLeaderboard
                      }
                    >
                      ↻ RETRY
                    </button>
                  </>
                )}


                {scoresStatus ===
                  "ready" &&
                  scores.length >
                    0 && (
                  <ol className="human-one-game__scores">
                    {scores.map(
                      (
                        item,
                        index
                      ) => (
                        <li
                          key={
                            `${item.player_name}-${item.score}-${index}`
                          }
                        >
                          <span>
                            {String(
                              index +
                                1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>

                          <strong>
                            {
                              item.player_name
                            }
                          </strong>

                          <b>
                            {String(
                              item.score
                            ).padStart(
                              5,
                              "0"
                            )}
                          </b>
                        </li>
                      )
                    )}
                  </ol>
                )}


                {scoresStatus ===
                  "ready" &&
                  scores.length ===
                    0 && (
                  <p className="human-one-game__empty">
                    NO SCORES YET
                  </p>
                )}


                <button
                  type="button"
                  className="human-one-game__back-button"
                  onClick={
                    handleBackToMenu
                  }
                >
                  ← BACK
                </button>
              </section>
            )}


          </div>
        </div>
      </section>
    </main>
  );
}


export default HumanOneGame;