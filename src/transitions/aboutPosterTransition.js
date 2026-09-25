import { gsap } from "gsap";

import {
  getViewportSize,
  getVisualBox,
  imageIsReady,
  lockDocumentScroll,
  preloadImage,
  prefersReducedMotion,
  waitForElement,
  waitForPaint,
} from "./routeTransitionCore.js";

import "../styles/transitions/AboutPosterTransition.css";

const ROOM_POSTER_SELECTOR =
  '[data-about-poster-transition-target="room-profile-poster"]';

const MAP_POSTER_SELECTOR =
  '[data-about-poster-transition-target="map-profile-poster"]';

const MAP_BACKGROUND_SELECTOR =
  ".human-one-about__map";

const ROOM_BACKGROUND_SELECTOR =
  ".human-one-room__background";

const ASSETS = {
  sticker:
    "/images/human-one/about/unwanted-sticker.webp",

  posterFrame:
    "/images/human-one/profile-poster.webp",

  mapDesktop:
    "/images/human-one/about/about-map-desktop.webp",

  mapMobile:
    "/images/human-one/about/about-map-mobile.webp",

  roomDesktop:
    "/images/human-one/room-bg.webp",

  roomMobile:
    "/images/human-one/room-bg-mobile.webp",
};

const STICKER_ASPECT_RATIO =
  1122 / 1402;

const GLITCH_SLICE_COUNT =
  10;

const TIMING = {
  blackout:
    0.34,

  moveToCenter:
    0.62,

  centerPause:
    0.08,

  flyToMap:
    0.72,

  nailHit:
    0.32,

  reveal:
    0.48,

  pullFromMap:
    0.18,

  returnToCenter:
    0.72,

  returnToRoom:
    0.62,

  glitchSettle:
    0.12,

  readyTimeout:
    8000,
};

let transitionInProgress =
  false;


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


function timelinePromise(
  timeline
) {
  return new Promise(
    (resolve) => {
      timeline.eventCallback(
        "onComplete",
        resolve
      );

      timeline.play(0);
    }
  );
}


function wait(
  seconds
) {
  return new Promise(
    (resolve) => {
      window.setTimeout(
        resolve,
        seconds * 1000
      );
    }
  );
}


function randomBetween(
  minimum,
  maximum
) {
  return (
    minimum +
    Math.random() *
      (
        maximum -
        minimum
      )
  );
}


function randomSign() {
  return (
    Math.random() < 0.5
      ? -1
      : 1
  );
}


function getCenteredRectFromRatio(
  ratio
) {
  const viewport =
    getViewportSize();

  const isMobile =
    viewport.width <= 700;

  const width =
    isMobile
      ? Math.min(
          viewport.width *
            0.64,
          330
        )
      : Math.min(
          viewport.width *
            0.29,
          520
        );

  const height =
    width /
    Math.max(
      ratio,
      0.1
    );

  return {
    left:
      (
        viewport.width -
        width
      ) / 2,

    top:
      (
        viewport.height -
        height
      ) / 2,

    width,

    height,
  };
}


