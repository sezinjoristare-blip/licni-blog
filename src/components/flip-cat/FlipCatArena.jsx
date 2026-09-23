import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getMouseTypeConfig,
  normalizeDifficulty,
} from "../../game/flip-cat/progression";

import {
  useFlipCatGame,
} from "../../hooks/useFlipCatGame";

import "../../styles/flip-cat/FlipCatArena.css";
import "../../styles/flip-cat/FlipCatMobileLandscape.css";


const GAME_OVER_FRAMES =
  Array.from(
    {
      length:
        8,
    },
    (
      _,
      index
    ) =>
      `/images/human-one/game/game-over/game-over-${String(
        index +
          1
      ).padStart(
        2,
        "0"
      )}.webp`
  );


const GAME_OVER_FRAME_DURATIONS = [
  300,
  135,
  100,
  185,
  180,
  145,
  210,
  360,
];


const GAMEPLAY_AUDIO_SRC =
  "/audio/human-one/flip-cat/flip-cat-gameplay.mp3";


const COUNT_IN_AUDIO_SRC =
  "/audio/human-one/flip-cat/flip-cat-count-in-sticks.wav";


const EAT_AUDIO_SRC =
  "/audio/human-one/flip-cat/flip-cat-eat.mp3";


const MOUSE_SQUEAK_AUDIO_SRC =
  "/audio/human-one/flip-cat/flip-cat-mouse-squeak.mp3";


const CAT_MEOW_AUDIO_SRC =
  "/audio/human-one/flip-cat/flip-cat-cat-meow.mp3";


const GAME_OVER_AUDIO_SRC =
  "/audio/human-one/flip-cat/flip-cat-game-over.mp3";


const CHEESE_RETURN_AUDIO_SRC =
  "/audio/human-one/flip-cat/flip-cat-cheese-return.mp3";


/*
 * Prvi prolaz:
 * početak pesme → skoro kraj.
 *
 * Posle toga:
 * 50% pesme → skoro kraj → 50% → ...
 */

const GAMEPLAY_LOOP_START_RATIO =
  0.5;


/*
 * Pesmu sečemo ovoliko sekundi
 * pre njenog pravog završetka.
 */

const GAMEPLAY_LOOP_END_OFFSET =
  3;


/*
 * Loše isečen početak cheese-return fajla
 * preskačemo i uvek krećemo od 6. sekunde.
 */

const CHEESE_RETURN_START_TIME =
  6;


const GAMEPLAY_VOLUME =
  0.38;


const COUNT_IN_VOLUME =
  0.9;


const EAT_VOLUME =
  0.72;


const MOUSE_SQUEAK_VOLUME =
  0.58;


const CAT_MEOW_VOLUME =
  0.72;


const GAME_OVER_VOLUME =
  0.78;


const CHEESE_RETURN_VOLUME =
  0.72;


