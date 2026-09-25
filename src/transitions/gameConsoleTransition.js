import {
  getVisualBox,
  imageIsReady,
  lockDocumentScroll,
  preloadImage,
  prefersReducedMotion,
  waitForAnimation,
  waitForElement,
  waitForPaint,
} from "./routeTransitionCore.js";

import "../styles/transitions/GameConsoleTransition.css";


const ROOM_CONSOLE_SELECTOR =
  '[data-game-console-transition-target="room-console"]';

const GAME_CONSOLE_SELECTOR =
  '[data-game-console-transition-target="game-console"]';


const ROUTE_ENTER_CLASS =
  "game-console-route-entering";

const ROUTE_LEAVE_CLASS =
  "game-console-route-leaving";


const ASSETS = {
  room:
    "/images/human-one/game-console-off.webp",

  front:
    "/images/human-one/game-console-transition.webp",

  menu:
    "/images/human-one/game/flip-cat-menu-bg.webp",
};


const CONSOLE_RATIO =
  3 / 2;


const SCREEN_HOLE = {
  left: 0.31,

  top: 0.195,

  width: 0.41,

  height: 0.445,
};


const TIMING = {
  /*
   * Vraćamo raniji osećaj otvaranja.
   */
  entryTravel:
    1500,

  exitTravel:
    1450,

  /*
   * Tek kada se front konzola već vratila
   * na mesto na zidu, pretvara se nazad
   * u originalni sobni Gameboy.
   */
  roomMorph:
    190,

  screenBoot:
    900,

  screenShutdown:
    560,

  revealConsole:
    300,

  bootPause:
    90,

  readyTimeout:
    7000,
};


let transitionInProgress =
  false;


let frontAssetPromise =
  null;


/* =====================================================
   MATH
   ===================================================== */

