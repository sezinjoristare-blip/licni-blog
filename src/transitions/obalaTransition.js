import {
  gsap,
} from "gsap";

import {
  Flip,
} from "gsap/Flip";

import {
  decodeImage,
  getViewportSize,
  getVisualBox,
  imageIsReady,
  lockDocumentScroll,
  preloadImage,
  prefersReducedMotion,
  waitForElement,
  waitForPaint,
} from "./routeTransitionCore.js";

import "../styles/transitions/ObalaTransition.css";


gsap.registerPlugin(
  Flip
);


/* =====================================================
   SELECTORS
   ===================================================== */

const ROOM_GUITAR_SELECTOR =
  '[data-obala-transition-target="room-guitar"]';

const TIKVAN_SELECTOR =
  '[data-obala-transition-target="tikvan"]';

const ROOM_BACKGROUND_SELECTOR =
  ".human-one-room__background";

const OBALA_BACKGROUND_SELECTOR =
  ".human-one-obala__background";

const OBALA_SCENE_SELECTOR =
  ".human-one-obala";


/* =====================================================
   ASSETI
   ===================================================== */

const ASSETS = {
  guitar:
    "/images/human-one/guitar.png",

  tikvan:
    "/images/human-one/obala/obala-guestbook-guy.png",

  roomDesktop:
    "/images/human-one/room-bg.png",

  roomMobile:
    "/images/human-one/room-bg-mobile.png",

  obalaDesktop:
    "/images/human-one/obala/obala-bg.png",

  obalaMobile:
    "/images/human-one/obala/obala-bg-mobile.png",
};


/* =====================================================
   AUDIO
   ===================================================== */

const AUDIO = {
  whoosh:
    "/audio/human-one/obala/guitar-whoosh.m4a",

  impact:
    "/audio/human-one/obala/guitar-impact.m4a",
};


const AUDIO_VOLUME = {
  whoosh:
    0.74,

  impact:
    0.88,
};


const transitionAudio = {
  whoosh:
    null,

  impact:
    null,
};


let transitionAudioPrepared =
  false;


function soundIsEnabled() {
  try {
    return (
      localStorage.getItem(
        "human-one-sound"
      ) !== "off"
    );
  } catch {
    return true;
  }
}


function prepareTransitionAudio() {
  if (
    transitionAudioPrepared ||
    typeof window ===
      "undefined"
  ) {
    return;
  }


  transitionAudio.whoosh =
    new Audio(
      AUDIO.whoosh
    );

  transitionAudio.impact =
    new Audio(
      AUDIO.impact
    );


  transitionAudio.whoosh.preload =
    "auto";

  transitionAudio.impact.preload =
    "auto";


  transitionAudio.whoosh.volume =
    AUDIO_VOLUME.whoosh;

  transitionAudio.impact.volume =
    AUDIO_VOLUME.impact;


  try {
    transitionAudio.whoosh.load();

    transitionAudio.impact.load();
  } catch {
    // Preload nije kritičan.
  }


  transitionAudioPrepared =
    true;
}


function playTransitionSound(
  key
) {
  if (!soundIsEnabled()) {
    return;
  }


  prepareTransitionAudio();


  const audio =
    transitionAudio[
      key
    ];


  if (!audio) {
    return;
  }


  audio.pause();


  try {
    audio.currentTime =
      0;
  } catch {
    // Audio još nije spreman.
  }


  audio.volume =
    AUDIO_VOLUME[key] ??
    1;


  audio
    .play()
    .catch(
      () => {
        /*
         * Zvuk ne sme da
         * prekine tranziciju.
         */
      }
    );
}


/* =====================================================
   TIMING
   ===================================================== */

const TIMING = {
  blackout:
    0.34,

  turnUpsideDown:
    0.78,

  tikvanAppear:
    0.22,

  windUp:
    0.26,

  slam:
    0.36,

  impact:
    0.24,


  /*
   * Kratka crna rupa
   * neposredno nakon udarca.
   */

  wakeHold:
    0.07,


  /*
   * Crnilo se skloni i ispod
   * njega ostane jako mutna Obala.
   */

  wakeBlackoutRelease:
    0.20,


  exitBlackout:
    0.38,

  apologyGuitarAppear:
    0.34,

  bubbleAppear:
    0.28,

  apologyPause:
    0.92,

  tikvanDisappear:
    0.34,

  guitarReturn:
    0.92,

  handoff:
    0.12,

  revealRoom:
    0.38,

  readyTimeout:
    8000,
};


/* =====================================================
   FOCUS WAVES

   Nema više:
   blur → fokus → blur → fokus
   preko CELOG ekrana.

   Sada imamo:

   BASE:
   cela Obala jako mutna.

   TALAS 1:
   iz Tikvana se širi zona sa
   srednjim blur-om.

   TALAS 2:
   odmah iza nje ide skoro čist fokus.

   TALAS 3:
   poslednji, najmekši front
   donosi potpuno čistu sliku.

   Zato efekat putuje PROSTORNO
   kroz scenu, umesto da treperi.
   ===================================================== */

const FOCUS_WAVE = {
  baseBlur:
    26,

  mediumBlur:
    12,

  softBlur:
    4.5,

  baseBrightness:
    0.80,

  baseSaturation:
    0.74,

  baseContrast:
    0.90,


  mediumBrightness:
    0.90,

  mediumSaturation:
    0.86,

  mediumContrast:
    0.95,


  softBrightness:
    0.97,

  softSaturation:
    0.95,

  softContrast:
    0.985,


  /*
   * Širina mekog ruba svakog
   * koncentričnog talasa.
   */

  mediumFeather:
    170,

  softFeather:
    145,

  sharpFeather:
    120,


  /*
   * Ako browser još ne zna trajanje
   * impact zvuka, koristimo ovo.
   */

  fallbackDuration:
    1.85,


  /*
   * Efekat neće biti prekratak čak
   * i ako je zvuk veoma kratak.
   */

  minimumDuration:
    1.40,


  /*
   * Ne dopuštamo ni preterano dugo
   * razvlačenje ako snimak ima
   * mnogo praznog repa.
   */

  maximumDuration:
    2.80,
};


