import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useBlog,
} from "../context/BlogContext";

import {
  useLanguage,
} from "../i18n/LanguageContext";

import LanguageMenuControl
  from "../components/LanguageSwitcher/LanguageMenuControl";

import {
  prepareSkateWorldTransition,
  startSkateWorldTransition,
} from "../transitions/skateWorldTransition";

import {
  prepareObalaTransition,
  startObalaTransition,
} from "../transitions/obalaTransition.js";

import {
  preparePosterTransition,
  startPosterTransition,
} from "../transitions/posterTransition.js";

import {
  prepareAboutPosterTransition,
  startAboutPosterTransition,
} from "../transitions/aboutPosterTransition.js";

import {
  prepareSekiRoomExitTransition,
  startSekiRoomExitTransition,
} from "../transitions/sekiRoomTransition.js";

import {
  prepareGameConsoleTransition,
  startGameConsoleTransition,
} from "../transitions/gameConsoleTransition.js";

import "../styles/pages/Home.css";


const BOOMBOX_VOLUME =
  0.38;


const BOOMBOX_AUDIO_CACHE_VERSION =
  "20260909-2";


const BOOMBOX_TOUCH_PLAY_DELAY_MS =
  100;


const BOOMBOX_TOUCH_STAY_THRESHOLD_MS =
  800;



const BOOMBOX_TRACKS = [
  { id: "jazz", src: "/audio/human-one/01-jazz.mp3", startRatio: 0.5, frequency: "88.3" },
  { id: "rock", src: "/audio/human-one/02-rock.mp3", startSeconds: 42, frequency: "90.1" },
  { id: "reggae", src: "/audio/human-one/03-reggae.mp3", startRatio: 0.5, frequency: "91.7" },
  { id: "nu-metal", src: "/audio/human-one/04-nu-metal.mp3", startSeconds: 100, frequency: "93.4" },
  { id: "hip-hop", src: "/audio/human-one/05-hip-hop.mp3", startSeconds: 5, frequency: "95.2" },
  { id: "punk", src: "/audio/human-one/06-punk.mp3", startSeconds: 43, frequency: "97.1" },
  { id: "funk", src: "/audio/human-one/07-funk.mp3", startSeconds: 40, frequency: "99.3" },
  { id: "dnb", src: "/audio/human-one/08-dnb.mp3", startSeconds: 100, frequency: "101.6" },
  { id: "delta-blues", src: "/audio/human-one/09-delta-blues.mp3", startSeconds: 130, frequency: "103.7" },
  { id: "dubstep", src: "/audio/human-one/10-dubstep.mp3", startSeconds: 35, frequency: "105.4" },
  { id: "moonlight-and-roses", src: "/audio/human-one/11-moonlight-and-roses.mp3", startSeconds: 60, frequency: "107.2" },
];


function getBoomboxTrackSrc(track) {
  return `${track.src}?v=${BOOMBOX_AUDIO_CACHE_VERSION}`;
}


const BELGRADE_CLOCK_FORMATTER =
  new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone:
        "Europe/Belgrade",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hourCycle:
        "h23",
    }
  );


function getRoomPeriod(hour) {
  if (
    hour >= 5 &&
    hour < 11
  ) {
    return "morning";
  }

  if (
    hour >= 11 &&
    hour < 16
  ) {
    return "day";
  }

  if (
    hour >= 16 &&
    hour < 20
  ) {
    return "evening";
  }

  return "night";
}


function getBelgradeClockState() {
  const parts =
    BELGRADE_CLOCK_FORMATTER
      .formatToParts(
        new Date()
      );

  const hourPart =
    parts.find(
      (part) =>
        part.type === "hour"
    )?.value || "00";

  const minutePart =
    parts.find(
      (part) =>
        part.type === "minute"
    )?.value || "00";

  const hour =
    Number(
      hourPart
    );

  return {
    time:
      `${hourPart}:${minutePart}`,

    period:
      getRoomPeriod(
        Number.isFinite(hour)
          ? hour
          : 0
      ),
  };
}


const SEGMENT_DIGIT_MAP = {
  "0": ["a", "b", "c", "d", "e", "f"],
  "1": ["b", "c"],
  "2": ["a", "b", "g", "e", "d"],
  "3": ["a", "b", "g", "c", "d"],
  "4": ["f", "g", "b", "c"],
  "5": ["a", "f", "g", "c", "d"],
  "6": ["a", "f", "g", "e", "c", "d"],
  "7": ["a", "b", "c"],
  "8": ["a", "b", "c", "d", "e", "f", "g"],
  "9": ["a", "b", "c", "d", "f", "g"],
};


function SevenSegmentGlyph({
  character,
  size = "room",
}) {
  if (character === ":") {
    return (
      <span
        className={
          `human-one-room__seven-segment-colon ` +
          `human-one-room__seven-segment-colon--${size}`
        }
        aria-hidden="true"
      >
        <span className="human-one-room__seven-segment-colon-dot" />
        <span className="human-one-room__seven-segment-colon-dot" />
      </span>
    );
  }

  const activeSegments =
    SEGMENT_DIGIT_MAP[character] || [];

  return (
    <span
      className={
        `human-one-room__seven-segment-digit ` +
        `human-one-room__seven-segment-digit--${size}`
      }
      aria-hidden="true"
    >
      {[
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
      ].map((segmentName) => (
        <span
          key={segmentName}
          className={
            activeSegments.includes(
              segmentName
            )
              ? `human-one-room__segment ` +
                `human-one-room__segment--${segmentName} ` +
                `human-one-room__segment--on`
              : `human-one-room__segment ` +
                `human-one-room__segment--${segmentName}`
          }
        />
      ))}
    </span>
  );
}


function SevenSegmentClock({
  time,
  size = "room",
}) {
  return (
    <span
      className={
        `human-one-room__seven-segment-clock ` +
        `human-one-room__seven-segment-clock--${size}`
      }
      aria-hidden="true"
    >
      {time.split("").map(
        (character, index) => (
          <SevenSegmentGlyph
            key={`${character}-${index}`}
            character={character}
            size={size}
          />
        )
      )}
    </span>
  );
}