function getCenteredRectFromElementRect(
  rect
) {
  return getCenteredRectFromRatio(
    rect.width /
      Math.max(
        rect.height,
        1
      )
  );
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


function removeTransitionAttributes(
  element
) {
  element.removeAttribute(
    "id"
  );

  element.removeAttribute(
    "data-about-poster-transition-target"
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
      "[data-about-poster-transition-target]"
    )
    .forEach(
      (child) => {
        child.removeAttribute(
          "data-about-poster-transition-target"
        );
      }
    );
}


function createTransitionLayer() {
  const root =
    document.createElement(
      "div"
    );

  root.className =
    "about-poster-transition";

  root.setAttribute(
    "aria-hidden",
    "true"
  );

  const blackout =
    document.createElement(
      "div"
    );

  blackout.className =
    "about-poster-transition__blackout";

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


function createPaperGhost(
  sourceElement,
  rect,
  extraClassName = ""
) {
  const ghost =
    sourceElement.cloneNode(
      true
    );

  ghost.classList.remove(
    "human-one-room__touch-hover-active"
  );

  ghost.classList.add(
    "about-poster-transition__paper-ghost"
  );

  if (
    extraClassName
  ) {
    ghost.classList.add(
      extraClassName
    );
  }

  removeTransitionAttributes(
    ghost
  );

  ghost.setAttribute(
    "tabindex",
    "-1"
  );

  setFixedRect(
    ghost,
    rect
  );

  gsap.set(
    ghost,
    {
      margin:
        0,

      visibility:
        "visible",

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

      transformOrigin:
        "50% 50%",
    }
  );

  return ghost;
}


function createStickerGhost(
  rect,
  {
    opacity = 1,
    rotation = 0,
    extraClassName = "",
  } = {}
) {
  const image =
    document.createElement(
      "img"
    );

  image.className =
    "about-poster-transition__sticker-ghost";

  if (
    extraClassName
  ) {
    image.classList.add(
      extraClassName
    );
  }

  image.src =
    ASSETS.sticker;

  image.alt =
    "";

  image.draggable =
    false;

  setFixedRect(
    image,
    rect
  );

  gsap.set(
    image,
    {
      opacity,

      x:
        0,

      y:
        0,

      scale:
        1,

      rotation,

      transformOrigin:
        "50% 50%",
    }
  );

  return image;
}


async function ensureImageLoaded(
  image
) {
  if (
    image.complete &&
    image.naturalWidth > 0
  ) {
    return;
  }

  await new Promise(
    (resolve) => {
      const finish =
        () => {
          image.removeEventListener(
            "load",
            finish
          );

          image.removeEventListener(
            "error",
            finish
          );

          resolve();
        };

      image.addEventListener(
        "load",
        finish
      );

      image.addEventListener(
        "error",
        finish
      );
    }
  );

  if (
    typeof image.decode ===
    "function"
  ) {
    try {
      await image.decode();
    } catch {
      // load je dovoljan fallback.
    }
  }
}


function applySliceClip(
  element,
  index,
  count
) {
  const overlap =
    0.45;

  const top =
    Math.max(
      0,
      (
        index /
        count
      ) *
        100 -
        overlap
    );

  const end =
    Math.min(
      100,
      (
        (
          index + 1
        ) /
        count
      ) *
        100 +
        overlap
    );

  const bottom =
    100 -
    end;

  element.style.clipPath =
    `inset(${top}% 0 ${bottom}% 0)`;
}


function createPaperSlices(
  sourceElement,
  rect
) {
  return Array.from(
    {
      length:
        GLITCH_SLICE_COUNT,
    },
    (
      _,
      index
    ) => {
      const slice =
        createPaperGhost(
          sourceElement,
          rect,
          "about-poster-transition__paper-slice"
        );

      applySliceClip(
        slice,
        index,
        GLITCH_SLICE_COUNT
      );

      gsap.set(
        slice,
        {
          opacity:
            0,

          zIndex:
            8,
        }
      );

      return slice;
    }
  );
}


function createStickerSlices(
  rect
) {
  return Array.from(
    {
      length:
        GLITCH_SLICE_COUNT,
    },
    (
      _,
      index
    ) => {
      const slice =
        createStickerGhost(
          rect,
          {
            opacity:
              0,

            extraClassName:
              "about-poster-transition__sticker-slice",
          }
        );

      applySliceClip(
        slice,
        index,
        GLITCH_SLICE_COUNT
      );

      gsap.set(
        slice,
        {
          zIndex:
            8,
        }
      );

      return slice;
    }
  );
}


function createGlitchFlash(
  rect
) {
  const flash =
    document.createElement(
      "div"
    );

  flash.className =
    "about-poster-transition__glitch-flash";

  setFixedRect(
    flash,
    rect
  );

  return flash;
}


function removeElements(
  elements
) {
  elements.forEach(
    (element) => {
      element?.remove();
    }
  );
}


function addPaperSliceAnimation(
  timeline,
  slices,
  direction = 1
) {
  slices.forEach(
    (
      slice,
      index
    ) => {
      const start =
        0.025 +
        index *
          0.009;

      const offset =
        randomBetween(
          10,
          34
        ) *
        randomSign() *
        direction;

      timeline.set(
        slice,
        {
          opacity:
            randomBetween(
              0.55,
              0.95
            ),

          x:
            0,
        },
        start
      );

      timeline.to(
        slice,
        {
          x:
            offset,

          opacity:
            0,

          duration:
            randomBetween(
              0.09,
              0.18
            ),

          ease:
            "steps(2)",
        },
        start +
          0.015
      );
    }
  );
}


function addStickerSliceAnimation(
  timeline,
  slices,
  reverse = false
) {
  slices.forEach(
    (
      slice,
      index
    ) => {
      const start =
        (
          reverse
            ? 0.025
            : 0.075
        ) +
        index *
          0.008;

      const offset =
        randomBetween(
          12,
          38
        ) *
        randomSign();

      const rgbDirection =
        index %
          2 ===
        0
          ? 1
          : -1;

      if (
        reverse
      ) {
        timeline.set(
          slice,
          {
            opacity:
              randomBetween(
                0.6,
                0.95
              ),

            x:
              0,

            filter:
              "drop-shadow(7px 0 0 rgba(255, 20, 45, 0.68)) " +
              "drop-shadow(-7px 0 0 rgba(0, 235, 255, 0.58)) " +
              "contrast(1.22) saturate(1.28)",
          },
          start
        );

        timeline.to(
          slice,
          {
            x:
              offset,

            opacity:
              0,

            duration:
              randomBetween(
                0.09,
                0.17
              ),

            ease:
              "steps(2)",
          },
          start +
            0.015
        );

        return;
      }

      timeline.set(
        slice,
        {
          opacity:
            0,

          x:
            offset,

          filter:
            `drop-shadow(${7 * rgbDirection}px 0 0 rgba(255, 20, 45, 0.70)) ` +
            `drop-shadow(${-7 * rgbDirection}px 0 0 rgba(0, 235, 255, 0.62)) ` +
            "contrast(1.24) saturate(1.30)",
        },
        start
      );

      timeline.to(
        slice,
        {
          opacity:
            randomBetween(
              0.7,
              1
            ),

          x:
            0,

          duration:
            randomBetween(
              0.07,
              0.14
            ),

          ease:
            "steps(2)",
        },
        start +
          0.01
      );

      timeline.to(
        slice,
        {
          opacity:
            0,

          x:
            randomBetween(
              4,
              14
            ) *
            randomSign(),

          duration:
            0.07,

          ease:
            "none",
        },
        start +
          0.15
      );
    }
  );
}


async function morphPaperToSticker({
  root,
  paperGhost,
  paperSource,
  paperRect,
  stickerRect,
}) {
  const stickerGhost =
    createStickerGhost(
      stickerRect,
      {
        opacity:
          0,
      }
    );

  root.appendChild(
    stickerGhost
  );

  await ensureImageLoaded(
    stickerGhost
  );

  const paperSlices =
    createPaperSlices(
      paperSource,
      paperRect
    );

  const stickerSlices =
    createStickerSlices(
      stickerRect
    );

  const flash =
    createGlitchFlash(
      stickerRect
    );

  paperSlices.forEach(
    (slice) => {
      root.appendChild(
        slice
      );
    }
  );

  stickerSlices.forEach(
    (slice) => {
      root.appendChild(
        slice
      );
    }
  );

  root.appendChild(
    flash
  );

  const timeline =
    gsap.timeline({
      paused:
        true,
    });

  timeline.set(
    stickerGhost,
    {
      scale:
        0.965,

      rotation:
        -1.4,

      filter:
        "contrast(1.14) saturate(1.18)",
    },
    0
  );

  timeline.to(
    flash,
    {
      opacity:
        0.72,

      duration:
        0.035,

      ease:
        "none",
    },
    0.02
  );

  timeline.to(
    flash,
    {
      opacity:
        0.08,

      duration:
        0.045,

      ease:
        "none",
    },
    0.055
  );

  timeline.to(
    flash,
    {
      opacity:
        0.45,

      duration:
        0.025,

      ease:
        "none",
    },
    0.12
  );

  timeline.to(
    flash,
    {
      opacity:
        0,

      duration:
        0.09,

      ease:
        "none",
    },
    0.16
  );

  timeline.to(
    paperGhost,
    {
      x:
        4,

      duration:
        0.035,

      ease:
        "none",
    },
    0.02
  );

  timeline.to(
    paperGhost,
    {
      x:
        -5,

      duration:
        0.035,

      ease:
        "none",
    },
    0.055
  );

  timeline.to(
    paperGhost,
    {
      x:
        2,

      duration:
        0.035,

      ease:
        "none",
    },
    0.09
  );

  timeline.to(
    paperGhost,
    {
      x:
        0,

      opacity:
        0,

      scale:
        0.985,

      duration:
        0.2,

      ease:
        "power2.in",
    },
    0.12
  );

  timeline.to(
    stickerGhost,
    {
      opacity:
        1,

      scale:
        1.018,

      rotation:
        0.8,

      duration:
        0.18,

      ease:
        "power2.out",
    },
    0.1
  );

  timeline.to(
    stickerGhost,
    {
      x:
        6,

      duration:
        0.035,

      repeat:
        3,

      yoyo:
        true,

      ease:
        "none",
    },
    0.13
  );

  timeline.to(
    stickerGhost,
    {
      x:
        0,

      scale:
        1,

      rotation:
        0,

      filter:
        "none",

      duration:
        TIMING.glitchSettle,

      ease:
        "power2.out",
    },
    0.33
  );

  addPaperSliceAnimation(
    timeline,
    paperSlices
  );

  addStickerSliceAnimation(
    timeline,
    stickerSlices,
    false
  );

  await timelinePromise(
    timeline
  );

  removeElements([
    ...paperSlices,
    ...stickerSlices,
    flash,
  ]);

  paperGhost.remove();

  gsap.set(
    stickerGhost,
    {
      left:
        stickerRect.left,

      top:
        stickerRect.top,

      width:
        stickerRect.width,

      height:
        stickerRect.height,

      x:
        0,

      y:
        0,

      scale:
        1,

      rotation:
        0,

      opacity:
        1,

      filter:
        "none",
    }
  );

  return stickerGhost;
}


async function morphStickerToPaper({
  root,
  stickerGhost,
  paperSource,
  stickerRect,
  paperRect,
}) {
  const paperGhost =
    createPaperGhost(
      paperSource,
      paperRect
    );

  gsap.set(
    paperGhost,
    {
      opacity:
        0,

      scale:
        0.975,
    }
  );

  root.appendChild(
    paperGhost
  );

  const paperSlices =
    createPaperSlices(
      paperSource,
      paperRect
    );

  const stickerSlices =
    createStickerSlices(
      stickerRect
    );

  const flash =
    createGlitchFlash(
      stickerRect
    );

  paperSlices.forEach(
    (slice) => {
      root.appendChild(
        slice
      );
    }
  );

  stickerSlices.forEach(
    (slice) => {
      root.appendChild(
        slice
      );
    }
  );

  root.appendChild(
    flash
  );

  const timeline =
    gsap.timeline({
      paused:
        true,
    });

  timeline.to(
    flash,
    {
      opacity:
        0.68,

      duration:
        0.035,

      ease:
        "none",
    },
    0.02
  );

  timeline.to(
    flash,
    {
      opacity:
        0.08,

      duration:
        0.045,

      ease:
        "none",
    },
    0.055
  );

  timeline.to(
    flash,
    {
      opacity:
        0,

      duration:
        0.1,

      ease:
        "none",
    },
    0.15
  );

  timeline.to(
    stickerGhost,
    {
      x:
        -5,

      duration:
        0.035,

      ease:
        "none",
    },
    0.02
  );

  timeline.to(
    stickerGhost,
    {
      x:
        6,

      duration:
        0.035,

      ease:
        "none",
    },
    0.055
  );

  timeline.to(
    stickerGhost,
    {
      x:
        0,

      opacity:
        0,

      scale:
        0.985,

      duration:
        0.2,

      ease:
        "power2.in",
    },
    0.11
  );

  timeline.to(
    paperGhost,
    {
      opacity:
        1,

      scale:
        1.015,

      duration:
        0.18,

      ease:
        "power2.out",
    },
    0.11
  );

  timeline.to(
    paperGhost,
    {
      x:
        5,

      duration:
        0.035,

      repeat:
        3,

      yoyo:
        true,

      ease:
        "none",
    },
    0.14
  );

  timeline.to(
    paperGhost,
    {
      x:
        0,

      scale:
        1,

      duration:
        TIMING.glitchSettle,

      ease:
        "power2.out",
    },
    0.33
  );

  addStickerSliceAnimation(
    timeline,
    stickerSlices,
    true
  );

  paperSlices.forEach(
    (
      slice,
      index
    ) => {
      const start =
        0.08 +
        index *
          0.008;

      const offset =
        randomBetween(
          10,
          30
        ) *
        randomSign();

      timeline.set(
        slice,
        {
          opacity:
            0,

          x:
            offset,
        },
        start
      );

      timeline.to(
        slice,
        {
          opacity:
            randomBetween(
              0.68,
              0.96
            ),

          x:
            0,

          duration:
            randomBetween(
              0.07,
              0.13
            ),

          ease:
            "steps(2)",
        },
        start +
          0.01
      );

      timeline.to(
        slice,
        {
          opacity:
            0,

          duration:
            0.07,

          ease:
            "none",
        },
        start +
          0.15
      );
    }
  );

  await timelinePromise(
    timeline
  );

  removeElements([
    ...paperSlices,
    ...stickerSlices,
    flash,
  ]);

  stickerGhost.remove();

  gsap.set(
    paperGhost,
    {
      left:
        paperRect.left,

      top:
        paperRect.top,

      width:
        paperRect.width,

      height:
        paperRect.height,

      x:
        0,

      y:
        0,

      scale:
        1,

      rotation:
        0,

      opacity:
        1,
    }
  );

  return paperGhost;
}


function mapTargetIsReady(
  element
) {
  const rect =
    element.getBoundingClientRect();

  const mapBackground =
    document.querySelector(
      MAP_BACKGROUND_SELECTOR
    );

  const sticker =
    element.querySelector(
      ".human-one-about__profile-poster-sticker"
    );

  return (
    rect.width >
      0 &&
    rect.height >
      0 &&
    mapBackground &&
    imageIsReady(
      mapBackground
    ) &&
    sticker &&
    imageIsReady(
      sticker
    )
  );
}


async function waitForMapTarget() {
  const result =
    await waitForElement(
      MAP_POSTER_SELECTOR,
      {
        timeout:
          TIMING.readyTimeout,

        ready:
          mapTargetIsReady,
      }
    );

  await waitForPaint(
    2
  );

  return result.element;
}


function roomTargetIsReady(
  element
) {
  const rect =
    element.getBoundingClientRect();

  const roomBackground =
    document.querySelector(
      ROOM_BACKGROUND_SELECTOR
    );

  const frame =
    element.querySelector(
      ".human-one-room__profile-poster-frame"
    );

  const photo =
    element.querySelector(
      ".human-one-room__profile-photo"
    );

  return (
    rect.width >
      0 &&
    rect.height >
      0 &&
    roomBackground &&
    imageIsReady(
      roomBackground
    ) &&
    frame &&
    imageIsReady(
      frame
    ) &&
    (
      !photo ||
      imageIsReady(
        photo
      )
    )
  );
}


async function waitForRoomTarget() {
  const result =
    await waitForElement(
      ROOM_POSTER_SELECTOR,
      {
        timeout:
          TIMING.readyTimeout,

        ready:
          roomTargetIsReady,
      }
    );

  await waitForPaint(
    2
  );

  return result.element;
}


export function prepareAboutPosterTransition() {
  const isMobile =
    window.matchMedia(
      "(max-width: 700px)"
    ).matches;

  preloadImage(
    ASSETS.sticker
  );

  preloadImage(
    ASSETS.posterFrame
  );

  preloadImage(
    isMobile
      ? ASSETS.mapMobile
      : ASSETS.mapDesktop
  );

  preloadImage(
    isMobile
      ? ASSETS.roomMobile
      : ASSETS.roomDesktop
  );
}


export async function startAboutPosterTransition({
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

  const source =
    sourceElement ||
    document.querySelector(
      ROOM_POSTER_SELECTOR
    );

  if (
    !source
  ) {
    navigate();
    return;
  }

  const sourceRect =
    getVisualBox(
      source
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

  const sourcePreviousVisibility =
    source.style.visibility;

  let layer =
    null;

  let paperGhost =
    null;

  let stickerGhost =
    null;

  let mapTarget =
    null;

  let mapTargetPreviousVisibility =
    "";

  let navigationCompleted =
    false;

  try {
    prepareAboutPosterTransition();

    layer =
      createTransitionLayer();

    paperGhost =
      createPaperGhost(
        source,
        sourceRect
      );

    layer.root.appendChild(
      paperGhost
    );

    source.style.visibility =
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

    await tweenPromise(
      layer.blackout,
      {
        opacity:
          1,

        duration:
          TIMING.blackout,

        ease:
          "power2.inOut",
      }
    );

    const paperCenterRect =
      getCenteredRectFromElementRect(
        sourceRect
      );

    await tweenPromise(
      paperGhost,
      {
        left:
          paperCenterRect.left,

        top:
          paperCenterRect.top,

        width:
          paperCenterRect.width,

        height:
          paperCenterRect.height,

        rotation:
          -0.5,

        duration:
          TIMING.moveToCenter,

        ease:
          "power3.inOut",
      }
    );

    await wait(
      TIMING.centerPause
    );

    const stickerCenterRect =
      getCenteredRectFromRatio(
        STICKER_ASPECT_RATIO
      );

    stickerGhost =
      await morphPaperToSticker({
        root:
          layer.root,

        paperGhost,

        paperSource:
          source,

        paperRect:
          paperCenterRect,

        stickerRect:
          stickerCenterRect,
      });

    paperGhost =
      null;

    await wait(
      TIMING.centerPause
    );

    navigate();

    navigationCompleted =
      true;

    mapTarget =
      await waitForMapTarget();

    if (
      !mapTarget
    ) {
      await tweenPromise(
        layer.blackout,
        {
          opacity:
            0,

          duration:
            TIMING.reveal,

          ease:
            "power2.out",
        }
      );

      return;
    }

    mapTargetPreviousVisibility =
      mapTarget.style.visibility;

    mapTarget.style.visibility =
      "hidden";

    const targetRect =
      getVisualBox(
        mapTarget
      );

    await tweenPromise(
      stickerGhost,
      {
        left:
          targetRect.left,

        top:
          targetRect.top,

        width:
          targetRect.width,

        height:
          targetRect.height,

        rotation:
          -2,

        duration:
          TIMING.flyToMap,

        ease:
          "power3.inOut",
      }
    );

    const nailTimeline =
      gsap.timeline({
        paused:
          true,
      });

    nailTimeline.to(
      stickerGhost,
      {
        y:
          -5,

        scale:
          1.055,

        rotation:
          -1.2,

        duration:
          0.08,

        ease:
          "power2.out",
      }
    );

    nailTimeline.to(
      stickerGhost,
      {
        y:
          2,

        scale:
          0.975,

        rotation:
          -2.8,

        duration:
          0.08,

        ease:
          "power2.in",
      }
    );

    nailTimeline.to(
      stickerGhost,
      {
        y:
          0,

        scale:
          1,

        rotation:
          -2,

        duration:
          TIMING.nailHit -
          0.16,

        ease:
          "elastic.out(1, 0.55)",
      }
    );

    await timelinePromise(
      nailTimeline
    );

    mapTarget.style.visibility =
      mapTargetPreviousVisibility;

    stickerGhost.remove();

    stickerGhost =
      null;

    await tweenPromise(
      layer.blackout,
      {
        opacity:
          0,

        duration:
          TIMING.reveal,

        ease:
          "power2.out",
      }
    );
  } catch (
    error
  ) {
    console.error(
      "About poster transition failed:",
      error
    );

    if (
      !navigationCompleted
    ) {
      navigate();
    }
  } finally {
    if (
      source?.isConnected
    ) {
      source.style.visibility =
        sourcePreviousVisibility;
    }

    if (
      mapTarget
    ) {
      mapTarget.style.visibility =
        mapTargetPreviousVisibility;
    }

    paperGhost?.remove();
    stickerGhost?.remove();
    layer?.root?.remove();

    restoreScroll();

    transitionInProgress =
      false;
  }
}


export async function startAboutPosterExitTransition({
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

  const source =
    sourceElement ||
    document.querySelector(
      MAP_POSTER_SELECTOR
    );

  if (
    !source
  ) {
    navigate();
    return;
  }

  const sourceRect =
    getVisualBox(
      source
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

  const sourcePreviousVisibility =
    source.style.visibility;

  let layer =
    null;

  let stickerGhost =
    null;

  let paperGhost =
    null;

  let roomTarget =
    null;

  let roomTargetPreviousVisibility =
    "";

  let navigationCompleted =
    false;

  try {
    prepareAboutPosterTransition();

    layer =
      createTransitionLayer();

    stickerGhost =
      createStickerGhost(
        sourceRect,
        {
          rotation:
            -2,
        }
      );

    layer.root.appendChild(
      stickerGhost
    );

    await ensureImageLoaded(
      stickerGhost
    );

    source.style.visibility =
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

    await tweenPromise(
      layer.blackout,
      {
        opacity:
          1,

        duration:
          TIMING.blackout,

        ease:
          "power2.inOut",
      }
    );

    await tweenPromise(
      stickerGhost,
      {
        y:
          -5,

        scale:
          1.045,

        rotation:
          -0.8,

        duration:
          TIMING.pullFromMap,

        ease:
          "power2.out",
      }
    );

    const stickerCenterRect =
      getCenteredRectFromRatio(
        STICKER_ASPECT_RATIO
      );

    await tweenPromise(
      stickerGhost,
      {
        left:
          stickerCenterRect.left,

        top:
          stickerCenterRect.top,

        width:
          stickerCenterRect.width,

        height:
          stickerCenterRect.height,

        x:
          0,

        y:
          0,

        scale:
          1,

        rotation:
          0,

        duration:
          TIMING.returnToCenter,

        ease:
          "power3.inOut",
      }
    );

    await wait(
      TIMING.centerPause
    );

    navigate();

    navigationCompleted =
      true;

    roomTarget =
      await waitForRoomTarget();

    if (
      !roomTarget
    ) {
      await tweenPromise(
        layer.blackout,
        {
          opacity:
            0,

          duration:
            TIMING.reveal,

          ease:
            "power2.out",
        }
      );

      return;
    }

    roomTargetPreviousVisibility =
      roomTarget.style.visibility;

    roomTarget.style.visibility =
      "hidden";

    const roomTargetRect =
      getVisualBox(
        roomTarget
      );

    const paperCenterRect =
      getCenteredRectFromElementRect(
        roomTargetRect
      );

    paperGhost =
      await morphStickerToPaper({
        root:
          layer.root,

        stickerGhost,

        paperSource:
          roomTarget,

        stickerRect:
          stickerCenterRect,

        paperRect:
          paperCenterRect,
      });

    stickerGhost =
      null;

    await wait(
      TIMING.centerPause
    );

    await tweenPromise(
      paperGhost,
      {
        left:
          roomTargetRect.left,

        top:
          roomTargetRect.top,

        width:
          roomTargetRect.width,

        height:
          roomTargetRect.height,

        rotation:
          0,

        duration:
          TIMING.returnToRoom,

        ease:
          "power3.inOut",
      }
    );

    roomTarget.style.visibility =
      roomTargetPreviousVisibility;

    paperGhost.remove();

    paperGhost =
      null;

    await tweenPromise(
      layer.blackout,
      {
        opacity:
          0,

        duration:
          TIMING.reveal,

        ease:
          "power2.out",
      }
    );
  } catch (
    error
  ) {
    console.error(
      "About poster exit transition failed:",
      error
    );

    if (
      !navigationCompleted
    ) {
      navigate();
    }
  } finally {
    if (
      source?.isConnected
    ) {
      source.style.visibility =
        sourcePreviousVisibility;
    }

    if (
      roomTarget
    ) {
      roomTarget.style.visibility =
        roomTargetPreviousVisibility;
    }

    stickerGhost?.remove();
    paperGhost?.remove();
    layer?.root?.remove();

    restoreScroll();

    transitionInProgress =
      false;
  }
}