import {
  applyRect,
  createImageSnapshot,
  getViewportSize,
  getVisualBox,
  imageIsReady,
  lockDocumentScroll,
  preloadImage,
  prefersReducedMotion,
  waitForAnimation,
  waitForElement,
  waitForPaint,
} from "./routeTransitionCore.js";

import "../styles/transitions/SekiRoomTransition.css";


const ROOM_TARGET_SELECTOR =
  '[data-seki-transition-target="portrait"]';


const CHARACTER_SELECT_TARGET_SELECTOR =
  '[data-seki-transition-target="character-select-portrait"]';


const ROOM_BACKGROUND_SELECTOR =
  ".human-one-room__background";


const ROOM_DESKTOP_BACKGROUND =
  "/images/human-one/room-bg.webp";


const ROOM_MOBILE_BACKGROUND =
  "/images/human-one/room-bg-mobile.webp";


const CHARACTER_SELECT_DESKTOP_BACKGROUND =
  "/images/character-select/character-select-desktop-bg.webp";


const CHARACTER_SELECT_MOBILE_BACKGROUNDS = [
  "/images/character-select/seki-bg-mobile.webp",
  "/images/character-select/sergej-bg-mobile.webp",
];


const TIMING = {
  blackout: 260,

  move: 680,

  cropCrossfadeDelay: 300,

  cropCrossfade: 220,

  sideReveal: 430,

  verticalReveal: 500,

  settle: 70,

  finalCrossfade: 160,

  targetWaitTimeout: 6000,
};


let transitionInProgress =
  false;


/* =====================================================
   PRELOAD

   Entry:
   Character Select → soba.

   Exit:
   soba → Character Select.

   Ovo ne garantuje readiness samo po sebi.
   Samo iskorišćava idle vreme da browser ranije
   povuče teže slike koje će nam uskoro trebati.
   ===================================================== */

export function prepareSekiRoomEntryTransition() {
  const isMobile =
    window.matchMedia(
      "(max-width: 700px)"
    ).matches;

  preloadImage(
    isMobile
      ? ROOM_MOBILE_BACKGROUND
      : ROOM_DESKTOP_BACKGROUND
  );
}


export function prepareSekiRoomExitTransition() {
  const isMobile =
    window.matchMedia(
      "(max-width: 700px)"
    ).matches;


  if (isMobile) {
    CHARACTER_SELECT_MOBILE_BACKGROUNDS
      .forEach(
        (src) =>
          preloadImage(
            src
          )
      );

    return;
  }


  preloadImage(
    CHARACTER_SELECT_DESKTOP_BACKGROUND
  );
}


/* =====================================================
   TARGET READINESS

   Ne koristimo "sačekaj 500ms pa valjda radi".
   Čekamo konkretan DOM element i konkretnu sliku.
   ===================================================== */

function roomTargetIsReady(
  element
) {
  const rect =
    element.getBoundingClientRect();

  const roomBackground =
    document.querySelector(
      ROOM_BACKGROUND_SELECTOR
    );


  return (
    rect.width > 0 &&
    rect.height > 0 &&
    imageIsReady(
      element
    ) &&
    roomBackground &&
    imageIsReady(
      roomBackground
    )
  );
}


function characterSelectTargetIsReady(
  element
) {
  const rect =
    element.getBoundingClientRect();


  return (
    rect.width > 0 &&
    rect.height > 0 &&
    imageIsReady(
      element
    )
  );
}


/* =====================================================
   TRANSITION LAYER

   Ovaj DOM živi direktno pod document.body.
   Zato preživljava React Router unmount stare rute.
   ===================================================== */

function createTransitionLayer(
  sourceElement,
  sourceRect
) {
  const root =
    document.createElement(
      "div"
    );

  root.className =
    "seki-room-transition";

  root.setAttribute(
    "aria-hidden",
    "true"
  );


  const blackout =
    document.createElement(
      "div"
    );

  blackout.className =
    "seki-room-transition__blackout";


  const ghost =
    document.createElement(
      "div"
    );

  ghost.className =
    "seki-room-transition__ghost";

  applyRect(
    ghost,
    sourceRect
  );


  const sourceImage =
    createImageSnapshot(
      sourceElement,
      "seki-room-transition__image seki-room-transition__image--source"
    );


  ghost.appendChild(
    sourceImage
  );


  root.append(
    blackout,
    ghost
  );


  document.body.appendChild(
    root
  );


  return {
    root,
    blackout,
    ghost,
    sourceImage,
  };
}