function Home() {
  const navigate =
    useNavigate();

  const {
    siteSettings,
  } = useBlog();

  const {
    t,
  } = useLanguage();


  /* =====================================
     PRVA LIČNOST
     ===================================== */

  const characterOneName =
    siteSettings
      .character_one_name ||
    "ЧОВЕК 1";

  const characterOneImage =
    siteSettings
      .character_one_image_url ||
    siteSettings
      .entry_image_url ||
    "";


  /* =====================================
     SHARED-ELEMENT TRANSITION — UNWANTED
     ===================================== */

  const profilePhotoRef =
    useRef(null);


  /* =====================================
     ZVUČNIK / RADIO — REFERENCE
     ===================================== */

  const boomboxAudioRef =
    useRef(null);

  const boomboxHoverRef =
    useRef(false);

  const audioUnlockedRef =
    useRef(false);

  const currentTrackIndexRef =
    useRef(-1);

  const soundEnabledRef =
    useRef(true);


  const boomboxTouchTimerRef =
    useRef(null);

  const boomboxTouchStartTimeRef =
    useRef(0);

  const boomboxTouchPointerIdRef =
    useRef(null);

  const boomboxTouchCanceledRef =
    useRef(false);

  const boomboxIgnoreClickUntilRef =
    useRef(0);

  const boomboxButtonRef =
    useRef(null);

  const boomboxPlaybackTokenRef =
    useRef(0);


  /* =====================================
     FLIP CAT KONZOLA — MOBILE TOUCH
     ===================================== */

  const gameConsoleTouchPointerIdRef =
    useRef(null);

  const gameConsoleIgnoreClickUntilRef =
    useRef(0);


  const [
    soundEnabled,
    setSoundEnabled,
  ] = useState(() => {
    const saved =
      localStorage.getItem(
        "human-one-sound"
      );

    return saved !== "off";
  });


  const [
    currentFrequency,
    setCurrentFrequency,
  ] = useState(
    BOOMBOX_TRACKS[0].frequency
  );


  const [
    showCategoryPicker,
    setShowCategoryPicker,
  ] = useState(false);


  const [
    boomboxTouchPlaying,
    setBoomboxTouchPlaying,
  ] = useState(false);


  const [
    gameConsoleTouchActive,
    setGameConsoleTouchActive,
  ] = useState(false);


  const [
    touchHoverObject,
    setTouchHoverObject,
  ] = useState(null);


  const [
    belgradeClock,
    setBelgradeClock,
  ] = useState(
    getBelgradeClockState
  );


  useEffect(() => {
    function updateClock() {
      const nextClock =
        getBelgradeClockState();

      setBelgradeClock(
        (previousClock) => {
          if (
            previousClock.time ===
              nextClock.time &&
            previousClock.period ===
              nextClock.period
          ) {
            return previousClock;
          }

          return nextClock;
        }
      );
    }


    updateClock();

    const intervalId =
      window.setInterval(
        updateClock,
        1000
      );


    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, []);


  useEffect(() => {
    soundEnabledRef.current =
      soundEnabled;
  }, [soundEnabled]);


  useEffect(() => {
    return () => {
      if (
        boomboxTouchTimerRef.current
      ) {
        clearTimeout(
          boomboxTouchTimerRef.current
        );
      }
    };
  }, []);


  /* =====================================
     POMOĆNE RADIO FUNKCIJE
     ===================================== */

  function deviceHasRealHover() {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return false;
    }

    return window
      .matchMedia(
        "(hover: hover) and (pointer: fine)"
      )
      .matches;
  }


  function isBoomboxPlaybackAllowed() {
    if (
      !boomboxHoverRef.current ||
      !soundEnabledRef.current
    ) {
      return false;
    }

    /*
     * Dok je touch prst aktivan na zvučniku,
     * playback je dozvoljen bez desktop hovera.
     */
    if (
      boomboxTouchPointerIdRef.current !==
      null
    ) {
      return true;
    }

    /*
     * Desktop radio sme da radi samo na uređaju
     * koji zaista ima precizan hover pointer.
     * Ovo sprečava telefone u landscape modu da
     * upadnu u emulirani / sticky hover.
     */
    if (!deviceHasRealHover()) {
      return false;
    }

    const button =
      boomboxButtonRef.current;

    return Boolean(
      button &&
      typeof button.matches ===
        "function" &&
      button.matches(":hover")
    );
  }


  function getRandomTrackIndex() {
    const previousIndex =
      currentTrackIndexRef.current;

    if (
      BOOMBOX_TRACKS.length <= 1
    ) {
      return 0;
    }

    let nextIndex =
      previousIndex;

    while (
      nextIndex === previousIndex
    ) {
      nextIndex =
        Math.floor(
          Math.random() *
          BOOMBOX_TRACKS.length
        );
    }

    return nextIndex;
  }


  function getTrackStartTime(
    audio,
    track
  ) {
    if (
      !Number.isFinite(
        audio.duration
      ) ||
      audio.duration <= 0
    ) {
      return 0;
    }

    let desiredStart = 0;

    if (
      Number.isFinite(
        track.startRatio
      )
    ) {
      desiredStart =
        audio.duration *
        track.startRatio;
    } else if (
      Number.isFinite(
        track.startSeconds
      )
    ) {
      desiredStart =
        track.startSeconds;
    }

    const latestSafeStart =
      Math.max(
        0,
        audio.duration - 0.25
      );

    return Math.min(
      Math.max(
        0,
        desiredStart
      ),
      latestSafeStart
    );
  }


  function resetCurrentTrackPosition() {
    const audio =
      boomboxAudioRef.current;

    const trackIndex =
      currentTrackIndexRef.current;

    if (
      !audio ||
      trackIndex < 0
    ) {
      return;
    }

    const track =
      BOOMBOX_TRACKS[
        trackIndex
      ];

    if (
      !Number.isFinite(
        audio.duration
      ) ||
      audio.duration <= 0
    ) {
      return;
    }

    audio.currentTime =
      getTrackStartTime(
        audio,
        track
      );
  }


  function playTrack(
    trackIndex
  ) {
    const audio =
      boomboxAudioRef.current;

    if (!audio) {
      return;
    }

    const track =
      BOOMBOX_TRACKS[
        trackIndex
      ];

    if (!track) {
      return;
    }

    const playbackToken =
      boomboxPlaybackTokenRef.current +
      1;

    boomboxPlaybackTokenRef.current =
      playbackToken;

    audio.pause();

    currentTrackIndexRef.current =
      trackIndex;

    setCurrentFrequency(
      track.frequency
    );

    audio.src =
      getBoomboxTrackSrc(
        track
      );

    audio.load();


    function beginTrack() {
      if (
        boomboxPlaybackTokenRef.current !==
          playbackToken ||
        currentTrackIndexRef.current !==
          trackIndex
      ) {
        return;
      }

      audio.currentTime =
        getTrackStartTime(
          audio,
          track
        );

      if (!isBoomboxPlaybackAllowed()) {
        return;
      }

      audio.volume =
        BOOMBOX_VOLUME;

      audio
        .play()
        .catch(
          (error) => {
            console.log(
              "Radio još nije pokrenut:",
              error
            );
          }
        );
    }


    if (
      audio.readyState >= 1 &&
      Number.isFinite(
        audio.duration
      )
    ) {
      beginTrack();
    } else {
      audio.addEventListener(
        "loadedmetadata",
        beginTrack,
        {
          once: true,
        }
      );
    }
  }


  function playRandomTrack() {
    const nextTrackIndex =
      getRandomTrackIndex();

    playTrack(
      nextTrackIndex
    );
  }


  /* =====================================
     PRIPREMA RADIO SISTEMA
     ===================================== */

  useEffect(() => {
    const audio =
      new Audio(
        getBoomboxTrackSrc(
          BOOMBOX_TRACKS[0]
        )
      );

    audio.preload =
      "metadata";

    audio.loop =
      false;

    audio.volume =
      BOOMBOX_VOLUME;


    function handleTrackEnded() {
      if (!isBoomboxPlaybackAllowed()) {
        stopBoombox();

        return;
      }

      playRandomTrack();
    }


    audio.addEventListener(
      "ended",
      handleTrackEnded
    );


    boomboxAudioRef.current =
      audio;


    audio.load();


    return () => {
      boomboxHoverRef.current =
        false;

      boomboxPlaybackTokenRef.current +=
        1;

      audio.pause();

      audio.removeEventListener(
        "ended",
        handleTrackEnded
      );

      boomboxAudioRef.current =
        null;
    };
  }, []);


  /* =====================================
     OTKLJUČAVANJE AUDIO SISTEMA
     ===================================== */

  async function unlockBoomboxAudio() {
    if (
      audioUnlockedRef.current
    ) {
      return;
    }

    const audio =
      boomboxAudioRef.current;

    if (!audio) {
      return;
    }


    const previousVolume =
      audio.volume;

    const playbackTokenBeforeUnlock =
      boomboxPlaybackTokenRef.current;


    try {
      audio.volume =
        0.001;

      await audio.play();

      /*
       * Ako je u međuvremenu korisnik već
       * pokrenuo pravi radio track, unlock ne
       * sme naknadno da ga pauzira ili resetuje.
       */
      if (
        boomboxPlaybackTokenRef.current !==
        playbackTokenBeforeUnlock
      ) {
        audio.volume =
          previousVolume;

        audioUnlockedRef.current =
          true;

        return;
      }

      audio.pause();

      audio.currentTime =
        0;

      audio.volume =
        previousVolume;

      audioUnlockedRef.current =
        true;
    } catch (error) {
      audio.volume =
        previousVolume;

      console.log(
        "Audio još nije otključan:",
        error
      );
    }
  }


  /* =====================================
     HOVER — POKRENI NASUMIČNU STANICU
     ===================================== */

  function startBoombox() {
    const audio =
      boomboxAudioRef.current;

    if (
      boomboxHoverRef.current &&
      audio &&
      !audio.paused
    ) {
      return;
    }

    boomboxHoverRef.current =
      true;


    if (!soundEnabledRef.current) {
      return;
    }


    playRandomTrack();
  }


  /* =====================================
     HOVER JE ZAVRŠEN
     ===================================== */

  function stopBoombox() {
    boomboxHoverRef.current =
      false;

    boomboxPlaybackTokenRef.current +=
      1;


    const audio =
      boomboxAudioRef.current;

    if (!audio) {
      return;
    }


    audio.pause();


    resetCurrentTrackPosition();
  }


  function handleBoomboxPointerEnter(
    event
  ) {
    if (
      event.pointerType !== "mouse" ||
      !deviceHasRealHover()
    ) {
      return;
    }

    startBoombox();
  }


  function handleBoomboxPointerLeave(
    event
  ) {
    if (
      event.pointerType !== "mouse" ||
      !deviceHasRealHover()
    ) {
      return;
    }

    stopBoombox();
  }


  /* =====================================
     RADIO FAILSAFE — ROTACIJA / TAB / FOKUS
     ===================================== */

  useEffect(() => {
    function hardStopBoombox() {
      clearBoomboxTouchTimer();

      boomboxTouchCanceledRef.current =
        true;

      boomboxTouchPointerIdRef.current =
        null;

      setBoomboxTouchPlaying(
        false
      );

      stopBoombox();
    }


    function handleVisibilityChange() {
      if (document.hidden) {
        hardStopBoombox();
      }
    }


    const screenOrientation =
      window.screen?.orientation;


    window.addEventListener(
      "blur",
      hardStopBoombox
    );

    window.addEventListener(
      "pagehide",
      hardStopBoombox
    );

    window.addEventListener(
      "orientationchange",
      hardStopBoombox
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    if (
      screenOrientation &&
      typeof screenOrientation
        .addEventListener ===
        "function"
    ) {
      screenOrientation.addEventListener(
        "change",
        hardStopBoombox
      );
    }


    return () => {
      window.removeEventListener(
        "blur",
        hardStopBoombox
      );

      window.removeEventListener(
        "pagehide",
        hardStopBoombox
      );

      window.removeEventListener(
        "orientationchange",
        hardStopBoombox
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      if (
        screenOrientation &&
        typeof screenOrientation
          .removeEventListener ===
          "function"
      ) {
        screenOrientation.removeEventListener(
          "change",
          hardStopBoombox
        );
      }
    };
  }, []);


  /* =====================================
     MOBILE TOUCH — ZVUČNIK

     Kratak tap:
     - nema muzike;
     - ulazi u muzičku sekciju.

     Držanje 0.1s:
     - kreće nasumična pesma.

     Puštanje pre 0.8s:
     - ulazi u muzičku sekciju.

     Držanje 0.8s ili duže:
     - po puštanju ostaje u sobi;
     - sledeće držanje bira novu pesmu.
     ===================================== */

  function clearBoomboxTouchTimer() {
    if (
      !boomboxTouchTimerRef.current
    ) {
      return;
    }

    clearTimeout(
      boomboxTouchTimerRef.current
    );

    boomboxTouchTimerRef.current =
      null;
  }


  function beginBoomboxTouch(
    event
  ) {
    if (
      event.pointerType !== "touch"
    ) {
      return;
    }


    event.preventDefault();


    clearBoomboxTouchTimer();

    boomboxTouchStartTimeRef.current =
      performance.now();

    boomboxTouchPointerIdRef.current =
      event.pointerId;

    boomboxTouchCanceledRef.current =
      false;

    boomboxIgnoreClickUntilRef.current =
      Date.now() + 800;

    setBoomboxTouchPlaying(
      false
    );


    try {
      event.currentTarget
        .setPointerCapture(
          event.pointerId
        );
    } catch {
      // Na nekim browserima je implicitni
      // pointer capture već aktivan.
    }


    boomboxTouchTimerRef.current =
      setTimeout(
        () => {
          if (
            boomboxTouchCanceledRef.current ||
            boomboxTouchPointerIdRef.current !==
              event.pointerId
          ) {
            return;
          }

          setBoomboxTouchPlaying(
            true
          );

          startBoombox();
        },
        BOOMBOX_TOUCH_PLAY_DELAY_MS
      );
  }


  function finishBoomboxTouch(
    event,
    canceled = false
  ) {
    if (
      event.pointerType !== "touch" ||
      boomboxTouchPointerIdRef.current !==
        event.pointerId
    ) {
      return;
    }


    event.preventDefault();


    const holdDuration =
      performance.now() -
      boomboxTouchStartTimeRef.current;


    clearBoomboxTouchTimer();


    try {
      if (
        event.currentTarget
          .hasPointerCapture(
            event.pointerId
          )
      ) {
        event.currentTarget
          .releasePointerCapture(
            event.pointerId
          );
      }
    } catch {
      // Nema šta da se oslobodi.
    }


    boomboxIgnoreClickUntilRef.current =
      Date.now() + 800;


    const interactionCanceled =
      canceled ||
      boomboxTouchCanceledRef.current;


    boomboxTouchPointerIdRef.current =
      null;

    boomboxTouchCanceledRef.current =
      false;


    setBoomboxTouchPlaying(
      false
    );

    stopBoombox();


    if (interactionCanceled) {
      return;
    }


    if (
      holdDuration >=
      BOOMBOX_TOUCH_STAY_THRESHOLD_MS
    ) {
      return;
    }


    handleBoombox();
  }


  function cancelBoomboxTouch(
    event
  ) {
    finishBoomboxTouch(
      event,
      true
    );
  }


  function handleBoomboxClick(
    event
  ) {
    if (
      Date.now() <
      boomboxIgnoreClickUntilRef.current
    ) {
      event.preventDefault();

      return;
    }


    handleBoombox();
  }


  function preventBoomboxContextMenu(
    event
  ) {
    event.preventDefault();
  }


  /* =====================================
     SFX ON / OFF
     ===================================== */

  function toggleSound() {
    const nextValue =
      !soundEnabled;


    soundEnabledRef.current =
      nextValue;


    setSoundEnabled(
      nextValue
    );


    localStorage.setItem(
      "human-one-sound",
      nextValue
        ? "on"
        : "off"
    );


    if (!nextValue) {
      stopBoombox();
    }
  }


  /* =====================================
     ZVUKOVI ZA OSTALE PREDMETE
     ===================================== */

  function playSoundEffect(
    fileName,
    volume = 0.5
  ) {
    if (!soundEnabled) {
      return;
    }

    const audio =
      new Audio(
        `/audio/human-one/${fileName}`
      );

    audio.volume =
      volume;

    audio.play().catch(
      () => {}
    );
  }


  /* =====================================
     TRANSITION PRELOAD — SAMO NA NAMERU

     Transition asseti i odgovarajući route
     chunk pripremaju se tek na hover, touch
     ili kao fallback neposredno pre klika.
     ===================================== */

  function prepareOnDesktopPointerEnter(
    event,
    prepare
  ) {
    if (
      event.pointerType !== "mouse" ||
      !deviceHasRealHover()
    ) {
      return;
    }

    prepare();
  }


  function prepareSkate() {
    try {
      prepareSkateWorldTransition();
    } catch {
      // Preload ne sme da utiče na rad sobe.
    }

    import(
      "./HumanOneSkate"
    ).catch(
      () => {}
    );
  }


  function prepareObala() {
    try {
      prepareObalaTransition();
    } catch {
      // Preload ne sme da utiče na rad sobe.
    }

    import(
      "./HumanOneObala"
    ).catch(
      () => {}
    );
  }


  function preparePosters() {
    try {
      preparePosterTransition();
    } catch {
      // Preload ne sme da utiče na rad sobe.
    }

    import(
      "./HumanOnePosters"
    ).catch(
      () => {}
    );
  }


  function prepareAbout() {
    try {
      prepareAboutPosterTransition();
    } catch {
      // Preload ne sme da utiče na rad sobe.
    }

    import(
      "./HumanOneAbout"
    ).catch(
      () => {}
    );
  }


  function prepareGame() {
    try {
      prepareGameConsoleTransition();
    } catch {
      // Preload ne sme da utiče na rad sobe.
    }

    import(
      "./HumanOneGame"
    ).catch(
      () => {}
    );
  }


  /* =====================================
     KLIKABILNI ELEMENTI
     ===================================== */

  function handleBack() {
    stopBoombox();

    try {
      prepareSekiRoomExitTransition();
    } catch {
      // Preload ne sme da spreči izlaz iz sobe.
    }

    startSekiRoomExitTransition({
      sourceElement:
        profilePhotoRef.current,

      navigate: () => {
        navigate(
          "/izbor"
        );
      },
    });
  }


  function handleSkateboard(
    event
  ) {
    prepareSkate();

    stopBoombox();

    startSkateWorldTransition({
      sourceElement:
        event.currentTarget,

      navigate: () => {
        navigate(
          "/autor/covek/skejt"
        );
      },
    });
  }


  function handleBoombox() {
    stopBoombox();

    navigate(
      "/autor/covek/muzika"
    );
  }


  function handleGuitar(
    event
  ) {
    prepareObala();

    stopBoombox();

    const sourceElement =
      event?.currentTarget ||
      document.querySelector(
        '[data-obala-transition-target="room-guitar"]'
      );

    startObalaTransition({
      sourceElement,

      navigate: () => {
        navigate(
          "/autor/covek/obala"
        );
      },
    });
  }


  function handlePosters(
    event
  ) {
    preparePosters();

    stopBoombox();

    const sourceElement =
      event?.currentTarget ||
      document.querySelector(
        '[data-poster-transition-target="room-posters"]'
      );


    startPosterTransition({
      sourceElement,

      navigate: () => {
        navigate(
          "/autor/covek/posteri"
        );
      },
    });
  }


  function handleProfilePoster(
    event
  ) {
    prepareAbout();

    stopBoombox();

    const sourceElement =
      event?.currentTarget ||
      document.querySelector(
        '[data-about-poster-transition-target="room-profile-poster"]'
      );


    startAboutPosterTransition({
      sourceElement,

      navigate: () => {
        navigate(
          "/autor/covek/o-meni"
        );
      },
    });
  }


  function handleMailbox() {
    stopBoombox();

    navigate(
      "/autor/covek/poruka"
    );
  }


  function handleClock() {
    stopBoombox();

    navigate(
      "/autor/covek/doskocice"
    );
  }


  function handleGame(
    event
  ) {
    prepareGame();

    stopBoombox();

    const sourceElement =
      event?.currentTarget ||
      document.querySelector(
        '[data-game-console-transition-target="room-console"]'
      );

    startGameConsoleTransition({
      sourceElement,

      navigate: () => {
        navigate(
          "/autor/covek/igra"
        );
      },
    });
  }


  /* =====================================
     MOBILE TOUCH — FLIP CAT KONZOLA

     - Dok držiš konzolu, ekran se pali
       istom CRT animacijom kao na desktopu.
     - Malo pomeranje prsta ne prekida držanje.
     - Kad pustiš, uvek ulaziš u igru.
     ===================================== */

  function beginGameConsoleTouch(
    event
  ) {
    if (
      event.pointerType !== "touch"
    ) {
      return;
    }


    prepareGame();


    event.preventDefault();

    gameConsoleTouchPointerIdRef.current =
      event.pointerId;

    gameConsoleIgnoreClickUntilRef.current =
      Date.now() + 1000;

    setGameConsoleTouchActive(
      true
    );


    try {
      event.currentTarget
        .setPointerCapture(
          event.pointerId
        );
    } catch {
      // Na nekim browserima je implicitni
      // pointer capture već aktivan.
    }
  }


  function finishGameConsoleTouch(
    event
  ) {
    if (
      event.pointerType !== "touch" ||
      gameConsoleTouchPointerIdRef.current !==
        event.pointerId
    ) {
      return;
    }


    event.preventDefault();

    setGameConsoleTouchActive(
      false
    );


    try {
      if (
        event.currentTarget
          .hasPointerCapture(
            event.pointerId
          )
      ) {
        event.currentTarget
          .releasePointerCapture(
            event.pointerId
          );
      }
    } catch {
      // Nema šta da se oslobodi.
    }


    gameConsoleTouchPointerIdRef.current =
      null;

    gameConsoleIgnoreClickUntilRef.current =
      Date.now() + 800;

    handleGame();
  }


  function cancelGameConsoleTouch(
    event
  ) {
    if (
      event.pointerType !== "touch" ||
      gameConsoleTouchPointerIdRef.current !==
        event.pointerId
    ) {
      return;
    }


    setGameConsoleTouchActive(
      false
    );

    gameConsoleTouchPointerIdRef.current =
      null;
  }


  function handleGameConsoleClick(
    event
  ) {
    if (
      Date.now() <
      gameConsoleIgnoreClickUntilRef.current
    ) {
      event.preventDefault();

      return;
    }


    handleGame(
      event
    );
  }


  /* =====================================
     MOBILE TOUCH — DESKTOP HOVER EFEKAT

     Za skejt, gitaru, postere i UNWANTED:
     - dodir / držanje = isti vizuelni efekat
       kao desktop hover;
     - puštanje = efekat nestaje;
     - normalni click ostaje netaknut i vodi
       na postojeću stranicu.
     ===================================== */

  function beginTouchHoverObject(
    event,
    objectName
  ) {
    if (
      event.pointerType !== "touch"
    ) {
      return;
    }


    if (objectName === "skateboard") {
      prepareSkate();
    } else if (objectName === "guitar") {
      prepareObala();
    } else if (objectName === "posters") {
      preparePosters();
    } else if (
      objectName ===
      "profile-poster"
    ) {
      prepareAbout();
    }


    setTouchHoverObject(
      objectName
    );


    try {
      event.currentTarget
        .setPointerCapture(
          event.pointerId
        );
    } catch {
      // Na nekim browserima je implicitni
      // pointer capture već aktivan.
    }
  }


  function finishTouchHoverObject(
    event
  ) {
    if (
      event.pointerType !== "touch"
    ) {
      return;
    }


    setTouchHoverObject(
      null
    );


    try {
      if (
        event.currentTarget
          .hasPointerCapture(
            event.pointerId
          )
      ) {
        event.currentTarget
          .releasePointerCapture(
            event.pointerId
          );
      }
    } catch {
      // Nema šta da se oslobodi.
    }
  }


  function openCategoryPicker() {
    stopBoombox();

    setShowCategoryPicker(
      true
    );
  }


  function closeCategoryPicker() {
    setShowCategoryPicker(
      false
    );
  }


  function handleCategorySelection(
    callback
  ) {
    setShowCategoryPicker(
      false
    );

    callback();
  }


  return (
    <main
      className={
        `human-one-room human-one-room--${belgradeClock.period}`
      }
      data-room-period={
        belgradeClock.period
      }
      onPointerDownCapture={
        unlockBoomboxAudio
      }
    >
      <div className="human-one-room__stage">
        {/* =====================================
            OSNOVNA SCENA
            ===================================== */}

        <picture className="human-one-room__background-picture">
          <source
            media="(max-width: 700px)"
            srcSet="/images/human-one/room-bg-mobile.webp"
          />

          <img
            className="human-one-room__background"
            src="/images/human-one/room-bg.webp"
            alt=""
            draggable="false"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </picture>


        {/* =====================================
            BACK
            ===================================== */}

        <button
          type="button"
          className="
            human-one-room__object
            human-one-room__back
          "
          onClick={
            handleBack
          }
          aria-label={t("room.backToSelect")}
        >
          <img
            src="/images/human-one/back-sign.webp"
            alt=""
            draggable="false"
          />
        </button>


        {/* =====================================
            MOBILE — BIRAJ KATEGORIJU
            ===================================== */}

        <button
          type="button"
          className="human-one-room__category-button"
          onClick={
            openCategoryPicker
          }
          aria-label={t("room.chooseCategory")}
          aria-expanded={
            showCategoryPicker
          }
          aria-controls="human-one-mobile-category-picker"
        >
          <span aria-hidden="true">
            ☰
          </span>
        </button>


        {/* =====================================
            DIGITALNI SAT — BRZE DOSKOČICE
            ===================================== */}

        <button
          type="button"
          className="
            human-one-room__object
            human-one-room__clock
          "
          onClick={
            handleClock
          }
          aria-label={
            `Брзе доскочице — ${belgradeClock.time}`
          }
        >
          <img
            className="human-one-room__clock-shell"
            src="/images/human-one/digital-clock.webp"
            alt=""
            draggable="false"
          />

          <span
            className="human-one-room__clock-display"
            aria-hidden="true"
          >
            <SevenSegmentClock
              time={belgradeClock.time}
              size="room"
            />
          </span>
        </button>


        {/* =====================================
            SKEJT
            ===================================== */}

        <button
          type="button"
          className={
            touchHoverObject ===
            "skateboard"
              ? `
                human-one-room__object
                human-one-room__skateboard
                human-one-room__touch-hover-active
              `
              : `
                human-one-room__object
                human-one-room__skateboard
              `
          }
          onPointerEnter={
            (event) =>
              prepareOnDesktopPointerEnter(
                event,
                prepareSkate
              )
          }
          onPointerDown={
            (event) =>
              beginTouchHoverObject(
                event,
                "skateboard"
              )
          }
          onPointerUp={
            finishTouchHoverObject
          }
          onPointerCancel={
            finishTouchHoverObject
          }
          onClick={
            handleSkateboard
          }
          aria-label={t("room.skate")}
        >
          <img
            data-skate-transition-target="room-skateboard"
            src="/images/human-one/skateboard.webp"
            alt=""
            draggable="false"
          />
        </button>


        {/* =====================================
            ZVUČNIK
            ===================================== */}

        <button
          ref={
            boomboxButtonRef
          }
          type="button"
          className={
            boomboxTouchPlaying
              ? `
                human-one-room__object
                human-one-room__boombox
                human-one-room__boombox--touch-playing
              `
              : `
                human-one-room__object
                human-one-room__boombox
              `
          }
          onPointerEnter={
            handleBoomboxPointerEnter
          }
          onPointerLeave={
            handleBoomboxPointerLeave
          }
          onPointerDown={
            beginBoomboxTouch
          }
          onPointerUp={
            (event) =>
              finishBoomboxTouch(
                event
              )
          }
          onPointerCancel={
            cancelBoomboxTouch
          }
          onContextMenu={
            preventBoomboxContextMenu
          }
          onClick={
            handleBoomboxClick
          }
          aria-label={t("room.boombox")}
        >
          <img
            src="/images/human-one/boombox.webp"
            alt=""
            draggable="false"
          />

          <span
            className="human-one-room__boombox-frequency"
            aria-hidden="true"
            style={{
              position:
                "absolute",

              left:
                "44%",

              rotate:
                "6deg",

              top:
                "49%",

              zIndex:
                4,

              transform:
                "translate(-50%, -50%)",

              display:
                "inline-flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              minWidth:
                "44px",

              padding:
                "2px 6px 3px",

              background:
                "rgba(0, 0, 0, 0.88)",

              border:
                "1px solid rgba(90, 255, 90, 0.18)",

              borderRadius:
                "3px",

              boxShadow:
                "inset 0 0 8px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.35)",

              color:
                "#8cff66",

              fontFamily:
                '"Courier New", monospace',

              fontSize:
                "clamp(8px, 0.85vw, 14px)",

              fontWeight:
                900,

              lineHeight:
                1,

              letterSpacing:
                "0.06em",

              textShadow:
                "0 0 5px rgba(140, 255, 102, 0.85)",

              whiteSpace:
                "nowrap",

              pointerEvents:
                "none",
            }}
          >
            {currentFrequency}
          </span>


          {/* =================================
              ŠARENE NOTE
              ================================= */}

          <span
            className="human-one-room__notes"
            aria-hidden="true"
          >
            <i
              style={{
                "--note-left":
                  "18%",

                "--note-drift":
                  "-45px",

                "--note-rise":
                  "105px",

                "--note-delay":
                  "0s",

                "--note-size":
                  "26px",

                "--note-color":
                  "#ff4b4b",

                "--note-rotate":
                  "-18deg",
              }}
            >
              ♪
            </i>


            <i
              style={{
                "--note-left":
                  "35%",

                "--note-drift":
                  "-18px",

                "--note-rise":
                  "145px",

                "--note-delay":
                  "0.25s",

                "--note-size":
                  "34px",

                "--note-color":
                  "#ffd84d",

                "--note-rotate":
                  "16deg",
              }}
            >
              ♫
            </i>


            <i
              style={{
                "--note-left":
                  "53%",

                "--note-drift":
                  "22px",

                "--note-rise":
                  "120px",

                "--note-delay":
                  "0.5s",

                "--note-size":
                  "29px",

                "--note-color":
                  "#5ed8ff",

                "--note-rotate":
                  "25deg",
              }}
            >
              ♬
            </i>


            <i
              style={{
                "--note-left":
                  "69%",

                "--note-drift":
                  "52px",

                "--note-rise":
                  "155px",

                "--note-delay":
                  "0.75s",

                "--note-size":
                  "24px",

                "--note-color":
                  "#ff75d8",

                "--note-rotate":
                  "-12deg",
              }}
            >
              ♩
            </i>


            <i
              style={{
                "--note-left":
                  "42%",

                "--note-drift":
                  "-38px",

                "--note-rise":
                  "180px",

                "--note-delay":
                  "1s",

                "--note-size":
                  "22px",

                "--note-color":
                  "#8cff66",

                "--note-rotate":
                  "20deg",
              }}
            >
              ♪
            </i>


            <i
              style={{
                "--note-left":
                  "61%",

                "--note-drift":
                  "38px",

                "--note-rise":
                  "195px",

                "--note-delay":
                  "1.25s",

                "--note-size":
                  "30px",

                "--note-color":
                  "#ff944d",

                "--note-rotate":
                  "-25deg",
              }}
            >
              ♫
            </i>
          </span>
        </button>


        {/* =====================================
            GITARA
            ===================================== */}

        <button
          type="button"
          className={
            touchHoverObject ===
            "guitar"
              ? `
                human-one-room__object
                human-one-room__guitar
                human-one-room__touch-hover-active
              `
              : `
                human-one-room__object
                human-one-room__guitar
              `
          }
          onPointerEnter={
            (event) =>
              prepareOnDesktopPointerEnter(
                event,
                prepareObala
              )
          }
          onPointerDown={
            (event) =>
              beginTouchHoverObject(
                event,
                "guitar"
              )
          }
          onPointerUp={
            finishTouchHoverObject
          }
          onPointerCancel={
            finishTouchHoverObject
          }
          onClick={
            handleGuitar
          }
          aria-label={t("room.guitar")}
        >
          <img
            data-obala-transition-target="room-guitar"
            src="/images/human-one/guitar.webp"
            alt=""
            draggable="false"
          />
        </button>


        {/* =====================================
            POSTERI
            ===================================== */}

        <button
          type="button"
          className={
            touchHoverObject ===
            "posters"
              ? `
                human-one-room__object
                human-one-room__posters
                human-one-room__touch-hover-active
              `
              : `
                human-one-room__object
                human-one-room__posters
              `
          }
          onPointerEnter={
            (event) =>
              prepareOnDesktopPointerEnter(
                event,
                preparePosters
              )
          }
          onPointerDown={
            (event) =>
              beginTouchHoverObject(
                event,
                "posters"
              )
          }
          onPointerUp={
            finishTouchHoverObject
          }
          onPointerCancel={
            finishTouchHoverObject
          }
          onClick={
            handlePosters
          }
          aria-label={t("room.posters")}
        >
          <img
            data-poster-transition-target="room-posters"
            src="/images/human-one/posters.webp"
            alt=""
            draggable="false"
          />
        </button>


        {/* =====================================
            UNWANTED PLAKAT

            Osnovni PNG je dekoracija.
            Fotografija i ime dolaze
            direktno iz admina.
            ===================================== */}

        <button
          type="button"
          data-about-poster-transition-target="room-profile-poster"
          className={
            touchHoverObject ===
            "profile-poster"
              ? `
                human-one-room__object
                human-one-room__profile-poster
                human-one-room__touch-hover-active
              `
              : `
                human-one-room__object
                human-one-room__profile-poster
              `
          }
          onPointerEnter={
            (event) =>
              prepareOnDesktopPointerEnter(
                event,
                prepareAbout
              )
          }
          onPointerDown={
            (event) =>
              beginTouchHoverObject(
                event,
                "profile-poster"
              )
          }
          onPointerUp={
            finishTouchHoverObject
          }
          onPointerCancel={
            finishTouchHoverObject
          }
          onClick={
            handleProfilePoster
          }
          aria-label={
            `${t("room.about")} — ${characterOneName}`
          }
        >
          <img
            className="human-one-room__profile-poster-frame"
            src="/images/human-one/profile-poster.webp"
            alt=""
            draggable="false"
          />


          {characterOneImage && (
            <>
              <img
                ref={
                  profilePhotoRef
                }
                className="human-one-room__profile-photo"
                data-seki-transition-target="portrait"
                src={
                  characterOneImage
                }
                alt=""
                draggable="false"
              />

              <span
                className="human-one-room__profile-scanlines"
                aria-hidden="true"
              />
            </>
          )}


          <span
            className="human-one-room__profile-name"
          >
            {characterOneName}
          </span>
        </button>


        {/* =====================================
            POŠTANSKO SANDUČE
            ===================================== */}

        <button
          type="button"
          className="
            human-one-room__object
            human-one-room__mailbox
          "
          onClick={
            handleMailbox
          }
          aria-label={t("room.sendMessage")}
        >
          <img
            src="/images/human-one/mailbox.webp"
            alt=""
            draggable="false"
          />
        </button>


        {/* =====================================
            RETRO KONZOLA — FLIP CAT
            ===================================== */}

        <button
          type="button"
          className={
            gameConsoleTouchActive
              ? `
                human-one-room__object
                human-one-room__game-console
                human-one-room__game-console--touch-active
              `
              : `
                human-one-room__object
                human-one-room__game-console
              `
          }
          onPointerEnter={
            (event) =>
              prepareOnDesktopPointerEnter(
                event,
                prepareGame
              )
          }
          onPointerDown={
            beginGameConsoleTouch
          }
          onPointerUp={
            finishGameConsoleTouch
          }
          onPointerCancel={
            cancelGameConsoleTouch
          }
          onClick={
            handleGameConsoleClick
          }
          data-game-console-transition-target="room-console"
          aria-label={t("room.gameAria")}
        >
          <img
            className="human-one-room__game-console-shell"
            src="/images/human-one/game-console-off.webp"
            alt=""
            draggable="false"
          />

          <img
            className="human-one-room__game-console-screen"
            src="/images/human-one/game-console-screen.webp"
            alt=""
            draggable="false"
            aria-hidden="true"
          />
        </button>


        {/* =====================================
            MOBILE — HORIZONTALNI IZBOR
            ===================================== */}

        {showCategoryPicker && (
          <section
            className="human-one-room__category-picker"
            id="human-one-mobile-category-picker"
            aria-label={t("room.categoryPickerLabel")}
          >
            <div className="human-one-room__category-picker-top">
              <button
                type="button"
                className="human-one-room__category-close"
                onClick={
                  closeCategoryPicker
                }
              >
                {t(
                  "room.backToRoom"
                )}
              </button>

              <p>
                {t(
                  "room.swipe"
                )}
              </p>
            </div>


            <LanguageMenuControl />


            <div className="human-one-room__category-track">
              <button
                type="button"
                className="human-one-room__category-card"
                onPointerDown={
                  prepareSkate
                }
                onClick={
                  () =>
                    handleCategorySelection(
                      handleSkateboard
                    )
                }
              >
                <span>
                  {t(
                    "room.skate"
                  )}
                </span>

                <img
                  src="/images/human-one/skateboard.webp"
                  alt=""
                  draggable="false"
                />
              </button>


              <button
                type="button"
                className="human-one-room__category-card"
                onClick={
                  () =>
                    handleCategorySelection(
                      handleBoombox
                    )
                }
              >
                <span>
                  {t(
                    "room.boombox"
                  )}
                </span>

                <img
                  src="/images/human-one/boombox.webp"
                  alt=""
                  draggable="false"
                />
              </button>


              <button
                type="button"
                className="human-one-room__category-card"
                onPointerDown={
                  prepareObala
                }
                onClick={
                  () =>
                    handleCategorySelection(
                      handleGuitar
                    )
                }
              >
                <span>
                  {t(
                    "room.guitar"
                  )}
                </span>

                <img
                  src="/images/human-one/guitar.webp"
                  alt=""
                  draggable="false"
                />
              </button>


              <button
                type="button"
                className="human-one-room__category-card"
                onPointerDown={
                  preparePosters
                }
                onClick={
                  () =>
                    handleCategorySelection(
                      handlePosters
                    )
                }
              >
                <span>
                  {t(
                    "room.posters"
                  )}
                </span>

                <img
                  src="/images/human-one/posters.webp"
                  alt=""
                  draggable="false"
                />
              </button>


              <button
                type="button"
                className="
                  human-one-room__category-card
                  human-one-room__category-card--profile
                "
                onPointerDown={
                  prepareAbout
                }
                onClick={
                  () =>
                    handleCategorySelection(
                      handleProfilePoster
                    )
                }
              >
                <span>
                  {t(
                    "room.about"
                  )}
                </span>

                <span className="human-one-room__category-profile">
                  <img
                    className="human-one-room__category-profile-frame"
                    src="/images/human-one/profile-poster.webp"
                    alt=""
                    draggable="false"
                  />

                  {characterOneImage && (
                    <img
                      className="human-one-room__category-profile-photo"
                      src={
                        characterOneImage
                      }
                      alt=""
                      draggable="false"
                    />
                  )}
                </span>
              </button>


              <button
                type="button"
                className="human-one-room__category-card"
                onClick={
                  () =>
                    handleCategorySelection(
                      handleMailbox
                    )
                }
              >
                <span>
                  {t(
                    "room.message"
                  )}
                </span>

                <img
                  src="/images/human-one/mailbox.webp"
                  alt=""
                  draggable="false"
                />
              </button>


              <button
                type="button"
                className="human-one-room__category-card"
                onClick={
                  () =>
                    handleCategorySelection(
                      handleClock
                    )
                }
              >
                <span>
                  БРЗЕ ДОСКОЧИЦЕ
                </span>

                <span className="human-one-room__category-clock">
                  <img
                    src="/images/human-one/digital-clock.webp"
                    alt=""
                    draggable="false"
                  />

                  <span
                    className="human-one-room__category-clock-display"
                    aria-hidden="true"
                  >
                    <SevenSegmentClock
                      time={belgradeClock.time}
                      size="category"
                    />
                  </span>
                </span>
              </button>


              <button
                type="button"
                className="human-one-room__category-card"
                onPointerDown={
                  prepareGame
                }
                onClick={
                  () =>
                    handleCategorySelection(
                      handleGame
                    )
                }
              >
                <span>
                  FLIP CAT
                </span>

                <img
                  src="/images/human-one/game-console-off.webp"
                  alt=""
                  draggable="false"
                />
              </button>
            </div>
          </section>
        )}


        {/* =====================================
            SFX ON / OFF
            ===================================== */}

        <button
          type="button"
          className={
            soundEnabled
              ? "human-one-room__sound human-one-room__sound--on"
              : "human-one-room__sound"
          }
          onClick={
            toggleSound
          }
          aria-pressed={
            soundEnabled
          }
        >
          <span />

          SFX

          <strong>
            {soundEnabled
              ? "ON"
              : "OFF"}
          </strong>
        </button>
      </div>
    </main>
  );
}


export default Home;