let transitionInProgress =
  false;


let lastRoomGuitarRect =
  null;


/* =====================================================
   TAČKA GLAVE TIKVANA
   ===================================================== */

const TIKVAN_HEAD = {
  x:
    0.50,

  y:
    0.18,
};


/* =====================================================
   FIZIKA ZAMAHA
   ===================================================== */

const GUITAR_SWING = {
  pivotX:
    50,

  pivotY:
    15,

  bodyX:
    50,

  bodyY:
    82,

  windUpRotation:
    145,

  impactRotation:
    255,
};


/* =====================================================
   BASIC HELPERS
   ===================================================== */

function preloadMany(
  sources
) {
  sources.forEach(
    (src) => {
      preloadImage(
        src
      );
    }
  );
}


function getGuitarImage(
  sourceElement
) {
  if (
    sourceElement instanceof
      HTMLImageElement
  ) {
    return sourceElement;
  }


  return sourceElement
    ?.querySelector(
      "img"
    ) || null;
}


function getSourceRotation(
  sourceElement
) {
  const owner =
    sourceElement instanceof
      HTMLImageElement
      ? sourceElement.closest(
          ".human-one-room__guitar"
        ) ||
        sourceElement
      : sourceElement;


  if (!owner) {
    return 0;
  }


  const computed =
    window.getComputedStyle(
      owner
    );


  const rotateValue =
    computed.rotate;


  if (
    rotateValue &&
    rotateValue !==
      "none"
  ) {
    const parsed =
      Number.parseFloat(
        rotateValue
      );


    if (
      Number.isFinite(
        parsed
      )
    ) {
      return parsed;
    }
  }


  const transform =
    computed.transform;


  if (
    transform &&
    transform !==
      "none"
  ) {
    const match =
      transform.match(
        /^matrix\(([^)]+)\)$/
      );


    if (match) {
      const values =
        match[1]
          .split(",")
          .map(
            (value) =>
              Number.parseFloat(
                value
              )
          );


      if (
        values.length >=
          2 &&
        values.every(
          Number.isFinite
        )
      ) {
        return (
          Math.atan2(
            values[1],
            values[0]
          ) *
          180 /
          Math.PI
        );
      }
    }
  }


  return 0;
}


function createImageGhost({
  src,
  className,
}) {
  const image =
    document.createElement(
      "img"
    );


  image.className =
    className;

  image.src =
    src;

  image.alt =
    "";

  image.draggable =
    false;


  return image;
}


function createTransitionLayer() {
  const root =
    document.createElement(
      "div"
    );


  root.className =
    "obala-transition";

  root.setAttribute(
    "aria-hidden",
    "true"
  );


  /*
   * Pravimo sopstveni stacking context.
   *
   * 1/2 = fokus slojevi
   * 3   = crnilo
   * 4   = Tikvan
   * 5   = gitara
   * 6   = oblačić
   */

  root.style.isolation =
    "isolate";


  const blackout =
    document.createElement(
      "div"
    );


  blackout.className =
    "obala-transition__blackout";

  blackout.style.zIndex =
    "3";


  root.appendChild(
    blackout
  );


  document.body.appendChild(
    root
  );


  return {
    root,
    blackout,
  };
}


function setFixedRect(
  element,
  rect
) {
  gsap.set(
    element,
    {
      position:
        "fixed",

      left:
        rect.left,

      top:
        rect.top,

      width:
        rect.width,

      height:
        rect.height,
    }
  );
}


function clamp(
  value,
  minimum,
  maximum
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );
}


function timelinePromise(
  timeline
) {
  return new Promise(
    (resolve) => {
      timeline.eventCallback(
        "onComplete",
        resolve
      );


      timeline.play(
        0
      );
    }
  );
}


function tweenPromise(
  target,
  vars
) {
  return new Promise(
    (resolve) => {
      gsap.to(
        target,
        {
          ...vars,

          onComplete:
            resolve,
        }
      );
    }
  );
}


function flipFitPromise(
  target,
  destination,
  vars = {}
) {
  return new Promise(
    (resolve) => {
      Flip.fit(
        target,
        destination,
        {
          ...vars,

          onComplete:
            resolve,
        }
      );
    }
  );
}


/* =====================================================
   OBALA ROOT
   ===================================================== */

function getObalaScene() {
  const scene =
    document.querySelector(
      OBALA_SCENE_SELECTOR
    );


  if (scene) {
    return scene;
  }


  const background =
    document.querySelector(
      OBALA_BACKGROUND_SELECTOR
    );


  return (
    background?.closest(
      "main"
    ) ||
    background?.parentElement ||
    null
  );
}


/* =====================================================
   AUDIO REP

   Talasi pokušavaju da traju približno
   koliko je impact zvuku još ostalo
   do kraja.

   Tako se fokus konačno smiri kada
   se smiri i sam ZVEK.
   ===================================================== */

function getImpactTailDuration() {
  const audio =
    transitionAudio.impact;


  if (
    !audio ||
    !Number.isFinite(
      audio.duration
    ) ||
    audio.duration <=
      0
  ) {
    return FOCUS_WAVE
      .fallbackDuration;
  }


  const currentTime =
    Number.isFinite(
      audio.currentTime
    )
      ? audio.currentTime
      : 0;


  const remaining =
    audio.duration -
    currentTime;


  if (
    !Number.isFinite(
      remaining
    ) ||
    remaining <=
      0.15
  ) {
    return FOCUS_WAVE
      .fallbackDuration;
  }


  return clamp(
    remaining,
    FOCUS_WAVE
      .minimumDuration,
    FOCUS_WAVE
      .maximumDuration
  );
}


/* =====================================================
   CLONE CLEANUP

   Klonovi služe ISKLJUČIVO za sliku.

   Ne smeju:
   - imati ID-eve;
   - biti klikabilni;
   - puštati audio/video;
   - sadržati Tikvana;
   - učestvovati u accessibility stablu.
   ===================================================== */