/* =====================================================
   VIEWPORT GEOMETRIJA
   ===================================================== */

function clampRectToViewport(
  rect
) {
  const viewport =
    getViewportSize();

  const left =
    Math.max(
      0,
      Math.min(
        rect.left,
        viewport.width
      )
    );

  const top =
    Math.max(
      0,
      Math.min(
        rect.top,
        viewport.height
      )
    );

  const right =
    Math.max(
      left,
      Math.min(
        rect.right,
        viewport.width
      )
    );

  const bottom =
    Math.max(
      top,
      Math.min(
        rect.bottom,
        viewport.height
      )
    );


  return {
    left,
    top,
    right,
    bottom,

    width:
      right - left,

    height:
      bottom - top,
  };
}


/* =====================================================
   ČETIRI PANELA OKO PORTRETA
   ===================================================== */

function createPortraitPanels(
  root,
  targetRect,
  {
    initiallyOpen = false,
  } = {}
) {
  const rect =
    clampRectToViewport(
      targetRect
    );

  const viewport =
    getViewportSize();


  const left =
    document.createElement(
      "div"
    );

  const right =
    document.createElement(
      "div"
    );

  const top =
    document.createElement(
      "div"
    );

  const bottom =
    document.createElement(
      "div"
    );


  left.className =
    "seki-room-transition__panel seki-room-transition__panel--left";

  right.className =
    "seki-room-transition__panel seki-room-transition__panel--right";

  top.className =
    "seki-room-transition__panel seki-room-transition__panel--top";

  bottom.className =
    "seki-room-transition__panel seki-room-transition__panel--bottom";


  Object.assign(
    left.style,
    {
      left:
        "0px",

      top:
        `${rect.top}px`,

      width:
        `${rect.left}px`,

      height:
        `${rect.height}px`,
    }
  );


  Object.assign(
    right.style,
    {
      left:
        `${rect.right}px`,

      top:
        `${rect.top}px`,

      width:
        `${Math.max(
          0,
          viewport.width -
            rect.right
        )}px`,

      height:
        `${rect.height}px`,
    }
  );


  Object.assign(
    top.style,
    {
      left:
        "0px",

      top:
        "0px",

      width:
        `${viewport.width}px`,

      height:
        `${rect.top}px`,
    }
  );


  Object.assign(
    bottom.style,
    {
      left:
        "0px",

      top:
        `${rect.bottom}px`,

      width:
        `${viewport.width}px`,

      height:
        `${Math.max(
          0,
          viewport.height -
            rect.bottom
        )}px`,
    }
  );


  if (initiallyOpen) {
    left.style.transform =
      "translateX(-105%)";

    right.style.transform =
      "translateX(105%)";

    top.style.transform =
      "translateY(-105%)";

    bottom.style.transform =
      "translateY(105%)";
  }


  root.append(
    left,
    right,
    top,
    bottom
  );


  return {
    left,
    right,
    top,
    bottom,
  };
}


/* =====================================================
   FORWARD REVEAL

   1. levo / desno
   2. gore / dole
   ===================================================== */

async function revealRoom(
  panels
) {
  const leftAnimation =
    panels.left.animate(
      [
        {
          transform:
            "translateX(0)",
        },

        {
          transform:
            "translateX(-105%)",
        },
      ],
      {
        duration:
          TIMING.sideReveal,

        easing:
          "cubic-bezier(0.76, 0, 0.24, 1)",

        fill:
          "forwards",
      }
    );


  const rightAnimation =
    panels.right.animate(
      [
        {
          transform:
            "translateX(0)",
        },

        {
          transform:
            "translateX(105%)",
        },
      ],
      {
        duration:
          TIMING.sideReveal,

        easing:
          "cubic-bezier(0.76, 0, 0.24, 1)",

        fill:
          "forwards",
      }
    );


  await Promise.all([
    waitForAnimation(
      leftAnimation
    ),

    waitForAnimation(
      rightAnimation
    ),
  ]);


  const topAnimation =
    panels.top.animate(
      [
        {
          transform:
            "translateY(0)",
        },

        {
          transform:
            "translateY(-105%)",
        },
      ],
      {
        duration:
          TIMING.verticalReveal,

        easing:
          "cubic-bezier(0.76, 0, 0.24, 1)",

        fill:
          "forwards",
      }
    );


  const bottomAnimation =
    panels.bottom.animate(
      [
        {
          transform:
            "translateY(0)",
        },

        {
          transform:
            "translateY(105%)",
        },
      ],
      {
        duration:
          TIMING.verticalReveal,

        easing:
          "cubic-bezier(0.76, 0, 0.24, 1)",

        fill:
          "forwards",
      }
    );


  await Promise.all([
    waitForAnimation(
      topAnimation
    ),

    waitForAnimation(
      bottomAnimation
    ),
  ]);
}


