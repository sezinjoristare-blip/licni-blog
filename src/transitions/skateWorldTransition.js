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
  lockDocumentScroll,
  preloadImage,
  prefersReducedMotion,
  waitForElement,
  waitForPaint,
} from "./routeTransitionCore.js";

import "../styles/transitions/SkateWorldTransition.css";


gsap.registerPlugin(
  Flip
);


const READY_SELECTOR =
  '[data-skate-world-transition-ready="true"]';

const ROOM_SKATE_SELECTOR =
  '[data-skate-transition-target="room-skateboard"]';

const ROOM_BACKGROUND_SELECTOR =
  ".human-one-room__background";

const WORLD_BACKGROUND_SELECTOR =
  ".human-one-skate-scene__background";


const ASSETS = {
  rideBase:
    "/images/human-one/skate/skateboard-ride-base.png",

  leftWheel:
    "/images/human-one/skate/skateboard-front-wheel-left.png",

  rightWheel:
    "/images/human-one/skate/skateboard-front-wheel-right.png",

  roomSkate:
    "/images/human-one/skateboard.png",

  roomDesktop:
    "/images/human-one/room-bg.png",

  roomMobile:
    "/images/human-one/room-bg-mobile.png",

  worldDesktop:
    "/images/human-one/skate/skate-background.png",

  worldMobile:
    "/images/human-one/skate/skate-scene-mobile.png",
};


const RIDE_ASPECT =
  2048 / 682;


const TIMING = {
  blackout:
    0.28,

  poseChange:
    0.62,

  driveOut:
    0.92,

  worldReveal:
    0.62,

  worldClose:
    0.56,

  driveIn:
    0.95,

  handoff:
    0.74,

  handoffCrossfade:
    0.16,

  roomReveal:
    0.30,

  readyTimeout:
    8000,
};


let transitionInProgress =
  false;


/* =====================================================
   HELPERS
   ===================================================== */