function stripCloneIdentity(
  element
) {
  element.removeAttribute(
    "id"
  );

  element.removeAttribute(
    "data-obala-transition-target"
  );


  element
    .querySelectorAll(
      "[id]"
    )
    .forEach(
      (child) => {
        child.removeAttribute(
          "id"
        );
      }
    );


  element
    .querySelectorAll(
      "[for]"
    )
    .forEach(
      (child) => {
        child.removeAttribute(
          "for"
        );
      }
    );


  element
    .querySelectorAll(
      "[data-obala-transition-target]"
    )
    .forEach(
      (child) => {
        child.removeAttribute(
          "data-obala-transition-target"
        );
      }
    );


  element
    .querySelectorAll(
      "audio, video, iframe"
    )
    .forEach(
      (child) => {
        child.remove();
      }
    );


  element
    .querySelectorAll(
      "button, a, input, textarea, select"
    )
    .forEach(
      (child) => {
        child.setAttribute(
          "tabindex",
          "-1"
        );
      }
    );


  /*
   * Zamrznemo eventualne animacije
   * unutar klona.
   */

  element
    .querySelectorAll(
      "*"
    )
    .forEach(
      (child) => {
        child.style.animationPlayState =
          "paused";

        child.style.pointerEvents =
          "none";
      }
    );


  element.setAttribute(
    "aria-hidden",
    "true"
  );


  element.style.pointerEvents =
    "none";

  element.style.userSelect =
    "none";


  if (
    "inert" in
    element
  ) {
    element.inert =
      true;
  }
}


/* =====================================================
   FOCUS SCENE CLONE
   ===================================================== */

function createFocusSceneClone({
  scene,
  sceneRect,
  filter,
  zIndex,
}) {
  const clone =
    scene.cloneNode(
      true
    );


  /*
   * Tikvan mora da ostane samo
   * kao originalni oštri ghost
   * iznad fokusnih talasa.
   */

  const clonedTikvan =
    clone.querySelector(
      TIKVAN_SELECTOR
    );


  clonedTikvan?.remove();


  stripCloneIdentity(
    clone
  );


  /*
   * Čuvamo originalnu klasu scene
   * kako bi njen postojeći CSS raspored
   * ostao potpuno isti.
   *
   * Samo dodajemo pomoćnu klasu.
   */

  clone.classList.add(
    "obala-transition__focus-scene"
  );


  Object.assign(
    clone.style,
    {
      position:
        "fixed",

      left:
        `${sceneRect.left}px`,

      top:
        `${sceneRect.top}px`,

      width:
        `${sceneRect.width}px`,

      height:
        `${sceneRect.height}px`,

      minWidth:
        "0",

      minHeight:
        "0",

      maxWidth:
        "none",

      maxHeight:
        "none",

      margin:
        "0",

      zIndex:
        String(
          zIndex
        ),

      filter,

      pointerEvents:
        "none",

      userSelect:
        "none",

      willChange:
        "filter, mask-image, -webkit-mask-image",

      backfaceVisibility:
        "hidden",

      WebkitBackfaceVisibility:
        "hidden",
    }
  );


  return clone;
}


/* =====================================================
   SOFT RADIAL MASK

   Umesto oštrog clip-path kruga koristimo
   radial-gradient masku.

   Zato granica fokusa nema tvrdu ivicu,
   nego se blur elegantno pretapa.
   ===================================================== */

function applyFocusMask({
  element,
  centerX,
  centerY,
}) {
  element.style.setProperty(
    "--focus-solid",
    "0px"
  );

  element.style.setProperty(
    "--focus-mid",
    "0px"
  );

  element.style.setProperty(
    "--focus-radius",
    "1px"
  );


  const gradient =
    `radial-gradient(
      circle at ${centerX}px ${centerY}px,
      rgba(0, 0, 0, 1) 0px,
      rgba(0, 0, 0, 1) var(--focus-solid),
      rgba(0, 0, 0, 0.72) var(--focus-mid),
      rgba(0, 0, 0, 0) var(--focus-radius)
    )`;


  element.style.maskImage =
    gradient;

  element.style.WebkitMaskImage =
    gradient;


  element.style.maskRepeat =
    "no-repeat";

  element.style.WebkitMaskRepeat =
    "no-repeat";


  element.style.maskMode =
    "alpha";
}


/* =====================================================
   KOLIKI RADIJUS MORA DA BUDE

   Računamo najudaljeniji ugao Obale
   od Tikvanove glave.

   Tako završni talas sigurno izađe
   van celog ekrana.
   ===================================================== */

function getMaximumFocusDistance({
  width,
  height,
  centerX,
  centerY,
}) {
  const distances = [
    Math.hypot(
      centerX,
      centerY
    ),

    Math.hypot(
      width -
      centerX,
      centerY
    ),

    Math.hypot(
      centerX,
      height -
      centerY
    ),

    Math.hypot(
      width -
      centerX,
      height -
      centerY
    ),
  ];


  return Math.max(
    ...distances
  );
}


/* =====================================================
   ANIMACIJA JEDNOG TALASA
   ===================================================== */

function addFocusWaveToTimeline({
  timeline,
  element,
  start,
  duration,
  farthestDistance,
  feather,
}) {
  /*
   * Solidni deo mora na kraju da pređe
   * i preko najudaljenijeg ugla.

   * Feather onda nastavlja još dalje.
   */

  const solidRadius =
    farthestDistance +
    34;


  const midRadius =
    solidRadius +
    feather *
    0.48;


  const outerRadius =
    solidRadius +
    feather;


  timeline.to(
    element,
    {
      "--focus-solid":
        `${solidRadius}px`,

      "--focus-mid":
        `${midRadius}px`,

      "--focus-radius":
        `${outerRadius}px`,

      duration,

      /*
       * Talas brzo izađe iz Tikvana,
       * a zatim elegantno usporava
       * kako se širi preko scene.
       */

      ease:
        "power2.out",
    },
    start
  );
}


/* =====================================================
   DECODE SVIH SLIKA U PRIVREMENOJ SCENI
   ===================================================== */