function clamp(
  minimum,
  value,
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


function getViewport() {
  const visualViewport =
    typeof window !== "undefined"
      ? window.visualViewport
      : null;


  const documentElement =
    document.documentElement;


  const width =
    visualViewport?.width ||
    window.innerWidth ||
    documentElement.clientWidth;


  const height =
    visualViewport?.height ||
    window.innerHeight ||
    documentElement.clientHeight;


  return {
    left:
      visualViewport?.offsetLeft ||
      0,

    top:
      visualViewport?.offsetTop ||
      0,

    width,

    height,
  };
}


function getReferenceLcdSize() {
  const viewport =
    getViewport();


  const machineWidth =
    Math.min(
      viewport.width *
        0.94,

      1120,

      viewport.height *
        1.26
    );


  const machineBorder =
    clamp(
      5,

      viewport.width *
        0.0065,

      9
    );


  const machinePadding =
    clamp(
      12,

      viewport.width *
        0.017,

      24
    );


  const bezelBorder =
    2;


  const bezelPadding =
    clamp(
      10,

      viewport.width *
        0.014,

      20
    );


  let width =
    machineWidth -
    (
      machineBorder +
      machinePadding +
      bezelBorder +
      bezelPadding
    ) *
    2;


  width =
    Math.max(
      width,
      320
    );


  let height =
    width *
    (
      780 /
      1200
    );


  const maxScreenHeight =
    viewport.height *
    0.82;


  if (
    height >
    maxScreenHeight
  ) {
    const scale =
      maxScreenHeight /
      height;


    width *=
      scale;


    height *=
      scale;
  }


  return {
    width,

    height,
  };
}


function getFinalConsoleRect() {
  const viewport =
    getViewport();


  const referenceLcd =
    getReferenceLcdSize();


  const widthNeededForScreenWidth =
    referenceLcd.width /
    SCREEN_HOLE.width;


  const consoleHeightNeededForScreenHeight =
    referenceLcd.height /
    SCREEN_HOLE.height;


  const widthNeededForScreenHeight =
    consoleHeightNeededForScreenHeight *
    CONSOLE_RATIO;


  const consoleWidth =
    Math.max(
      widthNeededForScreenWidth,

      widthNeededForScreenHeight
    );


  const consoleHeight =
    consoleWidth /
    CONSOLE_RATIO;


  const screenWidth =
    consoleWidth *
    SCREEN_HOLE.width;


  const screenHeight =
    consoleHeight *
    SCREEN_HOLE.height;


  const desiredScreenCenterX =
    viewport.left +
    viewport.width /
    2;


  const desiredScreenCenterY =
    viewport.top +
    viewport.height /
    2;


  const screenCenterInsideConsoleX =
    (
      SCREEN_HOLE.left +
      SCREEN_HOLE.width /
      2
    ) *
    consoleWidth;


  const screenCenterInsideConsoleY =
    (
      SCREEN_HOLE.top +
      SCREEN_HOLE.height /
      2
    ) *
    consoleHeight;


  const left =
    desiredScreenCenterX -
    screenCenterInsideConsoleX;


  const top =
    desiredScreenCenterY -
    screenCenterInsideConsoleY;


  return {
    left,

    top,

    width:
      consoleWidth,

    height:
      consoleHeight,

    screen: {
      left:
        left +
        consoleWidth *
        SCREEN_HOLE.left,

      top:
        top +
        consoleHeight *
        SCREEN_HOLE.top,

      width:
        screenWidth,

      height:
        screenHeight,
    },
  };
}


function rectWithConsoleRatio(
  rect
) {
  const centerX =
    rect.left +
    rect.width /
    2;


  const centerY =
    rect.top +
    rect.height /
    2;


  let width =
    rect.width;


  let height =
    width /
    CONSOLE_RATIO;


  if (
    height >
    rect.height *
      1.18
  ) {
    height =
      rect.height;


    width =
      height *
      CONSOLE_RATIO;
  }


  return {
    left:
      centerX -
      width /
      2,

    top:
      centerY -
      height /
      2,

    width,

    height,
  };
}


function transformBetweenRects(
  baseRect,
  targetRect
) {
  const baseCenterX =
    baseRect.left +
    baseRect.width /
    2;


  const baseCenterY =
    baseRect.top +
    baseRect.height /
    2;


  const targetCenterX =
    targetRect.left +
    targetRect.width /
    2;


  const targetCenterY =
    targetRect.top +
    targetRect.height /
    2;


  const translateX =
    targetCenterX -
    baseCenterX;


  const translateY =
    targetCenterY -
    baseCenterY;


  const scaleX =
    targetRect.width /
    Math.max(
      baseRect.width,
      0.001
    );


  const scaleY =
    targetRect.height /
    Math.max(
      baseRect.height,
      0.001
    );


  return [
    `translate3d(${translateX}px, ${translateY}px, 0)`,

    `scale(${scaleX}, ${scaleY})`,
  ].join(
    " "
  );
}


/* =====================================================
   WAIT
   ===================================================== */

function wait(
  duration
) {
  return new Promise(
    (resolve) => {
      window.setTimeout(
        resolve,
        duration
      );
    }
  );
}


/* =====================================================
   ASSET PRELOAD
   ===================================================== */

function ensureFrontAssetReady() {
  if (
    frontAssetPromise
  ) {
    return frontAssetPromise;
  }


  frontAssetPromise =
    new Promise(
      (resolve) => {
        const image =
          new Image();


        image.decoding =
          "async";


        image.src =
          ASSETS.front;


        async function finish() {
          try {
            if (
              typeof image.decode ===
              "function"
            ) {
              await image.decode();
            }
          } catch {
            /*
             * onload je dovoljan fallback.
             */
          }


          resolve();
        }


        if (
          image.complete &&
          image.naturalWidth >
            0
        ) {
          finish();


          return;
        }


        image.addEventListener(
          "load",
          finish,
          {
            once: true,
          }
        );


        image.addEventListener(
          "error",
          resolve,
          {
            once: true,
          }
        );
      }
    );


  return frontAssetPromise;
}


export function prepareGameConsoleTransition() {
  preloadImage(
    ASSETS.room
  );


  preloadImage(
    ASSETS.front
  );


  preloadImage(
    ASSETS.menu
  );


  ensureFrontAssetReady();
}


/* =====================================================
   SOBNA KONZOLA
   ===================================================== */

function parseRotation(
  element
) {
  if (!element) {
    return 0;
  }


  const computed =
    window.getComputedStyle(
      element
    );


  const directRotate =
    computed.rotate;


  if (
    directRotate &&
    directRotate !== "none"
  ) {
    const value =
      Number.parseFloat(
        directRotate
      );


    if (
      Number.isFinite(
        value
      )
    ) {
      return value;
    }
  }


  const transform =
    computed.transform;


  if (
    !transform ||
    transform === "none"
  ) {
    return 0;
  }


  const match =
    transform.match(
      /matrix\(([^)]+)\)/
    );


  if (!match) {
    return 0;
  }


  const numbers =
    match[1]
      .split(
        ","
      )
      .map(
        (value) =>
          Number.parseFloat(
            value.trim()
          )
      );


  if (
    numbers.length <
      2 ||
    !Number.isFinite(
      numbers[0]
    ) ||
    !Number.isFinite(
      numbers[1]
    )
  ) {
    return 0;
  }


  return (
    Math.atan2(
      numbers[1],
      numbers[0]
    ) *
    180 /
    Math.PI
  );
}


function getRoomPose(
  element
) {
  const visual =
    getVisualBox(
      element
    );


  const width =
    element.offsetWidth ||
    visual.width;


  const height =
    element.offsetHeight ||
    visual.height;


  const centerX =
    visual.left +
    visual.width /
    2;


  const centerY =
    visual.top +
    visual.height /
    2;


  return {
    rect: {
      left:
        centerX -
        width /
        2,

      top:
        centerY -
        height /
        2,

      width,

      height,
    },

    rotation:
      parseRotation(
        element
      ),
  };
}


/* =====================================================
   FINALNI GAMEBOY LAYOUT
   ===================================================== */