/* =====================================================
   REVERSE CONCEAL

   Bukvalno obrnuta koreografija:

   1. gore / dole se ZATVARAJU
   2. levo / desno se ZATVARAJU

   Na kraju ostaje samo portret.
   ===================================================== */

async function concealRoomToPortrait(
  panels
) {
  const topAnimation =
    panels.top.animate(
      [
        {
          transform:
            "translateY(-105%)",
        },

        {
          transform:
            "translateY(0)",
        },
      ],
      {
        duration:
          TIMING.verticalReveal,

        easing:
          "cubic-bezier(0.76, 0, 0.24, 1)",

        fill:
          "forwards",
      }
    );


  const bottomAnimation =
    panels.bottom.animate(
      [
        {
          transform:
            "translateY(105%)",
        },

        {
          transform:
            "translateY(0)",
        },
      ],
      {
        duration:
          TIMING.verticalReveal,

        easing:
          "cubic-bezier(0.76, 0, 0.24, 1)",

        fill:
          "forwards",
      }
    );


  await Promise.all([
    waitForAnimation(
      topAnimation
    ),

    waitForAnimation(
      bottomAnimation
    ),
  ]);


  const leftAnimation =
    panels.left.animate(
      [
        {
          transform:
            "translateX(-105%)",
        },

        {
          transform:
            "translateX(0)",
        },
      ],
      {
        duration:
          TIMING.sideReveal,

        easing:
          "cubic-bezier(0.76, 0, 0.24, 1)",

        fill:
          "forwards",
      }
    );


  const rightAnimation =
    panels.right.animate(
      [
        {
          transform:
            "translateX(105%)",
        },

        {
          transform:
            "translateX(0)",
        },
      ],
      {
        duration:
          TIMING.sideReveal,

        easing:
          "cubic-bezier(0.76, 0, 0.24, 1)",

        fill:
          "forwards",
      }
    );


  await Promise.all([
    waitForAnimation(
      leftAnimation
    ),

    waitForAnimation(
      rightAnimation
    ),
  ]);
}


/* =====================================================
   SHARED-ELEMENT MOVE + CROP CROSSFADE
   ===================================================== */

async function moveGhostBetweenRects({
  layer,
  targetElement,
  sourceRect,
  targetRect,
}) {
  const targetImage =
    createImageSnapshot(
      targetElement,
      "seki-room-transition__image seki-room-transition__image--target"
    );


  layer.ghost.appendChild(
    targetImage
  );


  const moveAnimation =
    layer.ghost.animate(
      [
        {
          left:
            `${sourceRect.left}px`,

          top:
            `${sourceRect.top}px`,

          width:
            `${sourceRect.width}px`,

          height:
            `${sourceRect.height}px`,
        },

        {
          left:
            `${targetRect.left}px`,

          top:
            `${targetRect.top}px`,

          width:
            `${targetRect.width}px`,

          height:
            `${targetRect.height}px`,
        },
      ],
      {
        duration:
          TIMING.move,

        easing:
          "cubic-bezier(0.16, 1, 0.3, 1)",

        fill:
          "forwards",
      }
    );


  const sourceCrossfade =
    layer.sourceImage.animate(
      [
        {
          opacity: 1,
        },

        {
          opacity: 0,
        },
      ],
      {
        delay:
          TIMING.cropCrossfadeDelay,

        duration:
          TIMING.cropCrossfade,

        easing:
          "ease-in-out",

        fill:
          "forwards",
      }
    );


  const targetCrossfade =
    targetImage.animate(
      [
        {
          opacity: 0,
        },

        {
          opacity: 1,
        },
      ],
      {
        delay:
          TIMING.cropCrossfadeDelay,

        duration:
          TIMING.cropCrossfade,

        easing:
          "ease-in-out",

        fill:
          "forwards",
      }
    );


  await Promise.all([
    waitForAnimation(
      moveAnimation
    ),

    waitForAnimation(
      sourceCrossfade
    ),

    waitForAnimation(
      targetCrossfade
    ),
  ]);


  applyRect(
    layer.ghost,
    targetRect
  );


  return targetImage;
}