async function decodeImagesInside(
  element
) {
  const images =
    Array.from(
      element.querySelectorAll(
        "img"
      )
    );


  if (!images.length) {
    return;
  }


  await Promise.allSettled(
    images.map(
      (image) =>
        decodeImage(
          image
        )
    )
  );
}


/* =====================================================
   FOCUS WAVES — GLAVNI EFEKAT

   OVO JE NOVA TRANZICIJA POSLE UDARCA.

   1. Napravimo četiri vizuelna sloja
      iste Obale BEZ Tikvana.

   2. Base je potpuno mutan.

   3. Tri sve oštrija sloja dobijaju
      meke koncentrične maske.

   4. Maske izlaze iz Tikvanove glave
      jedna za drugom.

   5. Poslednji talas je potpuno čist.

   6. Kada poslednji talas izađe van
      scene, vraćamo stvarnu Obalu
      i klonovi nestaju bez vizuelnog
      skoka.
   ===================================================== */

async function revealObalaWithFocusWaves({
  layerRoot,
  blackout,
  obalaScene,
  headPoint,
}) {
  if (
    !obalaScene
  ) {
    await tweenPromise(
      blackout,
      {
        opacity:
          0,

        duration:
          0.55,

        ease:
          "power2.out",
      }
    );


    return;
  }


  const sceneRect =
    obalaScene
      .getBoundingClientRect();


  if (
    sceneRect.width <=
      0 ||
    sceneRect.height <=
      0
  ) {
    await tweenPromise(
      blackout,
      {
        opacity:
          0,

        duration:
          0.55,

        ease:
          "power2.out",
      }
    );


    return;
  }


  /*
   * Tačka udara prevedena u
   * lokalne koordinate Obale.
   */

  const centerX =
    clamp(
      headPoint.x -
      sceneRect.left,

      0,

      sceneRect.width
    );


  const centerY =
    clamp(
      headPoint.y -
      sceneRect.top,

      0,

      sceneRect.height
    );


  const farthestDistance =
    getMaximumFocusDistance({
      width:
        sceneRect.width,

      height:
        sceneRect.height,

      centerX,

      centerY,
    });


  /*
   * Koliko impact zvuku još traje rep.
   */

  const totalDuration =
    getImpactTailDuration();


  /*
   * Privremena scena stoji:
   *
   * iznad prave Obale,
   * ispod crnila,
   * ispod Tikvana.
   */

  const focusStage =
    document.createElement(
      "div"
    );


  focusStage.className =
    "obala-transition__focus-stage";

  focusStage.setAttribute(
    "aria-hidden",
    "true"
  );


  Object.assign(
    focusStage.style,
    {
      position:
        "fixed",

      inset:
        "0",

      zIndex:
        "2",

      overflow:
        "hidden",

      pointerEvents:
        "none",

      userSelect:
        "none",
    }
  );


  /*
   * BASE — potpuno mutna Obala.
   */

  const baseLayer =
    createFocusSceneClone({
      scene:
        obalaScene,

      sceneRect,

      filter:
        `blur(${FOCUS_WAVE.baseBlur}px)
         brightness(${FOCUS_WAVE.baseBrightness})
         saturate(${FOCUS_WAVE.baseSaturation})
         contrast(${FOCUS_WAVE.baseContrast})`,

      zIndex:
        1,
    });


  /*
   * TALAS 1 — srednji fokus.
   */

  const mediumLayer =
    createFocusSceneClone({
      scene:
        obalaScene,

      sceneRect,

      filter:
        `blur(${FOCUS_WAVE.mediumBlur}px)
         brightness(${FOCUS_WAVE.mediumBrightness})
         saturate(${FOCUS_WAVE.mediumSaturation})
         contrast(${FOCUS_WAVE.mediumContrast})`,

      zIndex:
        2,
    });


  /*
   * TALAS 2 — skoro čisto.
   */

  const softLayer =
    createFocusSceneClone({
      scene:
        obalaScene,

      sceneRect,

      filter:
        `blur(${FOCUS_WAVE.softBlur}px)
         brightness(${FOCUS_WAVE.softBrightness})
         saturate(${FOCUS_WAVE.softSaturation})
         contrast(${FOCUS_WAVE.softContrast})`,

      zIndex:
        3,
    });


  /*
   * TALAS 3 — potpuno čisto.
   */

  const sharpLayer =
    createFocusSceneClone({
      scene:
        obalaScene,

      sceneRect,

      filter:
        "blur(0px) brightness(1) saturate(1) contrast(1)",

      zIndex:
        4,
    });


  applyFocusMask({
    element:
      mediumLayer,

    centerX,

    centerY,
  });


  applyFocusMask({
    element:
      softLayer,

    centerX,

    centerY,
  });


  applyFocusMask({
    element:
      sharpLayer,

    centerX,

    centerY,
  });


  focusStage.append(
    baseLayer,
    mediumLayer,
    softLayer,
    sharpLayer
  );


  layerRoot.appendChild(
    focusStage
  );


  /*
   * Čekamo da klonirane slike budu
   * spremne pre nego što sakrijemo
   * stvarnu Obalu.
   */

  await decodeImagesInside(
    focusStage
  );


  await waitForPaint(
    1
  );


  /*
   * Od ovog trenutka prava Obala
   * može da se sakrije.
   *
   * Gledalac sada vidi samo naš
   * precizno kontrolisan vizuelni sloj.
   */

  const previousSceneVisibility =
    obalaScene.style.visibility;


  obalaScene.style.visibility =
    "hidden";


  await waitForPaint(
    1
  );


  const wakeTimeline =
    gsap.timeline({
      paused:
        true,
    });


  /*
   * Delić sekunde totalnog nokauta.
   */

  wakeTimeline.to(
    {},
    {
      duration:
        TIMING.wakeHold,
    },
    0
  );


  /*
   * Crnilo ode.
   *
   * Ne pojavljuje se čista Obala,
   * već BASE blur od 26px.
   */

  wakeTimeline.to(
    blackout,
    {
      opacity:
        0,

      duration:
        TIMING
          .wakeBlackoutRelease,

      ease:
        "power1.out",
    },
    TIMING.wakeHold
  );


  /*
   * PRVI TALAS

   * Najbrži.
   * On "razbija" ekstremni blur
   * oko Tikvana.
   */

  addFocusWaveToTimeline({
    timeline:
      wakeTimeline,

    element:
      mediumLayer,

    start:
      TIMING.wakeHold +
      0.02,

    duration:
      totalDuration *
      0.64,

    farthestDistance,

    feather:
      FOCUS_WAVE
        .mediumFeather,
  });


  /*
   * DRUGI TALAS

   * Ide malo iza prvog.
   * Fokus već postaje vrlo čist.
   */

  addFocusWaveToTimeline({
    timeline:
      wakeTimeline,

    element:
      softLayer,

    start:
      TIMING.wakeHold +
      totalDuration *
      0.11,

    duration:
      totalDuration *
      0.71,

    farthestDistance,

    feather:
      FOCUS_WAVE
        .softFeather,
  });


  /*
   * TREĆI TALAS

   * Najsporiji i najfiniji.
   *
   * Njegov kraj poklapamo sa
   * približnim smirivanjem impact
   * zvuka.
   */

  addFocusWaveToTimeline({
    timeline:
      wakeTimeline,

    element:
      sharpLayer,

    start:
      TIMING.wakeHold +
      totalDuration *
      0.24,

    duration:
      totalDuration *
      0.76,

    farthestDistance,

    feather:
      FOCUS_WAVE
        .sharpFeather,
  });


  try {
    await timelinePromise(
      wakeTimeline
    );


    /*
     * Sharp layer sada pokriva
     * celu Obalu.
     *
     * Vraćamo stvarnu scenu ispod
     * njega dok gledalac to ne može
     * da primeti.
     */

    obalaScene.style.visibility =
      previousSceneVisibility;


    await waitForPaint(
      1
    );

  } finally {
    /*
     * Kada skinemo privremene slojeve,
     * ispod njih je već identična
     * stvarna, čista Obala.
     */

    obalaScene.style.visibility =
      previousSceneVisibility;


    focusStage.remove();
  }
}