function FlipCatArena({
  onExit,

  onGameOver,

  sfxEnabled =
    true,

  difficulty:
    difficultyProp =
      "easy",
}) {
  const difficulty =
    normalizeDifficulty(
      difficultyProp
    );


  const [
    catSrc,
    setCatSrc,
  ] = useState(
    "/images/human-one/game/cat.webp"
  );


  const [
    gameOverFrameIndex,
    setGameOverFrameIndex,
  ] = useState(0);


  const gameplayAudioRef =
    useRef(null);


  const countInAudioRef =
    useRef(null);


  const eatAudioRef =
    useRef(null);


  const mouseSqueakAudioRef =
    useRef(null);


  const catMeowAudioRef =
    useRef(null);


  const gameOverAudioRef =
    useRef(null);


  const cheeseReturnAudioRef =
    useRef(null);


  const previousGamePhaseRef =
    useRef("ready");


  const lastCountdownRef =
    useRef(null);


  const suppressNextCountdownHitRef =
    useRef(false);


  const previousScoreRef =
    useRef(0);


  const eatenMouseCountRef =
    useRef(0);


  const previousActiveCheeseCountRef =
    useRef(null);


  const {
    playfieldRef,
    catPosition,
    cheeses,
    mice,
    droppedCheeses,
    availableAction,
    score,
    lives,
    maxLives,
    activeHoles,
    gamePhase,
    countdown,
    isDragging,
    startGame,
    resumeGame,
    togglePause,
    resetGame,
    performAction,
    pointerHandlers,
  } =
    useFlipCatGame({
      difficulty,

      onGameOver,
    });


  const actionLabel =
    availableAction ===
    "eat"
      ? "ПОЈЕДИ"
      : availableAction ===
        "return-cheese"
        ? "ВРАТИ СИР"
        : "";


  const showHud =
    gamePhase ===
      "countdown" ||
    gamePhase ===
      "playing" ||
    gamePhase ===
      "paused";


  function playAudioFrom(
    audioRef,
    volume,
    startTime =
      0
  ) {
    const audio =
      audioRef.current;


    if (
      !audio ||
      !sfxEnabled
    ) {
      return;
    }


    audio.pause();

    audio.volume =
      volume;

    audio.muted =
      false;


    function startPlayback() {
      try {
        audio.currentTime =
          startTime;
      } catch {
        // Metadata možda još nije spremna.
      }


      const playPromise =
        audio.play();


      if (
        playPromise &&
        typeof playPromise.catch ===
          "function"
      ) {
        playPromise.catch(
          () => {}
        );
      }
    }


    if (
      audio.readyState >=
      1
    ) {
      startPlayback();

      return;
    }


    audio.addEventListener(
      "loadedmetadata",
      startPlayback,
      {
        once:
          true,
      }
    );


    audio.load();
  }


  function playAudio(
    audioRef,
    volume
  ) {
    playAudioFrom(
      audioRef,
      volume,
      0
    );
  }


  function stopAudio(
    audioRef
  ) {
    const audio =
      audioRef.current;


    if (!audio) {
      return;
    }


    audio.pause();

    audio.currentTime =
      0;
  }


  function playCountInHit() {
    playAudio(
      countInAudioRef,
      COUNT_IN_VOLUME
    );
  }


  function stopCountInAudio() {
    stopAudio(
      countInAudioRef
    );
  }


  function stopGameplayAudio() {
    const audio =
      gameplayAudioRef.current;


    if (!audio) {
      return;
    }


    audio.pause();

    audio.currentTime =
      0;

    audio.volume =
      GAMEPLAY_VOLUME;
  }


  function stopGameplayEffects() {
    stopAudio(
      eatAudioRef
    );

    stopAudio(
      mouseSqueakAudioRef
    );

    stopAudio(
      catMeowAudioRef
    );

    stopAudio(
      cheeseReturnAudioRef
    );
  }


  function stopGameOverAudio() {
    stopAudio(
      gameOverAudioRef
    );
  }


  function primeGameplayAudio() {
    const audio =
      gameplayAudioRef.current;


    if (
      !audio ||
      !sfxEnabled
    ) {
      return;
    }


    audio.pause();

    audio.currentTime =
      0;

    audio.volume =
      0;

    audio.muted =
      false;


    const playPromise =
      audio.play();


    if (
      playPromise &&
      typeof playPromise.catch ===
        "function"
    ) {
      playPromise.catch(
        () => {}
      );
    }
  }


  /* =====================================================
     AUDIO FAJLOVI
     ===================================================== */

  useEffect(() => {
    if (
      typeof Audio ===
      "undefined"
    ) {
      return undefined;
    }


    const gameplayAudio =
      new Audio(
        GAMEPLAY_AUDIO_SRC
      );

    gameplayAudio.preload =
      "auto";

    /*
     * VAŽNO:
     * ne koristimo običan audio.loop.
     *
     * Sami kontrolišemo drugi deo pesme
     * da nikada ne dođe do pravog kraja.
     */
    gameplayAudio.loop =
      false;

    gameplayAudio.volume =
      GAMEPLAY_VOLUME;


    const countInAudio =
      new Audio(
        COUNT_IN_AUDIO_SRC
      );

    countInAudio.preload =
      "auto";

    countInAudio.volume =
      COUNT_IN_VOLUME;


    const eatAudio =
      new Audio(
        EAT_AUDIO_SRC
      );

    eatAudio.preload =
      "auto";

    eatAudio.volume =
      EAT_VOLUME;


    const mouseSqueakAudio =
      new Audio(
        MOUSE_SQUEAK_AUDIO_SRC
      );

    mouseSqueakAudio.preload =
      "auto";

    mouseSqueakAudio.volume =
      MOUSE_SQUEAK_VOLUME;


    const catMeowAudio =
      new Audio(
        CAT_MEOW_AUDIO_SRC
      );

    catMeowAudio.preload =
      "auto";

    catMeowAudio.volume =
      CAT_MEOW_VOLUME;


    const gameOverAudio =
      new Audio(
        GAME_OVER_AUDIO_SRC
      );

    gameOverAudio.preload =
      "auto";

    gameOverAudio.volume =
      GAME_OVER_VOLUME;


    const cheeseReturnAudio =
      new Audio(
        CHEESE_RETURN_AUDIO_SRC
      );

    cheeseReturnAudio.preload =
      "auto";

    cheeseReturnAudio.volume =
      CHEESE_RETURN_VOLUME;


    gameplayAudioRef.current =
      gameplayAudio;

    countInAudioRef.current =
      countInAudio;

    eatAudioRef.current =
      eatAudio;

    mouseSqueakAudioRef.current =
      mouseSqueakAudio;

    catMeowAudioRef.current =
      catMeowAudio;

    gameOverAudioRef.current =
      gameOverAudio;

    cheeseReturnAudioRef.current =
      cheeseReturnAudio;


    return () => {
      gameplayAudio.pause();

      countInAudio.pause();

      eatAudio.pause();

      mouseSqueakAudio.pause();

      catMeowAudio.pause();

      gameOverAudio.pause();

      cheeseReturnAudio.pause();


      gameplayAudio.currentTime =
        0;

      countInAudio.currentTime =
        0;

      eatAudio.currentTime =
        0;

      mouseSqueakAudio.currentTime =
        0;

      catMeowAudio.currentTime =
        0;

      gameOverAudio.currentTime =
        0;

      cheeseReturnAudio.currentTime =
        0;


      gameplayAudioRef.current =
        null;

      countInAudioRef.current =
        null;

      eatAudioRef.current =
        null;

      mouseSqueakAudioRef.current =
        null;

      catMeowAudioRef.current =
        null;

      gameOverAudioRef.current =
        null;

      cheeseReturnAudioRef.current =
        null;
    };
  }, []);


  /* =====================================================
     BESKONAČNI METAL LOOP

     PRVI PUT:
     0% → skoro 100%

     ZATIM:
     50% → skoro 100%
     50% → skoro 100%
     50% → skoro 100%

     Nema kraja pesme i nema praznog prostora.
     ===================================================== */

  useEffect(() => {
    const audio =
      gameplayAudioRef.current;


    if (!audio) {
      return undefined;
    }


    function getLoopStart() {
      if (
        !Number.isFinite(
          audio.duration
        ) ||
        audio.duration <=
          0
      ) {
        return null;
      }


      return (
        audio.duration *
        GAMEPLAY_LOOP_START_RATIO
      );
    }


    function getLoopEnd() {
      if (
        !Number.isFinite(
          audio.duration
        ) ||
        audio.duration <=
          0
      ) {
        return null;
      }


      return Math.max(
        0,
        audio.duration -
          GAMEPLAY_LOOP_END_OFFSET
      );
    }


    function handleTimeUpdate() {
      if (
        gamePhase !==
          "playing" ||
        !sfxEnabled
      ) {
        return;
      }


      const loopStart =
        getLoopStart();

      const loopEnd =
        getLoopEnd();


      if (
        loopStart ===
          null ||
        loopEnd ===
          null ||
        loopEnd <=
          loopStart
      ) {
        return;
      }


      if (
        audio.currentTime >=
        loopEnd
      ) {
        audio.currentTime =
          loopStart;
      }
    }


    /*
     * Fallback:
     * ako browser iz nekog razloga preskoči
     * naš pred-kraj check i pesma ipak stigne
     * do pravog END-a, odmah je vraćamo
     * na polovinu.
     */

    function handleEnded() {
      if (
        gamePhase !==
          "playing" ||
        !sfxEnabled
      ) {
        return;
      }


      const loopStart =
        getLoopStart();


      if (
        loopStart ===
        null
      ) {
        return;
      }


      audio.currentTime =
        loopStart;


      const playPromise =
        audio.play();


      if (
        playPromise &&
        typeof playPromise.catch ===
          "function"
      ) {
        playPromise.catch(
          () => {}
        );
      }
    }


    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    audio.addEventListener(
      "ended",
      handleEnded
    );


    return () => {
      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );

      audio.removeEventListener(
        "ended",
        handleEnded
      );
    };
  }, [
    gamePhase,
    sfxEnabled,
  ]);


  /* =====================================================
     GAMEPLAY METAL
     ===================================================== */

  useEffect(() => {
    const audio =
      gameplayAudioRef.current;

    const previousPhase =
      previousGamePhaseRef.current;


    if (!audio) {
      previousGamePhaseRef.current =
        gamePhase;

      return;
    }


    audio.muted =
      !sfxEnabled;


    if (!sfxEnabled) {
      audio.pause();

      audio.currentTime =
        0;

      audio.volume =
        GAMEPLAY_VOLUME;

      previousGamePhaseRef.current =
        gamePhase;

      return;
    }


    if (
      gamePhase ===
      "countdown"
    ) {
      audio.volume =
        0;
    } else if (
      gamePhase ===
      "playing"
    ) {
      if (
        previousPhase ===
        "countdown"
      ) {
        /*
         * Svaka NOVA partija prvi put
         * kreće od početka pesme.
         */
        audio.currentTime =
          0;
      }


      audio.volume =
        GAMEPLAY_VOLUME;


      if (audio.paused) {
        const playPromise =
          audio.play();


        if (
          playPromise &&
          typeof playPromise.catch ===
            "function"
        ) {
          playPromise.catch(
            () => {}
          );
        }
      }
    } else if (
      gamePhase ===
      "paused"
    ) {
      audio.pause();
    } else {
      audio.pause();

      audio.currentTime =
        0;

      audio.volume =
        GAMEPLAY_VOLUME;
    }


    previousGamePhaseRef.current =
      gamePhase;
  }, [
    gamePhase,
    sfxEnabled,
  ]);


  /* =====================================================
     3 — 2 — 1 PALICE
     ===================================================== */

  useEffect(() => {
    if (
      gamePhase !==
      "countdown"
    ) {
      lastCountdownRef.current =
        null;

      return;
    }


    if (!countdown) {
      return;
    }


    if (!sfxEnabled) {
      lastCountdownRef.current =
        countdown;

      return;
    }


    if (
      suppressNextCountdownHitRef.current
    ) {
      suppressNextCountdownHitRef.current =
        false;

      lastCountdownRef.current =
        countdown;

      return;
    }


    if (
      lastCountdownRef.current ===
      countdown
    ) {
      return;
    }


    lastCountdownRef.current =
      countdown;

    playCountInHit();
  }, [
    gamePhase,
    countdown,
    sfxEnabled,
  ]);


  /* =====================================================
     POJEDEN MIŠ

     Svaki miš:
     - EAT

     Svaki četvrti:
     - + SQUEAK

     Svaki deseti:
     - + CAT MEOW
     ===================================================== */

  useEffect(() => {
    const previousScore =
      previousScoreRef.current;


    if (
      score <=
      previousScore
    ) {
      previousScoreRef.current =
        score;


      if (
        score ===
        0
      ) {
        eatenMouseCountRef.current =
          0;
      }


      return;
    }


    previousScoreRef.current =
      score;


    eatenMouseCountRef.current +=
      1;


    const eatenCount =
      eatenMouseCountRef.current;


    if (!sfxEnabled) {
      return;
    }


    playAudio(
      eatAudioRef,
      EAT_VOLUME
    );


    if (
      eatenCount %
        4 ===
      0
    ) {
      playAudio(
        mouseSqueakAudioRef,
        MOUSE_SQUEAK_VOLUME
      );
    }


    if (
      eatenCount %
        10 ===
      0
    ) {
      playAudio(
        catMeowAudioRef,
        CAT_MEOW_VOLUME
      );
    }
  }, [
    score,
    sfxEnabled,
  ]);


  /* =====================================================
     VRAĆANJE SIRA

     Kada se broj aktivnih originalnih sireva
     poveća, znači da je ispali sir vraćen.

     Zvuk se UVEK pušta od 6. sekunde.
     ===================================================== */

  useEffect(() => {
    const activeCheeseCount =
      cheeses.filter(
        (
          cheese
        ) =>
          cheese.active
      ).length;


    const previousCount =
      previousActiveCheeseCountRef
        .current;


    previousActiveCheeseCountRef.current =
      activeCheeseCount;


    /*
     * Prvo renderovanje:
     * samo zapamtimo trenutno stanje.
     */

    if (
      previousCount ===
      null
    ) {
      return;
    }


    /*
     * Reset igre takođe vraća sve sireve,
     * ali tada faza nije "playing",
     * pa ne želimo zvuk.
     */

    if (
      gamePhase !==
      "playing"
    ) {
      return;
    }


    if (
      activeCheeseCount <=
      previousCount
    ) {
      return;
    }


    playAudioFrom(
      cheeseReturnAudioRef,
      CHEESE_RETURN_VOLUME,
      CHEESE_RETURN_START_TIME
    );
  }, [
    cheeses,
    gamePhase,
    sfxEnabled,
  ]);


  /* =====================================================
     GAME OVER ZVUK
     ===================================================== */

  useEffect(() => {
    if (
      gamePhase !==
      "game-over"
    ) {
      return;
    }


    stopCountInAudio();

    stopGameplayEffects();


    if (!sfxEnabled) {
      return;
    }


    playAudio(
      gameOverAudioRef,
      GAME_OVER_VOLUME
    );
  }, [
    gamePhase,
    sfxEnabled,
  ]);


  /* =====================================================
     GAME OVER FREJMOVI — PRELOAD
     ===================================================== */

  useEffect(() => {
    if (
      typeof Image ===
      "undefined"
    ) {
      return;
    }


    GAME_OVER_FRAMES.forEach(
      (
        src
      ) => {
        const image =
          new Image();

        image.src =
          src;
      }
    );
  }, []);


  useEffect(() => {
    if (
      gamePhase !==
      "game-over"
    ) {
      setGameOverFrameIndex(
        0
      );

      return undefined;
    }


    const duration =
      GAME_OVER_FRAME_DURATIONS[
        gameOverFrameIndex
      ] ||
      180;


    const timer =
      window.setTimeout(
        () => {
          setGameOverFrameIndex(
            (
              current
            ) =>
              (
                current +
                1
              ) %
              GAME_OVER_FRAMES.length
          );
        },
        duration
      );


    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    gamePhase,
    gameOverFrameIndex,
  ]);


  /* =====================================================
     MOBILE LANDSCAPE
     ===================================================== */

  useEffect(() => {
    if (
      typeof window ===
        "undefined" ||
      typeof window.matchMedia !==
        "function"
    ) {
      return undefined;
    }


    const portraitTouchQuery =
      window.matchMedia(
        "(orientation: portrait) and (hover: none) and (pointer: coarse)"
      );


    function pauseIfPortrait() {
      if (
        portraitTouchQuery.matches &&
        gamePhase ===
          "playing"
      ) {
        togglePause();
      }
    }


    pauseIfPortrait();


    if (
      typeof portraitTouchQuery
        .addEventListener ===
      "function"
    ) {
      portraitTouchQuery
        .addEventListener(
          "change",
          pauseIfPortrait
        );


      return () => {
        portraitTouchQuery
          .removeEventListener(
            "change",
            pauseIfPortrait
          );
      };
    }


    portraitTouchQuery
      .addListener(
        pauseIfPortrait
      );


    return () => {
      portraitTouchQuery
        .removeListener(
          pauseIfPortrait
        );
    };
  }, [
    gamePhase,
    togglePause,
  ]);


  function handleStartGame() {
    if (
      typeof window !==
        "undefined" &&
      typeof document !==
        "undefined"
    ) {
      const isTouchDevice =
        typeof window.matchMedia ===
          "function" &&
        window.matchMedia(
          "(hover: none) and (pointer: coarse)"
        ).matches;


      const playfield =
        playfieldRef.current;


      if (
        !isTouchDevice &&
        playfield &&
        typeof playfield.requestPointerLock ===
          "function" &&
        document.pointerLockElement !==
          playfield
      ) {
        try {
          const lockPromise =
            playfield
              .requestPointerLock();


          if (
            lockPromise &&
            typeof lockPromise.catch ===
              "function"
          ) {
            lockPromise.catch(
              () => {}
            );
          }
        } catch {
          // Ako browser odbije lock,
          // igra i dalje radi.
        }
      }
    }


    suppressNextCountdownHitRef.current =
      true;

    lastCountdownRef.current =
      null;


    previousScoreRef.current =
      0;

    eatenMouseCountRef.current =
      0;


    previousActiveCheeseCountRef.current =
      cheeses.filter(
        (
          cheese
        ) =>
          cheese.active
      ).length;


    stopGameOverAudio();


    primeGameplayAudio();

    playCountInHit();


    startGame();
  }


  function handleResetGame() {
    stopCountInAudio();

    stopGameplayAudio();

    stopGameplayEffects();

    stopGameOverAudio();


    suppressNextCountdownHitRef.current =
      false;

    lastCountdownRef.current =
      null;


    previousScoreRef.current =
      0;

    eatenMouseCountRef.current =
      0;


    previousActiveCheeseCountRef.current =
      null;


    resetGame();
  }


  function handleActionPointerDown(
    event
  ) {
    event.preventDefault();

    event.stopPropagation();


    performAction();
  }


  function handleQuit() {
    stopCountInAudio();

    stopGameplayAudio();

    stopGameplayEffects();

    stopGameOverAudio();


    if (
      document.pointerLockElement
    ) {
      document
        .exitPointerLock();
    }


    onExit?.();
  }


  return (
    <main className="flip-cat-arena">
      <section
        className="flip-cat-arena__screen"
        aria-label={`FLIP CAT arena — ${difficulty}`}
      >
        <picture className="flip-cat-arena__picture">
          <source
            media="(orientation: portrait)"
            srcSet="/images/human-one/game/arena-mobile.webp"
          />

          <img
            className="flip-cat-arena__background"
            src="/images/human-one/game/arena-desktop.webp"
            alt=""
            draggable="false"
          />
        </picture>


        <div
          ref={
            playfieldRef
          }
          className={
            isDragging
              ? "flip-cat-arena__playfield flip-cat-arena__playfield--dragging"
              : "flip-cat-arena__playfield"
          }
          {...pointerHandlers}
        >
          {activeHoles.map(
            (
              hole
            ) => (
              <img
                key={
                  hole.id
                }
                className={
                  [
                    "flip-cat-arena__hole",
                    "flip-cat-arena__hole--active",
                    `flip-cat-arena__hole--${hole.side}`,
                  ]
                    .join(
                      " "
                    )
                }
                src={
                  hole.image
                }
                alt=""
                draggable="false"
                style={{
                  "--hole-x":
                    `${hole.x}%`,

                  "--hole-y":
                    `${hole.y}%`,

                  "--hole-mobile-x":
                    `${hole.mobileX}%`,

                  "--hole-mobile-y":
                    `${hole.mobileY}%`,

                  "--hole-width":
                    hole.width,

                  "--hole-mobile-width":
                    hole.mobileWidth,
                }}
              />
            )
          )}


          {cheeses.map(
            (
              cheese
            ) =>
              cheese.active && (
                <img
                  key={
                    cheese.id
                  }
                  className="flip-cat-arena__cheese"
                  src="/images/human-one/game/cheese.webp"
                  alt=""
                  draggable="false"
                  style={{
                    "--cheese-x":
                      cheese.x,

                    "--cheese-y":
                      cheese.y,

                    "--cheese-mobile-x":
                      cheese.mobileX,

                    "--cheese-mobile-y":
                      cheese.mobileY,

                    "--cheese-rotation":
                      cheese.rotation,
                  }}
                />
              )
          )}


          {droppedCheeses.map(
            (
              droppedCheese
            ) => (
              <img
                key={
                  droppedCheese.id
                }
                className="flip-cat-arena__dropped-cheese"
                src="/images/human-one/game/cheese.webp"
                alt=""
                draggable="false"
                style={{
                  left:
                    `${droppedCheese.x}%`,

                  top:
                    `${droppedCheese.y}%`,

                  transform:
                    `translate(-50%, -50%) rotate(${droppedCheese.rotation})`,
                }}
              />
            )
          )}


          {mice.map(
            (
              mouse
            ) => {
              const mouseConfig =
                getMouseTypeConfig(
                  mouse.type
                );


              return (
                <div
                  key={
                    mouse.id
                  }
                  className={
                    [
                      "flip-cat-arena__mouse",
                      `flip-cat-arena__mouse--${mouse.type}`,
                      mouse.isHitFlashing
                        ? "flip-cat-arena__mouse--hit"
                        : "",
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        " "
                      )
                  }
                  style={{
                    left:
                      `${mouse.x}%`,

                    top:
                      `${mouse.y}%`,

                    transform:
                      `translate(-50%, -50%) rotate(${mouse.rotation}deg)`,
                  }}
                >
                  <img
                    className="flip-cat-arena__mouse-frame"
                    src={
                      mouseConfig.frames[
                        mouse.frameIndex
                      ]
                    }
                    alt=""
                    draggable="false"
                  />

                  {mouse.carryingCheese && (
                    <img
                      className="flip-cat-arena__mouse-cheese"
                      src="/images/human-one/game/cheese.webp"
                      alt=""
                      draggable="false"
                    />
                  )}
                </div>
              );
            }
          )}


          <img
            className="flip-cat-arena__cat"
            src={
              catSrc
            }
            alt="Мачка"
            draggable="false"
            style={{
              left:
                `${catPosition.x}%`,

              top:
                `${catPosition.y}%`,
            }}
            onError={
              (
                event
              ) => {
                if (
                  catSrc.endsWith(
                    ".webp"
                  )
                ) {
                  setCatSrc(
                    "/images/human-one/game/cat.png"
                  );


                  return;
                }


                event
                  .currentTarget
                  .style
                  .display =
                  "none";
              }
            }
          />
        </div>


        {showHud && (
          <div
            className="flip-cat-arena__hud"
            aria-label={`Lives ${lives} of ${maxLives}, score ${score}`}
          >
            <div className="flip-cat-arena__lives">
              {Array.from(
                {
                  length:
                    maxLives,
                },
                (
                  _,
                  index
                ) => (
                  <span
                    key={
                      index
                    }
                    className={
                      index <
                      lives
                        ? "flip-cat-arena__heart flip-cat-arena__heart--full"
                        : "flip-cat-arena__heart flip-cat-arena__heart--empty"
                    }
                    aria-hidden="true"
                  >
                    {
                      index <
                      lives
                        ? "♥"
                        : "♡"
                    }
                  </span>
                )
              )}
            </div>


            <div className="flip-cat-arena__score">
              SCORE{" "}
              <strong>
                {
                  String(
                    score
                  )
                    .padStart(
                      5,
                      "0"
                    )
                }
              </strong>
            </div>


            {(gamePhase ===
              "playing" ||
              gamePhase ===
                "paused") && (
              <button
                type="button"
                className="flip-cat-arena__pause"
                onPointerDown={
                  (
                    event
                  ) => {
                    event
                      .stopPropagation();
                  }
                }
                onClick={
                  togglePause
                }
                aria-label={
                  gamePhase ===
                  "paused"
                    ? "Настави игру"
                    : "Паузирај игру"
                }
              >
                {
                  gamePhase ===
                  "paused"
                    ? "▶"
                    : "Ⅱ"
                }
              </button>
            )}
          </div>
        )}


        {gamePhase ===
          "ready" && (
          <button
            type="button"
            className="flip-cat-arena__ready"
            onPointerDown={
              handleStartGame
            }
          >
            <span className="flip-cat-arena__ready-title">
              READY?
            </span>

            <small className="flip-cat-arena__ready-hint">
              click to start
            </small>
          </button>
        )}


        {gamePhase ===
          "countdown" &&
          countdown && (
          <div
            className="flip-cat-arena__countdown"
            aria-live="polite"
          >
            {countdown}
          </div>
        )}


        {gamePhase ===
          "playing" &&
          availableAction && (
          <button
            type="button"
            className={
              [
                "flip-cat-arena__action",
                availableAction ===
                  "eat"
                  ? "flip-cat-arena__action--eat"
                  : "flip-cat-arena__action--return",
              ]
                .join(
                  " "
                )
            }
            onPointerDown={
              handleActionPointerDown
            }
            aria-label={
              actionLabel
            }
          >
            {availableAction ===
              "return-cheese" && (
              <img
                className="flip-cat-arena__action-cheese"
                src="/images/human-one/game/cheese.webp"
                alt=""
                draggable="false"
                aria-hidden="true"
              />
            )}

            <strong>
              {
                actionLabel
              }
            </strong>

            <small>
              КЛИК
            </small>
          </button>
        )}


        {gamePhase ===
          "paused" && (
          <div
            className="flip-cat-arena__pause-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Pause menu"
          >
            <div className="flip-cat-arena__pause-menu">
              <strong className="flip-cat-arena__pause-title">
                PAUSED
              </strong>

              <div className="flip-cat-arena__pause-actions">
                <button
                  type="button"
                  onClick={
                    resumeGame
                  }
                >
                  RESUME
                </button>

                <button
                  type="button"
                  onClick={
                    handleResetGame
                  }
                >
                  RESET GAME
                </button>

                <button
                  type="button"
                  onClick={
                    handleQuit
                  }
                >
                  QUIT
                </button>
              </div>

              <small className="flip-cat-arena__pause-hint">
                SPACE — resume
              </small>
            </div>
          </div>
        )}


        {gamePhase ===
          "game-over" && (
          <div
            className="flip-cat-arena__game-over-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Game over"
          >
            <div className="flip-cat-arena__game-over-panel">
              <div
                className="flip-cat-arena__game-over-animation"
                aria-hidden="true"
              >
                <img
                  className="flip-cat-arena__game-over-frame"
                  src={
                    GAME_OVER_FRAMES[
                      gameOverFrameIndex
                    ]
                  }
                  alt=""
                  draggable="false"
                />
              </div>

              <div className="flip-cat-arena__game-over-score">
                SCORE{" "}
                <strong>
                  {
                    String(
                      score
                    )
                      .padStart(
                        5,
                        "0"
                      )
                  }
                </strong>
              </div>

              <p className="flip-cat-arena__game-over-message">
                НЕ МОЖЕ СЕ ПРАВИТИ ГИБАНИЦА ОД ЈЕДНОГ СИРА
              </p>

              <div className="flip-cat-arena__game-over-actions">
                <button
                  type="button"
                  className="flip-cat-arena__game-over-button flip-cat-arena__game-over-button--restart"
                  onClick={
                    handleResetGame
                  }
                >
                  RESTART GAME
                </button>

                <button
                  type="button"
                  className="flip-cat-arena__game-over-button"
                  onClick={
                    handleQuit
                  }
                >
                  QUIT
                </button>
              </div>
            </div>
          </div>
        )}


        {gamePhase !==
          "game-over" && (
          <button
            type="button"
            className="flip-cat-arena__back"
            onClick={
              handleQuit
            }
          >
            ← MENU
          </button>
        )}
      </section>
    </main>
  );
}


export default FlipCatArena;