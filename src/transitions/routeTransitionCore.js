const REDUCED_MOTION_MEDIA =
  "(prefers-reduced-motion: reduce)";


export function prefersReducedMotion() {
  return window.matchMedia(
    REDUCED_MOTION_MEDIA
  ).matches;
}


export function waitForAnimation(
  animation
) {
  return animation.finished.catch(
    () => undefined
  );
}


export function waitForPaint(
  frameCount = 2
) {
  return new Promise(
    (resolve) => {
      let remaining =
        frameCount;

      function nextFrame() {
        remaining -= 1;

        if (remaining <= 0) {
          resolve();
          return;
        }

        requestAnimationFrame(
          nextFrame
        );
      }

      requestAnimationFrame(
        nextFrame
      );
    }
  );
}


export function lockDocumentScroll() {
  const previousBodyOverflow =
    document.body.style.overflow;

  const previousHtmlOverflow =
    document.documentElement
      .style.overflow;

  document.body.style.overflow =
    "hidden";

  document.documentElement
    .style.overflow =
    "hidden";


  return () => {
    document.body.style.overflow =
      previousBodyOverflow;

    document.documentElement
      .style.overflow =
      previousHtmlOverflow;
  };
}


export function imageIsReady(
  element
) {
  if (
    !(element instanceof HTMLImageElement)
  ) {
    return true;
  }

  return (
    element.complete &&
    element.naturalWidth > 0
  );
}


export async function decodeImage(
  image
) {
  if (
    !(image instanceof HTMLImageElement)
  ) {
    return;
  }

  if (
    typeof image.decode === "function"
  ) {
    try {
      await image.decode();
    } catch {
      // Ako browser ne može da decode-uje sliku,
      // onLoad / complete i dalje ostaju fallback.
    }
  }
}


export function waitForElement(
  selector,
  {
    timeout = 7000,
    ready = null,
  } = {}
) {
  return new Promise(
    (resolve) => {
      const startedAt =
        performance.now();

      function check() {
        const element =
          document.querySelector(
            selector
          );

        const isReady =
          element &&
          (
            typeof ready !== "function" ||
            ready(element)
          );

        if (isReady) {
          resolve({
            element,
            timedOut: false,
          });

          return;
        }

        if (
          performance.now() -
            startedAt >=
          timeout
        ) {
          resolve({
            element:
              element || null,
            timedOut: true,
          });

          return;
        }

        requestAnimationFrame(
          check
        );
      }

      check();
    }
  );
}


export function createImageSnapshot(
  imageElement,
  className
) {
  const computed =
    window.getComputedStyle(
      imageElement
    );

  const image =
    document.createElement(
      "img"
    );

  image.className =
    className;

  image.src =
    imageElement.currentSrc ||
    imageElement.src;

  image.alt = "";
  image.draggable = false;

  image.style.objectFit =
    computed.objectFit ||
    "contain";

  image.style.objectPosition =
    computed.objectPosition ||
    "center center";

  image.style.filter =
    computed.filter === "none"
      ? "none"
      : computed.filter;

  return image;
}


export function applyRect(
  element,
  rect
) {
  element.style.left =
    `${rect.left}px`;

  element.style.top =
    `${rect.top}px`;

  element.style.width =
    `${rect.width}px`;

  element.style.height =
    `${rect.height}px`;
}


export function getViewportSize() {
  return {
    width:
      document.documentElement
        .clientWidth ||
      window.innerWidth,

    height:
      document.documentElement
        .clientHeight ||
      window.innerHeight,
  };
}


export function getVisualBox(
  element
) {
  const rect =
    element.getBoundingClientRect();

  return {
    left:
      rect.left,

    top:
      rect.top,

    width:
      rect.width,

    height:
      rect.height,

    right:
      rect.right,

    bottom:
      rect.bottom,
  };
}


export function preloadImage(
  src
) {
  if (!src) {
    return;
  }

  const image =
    new Image();

  image.decoding =
    "async";

  image.src =
    src;
}