/* =====================================================
   PROMENA PIVOTA BEZ VIZUELNOG SKOKA
   ===================================================== */

function setTransformOriginWithoutJump(
  element,
  transformOrigin
) {
  if (!element) {
    return;
  }


  const before =
    element
      .getBoundingClientRect();


  gsap.set(
    element,
    {
      transformOrigin,
    }
  );


  const after =
    element
      .getBoundingClientRect();


  gsap.set(
    element,
    {
      x:
        `+=${before.left - after.left}`,

      y:
        `+=${before.top - after.top}`,
    }
  );
}


/* =====================================================
   TAČNO RAČUNANJE POZE UDARCA
   ===================================================== */

function calculateImpactTranslation({
  guitarRect,
  headPoint,
  rotation,
}) {
  const width =
    guitarRect.width;

  const height =
    guitarRect.height;


  const pivotX =
    width *
    (
      GUITAR_SWING.pivotX /
      100
    );


  const pivotY =
    height *
    (
      GUITAR_SWING.pivotY /
      100
    );


  const bodyX =
    width *
    (
      GUITAR_SWING.bodyX /
      100
    );


  const bodyY =
    height *
    (
      GUITAR_SWING.bodyY /
      100
    );


  const localX =
    bodyX -
    pivotX;


  const localY =
    bodyY -
    pivotY;


  const radians =
    rotation *
    Math.PI /
    180;


  const rotatedX =
    localX *
      Math.cos(
        radians
      ) -
    localY *
      Math.sin(
        radians
      );


  const rotatedY =
    localX *
      Math.sin(
        radians
      ) +
    localY *
      Math.cos(
        radians
      );


  const basePivotX =
    guitarRect.left +
    pivotX;


  const basePivotY =
    guitarRect.top +
    pivotY;


  return {
    x:
      headPoint.x -
      (
        basePivotX +
        rotatedX
      ),

    y:
      headPoint.y -
      (
        basePivotY +
        rotatedY
      ),
  };
}


/* =====================================================
   READINESS — OBALA
   ===================================================== */

function tikvanIsReady(
  element
) {
  const rect =
    element.getBoundingClientRect();


  const background =
    document.querySelector(
      OBALA_BACKGROUND_SELECTOR
    );


  return (
    rect.width >
      0 &&
    rect.height >
      0 &&
    imageIsReady(
      element
    ) &&
    background &&
    imageIsReady(
      background
    )
  );
}


async function waitForObalaReady() {
  const result =
    await waitForElement(
      TIKVAN_SELECTOR,
      {
        timeout:
          TIMING.readyTimeout,

        ready:
          tikvanIsReady,
      }
    );


  const background =
    document.querySelector(
      OBALA_BACKGROUND_SELECTOR
    );


  if (background) {
    await decodeImage(
      background
    );
  }


  if (result.element) {
    await decodeImage(
      result.element
    );
  }


  await waitForPaint(
    2
  );


  return result;
}


/* =====================================================
   READINESS — SOBA
   ===================================================== */

function roomGuitarIsReady(
  element
) {
  const rect =
    element.getBoundingClientRect();


  const background =
    document.querySelector(
      ROOM_BACKGROUND_SELECTOR
    );


  return (
    rect.width >
      0 &&
    rect.height >
      0 &&
    imageIsReady(
      element
    ) &&
    background &&
    imageIsReady(
      background
    )
  );
}


async function waitForRoomReady() {
  const result =
    await waitForElement(
      ROOM_GUITAR_SELECTOR,
      {
        timeout:
          TIMING.readyTimeout,

        ready:
          roomGuitarIsReady,
      }
    );


  const background =
    document.querySelector(
      ROOM_BACKGROUND_SELECTOR
    );


  if (background) {
    await decodeImage(
      background
    );
  }


  if (result.element) {
    await decodeImage(
      result.element
    );
  }


  await waitForPaint(
    2
  );


  return result;
}


/* =====================================================
   GLAVA TIKVANA
   ===================================================== */

function getTikvanHeadPoint(
  tikvanRect
) {
  return {
    x:
      tikvanRect.left +
      tikvanRect.width *
        TIKVAN_HEAD.x,

    y:
      tikvanRect.top +
      tikvanRect.height *
        TIKVAN_HEAD.y,
  };
}