function storeFinalLayout(
  rect
) {
  const root =
    document.documentElement;


  root.style.setProperty(
    "--flip-cat-console-left",
    `${rect.left}px`
  );


  root.style.setProperty(
    "--flip-cat-console-top",
    `${rect.top}px`
  );


  root.style.setProperty(
    "--flip-cat-console-width",
    `${rect.width}px`
  );


  root.style.setProperty(
    "--flip-cat-console-height",
    `${rect.height}px`
  );
}


function applyFinalGameLayout(
  machine,
  finalRect
) {
  if (!machine) {
    return;
  }


  storeFinalLayout(
    finalRect
  );


  machine.style.setProperty(
    "position",
    "fixed",
    "important"
  );


  machine.style.setProperty(
    "left",
    `${finalRect.left}px`,
    "important"
  );


  machine.style.setProperty(
    "top",
    `${finalRect.top}px`,
    "important"
  );


  machine.style.setProperty(
    "width",
    `${finalRect.width}px`,
    "important"
  );


  machine.style.setProperty(
    "height",
    `${finalRect.height}px`,
    "important"
  );


  machine.style.setProperty(
    "max-width",
    "none",
    "important"
  );


  machine.style.setProperty(
    "margin",
    "0",
    "important"
  );


  machine.style.setProperty(
    "padding",
    "0",
    "important"
  );


  machine.style.setProperty(
    "border",
    "0",
    "important"
  );


  machine.style.setProperty(
    "border-radius",
    "0",
    "important"
  );


  machine.style.setProperty(
    "box-shadow",
    "none",
    "important"
  );


  machine.style.setProperty(
    "animation",
    "none",
    "important"
  );


  machine.style.setProperty(
    "transition",
    "none",
    "important"
  );


  machine.style.setProperty(
    "transform",
    "none",
    "important"
  );


  machine.style.setProperty(
    "background",
    `url("${ASSETS.front}") center center / 100% 100% no-repeat`,
    "important"
  );


  const bezel =
    machine.querySelector(
      ".human-one-game__bezel"
    );


  if (bezel) {
    bezel.style.setProperty(
      "position",
      "absolute",
      "important"
    );


    bezel.style.setProperty(
      "left",
      `${SCREEN_HOLE.left * 100}%`,
      "important"
    );


    bezel.style.setProperty(
      "top",
      `${SCREEN_HOLE.top * 100}%`,
      "important"
    );


    bezel.style.setProperty(
      "width",
      `${SCREEN_HOLE.width * 100}%`,
      "important"
    );


    bezel.style.setProperty(
      "height",
      `${SCREEN_HOLE.height * 100}%`,
      "important"
    );


    bezel.style.setProperty(
      "padding",
      "0",
      "important"
    );


    bezel.style.setProperty(
      "border",
      "0",
      "important"
    );


    bezel.style.setProperty(
      "border-radius",
      "0",
      "important"
    );


    bezel.style.setProperty(
      "background",
      "transparent",
      "important"
    );


    bezel.style.setProperty(
      "box-shadow",
      "none",
      "important"
    );


    bezel.style.setProperty(
      "overflow",
      "hidden",
      "important"
    );
  }


  const lcd =
    machine.querySelector(
      ".human-one-game__lcd"
    );


  if (lcd) {
    lcd.style.setProperty(
      "width",
      "100%",
      "important"
    );


    lcd.style.setProperty(
      "height",
      "100%",
      "important"
    );


    lcd.style.setProperty(
      "aspect-ratio",
      "auto",
      "important"
    );


    lcd.style.setProperty(
      "box-sizing",
      "border-box",
      "important"
    );


    lcd.style.setProperty(
      "border",
      "0",
      "important"
    );


    lcd.style.setProperty(
      "border-radius",
      "1.5%",
      "important"
    );


    lcd.style.setProperty(
      "background-size",
      "cover",
      "important"
    );


    lcd.style.setProperty(
      "background-position",
      "center",
      "important"
    );
  }
}


/* =====================================================
   RESPONSIVE SYNC
   ===================================================== */

export function syncGameConsoleLayout(
  machineElement = null
) {
  const machine =
    machineElement ||
    document.querySelector(
      GAME_CONSOLE_SELECTOR
    );


  if (!machine) {
    return null;
  }


  const finalRect =
    getFinalConsoleRect();


  applyFinalGameLayout(
    machine,
    finalRect
  );


  return finalRect;
}


/* =====================================================
   TRANSITION DOM
   ===================================================== */