/* =====================================================
   EMERGENCY REVEAL

   Ako neka ruta ne prijavi target u roku,
   nikada ne ostavljamo korisnika zaglavljenog
   iza crnog ekrana.
   ===================================================== */

async function emergencyReveal(
  layer
) {
  if (!layer?.blackout) {
    return;
  }


  const animation =
    layer.blackout.animate(
      [
        {
          opacity: 1,
        },

        {
          opacity: 0,
        },
      ],
      {
        duration:
          220,

        easing:
          "ease-out",

        fill:
          "forwards",
      }
    );


  await waitForAnimation(
    animation
  );
}


/* =====================================================
   ENTRY
   CHARACTER SELECT → SOBA
   ===================================================== */

export async function startSekiRoomTransition({
  sourceElement,
  navigate,
}) {
  if (
    typeof navigate !== "function"
  ) {
    return;
  }


  if (
    transitionInProgress
  ) {
    return;
  }


  if (
    prefersReducedMotion() ||
    !sourceElement
  ) {
    navigate();
    return;
  }


  const sourceRect =
    getVisualBox(
      sourceElement
    );


  if (
    sourceRect.width <= 0 ||
    sourceRect.height <= 0
  ) {
    navigate();
    return;
  }


  transitionInProgress =
    true;


  const restoreScroll =
    lockDocumentScroll();


  let layer =
    null;

  let targetElement =
    null;

  let targetPreviousVisibility =
    "";

  let navigationCompleted =
    false;


  try {
    layer =
      createTransitionLayer(
        sourceElement,
        sourceRect
      );


    await waitForPaint(
      2
    );


    const blackoutAnimation =
      layer.blackout.animate(
        [
          {
            opacity: 0,
          },

          {
            opacity: 1,
          },
        ],
        {
          duration:
            TIMING.blackout,

          easing:
            "cubic-bezier(0.4, 0, 1, 1)",

          fill:
            "forwards",
        }
      );


    await waitForAnimation(
      blackoutAnimation
    );


    navigate();

    navigationCompleted =
      true;


    const targetResult =
      await waitForElement(
        ROOM_TARGET_SELECTOR,
        {
          timeout:
            TIMING.targetWaitTimeout,

          ready:
            roomTargetIsReady,
        }
      );


    targetElement =
      targetResult.element;


    if (
      !targetElement ||
      targetResult.timedOut
    ) {
      await emergencyReveal(
        layer
      );

      return;
    }


    await waitForPaint(
      2
    );


    const targetRect =
      getVisualBox(
        targetElement
      );


    targetPreviousVisibility =
      targetElement.style.visibility;

    targetElement.style.visibility =
      "hidden";


    await moveGhostBetweenRects({
      layer,
      targetElement,
      sourceRect,
      targetRect,
    });


    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          TIMING.settle
        )
    );


    const panels =
      createPortraitPanels(
        layer.root,
        targetRect
      );


    layer.blackout.remove();


    await revealRoom(
      panels
    );


    targetElement.style.visibility =
      targetPreviousVisibility;


    const finalCrossfade =
      layer.ghost.animate(
        [
          {
            opacity: 1,
          },

          {
            opacity: 0,
          },
        ],
        {
          duration:
            TIMING.finalCrossfade,

          easing:
            "ease-out",

          fill:
            "forwards",
        }
      );


    await waitForAnimation(
      finalCrossfade
    );
  } catch (error) {
    console.error(
      "Seki room entry transition failed:",
      error
    );


    if (!navigationCompleted) {
      navigate();
    }


    if (targetElement) {
      targetElement.style.visibility =
        targetPreviousVisibility;
    }
  } finally {
    if (
      targetElement &&
      targetElement.style.visibility ===
        "hidden"
    ) {
      targetElement.style.visibility =
        targetPreviousVisibility;
    }


    layer?.root?.remove();

    restoreScroll();

    transitionInProgress =
      false;
  }
}


/* =====================================================
   EXIT / REVERSE
   SOBA → CHARACTER SELECT
   ===================================================== */