/* =====================================================
   VELIKA GITARA ZA BACK / "IZVINI"
   ===================================================== */

function getApologyGuitarRect(
  tikvanRect,
  guitarImage
) {
  const viewport =
    getViewportSize();


  const isMobile =
    viewport.width <=
    700;


  let width;

  let height;


  if (
    lastRoomGuitarRect &&
    lastRoomGuitarRect.width >
      0 &&
    lastRoomGuitarRect.height >
      0
  ) {
    width =
      lastRoomGuitarRect.width;

    height =
      lastRoomGuitarRect.height;

  } else {
    const ratio =
      (
        guitarImage.naturalWidth >
          0 &&
        guitarImage.naturalHeight >
          0
      )
        ? (
            guitarImage.naturalWidth /
            guitarImage.naturalHeight
          )
        : 0.38;


    width =
      isMobile
        ? Math.min(
            viewport.width *
              0.34,
            185
          )
        : Math.min(
            viewport.width *
              0.16,
            265
          );


    height =
      width /
      Math.max(
        ratio,
        0.1
      );
  }


  const left =
    clamp(
      tikvanRect.left +
      tikvanRect.width *
        (
          isMobile
            ? 0.66
            : 0.78
        ),

      12,

      viewport.width -
      width -
      12
    );


  const top =
    clamp(
      tikvanRect.top +
      tikvanRect.height *
        0.18 -
      height *
        0.22,

      12,

      viewport.height -
      height -
      12
    );


  return {
    left,
    top,
    width,
    height,
  };
}


/* =====================================================
   OBLAČIĆ
   ===================================================== */

function createApologyBubble() {
  const bubble =
    document.createElement(
      "div"
    );


  bubble.className =
    "obala-transition__bubble";

  bubble.textContent =
    "извини";

  bubble.style.zIndex =
    "6";


  return bubble;
}


function positionBubble(
  bubble,
  guitarRect
) {
  const viewport =
    getViewportSize();


  const left =
    clamp(
      guitarRect.left +
      guitarRect.width *
        0.68,

      14,

      viewport.width -
      150
    );


  const top =
    clamp(
      guitarRect.top -
      48,

      14,

      viewport.height -
      80
    );


  gsap.set(
    bubble,
    {
      left,
      top,
    }
  );
}


/* =====================================================
   PRELOAD — SOBA → OBALA
   ===================================================== */

export function prepareObalaTransition() {
  const isMobile =
    window.matchMedia(
      "(max-width: 700px)"
    ).matches;


  preloadMany([
    ASSETS.guitar,

    ASSETS.tikvan,

    isMobile
      ? ASSETS.obalaMobile
      : ASSETS.obalaDesktop,
  ]);


  prepareTransitionAudio();
}


/* =====================================================
   PRELOAD — OBALA → SOBA
   ===================================================== */

export function prepareObalaExitTransition() {
  const isMobile =
    window.matchMedia(
      "(max-width: 700px)"
    ).matches;


  preloadMany([
    ASSETS.guitar,

    ASSETS.tikvan,

    isMobile
      ? ASSETS.roomMobile
      : ASSETS.roomDesktop,
  ]);
}


/* =====================================================
   SOBA → OBALA
   ===================================================== */