function stripCloneIdentity(
  element
) {
  element.removeAttribute(
    "id"
  );


  element.removeAttribute(
    "data-game-console-transition-target"
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


  element.setAttribute(
    "aria-hidden",
    "true"
  );


  element.setAttribute(
    "tabindex",
    "-1"
  );
}


function createTransitionLayer() {
  const root =
    document.createElement(
      "div"
    );


  root.className =
    "game-console-transition";


  root.setAttribute(
    "aria-hidden",
    "true"
  );


  const blackout =
    document.createElement(
      "div"
    );


  blackout.className =
    "game-console-transition__blackout";


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


function createFrontGhost(
  finalRect
) {
  const ghost =
    document.createElement(
      "img"
    );


  ghost.className =
    "game-console-transition__front-ghost";


  ghost.src =
    ASSETS.front;


  ghost.alt =
    "";


  ghost.draggable =
    false;


  /*
   * Fizička veličina elementa je finalna.
   * Let radimo samo transformom.
   */
  ghost.style.left =
    `${finalRect.left}px`;


  ghost.style.top =
    `${finalRect.top}px`;


  ghost.style.width =
    `${finalRect.width}px`;


  ghost.style.height =
    `${finalRect.height}px`;


  return ghost;
}


function createRoomGhost(
  source,
  rect,
  rotation
) {
  const ghost =
    source.cloneNode(
      true
    );


  stripCloneIdentity(
    ghost
  );


  ghost.className =
    "game-console-transition__room-ghost";


  ghost.style.left =
    `${rect.left}px`;


  ghost.style.top =
    `${rect.top}px`;


  ghost.style.width =
    `${rect.width}px`;


  ghost.style.height =
    `${rect.height}px`;


  ghost.style.rotate =
    `${rotation}deg`;


  ghost.style.transform =
    "none";


  /*
   * Tokom povratka konzola mora biti ugašena.
   */
  const screen =
    ghost.querySelector(
      ".human-one-room__game-console-screen"
    );


  if (screen) {
    screen.style.animation =
      "none";


    screen.style.transition =
      "none";


    screen.style.opacity =
      "0";


    screen.style.transform =
      "scaleY(0.015)";
  }


  return ghost;
}


/* =====================================================
   TARGET READY
   ===================================================== */

function roomTargetReady(
  element
) {
  const rect =
    element.getBoundingClientRect();


  const shell =
    element.querySelector(
      ".human-one-room__game-console-shell"
    );


  return (
    rect.width >
      0 &&
    rect.height >
      0 &&
    shell &&
    imageIsReady(
      shell
    )
  );
}


function gameTargetReady(
  element
) {
  const rect =
    element.getBoundingClientRect();


  const lcd =
    element.querySelector(
      ".human-one-game__lcd"
    );


  return (
    rect.width >
      0 &&
    rect.height >
      0 &&
    Boolean(
      lcd
    )
  );
}


/* =====================================================
   CRT — PRIPREMA
   ===================================================== */

function prepareLcdForBoot(
  lcd
) {
  if (!lcd) {
    return;
  }


  lcd.style.transformOrigin =
    "50% 50%";


  lcd.style.opacity =
    "0";


  lcd.style.transform =
    "scale3d(1, 0.008, 1)";


  lcd.style.filter =
    "brightness(4.8) contrast(1.28) saturate(0.42)";
}


/* =====================================================
   CRT — PALJENJE
   ===================================================== */

async function bootLcd(
  lcd
) {
  if (!lcd) {
    return;
  }


  const animation =
    lcd.animate(
      [
        {
          offset: 0,

          opacity: 0,

          transform:
            "scale3d(1, 0.006, 1)",

          filter:
            "brightness(5.2) contrast(1.32) saturate(0.35)",
        },


        {
          offset: 0.10,

          opacity: 1,

          transform:
            "scale3d(1, 0.012, 1)",

          filter:
            "brightness(4.8) contrast(1.3) saturate(0.40)",
        },


        {
          offset: 0.23,

          opacity: 1,

          transform:
            "scale3d(1, 0.055, 1)",

          filter:
            "brightness(3.5) contrast(1.24) saturate(0.52)",
        },


        {
          offset: 0.48,

          opacity: 0.96,

          transform:
            "scale3d(1, 0.48, 1)",

          filter:
            "brightness(1.8) contrast(1.14) saturate(0.72)",
        },


        {
          offset: 0.68,

          opacity: 1,

          transform:
            "scale3d(1, 0.88, 1)",

          filter:
            "brightness(1.3) contrast(1.08) saturate(0.86)",
        },


        {
          offset: 0.82,

          opacity: 1,

          transform:
            "scale3d(1, 1.045, 1)",

          filter:
            "brightness(1.12) contrast(1.04) saturate(0.94)",
        },


        {
          offset: 0.92,

          opacity: 1,

          transform:
            "scale3d(1, 0.982, 1)",

          filter:
            "brightness(1.04) contrast(1.02) saturate(0.98)",
        },


        {
          offset: 1,

          opacity: 1,

          transform:
            "scale3d(1, 1, 1)",

          filter:
            "brightness(1) contrast(1) saturate(1)",
        },
      ],
      {
        duration:
          TIMING.screenBoot,

        easing:
          "cubic-bezier(0.18, 0.78, 0.18, 1)",

        fill:
          "forwards",
      }
    );


  await waitForAnimation(
    animation
  );


  lcd.style.opacity =
    "1";


  lcd.style.transform =
    "none";


  lcd.style.filter =
    "none";
}


/* =====================================================
   CRT — GAŠENJE
   ===================================================== */

async function shutdownLcd(
  lcd
) {
  if (!lcd) {
    return;
  }


  lcd.style.transformOrigin =
    "50% 50%";


  const animation =
    lcd.animate(
      [
        {
          offset: 0,

          opacity: 1,

          transform:
            "scale3d(1, 1, 1)",

          filter:
            "brightness(1)",
        },


        {
          offset: 0.44,

          opacity: 1,

          transform:
            "scale3d(1, 0.72, 1)",

          filter:
            "brightness(1.25)",
        },


        {
          offset: 0.68,

          opacity: 1,

          transform:
            "scale3d(1, 0.08, 1)",

          filter:
            "brightness(2.9)",
        },


        {
          offset: 0.84,

          opacity: 1,

          transform:
            "scale3d(1, 0.012, 1)",

          filter:
            "brightness(4.8)",
        },


        {
          offset: 1,

          opacity: 0,

          transform:
            "scale3d(0.15, 0.006, 1)",

          filter:
            "brightness(5.3)",
        },
      ],
      {
        duration:
          TIMING.screenShutdown,

        easing:
          "cubic-bezier(0.55, 0, 0.9, 0.42)",

        fill:
          "forwards",
      }
    );


  await waitForAnimation(
    animation
  );
}


/* =====================================================
   ENTRY FLIGHT

   VAŽNO:

   Nema više:
   sobni asset → morph tokom leta → front asset.

   Klik:
   original nestaje,
   front-facing asset odmah zauzima njegovo mesto,
   i TA ISTA slika se samo povećava.
   ===================================================== */

async function animateEntry({
  frontGhost,
  blackout,
  finalRect,
  startRect,
}) {
  const startTransform =
    transformBetweenRects(
      finalRect,
      startRect
    );


  frontGhost.style.opacity =
    "1";


  frontGhost.style.rotate =
    "0deg";


  frontGhost.style.transform =
    startTransform;


  const frontAnimation =
    frontGhost.animate(
      [
        {
          offset: 0,

          opacity: 1,

          rotate:
            "0deg",

          transform:
            startTransform,
        },


        /*
         * Vrlo mali početni pomak sprečava
         * osećaj da konzola "puca" napred.
         */
        {
          offset: 0.14,

          opacity: 1,

          rotate:
            "0deg",

          transform:
            transformBetweenRects(
              finalRect,
              {
                left:
                  startRect.left +
                  (
                    finalRect.left -
                    startRect.left
                  ) *
                  0.055,

                top:
                  startRect.top +
                  (
                    finalRect.top -
                    startRect.top
                  ) *
                  0.055,

                width:
                  startRect.width +
                  (
                    finalRect.width -
                    startRect.width
                  ) *
                  0.055,

                height:
                  startRect.height +
                  (
                    finalRect.height -
                    startRect.height
                  ) *
                  0.055,
              }
            ),
        },


        {
          offset: 1,

          opacity: 1,

          rotate:
            "0deg",

          transform:
            "translate3d(0, 0, 0) scale(1, 1)",
        },
      ],
      {
        duration:
          TIMING.entryTravel,

        easing:
          "cubic-bezier(0.16, 0.82, 0.18, 1)",

        fill:
          "forwards",
      }
    );


  const blackoutAnimation =
    blackout.animate(
      [
        {
          offset: 0,

          opacity: 0,
        },


        {
          offset: 0.35,

          opacity: 0.45,
        },


        {
          offset: 0.70,

          opacity: 0.88,
        },


        {
          offset: 1,

          opacity: 0.96,
        },
      ],
      {
        duration:
          TIMING.entryTravel,

        easing:
          "linear",

        fill:
          "forwards",
      }
    );


  await Promise.all([
    waitForAnimation(
      frontAnimation
    ),

    waitForAnimation(
      blackoutAnimation
    ),
  ]);


  frontGhost.style.opacity =
    "1";


  frontGhost.style.rotate =
    "0deg";


  frontGhost.style.transform =
    "none";


  blackout.style.opacity =
    "0.96";
}


/* =====================================================
   EXIT FLIGHT

   Ista frontalna konzola ostaje od početka
   do kraja leta.

   Ne pretvara se u sobnu dok još putuje.
   ===================================================== */

async function animateExitToRoomPosition({
  frontGhost,
  blackout,
  finalRect,
  targetFrontRect,
}) {
  const targetTransform =
    transformBetweenRects(
      finalRect,
      targetFrontRect
    );


  const frontAnimation =
    frontGhost.animate(
      [
        {
          offset: 0,

          opacity: 1,

          rotate:
            "0deg",

          transform:
            "translate3d(0, 0, 0) scale(1, 1)",
        },


        {
          offset: 0.86,

          opacity: 1,

          rotate:
            "0deg",

          transform:
            transformBetweenRects(
              finalRect,
              {
                left:
                  finalRect.left +
                  (
                    targetFrontRect.left -
                    finalRect.left
                  ) *
                  0.96,

                top:
                  finalRect.top +
                  (
                    targetFrontRect.top -
                    finalRect.top
                  ) *
                  0.96,

                width:
                  finalRect.width +
                  (
                    targetFrontRect.width -
                    finalRect.width
                  ) *
                  0.96,

                height:
                  finalRect.height +
                  (
                    targetFrontRect.height -
                    finalRect.height
                  ) *
                  0.96,
              }
            ),
        },


        {
          offset: 1,

          opacity: 1,

          rotate:
            "0deg",

          transform:
            targetTransform,
        },
      ],
      {
        duration:
          TIMING.exitTravel,

        easing:
          "cubic-bezier(0.20, 0, 0.22, 1)",

        fill:
          "forwards",
      }
    );


  const blackoutAnimation =
    blackout.animate(
      [
        {
          offset: 0,

          opacity: 0.96,
        },


        {
          offset: 0.45,

          opacity: 0.88,
        },


        {
          offset: 0.75,

          opacity: 0.38,
        },


        {
          offset: 1,

          opacity: 0,
        },
      ],
      {
        duration:
          TIMING.exitTravel,

        easing:
          "linear",

        fill:
          "forwards",
      }
    );


  await Promise.all([
    waitForAnimation(
      frontAnimation
    ),

    waitForAnimation(
      blackoutAnimation
    ),
  ]);


  frontGhost.style.opacity =
    "1";


  frontGhost.style.rotate =
    "0deg";


  frontGhost.style.transform =
    targetTransform;


  blackout.style.opacity =
    "0";
}


/* =====================================================
   FINALNI MORPH NA ZIDU

   Tek sada:
   frontalna konzola → originalni sobni oblik.

   Sobni ghost se pojavi ISPOD front ghosta
   pre nego što front uopšte počne da nestaje.

   Zbog toga nema praznog frame-a.
   ===================================================== */

async function morphFrontIntoRoomConsole({
  root,
  frontGhost,
  roomTarget,
  roomRect,
  roomRotation,
  finalRect,
  targetFrontRect,
}) {
  const roomGhost =
    createRoomGhost(
      roomTarget,
      roomRect,
      roomRotation
    );


  /*
   * Room ghost ide ISPOD frontalnog.
   */
  roomGhost.style.setProperty(
    "z-index",
    "2",
    "important"
  );


  frontGhost.style.setProperty(
    "z-index",
    "3",
    "important"
  );


  /*
   * Insertujemo ga pre front ghosta,
   * pa je front garantovano iznad.
   */
  root.insertBefore(
    roomGhost,
    frontGhost
  );


  /*
   * Room asset počinje nevidljiv,
   * ali brzo postaje 100% vidljiv DOK JE
   * front asset još uvek potpuno vidljiv.
   */
  roomGhost.style.opacity =
    "0";


  const frontStartTransform =
    transformBetweenRects(
      finalRect,
      targetFrontRect
    );


  const frontRoomTransform =
    transformBetweenRects(
      finalRect,
      roomRect
    );


  const roomAnimation =
    roomGhost.animate(
      [
        {
          offset: 0,

          opacity: 0,
        },


        {
          offset: 0.20,

          opacity: 0.55,
        },


        {
          offset: 0.38,

          opacity: 1,
        },


        {
          offset: 1,

          opacity: 1,
        },
      ],
      {
        duration:
          TIMING.roomMorph,

        easing:
          "ease-out",

        fill:
          "forwards",
      }
    );


  const frontAnimation =
    frontGhost.animate(
      [
        {
          offset: 0,

          opacity: 1,

          rotate:
            "0deg",

          transform:
            frontStartTransform,
        },


        /*
         * Dok sobni asset već postaje vidljiv,
         * front još ne bledi.
         */
        {
          offset: 0.38,

          opacity: 1,

          rotate:
            `${roomRotation * 0.25}deg`,

          transform:
            transformBetweenRects(
              finalRect,
              {
                left:
                  targetFrontRect.left +
                  (
                    roomRect.left -
                    targetFrontRect.left
                  ) *
                  0.35,

                top:
                  targetFrontRect.top +
                  (
                    roomRect.top -
                    targetFrontRect.top
                  ) *
                  0.35,

                width:
                  targetFrontRect.width +
                  (
                    roomRect.width -
                    targetFrontRect.width
                  ) *
                  0.35,

                height:
                  targetFrontRect.height +
                  (
                    roomRect.height -
                    targetFrontRect.height
                  ) *
                  0.35,
              }
            ),
        },


        /*
         * Room ghost je već 100% vidljiv.
         * Tek sad front može da počne da odlazi.
         */
        {
          offset: 0.68,

          opacity: 0.72,

          rotate:
            `${roomRotation * 0.70}deg`,

          transform:
            frontRoomTransform,
        },


        {
          offset: 1,

          opacity: 0,

          rotate:
            `${roomRotation}deg`,

          transform:
            frontRoomTransform,
        },
      ],
      {
        duration:
          TIMING.roomMorph,

        easing:
          "cubic-bezier(0.22, 1, 0.36, 1)",

        fill:
          "forwards",
      }
    );


  await Promise.all([
    waitForAnimation(
      roomAnimation
    ),

    waitForAnimation(
      frontAnimation
    ),
  ]);


  roomGhost.style.opacity =
    "1";


  roomGhost.style.rotate =
    `${roomRotation}deg`;


  roomGhost.style.transform =
    "none";


  frontGhost.remove();


  return roomGhost;
}


/* =====================================================
   ENTRY
   SOBA → FRONT KONZOLA → FLIP CAT
   ===================================================== */

export async function startGameConsoleTransition({
  sourceElement,
  navigate,
}) {
  if (
    transitionInProgress ||
    typeof navigate !==
      "function"
  ) {
    return;
  }


  if (
    prefersReducedMotion()
  ) {
    navigate();


    return;
  }


  const source =
    sourceElement ||
    document.querySelector(
      ROOM_CONSOLE_SELECTOR
    );


  if (!source) {
    navigate();


    return;
  }


  const sourcePose =
    getRoomPose(
      source
    );


  if (
    sourcePose.rect.width <=
      0 ||
    sourcePose.rect.height <=
      0
  ) {
    navigate();


    return;
  }


  transitionInProgress =
    true;


  const restoreScroll =
    lockDocumentScroll();


  const oldSourceVisibility =
    source.style.visibility;


  let layer =
    null;


  let target =
    null;


  let oldTargetVisibility =
    "";


  let navigated =
    false;


  try {
    prepareGameConsoleTransition();


    await ensureFrontAssetReady();


    const finalRect =
      getFinalConsoleRect();


    storeFinalLayout(
      finalRect
    );


    /*
     * Mala frontalna konzola stoji u centru
     * postojeće sobne konzole.
     *
     * Čim klikneš:
     * ORIGINAL → FRONT.
     *
     * Nema morph-a usred leta.
     */
    const startRect =
      rectWithConsoleRatio(
        sourcePose.rect
      );


    layer =
      createTransitionLayer();


    const frontGhost =
      createFrontGhost(
        finalRect
      );


    const startTransform =
      transformBetweenRects(
        finalRect,
        startRect
      );


    frontGhost.style.opacity =
      "1";


    frontGhost.style.rotate =
      "0deg";


    frontGhost.style.transform =
      startTransform;


    layer.root.appendChild(
      frontGhost
    );


    /*
     * Prvo garantujemo da je frontalni ghost
     * iscrtan preko originala.
     */
    await waitForPaint(
      1
    );


    /*
     * Tek sada original iz sobe nestaje.
     * Korisnik već vidi frontalni asset
     * na potpuno istom mestu.
     */
    source.style.visibility =
      "hidden";


    await waitForPaint(
      1
    );


    /*
     * Jedina animacija predmeta:
     * frontalna konzola samo raste.
     */
    await animateEntry({
      frontGhost,

      blackout:
        layer.blackout,

      finalRect,

      startRect,
    });


    /*
     * Ruta se menja tek kada je velika
     * frontalna konzola potpuno stala.
     */
    document.documentElement
      .classList.add(
        ROUTE_ENTER_CLASS
      );


    navigate();


    navigated =
      true;


    const result =
      await waitForElement(
        GAME_CONSOLE_SELECTOR,
        {
          timeout:
            TIMING.readyTimeout,

          ready:
            gameTargetReady,
        }
      );


    target =
      result.element;


    if (
      !target ||
      result.timedOut
    ) {
      document.documentElement
        .classList.remove(
          ROUTE_ENTER_CLASS
        );


      return;
    }


    /*
     * Pravi React Gameboy dobija TAČNO
     * istu geometriju kao front ghost.
     */
    applyFinalGameLayout(
      target,
      finalRect
    );


    const lcd =
      target.querySelector(
        ".human-one-game__lcd"
      );


    prepareLcdForBoot(
      lcd
    );


    oldTargetVisibility =
      target.style.visibility;


    target.style.visibility =
      "visible";


    await waitForPaint(
      2
    );


    document.documentElement
      .classList.remove(
        ROUTE_ENTER_CLASS
      );


    await waitForPaint(
      2
    );


    /*
     * Ista slika već postoji ispod.
     * Nema fade-a ni pomeranja.
     */
    frontGhost.remove();


    const blackoutReveal =
      layer.blackout.animate(
        [
          {
            opacity: 0.96,
          },


          {
            opacity: 0,
          },
        ],
        {
          duration:
            TIMING.revealConsole,

          easing:
            "cubic-bezier(0.22, 1, 0.36, 1)",

          fill:
            "forwards",
        }
      );


    await waitForAnimation(
      blackoutReveal
    );


    layer.root.remove();


    layer =
      null;


    await waitForPaint(
      2
    );


    await wait(
      TIMING.bootPause
    );


    await bootLcd(
      lcd
    );
  } catch (error) {
    console.error(
      "Game console entry transition failed:",
      error
    );


    if (!navigated) {
      navigate();
    }
  } finally {
    document.documentElement
      .classList.remove(
        ROUTE_ENTER_CLASS
      );


    if (
      source?.isConnected
    ) {
      source.style.visibility =
        oldSourceVisibility;
    }


    if (target) {
      target.style.visibility =
        oldTargetVisibility;
    }


    layer?.root?.remove();


    restoreScroll();


    transitionInProgress =
      false;
  }
}


/* =====================================================
   EXIT
   FLIP CAT → FRONT KONZOLA → SOBA
   ===================================================== */

export async function startGameConsoleExitTransition({
  sourceElement,
  navigate,
}) {
  if (
    transitionInProgress ||
    typeof navigate !==
      "function"
  ) {
    return;
  }


  if (
    prefersReducedMotion()
  ) {
    navigate();


    return;
  }


  const source =
    sourceElement ||
    document.querySelector(
      GAME_CONSOLE_SELECTOR
    );


  if (!source) {
    navigate();


    return;
  }


  transitionInProgress =
    true;


  const restoreScroll =
    lockDocumentScroll();


  const oldSourceVisibility =
    source.style.visibility;


  let layer =
    null;


  let roomTarget =
    null;


  let oldRoomVisibility =
    "";


  let navigated =
    false;


  try {
    prepareGameConsoleTransition();


    await ensureFrontAssetReady();


    /*
     * Ponovna računica je bitna ako je
     * telefon promenio orijentaciju.
     */
    const finalRect =
      getFinalConsoleRect();


    applyFinalGameLayout(
      source,
      finalRect
    );


    await waitForPaint(
      2
    );


    const lcd =
      source.querySelector(
        ".human-one-game__lcd"
      );


    /*
     * Prvo se gasi samo LCD.
     * Kućište se ne pomera.
     */
    await shutdownLcd(
      lcd
    );


    layer =
      createTransitionLayer();


    layer.blackout.style.opacity =
      "0.96";


    /*
     * Velika frontalna konzola preuzima
     * mesto ugašenog React Gameboya.
     */
    const frontGhost =
      createFrontGhost(
        finalRect
      );


    frontGhost.style.opacity =
      "1";


    frontGhost.style.rotate =
      "0deg";


    frontGhost.style.transform =
      "none";


    layer.root.appendChild(
      frontGhost
    );


    await waitForPaint(
      2
    );


    /*
     * Ghost je već tačno preko source-a.
     */
    source.style.visibility =
      "hidden";


    document.documentElement
      .classList.add(
        ROUTE_LEAVE_CLASS
      );


    navigate();


    navigated =
      true;


    const result =
      await waitForElement(
        ROOM_CONSOLE_SELECTOR,
        {
          timeout:
            TIMING.readyTimeout,

          ready:
            roomTargetReady,
        }
      );


    roomTarget =
      result.element;


    if (
      !roomTarget ||
      result.timedOut
    ) {
      document.documentElement
        .classList.remove(
          ROUTE_LEAVE_CLASS
        );


      return;
    }


    await waitForPaint(
      2
    );


    const roomPose =
      getRoomPose(
        roomTarget
      );


    oldRoomVisibility =
      roomTarget.style.visibility;


    /*
     * Pravi predmet u sobi još krijemo.
     */
    roomTarget.style.visibility =
      "hidden";


    /*
     * Front konzola se tokom CELOG povratka
     * zadržava u frontalnom obliku.
     */
    const targetFrontRect =
      rectWithConsoleRatio(
        roomPose.rect
      );


    await animateExitToRoomPosition({
      frontGhost,

      blackout:
        layer.blackout,

      finalRect,

      targetFrontRect,
    });


    /*
     * SAD je frontalna konzola već stigla
     * na svoje mesto na zidu.
     *
     * Tek ovde vraćamo originalni sobni oblik.
     */
    const roomGhost =
      await morphFrontIntoRoomConsole({
        root:
          layer.root,

        frontGhost,

        roomTarget,

        roomRect:
          roomPose.rect,

        roomRotation:
          roomPose.rotation,

        finalRect,

        targetFrontRect,
      });


    /*
     * Route guard skidamo tek kada je
     * originalni oblik već 100% vidljiv.
     */
    document.documentElement
      .classList.remove(
        ROUTE_LEAVE_CLASS
      );


    roomTarget.style.visibility =
      oldRoomVisibility;


    /*
     * Pravi sobni Gameboy sada postoji
     * ispod potpuno identičnog room ghosta.
     */
    await waitForPaint(
      2
    );


    /*
     * NEMA fade-outa.
     *
     * Samo uklanjamo kopiju jer je pravi
     * predmet već iscrtan ispod nje.
     */
    roomGhost.remove();


    layer.root.remove();


    layer =
      null;
  } catch (error) {
    console.error(
      "Game console exit transition failed:",
      error
    );


    if (!navigated) {
      navigate();
    }
  } finally {
    document.documentElement
      .classList.remove(
        ROUTE_LEAVE_CLASS
      );


    if (
      source?.isConnected
    ) {
      source.style.visibility =
        oldSourceVisibility;
    }


    if (roomTarget) {
      roomTarget.style.visibility =
        oldRoomVisibility;
    }


    layer?.root?.remove();


    restoreScroll();


    transitionInProgress =
      false;
  }
}