function getSkateImage(
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


function preloadMany(
  sources
) {
  sources.forEach(
    (src) =>
      preloadImage(
        src
      )
  );
}


function createImageGhost(
  sourceImage,
  className
) {
  const image =
    document.createElement(
      "img"
    );

  image.className =
    className;

  image.src =
    sourceImage.currentSrc ||
    sourceImage.src;

  image.alt = "";

  image.draggable =
    false;

  return image;
}


/* =====================================================
   RIDE RIG DOM
   ===================================================== */

function createRideRig() {
  const rig =
    document.createElement(
      "div"
    );

  rig.className =
    "skate-world-transition__rig";


  const base =
    document.createElement(
      "img"
    );

  base.className =
    "skate-world-transition__rig-base";

  base.src =
    ASSETS.rideBase;

  base.alt = "";

  base.draggable =
    false;


  const leftWheel =
    document.createElement(
      "img"
    );

  leftWheel.className =
    "skate-world-transition__wheel skate-world-transition__wheel--left";

  leftWheel.src =
    ASSETS.leftWheel;

  leftWheel.alt = "";

  leftWheel.draggable =
    false;


  const rightWheel =
    document.createElement(
      "img"
    );

  rightWheel.className =
    "skate-world-transition__wheel skate-world-transition__wheel--right";

  rightWheel.src =
    ASSETS.rightWheel;

  rightWheel.alt = "";

  rightWheel.draggable =
    false;


  rig.append(
    base,
    leftWheel,
    rightWheel
  );


  return {
    rig,
    base,
    leftWheel,
    rightWheel,
  };
}


/* =====================================================
   TRANSITION ROOT
   ===================================================== */

function createTransitionLayer() {
  const root =
    document.createElement(
      "div"
    );

  root.className =
    "skate-world-transition";

  root.setAttribute(
    "aria-hidden",
    "true"
  );


  const blackout =
    document.createElement(
      "div"
    );

  blackout.className =
    "skate-world-transition__blackout";


  const ride =
    createRideRig();


  root.append(
    blackout,
    ride.rig
  );


  document.body.appendChild(
    root
  );


  return {
    root,
    blackout,

    ...ride,

    sourceGhost:
      null,

    targetGhost:
      null,
  };
}


/* =====================================================
   GEOMETRIJA RIDE POZE
   ===================================================== */

function getRideRect() {
  const viewport =
    getViewportSize();

  const isMobile =
    viewport.width <=
    700;


  const width =
    isMobile
      ? Math.min(
          viewport.width *
            0.82,
          470
        )
      : Math.min(
          viewport.width *
            0.46,
          790
        );


  const height =
    width /
    RIDE_ASPECT;


  return {
    left:
      (
        viewport.width -
        width
      ) / 2,

    top:
      viewport.height *
        (
          isMobile
            ? 0.56
            : 0.58
        ) -
      height / 2,

    width,
    height,
  };
}


function setFixedRect(
  element,
  rect
) {
  gsap.set(
    element,
    {
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


/* =====================================================
   ROTACIJA TOČKOVA PREMA PREĐENOM PUTU
   ===================================================== */

function wheelRotationForDistance(
  wheel,
  distance
) {
  const diameter =
    wheel
      .getBoundingClientRect()
      .width;


  if (
    !diameter ||
    diameter <= 0
  ) {
    return 720;
  }


  const circumference =
    Math.PI *
    diameter;


  return (
    distance /
    circumference
  ) * 360;
}


/* =====================================================
   PROMISE WRAPPERS ZA GSAP
   ===================================================== */

function playTimeline(
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
   READINESS — SKEJT SVET
   ===================================================== */

async function waitForWorldReady() {
  const result =
    await waitForElement(
      READY_SELECTOR,
      {
        timeout:
          TIMING
            .readyTimeout,

        ready:
          (
            element
          ) =>
            element.getAttribute(
              "data-skate-world-transition-ready"
            ) ===
            "true",
      }
    );


  const background =
    document.querySelector(
      WORLD_BACKGROUND_SELECTOR
    );


  if (background) {
    await decodeImage(
      background
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

async function waitForRoomReady() {
  const result =
    await waitForElement(
      ROOM_SKATE_SELECTOR,
      {
        timeout:
          TIMING
            .readyTimeout,

        ready:
          (
            element
          ) => {
            const rect =
              element
                .getBoundingClientRect();


            return (
              rect.width >
                0 &&
              rect.height >
                0 &&
              element.complete &&
              element
                .naturalWidth >
                0
            );
          },
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


  await waitForPaint(
    2
  );


  return result;
}


/* =====================================================
   PRELOAD — SOBA → SKEJT
   ===================================================== */

export function prepareSkateWorldTransition() {
  const isMobile =
    window.matchMedia(
      "(max-width: 700px)"
    ).matches;


  preloadMany([
    ASSETS.rideBase,

    ASSETS.leftWheel,

    ASSETS.rightWheel,

    isMobile
      ? ASSETS
          .worldMobile
      : ASSETS
          .worldDesktop,
  ]);
}


/* =====================================================
   PRELOAD — SKEJT → SOBA
   ===================================================== */

export function prepareSkateWorldExitTransition() {
  const isMobile =
    window.matchMedia(
      "(max-width: 700px)"
    ).matches;


  preloadMany([
    ASSETS.rideBase,

    ASSETS.leftWheel,

    ASSETS.rightWheel,

    ASSETS.roomSkate,

    isMobile
      ? ASSETS
          .roomMobile
      : ASSETS
          .roomDesktop,
  ]);
}


/* =====================================================
   SOBA → SKEJT SVET
   ===================================================== */

export async function startSkateWorldTransition({
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
    getSkateImage(
      sourceElement
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


  transitionInProgress =
    true;


  const restoreScroll =
    lockDocumentScroll();


  const previousVisibility =
    sourceImage
      .style
      .visibility;


  let layer =
    null;


  let navigationCompleted =
    false;


  try {
    prepareSkateWorldTransition();


    layer =
      createTransitionLayer();


    /* -------------------------------------
       ORIGINALNI SKEJT OSTANE VIDLJIV
       DOK SOBA CRNI
       ------------------------------------- */

    layer.sourceGhost =
      createImageGhost(
        sourceImage,
        "skate-world-transition__source-ghost"
      );


    layer.root.appendChild(
      layer.sourceGhost
    );


    setFixedRect(
      layer.sourceGhost,
      sourceRect
    );


    sourceImage
      .style
      .visibility =
      "hidden";


    /* -------------------------------------
       FINALNA RIDE POZA
       ------------------------------------- */

    const rideRect =
      getRideRect();


    setFixedRect(
      layer.rig,
      rideRect
    );


    const sourceCenterX =
      sourceRect.left +
      sourceRect.width /
        2;


    const sourceCenterY =
      sourceRect.top +
      sourceRect.height /
        2;


    const rideCenterX =
      rideRect.left +
      rideRect.width /
        2;


    const rideCenterY =
      rideRect.top +
      rideRect.height /
        2;


    gsap.set(
      layer.blackout,
      {
        opacity:
          0,

        xPercent:
          0,
      }
    );


    /*
      Novi horizontalni rig počinje
      oko stare pozicije skejta.
    */

    gsap.set(
      layer.rig,
      {
        opacity:
          0,

        x:
          sourceCenterX -
          rideCenterX,

        y:
          sourceCenterY -
          rideCenterY,

        scale:
          0.48,

        rotation:
          -10,
      }
    );


    gsap.set(
      [
        layer.leftWheel,
        layer.rightWheel,
      ],
      {
        rotation:
          0,
      }
    );


    await waitForPaint(
      1
    );


    /* -------------------------------------
       SOBA PCRNI, SKEJT OSTANE
       ------------------------------------- */

    await tweenPromise(
      layer.blackout,
      {
        opacity:
          1,

        duration:
          TIMING
            .blackout,

        ease:
          "power2.inOut",
      }
    );


    /* -------------------------------------
       SOBNI POSE → RIDE POSE
       ------------------------------------- */

    const poseTimeline =
      gsap.timeline({
        paused:
          true,
      });


    poseTimeline.to(
      layer.sourceGhost,
      {
        opacity:
          0,

        scale:
          1.06,

        rotation:
          -6,

        duration:
          TIMING
            .poseChange,

        ease:
          "power2.inOut",
      },
      0
    );


    poseTimeline.to(
      layer.rig,
      {
        opacity:
          1,

        x:
          0,

        y:
          0,

        scale:
          1,

        rotation:
          0,

        duration:
          TIMING
            .poseChange,

        ease:
          "power3.out",
      },
      0.04
    );


    await playTimeline(
      poseTimeline
    );


    layer.sourceGhost
      .remove();


    layer.sourceGhost =
      null;


    /* -------------------------------------
       RUTA SE MENJA DOK JE EKRAN CRN
       ------------------------------------- */

    navigate();


    navigationCompleted =
      true;


    const readyPromise =
      waitForWorldReady();


    /* -------------------------------------
       SKEJT ODLAZI DESNO
       ------------------------------------- */

    const viewport =
      getViewportSize();


    const driveDistance =
      viewport.width -
      rideRect.left +
      rideRect.width *
        0.32;


    const wheelRotation =
      wheelRotationForDistance(
        layer.leftWheel,
        driveDistance
      );


    const driveTimeline =
      gsap.timeline({
        paused:
          true,
      });


    driveTimeline.to(
      layer.rig,
      {
        x:
          driveDistance,

        duration:
          TIMING
            .driveOut,

        ease:
          "power2.in",
      },
      0
    );


    driveTimeline.to(
      [
        layer.leftWheel,
        layer.rightWheel,
      ],
      {
        rotation:
          wheelRotation,

        duration:
          TIMING
            .driveOut,

        ease:
          "none",
      },
      0
    );


    await Promise.all([
      playTimeline(
        driveTimeline
      ),

      readyPromise,
    ]);


    /* -------------------------------------
       SKEJT SVET SE OTKRIVA UDESNO
       ------------------------------------- */

    gsap.set(
      layer.blackout,
      {
        xPercent:
          0,

        opacity:
          1,
      }
    );


    await tweenPromise(
      layer.blackout,
      {
        xPercent:
          100,

        duration:
          TIMING
            .worldReveal,

        ease:
          "power3.inOut",
      }
    );

  } catch (error) {
    console.error(
      "Skate world entry transition failed:",
      error
    );


    if (
      !navigationCompleted
    ) {
      navigate();
    }

  } finally {
    sourceImage
      .style
      .visibility =
      previousVisibility;


    layer?.root?.remove();


    restoreScroll();


    transitionInProgress =
      false;
  }
}


/* =====================================================
   SKEJT SVET → SOBA
   PRAVI REVERSE
   ===================================================== */

export async function startSkateWorldExitTransition({
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


  transitionInProgress =
    true;


  const restoreScroll =
    lockDocumentScroll();


  let layer =
    null;


  let navigationCompleted =
    false;


  let targetImage =
    null;


  let targetPreviousVisibility =
    "";


  try {
    prepareSkateWorldExitTransition();


    layer =
      createTransitionLayer();


    const rideRect =
      getRideRect();


    setFixedRect(
      layer.rig,
      rideRect
    );


    const viewport =
      getViewportSize();


    const entryDistance =
      viewport.width -
      rideRect.left +
      rideRect.width *
        0.34;


    /*
      Black panel je trenutno
      van ekrana desno.
    */

    gsap.set(
      layer.blackout,
      {
        opacity:
          1,

        xPercent:
          100,
      }
    );


    /*
      Skejt čeka van ekrana desno.
    */

    gsap.set(
      layer.rig,
      {
        opacity:
          1,

        x:
          entryDistance,

        y:
          0,

        scale:
          1,

        rotation:
          0,
      }
    );


    const initialWheelRotation =
      wheelRotationForDistance(
        layer.leftWheel,
        entryDistance
      );


    gsap.set(
      [
        layer.leftWheel,
        layer.rightWheel,
      ],
      {
        rotation:
          initialWheelRotation,
      }
    );


    /* -------------------------------------
       SKEJT SVET SE ZATVARA
       DESNO → LEVO
       ------------------------------------- */

    await tweenPromise(
      layer.blackout,
      {
        xPercent:
          0,

        duration:
          TIMING
            .worldClose,

        ease:
          "power3.inOut",
      }
    );


    /* -------------------------------------
       SKEJT ULAZI SA DESNE STRANE
       I USPORAVA
       ------------------------------------- */

    const driveInTimeline =
      gsap.timeline({
        paused:
          true,
      });


    driveInTimeline.to(
      layer.rig,
      {
        x:
          0,

        duration:
          TIMING
            .driveIn,

        ease:
          "power3.out",
      },
      0
    );


    driveInTimeline.to(
      [
        layer.leftWheel,
        layer.rightWheel,
      ],
      {
        rotation:
          0,

        duration:
          TIMING
            .driveIn,

        ease:
          "none",
      },
      0
    );


    await playTimeline(
      driveInTimeline
    );


    /* -------------------------------------
       MOUNTUJEMO SOBU ISPOD CRNILA
       ------------------------------------- */

    navigate();


    navigationCompleted =
      true;


    const roomResult =
      await waitForRoomReady();


    targetImage =
      roomResult.element;


    if (!targetImage) {
      throw new Error(
        "Room skateboard target nije pronađen."
      );
    }


    const targetRect =
      getVisualBox(
        targetImage
      );


    targetPreviousVisibility =
      targetImage
        .style
        .visibility;


    targetImage
      .style
      .visibility =
      "hidden";


    /* -------------------------------------
       KLON PRAVOG SOBNOG SKEJTA
       ------------------------------------- */

    layer.targetGhost =
      createImageGhost(
        targetImage,
        "skate-world-transition__target-ghost"
      );


    layer.root.appendChild(
      layer.targetGhost
    );


    setFixedRect(
      layer.targetGhost,
      targetRect
    );


    gsap.set(
      layer.targetGhost,
      {
        opacity:
          0,
      }
    );


    /* -------------------------------------
       IZRAČUNAJ PUT DO PRAVOG SKEJTA
       ------------------------------------- */

    const targetCenterX =
      targetRect.left +
      targetRect.width /
        2;


    const targetCenterY =
      targetRect.top +
      targetRect.height /
        2;


    const rigRect =
      layer.rig
        .getBoundingClientRect();


    const rigCenterX =
      rigRect.left +
      rigRect.width /
        2;


    const rigCenterY =
      rigRect.top +
      rigRect.height /
        2;


    const handoffDistance =
      Math.hypot(
        targetCenterX -
          rigCenterX,

        targetCenterY -
          rigCenterY
      );


    const handoffRotation =
      wheelRotationForDistance(
        layer.leftWheel,
        handoffDistance
      );


    /* -------------------------------------
       RIDE RIG → TAČNA DOM POZICIJA
       Flip.fit radi shared-element handoff.
       ------------------------------------- */

    const wheelTween =
      tweenPromise(
        [
          layer.leftWheel,
          layer.rightWheel,
        ],
        {
          rotation:
            `-=${handoffRotation}`,

          duration:
            TIMING
              .handoff,

          ease:
            "none",
        }
      );


    const fitTween =
      flipFitPromise(
        layer.rig,
        layer.targetGhost,
        {
          duration:
            TIMING
              .handoff,

          ease:
            "power3.inOut",

          scale:
            true,
        }
      );


    await Promise.all([
      wheelTween,
      fitTween,
    ]);


    /* -------------------------------------
       RIDE POSE → ORIGINALNI SOBNI SKEJT

       Nema praznog frame-a.
       Jedan nestaje dok drugi postaje vidljiv.
       ------------------------------------- */

    await new Promise(
      (resolve) => {
        const handoffTimeline =
          gsap.timeline({
            onComplete:
              resolve,
          });


        handoffTimeline.to(
          layer.targetGhost,
          {
            opacity:
              1,

            duration:
              TIMING
                .handoffCrossfade,

            ease:
              "none",
          },
          0
        );


        handoffTimeline.to(
          layer.rig,
          {
            opacity:
              0,

            duration:
              TIMING
                .handoffCrossfade,

            ease:
              "none",
          },
          0
        );
      }
    );


    /*
      Pravi React DOM skejt sada stoji
      TAČNO ispod identičnog ghosta.
    */

    targetImage
      .style
      .visibility =
      targetPreviousVisibility;


    /* -------------------------------------
       CRNILO NESTAJE.
       SOBA SE VRAĆA OKO SKEJTA.
       ------------------------------------- */

    await tweenPromise(
      layer.blackout,
      {
        opacity:
          0,

        duration:
          TIMING
            .roomReveal,

        ease:
          "power2.out",
      }
    );

  } catch (error) {
    console.error(
      "Skate world exit transition failed:",
      error
    );


    if (
      !navigationCompleted
    ) {
      navigate();
    }

  } finally {
    if (targetImage) {
      targetImage
        .style
        .visibility =
        targetPreviousVisibility;
    }


    layer?.root?.remove();


    restoreScroll();


    transitionInProgress =
      false;
  }
}