export async function startObalaTransition({
  sourceElement,
  navigate,
}) {
  if (
    typeof navigate !==
      "function" ||
    transitionInProgress
  ) {
    return;
  }


  if (
    prefersReducedMotion()
  ) {
    navigate();

    return;
  }


  const sourceImage =
    getGuitarImage(
      sourceElement
    ) ||
    document.querySelector(
      ROOM_GUITAR_SELECTOR
    );


  if (!sourceImage) {
    navigate();

    return;
  }


  const sourceRect =
    getVisualBox(
      sourceImage
    );


  if (
    sourceRect.width <=
      0 ||
    sourceRect.height <=
      0
  ) {
    navigate();

    return;
  }


  lastRoomGuitarRect = {
    left:
      sourceRect.left,

    top:
      sourceRect.top,

    width:
      sourceRect.width,

    height:
      sourceRect.height,
  };


  transitionInProgress =
    true;


  const restoreScroll =
    lockDocumentScroll();


  const sourcePreviousVisibility =
    sourceImage.style.visibility;


  let layer =
    null;

  let targetImage =
    null;

  let targetPreviousVisibility =
    "";

  let navigationCompleted =
    false;


  try {
    prepareObalaTransition();


    layer =
      createTransitionLayer();


    const guitarGhost =
      createImageGhost({
        src:
          sourceImage.currentSrc ||
          sourceImage.src,

        className:
          "obala-transition__guitar",
      });


    layer.root.appendChild(
      guitarGhost
    );


    setFixedRect(
      guitarGhost,
      sourceRect
    );


    const startRotation =
      getSourceRotation(
        sourceElement ||
        sourceImage
      );


    gsap.set(
      guitarGhost,
      {
        opacity:
          1,

        rotation:
          startRotation,

        scale:
          1,

        zIndex:
          5,

        transformOrigin:
          "50% 50%",
      }
    );


    sourceImage.style.visibility =
      "hidden";


    gsap.set(
      layer.blackout,
      {
        opacity:
          0,
      }
    );


    /*
     * WHOOSH ostaje identičan.
     */

    playTransitionSound(
      "whoosh"
    );


    await waitForPaint(
      1
    );


    /* -------------------------------------
       ZAMAH + CRNILO
       ------------------------------------- */

    const openingTimeline =
      gsap.timeline({
        paused:
          true,
      });


    openingTimeline.to(
      layer.blackout,
      {
        opacity:
          1,

        duration:
          TIMING.blackout,

        ease:
          "power2.inOut",
      },
      0
    );


    openingTimeline.to(
      guitarGhost,
      {
        rotation:
          startRotation +
          180,

        y:
          -8,

        scale:
          1,

        duration:
          TIMING.turnUpsideDown,

        ease:
          "power2.inOut",
      },
      0
    );


    await timelinePromise(
      openingTimeline
    );


    /* -------------------------------------
       MONTIRAMO OBALU
       ------------------------------------- */

    navigate();


    navigationCompleted =
      true;


    const targetResult =
      await waitForObalaReady();


    targetImage =
      targetResult.element;


    if (!targetImage) {
      throw new Error(
        "Tikvan target nije pronađen."
      );
    }


    const tikvanRect =
      getVisualBox(
        targetImage
      );


    targetPreviousVisibility =
      targetImage.style.visibility;


    targetImage.style.visibility =
      "hidden";


    const tikvanGhost =
      createImageGhost({
        src:
          targetImage.currentSrc ||
          targetImage.src,

        className:
          "obala-transition__tikvan",
      });


    layer.root.appendChild(
      tikvanGhost
    );


    setFixedRect(
      tikvanGhost,
      tikvanRect
    );


    gsap.set(
      tikvanGhost,
      {
        opacity:
          0,

        scale:
          1,

        zIndex:
          4,

        transformOrigin:
          "50% 80%",
      }
    );


    /* -------------------------------------
       TIKVAN SE POJAVI
       ------------------------------------- */

    await tweenPromise(
      tikvanGhost,
      {
        opacity:
          1,

        duration:
          TIMING.tikvanAppear,

        ease:
          "power2.out",
      }
    );


    /* -------------------------------------
       PIVOT GITARE
       ------------------------------------- */

    setTransformOriginWithoutJump(
      guitarGhost,
      `${GUITAR_SWING.pivotX}% ${GUITAR_SWING.pivotY}%`
    );


    /*
     * Ovo je UJEDNO centar
     * naših focus talasa.
     */

    const headPoint =
      getTikvanHeadPoint(
        tikvanRect
      );


    const impactRotation =
      startRotation +
      GUITAR_SWING
        .impactRotation;


    const impactPosition =
      calculateImpactTranslation({
        guitarRect:
          sourceRect,

        headPoint,

        rotation:
          impactRotation,
      });


    /* -------------------------------------
       ZAMAH UNAZAD
       ------------------------------------- */

    await tweenPromise(
      guitarGhost,
      {
        rotation:
          startRotation +
          GUITAR_SWING
            .windUpRotation,

        scale:
          1,

        duration:
          TIMING.windUp,

        ease:
          "power2.out",
      }
    );


    /* -------------------------------------
       ZVEK
       ------------------------------------- */

    const slamTimeline =
      gsap.timeline({
        paused:
          true,
      });


    slamTimeline.to(
      guitarGhost,
      {
        x:
          impactPosition.x,

        y:
          impactPosition.y,

        rotation:
          impactRotation,

        scale:
          1,

        duration:
          TIMING.slam,

        ease:
          "power4.in",
      },
      0
    );


    /*
     * TVOJ NAŠTELOVANI TAJMING.
     *
     * 0.76 NE DIRAMO.
     */

    slamTimeline.call(
      () => {
        playTransitionSound(
          "impact"
        );
      },
      null,
      TIMING.slam -
      0.76
    );


    slamTimeline.to(
      tikvanGhost,
      {
        x:
          8,

        y:
          5,

        rotation:
          2,

        duration:
          0.055,

        ease:
          "power4.out",
      },
      TIMING.slam -
      0.04
    );


    await timelinePromise(
      slamTimeline
    );


    /* -------------------------------------
       IMPACT / ODSKOK
       ------------------------------------- */

    const impactTimeline =
      gsap.timeline({
        paused:
          true,
      });


    impactTimeline.to(
      tikvanGhost,
      {
        x:
          17,

        y:
          9,

        rotation:
          3.5,

        duration:
          0.07,

        ease:
          "power3.out",
      },
      0
    );


    impactTimeline.to(
      tikvanGhost,
      {
        x:
          -6,

        y:
          2,

        rotation:
          -1.5,

        duration:
          0.08,

        ease:
          "power2.inOut",
      }
    );


    impactTimeline.to(
      tikvanGhost,
      {
        x:
          0,

        y:
          0,

        rotation:
          0,

        duration:
          0.11,

        ease:
          "power2.out",
      }
    );


    impactTimeline.to(
      guitarGhost,
      {
        x:
          "-=18",

        y:
          "-=13",

        rotation:
          "-=13",

        scale:
          1,

        duration:
          0.14,

        ease:
          "power2.out",
      },
      0
    );


    impactTimeline.to(
      guitarGhost,
      {
        opacity:
          0,

        duration:
          0.10,

        ease:
          "none",
      },
      0.14
    );


    /*
     * VAŽNO:
     *
     * Više NE čekamo da se recoil
     * potpuno završi pa tek onda
     * otkrivamo Obalu.
     *
     * Talasi fokusa počinju praktično
     * istovremeno sa posledicom udarca.
     */

    const obalaScene =
      getObalaScene();


    await Promise.all([
      timelinePromise(
        impactTimeline
      ),

      revealObalaWithFocusWaves({
        layerRoot:
          layer.root,

        blackout:
          layer.blackout,

        obalaScene,

        headPoint,
      }),
    ]);


    /* -------------------------------------
       TIKVAN HANDOFF
       ------------------------------------- */

    targetImage.style.visibility =
      targetPreviousVisibility;


    await waitForPaint(
      1
    );


    tikvanGhost.remove();

  } catch (error) {
    console.error(
      "Obala entry transition failed:",
      error
    );


    if (
      !navigationCompleted
    ) {
      navigate();
    }

  } finally {
    sourceImage.style.visibility =
      sourcePreviousVisibility;


    if (targetImage) {
      targetImage.style.visibility =
        targetPreviousVisibility;
    }


    layer?.root?.remove();


    restoreScroll();


    transitionInProgress =
      false;
  }
}


/* =====================================================
   OBALA → SOBA

   POVRATAK NE MENJAMO.
   ===================================================== */