export async function startSekiRoomExitTransition({
  sourceElement,
  navigate,
}) {
  if (
    typeof navigate !== "function"
  ) {
    return;
  }


  if (
    transitionInProgress
  ) {
    return;
  }


  if (
    prefersReducedMotion() ||
    !sourceElement
  ) {
    navigate();
    return;
  }


  const sourceRect =
    getVisualBox(
      sourceElement
    );


  if (
    sourceRect.width <= 0 ||
    sourceRect.height <= 0
  ) {
    navigate();
    return;
  }


  transitionInProgress =
    true;


  const restoreScroll =
    lockDocumentScroll();


  let layer =
    null;

  let targetElement =
    null;

  let targetPreviousVisibility =
    "";

  let navigationCompleted =
    false;


  try {
    /*
     * Ghost portret nastaje PRE zatvaranja.
     * Zato ostaje netaknut dok se soba oko njega
     * pretvara u crnilo.
     */

    layer =
      createTransitionLayer(
        sourceElement,
        sourceRect
      );


    const panels =
      createPortraitPanels(
        layer.root,
        sourceRect,
        {
          initiallyOpen: true,
        }
      );


    await waitForPaint(
      2
    );


    /*
     * REVERSE stare ulazne koreografije:
     *
     * forward:
     * levo/desno → gore/dole
     *
     * reverse:
     * gore/dole → levo/desno
     */

    await concealRoomToPortrait(
      panels
    );


    /*
     * Paneli su sada zatvorili sve osim portreta.
     * Uvodimo puni crni base ISPOD ghosta,
     * pa možemo bez ikakvog vizuelnog reza
     * da promenimo React rutu.
     */

    layer.blackout.style.opacity =
      "1";


    panels.left.remove();
    panels.right.remove();
    panels.top.remove();
    panels.bottom.remove();


    navigate();

    navigationCompleted =
      true;


    const targetResult =
      await waitForElement(
        CHARACTER_SELECT_TARGET_SELECTOR,
        {
          timeout:
            TIMING.targetWaitTimeout,

          ready:
            characterSelectTargetIsReady,
        }
      );


    targetElement =
      targetResult.element;


    if (
      !targetElement ||
      targetResult.timedOut
    ) {
      await emergencyReveal(
        layer
      );

      return;
    }


    await waitForPaint(
      2
    );


    const targetRect =
      getVisualBox(
        targetElement
      );


    targetPreviousVisibility =
      targetElement.style.visibility;

    targetElement.style.visibility =
      "hidden";


    /*
     * UNWANTED crop/filter se tokom leta pretvara
     * nazad u Character Select crop/filter.
     */

    await moveGhostBetweenRects({
      layer,
      targetElement,
      sourceRect,
      targetRect,
    });


    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          TIMING.settle
        )
    );


    /*
     * Pravi Character Select portret sada sedi
     * tačno ispod ghosta. Vraćamo ga pre otvaranja.
     */

    targetElement.style.visibility =
      targetPreviousVisibility;


    /*
     * Poslednji kadar reverse procesa:
     * - crnilo nestaje;
     * - ghost se predaje pravom DOM portretu.
     */

    const blackoutReveal =
      layer.blackout.animate(
        [
          {
            opacity: 1,
          },

          {
            opacity: 0,
          },
        ],
        {
          duration:
            TIMING.blackout,

          easing:
            "cubic-bezier(0, 0, 0.2, 1)",

          fill:
            "forwards",
        }
      );


    const ghostFade =
      layer.ghost.animate(
        [
          {
            opacity: 1,
          },

          {
            opacity: 0,
          },
        ],
        {
          duration:
            TIMING.finalCrossfade,

          easing:
            "ease-out",

          fill:
            "forwards",
        }
      );


    await Promise.all([
      waitForAnimation(
        blackoutReveal
      ),

      waitForAnimation(
        ghostFade
      ),
    ]);
  } catch (error) {
    console.error(
      "Seki room exit transition failed:",
      error
    );


    if (!navigationCompleted) {
      navigate();
    }


    if (targetElement) {
      targetElement.style.visibility =
        targetPreviousVisibility;
    }
  } finally {
    if (
      targetElement &&
      targetElement.style.visibility ===
        "hidden"
    ) {
      targetElement.style.visibility =
        targetPreviousVisibility;
    }


    layer?.root?.remove();

    restoreScroll();

    transitionInProgress =
      false;
  }
}