export async function startObalaExitTransition({
  navigate,
}) {
  if (
    typeof navigate !==
      "function" ||
    transitionInProgress
  ) {
    return;
  }


  if (
    prefersReducedMotion()
  ) {
    navigate();

    return;
  }


  const tikvanSource =
    document.querySelector(
      TIKVAN_SELECTOR
    );


  if (!tikvanSource) {
    navigate();

    return;
  }


  const tikvanRect =
    getVisualBox(
      tikvanSource
    );


  if (
    tikvanRect.width <=
      0 ||
    tikvanRect.height <=
      0
  ) {
    navigate();

    return;
  }


  transitionInProgress =
    true;


  const restoreScroll =
    lockDocumentScroll();


  const tikvanPreviousVisibility =
    tikvanSource.style.visibility;


  let layer =
    null;

  let roomGuitar =
    null;

  let roomGuitarPreviousVisibility =
    "";

  let navigationCompleted =
    false;


  try {
    prepareObalaExitTransition();


    layer =
      createTransitionLayer();


    const tikvanGhost =
      createImageGhost({
        src:
          tikvanSource.currentSrc ||
          tikvanSource.src,

        className:
          "obala-transition__tikvan",
      });


    layer.root.appendChild(
      tikvanGhost
    );


    setFixedRect(
      tikvanGhost,
      tikvanRect
    );


    gsap.set(
      tikvanGhost,
      {
        opacity:
          1,

        zIndex:
          4,

        transformOrigin:
          "50% 80%",
      }
    );


    tikvanSource.style.visibility =
      "hidden";


    gsap.set(
      layer.blackout,
      {
        opacity:
          0,
      }
    );


    await waitForPaint(
      1
    );


    /* -------------------------------------
       SVE PCRNI OSIM TIKVANA
       ------------------------------------- */

    await tweenPromise(
      layer.blackout,
      {
        opacity:
          1,

        duration:
          TIMING.exitBlackout,

        ease:
          "power2.inOut",
      }
    );


    /* -------------------------------------
       GITARA SE POJAVLJUJE
       ------------------------------------- */

    const guitarGhost =
      createImageGhost({
        src:
          ASSETS.guitar,

        className:
          "obala-transition__guitar obala-transition__guitar--apology",
      });


    layer.root.appendChild(
      guitarGhost
    );


    await decodeImage(
      guitarGhost
    );


    const apologyRect =
      getApologyGuitarRect(
        tikvanRect,
        guitarGhost
      );


    setFixedRect(
      guitarGhost,
      apologyRect
    );


    gsap.set(
      guitarGhost,
      {
        opacity:
          0,

        scale:
          1,

        rotation:
          -10,

        x:
          18,

        y:
          4,

        zIndex:
          5,

        transformOrigin:
          "50% 50%",
      }
    );


    await tweenPromise(
      guitarGhost,
      {
        opacity:
          1,

        x:
          0,

        y:
          0,

        scale:
          1,

        duration:
          TIMING
            .apologyGuitarAppear,

        ease:
          "power2.out",
      }
    );


    /* -------------------------------------
       "ИЗВИНИ"
       ------------------------------------- */

    const bubble =
      createApologyBubble();


    layer.root.appendChild(
      bubble
    );


    positionBubble(
      bubble,
      apologyRect
    );


    gsap.set(
      bubble,
      {
        opacity:
          0,

        scale:
          0.72,

        y:
          10,

        zIndex:
          6,

        transformOrigin:
          "20% 100%",
      }
    );


    await tweenPromise(
      bubble,
      {
        opacity:
          1,

        scale:
          1,

        y:
          0,

        duration:
          TIMING.bubbleAppear,

        ease:
          "back.out(1.7)",
      }
    );


    await tweenPromise(
      {},
      {
        duration:
          TIMING.apologyPause,
      }
    );


    /* -------------------------------------
       TIKVAN NESTANE
       ------------------------------------- */

    const vanishTimeline =
      gsap.timeline({
        paused:
          true,
      });


    vanishTimeline.to(
      tikvanGhost,
      {
        opacity:
          0,

        y:
          12,

        duration:
          TIMING.tikvanDisappear,

        ease:
          "power2.in",
      },
      0
    );


    vanishTimeline.to(
      bubble,
      {
        opacity:
          0,

        y:
          -7,

        duration:
          0.22,

        ease:
          "power2.in",
      },
      0.08
    );


    await timelinePromise(
      vanishTimeline
    );


    tikvanGhost.remove();

    bubble.remove();


    /* -------------------------------------
       MONTIRAMO SOBU
       ------------------------------------- */

    navigate();


    navigationCompleted =
      true;


    const roomResult =
      await waitForRoomReady();


    roomGuitar =
      roomResult.element;


    if (!roomGuitar) {
      throw new Error(
        "Guitar target u sobi nije pronađen."
      );
    }


    roomGuitarPreviousVisibility =
      roomGuitar.style.visibility;


    roomGuitar.style.visibility =
      "hidden";


    /* -------------------------------------
       POVRATAK GITARE
       ------------------------------------- */

    await flipFitPromise(
      guitarGhost,
      roomGuitar,
      {
        duration:
          TIMING.guitarReturn,

        ease:
          "power3.inOut",

        scale:
          true,
      }
    );


    /* -------------------------------------
       HANDOFF
       ------------------------------------- */

    roomGuitar.style.visibility =
      roomGuitarPreviousVisibility;


    await tweenPromise(
      guitarGhost,
      {
        opacity:
          0,

        duration:
          TIMING.handoff,

        ease:
          "none",
      }
    );


    /* -------------------------------------
       SOBA SE OTKRIVA
       ------------------------------------- */

    await tweenPromise(
      layer.blackout,
      {
        opacity:
          0,

        duration:
          TIMING.revealRoom,

        ease:
          "power2.out",
      }
    );

  } catch (error) {
    console.error(
      "Obala exit transition failed:",
      error
    );


    if (
      !navigationCompleted
    ) {
      navigate();
    }

  } finally {
    tikvanSource.style.visibility =
      tikvanPreviousVisibility;


    if (roomGuitar) {
      roomGuitar.style.visibility =
        roomGuitarPreviousVisibility;
    }


    layer?.root?.remove();


    restoreScroll();


    transitionInProgress =
      false;
  }
}