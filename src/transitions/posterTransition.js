import {
  gsap,
} from "gsap";

import {
  decodeImage,
  getVisualBox,
  getViewportSize,
  imageIsReady,
  lockDocumentScroll,
  preloadImage,
  prefersReducedMotion,
  waitForElement,
  waitForPaint,
} from "./routeTransitionCore.js";

import "../styles/transitions/PosterTransition.css";


const ROOM_POSTERS_SELECTOR =
  '[data-poster-transition-target="room-posters"]';

const POSTERS_PAGE_SELECTOR =
  '[data-poster-transition-page="true"]';

const ROOM_BACKGROUND_SELECTOR =
  ".human-one-room__background";


const POSTERS_ASSET =
  "/images/human-one/posters.png";

const ROOM_DESKTOP_BACKGROUND =
  "/images/human-one/room-bg.png";

const ROOM_MOBILE_BACKGROUND =
  "/images/human-one/room-bg-mobile.png";


/* =====================================================
   TIMING
   ===================================================== */

const TIMING = {
  blackout:
    0.32,

  center:
    0.68,


  /*
   * ULAZ
   */

  grip:
    0.24,

  tension:
    0.11,

  tearWaveGap:
  0.115,

  tearPieceStagger:
    0.018,

  driftMin:
    1.02,

  driftMax:
    1.34,

  gustMin:
    0.72,

  gustMax:
    0.94,

  revealPosters:
    0.52,


  /*
   * POVRATAK
   */

  exitBlackout:
    0.40,

  returnStagger:
    0.055,

  returnWindMin:
    0.94,

  returnWindMax:
    1.22,

  returnGlueMin:
    0.50,

  returnGlueMax:
    0.66,

  revealRoom:
    0.56,

  readyTimeout:
    8000,
};


let transitionInProgress =
  false;


/* =====================================================
   RANDOM
   ===================================================== */

function createRandom(
  seed = 20260911
) {
  let value =
    seed >>> 0;


  return () => {
    value +=
      0x6d2b79f5;

    let next =
      value;


    next =
      Math.imul(
        next ^
        (
          next >>>
          15
        ),
        next |
        1
      );


    next ^=
      next +
      Math.imul(
        next ^
        (
          next >>>
          7
        ),
        next |
        61
      );


    return (
      (
        next ^
        (
          next >>>
          14
        )
      ) >>>
      0
    ) /
    4294967296;
  };
}


function randomBetween(
  random,
  minimum,
  maximum
) {
  return (
    minimum +
    random() *
    (
      maximum -
      minimum
    )
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


/* =====================================================
   IMAGE
   ===================================================== */

function getPostersImage(
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


async function loadImage(
  src
) {
  const image =
    new Image();


  image.src =
    src;


  await new Promise(
    (
      resolve,
      reject
    ) => {
      if (
        image.complete &&
        image.naturalWidth >
          0
      ) {
        resolve();

        return;
      }


      image.onload =
        resolve;


      image.onerror =
        () => {
          reject(
            new Error(
              `Poster asset nije učitan: ${src}`
            )
          );
        };
    }
  );


  await decodeImage(
    image
  );


  return image;
}


/* =====================================================
   ALPHA CROP
   ===================================================== */

function getAlphaCrop(
  image
) {
  const naturalWidth =
    image.naturalWidth ||
    1;

  const naturalHeight =
    image.naturalHeight ||
    1;


  const maxSampleSide =
    640;


  const sampleScale =
    Math.min(
      1,
      maxSampleSide /
      Math.max(
        naturalWidth,
        naturalHeight
      )
    );


  const sampleWidth =
    Math.max(
      1,
      Math.round(
        naturalWidth *
        sampleScale
      )
    );


  const sampleHeight =
    Math.max(
      1,
      Math.round(
        naturalHeight *
        sampleScale
      )
    );


  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.width =
    sampleWidth;

  canvas.height =
    sampleHeight;


  const context =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true,
      }
    );


  if (!context) {
    return {
      sx:
        0,

      sy:
        0,

      sw:
        naturalWidth,

      sh:
        naturalHeight,

      nx:
        0,

      ny:
        0,

      nw:
        1,

      nh:
        1,
    };
  }


  context.clearRect(
    0,
    0,
    sampleWidth,
    sampleHeight
  );


  context.drawImage(
    image,
    0,
    0,
    sampleWidth,
    sampleHeight
  );


  const data =
    context.getImageData(
      0,
      0,
      sampleWidth,
      sampleHeight
    ).data;


  let minX =
    sampleWidth;

  let minY =
    sampleHeight;

  let maxX =
    -1;

  let maxY =
    -1;


  for (
    let y = 0;
    y < sampleHeight;
    y += 1
  ) {
    for (
      let x = 0;
      x < sampleWidth;
      x += 1
    ) {
      const alpha =
        data[
          (
            y *
            sampleWidth +
            x
          ) *
          4 +
          3
        ];


      if (
        alpha <=
        8
      ) {
        continue;
      }


      minX =
        Math.min(
          minX,
          x
        );

      minY =
        Math.min(
          minY,
          y
        );

      maxX =
        Math.max(
          maxX,
          x
        );

      maxY =
        Math.max(
          maxY,
          y
        );
    }
  }


  if (
    maxX < minX ||
    maxY < minY
  ) {
    return {
      sx:
        0,

      sy:
        0,

      sw:
        naturalWidth,

      sh:
        naturalHeight,

      nx:
        0,

      ny:
        0,

      nw:
        1,

      nh:
        1,
    };
  }


  const padding =
    2;


  minX =
    clamp(
      minX -
      padding,
      0,
      sampleWidth -
      1
    );


  minY =
    clamp(
      minY -
      padding,
      0,
      sampleHeight -
      1
    );


  maxX =
    clamp(
      maxX +
      padding,
      0,
      sampleWidth -
      1
    );


  maxY =
    clamp(
      maxY +
      padding,
      0,
      sampleHeight -
      1
    );


  const nx =
    minX /
    sampleWidth;

  const ny =
    minY /
    sampleHeight;

  const nw =
    (
      maxX -
      minX +
      1
    ) /
    sampleWidth;

  const nh =
    (
      maxY -
      minY +
      1
    ) /
    sampleHeight;


  return {
    sx:
      nx *
      naturalWidth,

    sy:
      ny *
      naturalHeight,

    sw:
      nw *
      naturalWidth,

    sh:
      nh *
      naturalHeight,

    nx,
    ny,
    nw,
    nh,
  };
}


/* =====================================================
   GEOMETRIJA POSTERA
   ===================================================== */

function getPosterTransformState(
  image
) {
  const owner =
    image.closest(
      ".human-one-room__posters"
    ) ||
    image;


  const ownerStyle =
    window.getComputedStyle(
      owner
    );


  const imageRect =
    image
      .getBoundingClientRect();


  let rotation =
    0;


  const rotateValue =
    ownerStyle.rotate;


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
      rotation =
        parsed;
    }
  }


  let scaleX =
    1;

  let scaleY =
    1;


  const transform =
    ownerStyle.transform;


  if (
    transform &&
    transform !==
      "none"
  ) {
    const matrixMatch =
      transform.match(
        /^matrix\(([^)]+)\)$/
      );


    if (matrixMatch) {
      const values =
        matrixMatch[1]
          .split(",")
          .map(
            (
              value
            ) =>
              Number.parseFloat(
                value
              )
          );


      if (
        values.length >=
          4 &&
        values.every(
          Number.isFinite
        )
      ) {
        scaleX =
          Math.hypot(
            values[0],
            values[1]
          ) ||
          1;


        scaleY =
          Math.hypot(
            values[2],
            values[3]
          ) ||
          1;
      }
    }
  }


  const layoutWidth =
    image.offsetWidth ||
    imageRect.width;


  const layoutHeight =
    image.offsetHeight ||
    imageRect.height;


  const width =
    layoutWidth *
    scaleX;


  const height =
    layoutHeight *
    scaleY;


  const centerX =
    imageRect.left +
    imageRect.width /
    2;


  const centerY =
    imageRect.top +
    imageRect.height /
    2;


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
    rotation,
  };
}


function getCroppedRenderState(
  fullState,
  crop
) {
  const width =
    fullState.width *
    crop.nw;


  const height =
    fullState.height *
    crop.nh;


  const fullCenterX =
    fullState.left +
    fullState.width /
    2;


  const fullCenterY =
    fullState.top +
    fullState.height /
    2;


  const localOffsetX =
    (
      crop.nx +
      crop.nw /
      2 -
      0.5
    ) *
    fullState.width;


  const localOffsetY =
    (
      crop.ny +
      crop.nh /
      2 -
      0.5
    ) *
    fullState.height;


  const radians =
    fullState.rotation *
    Math.PI /
    180;


  const rotatedOffsetX =
    localOffsetX *
      Math.cos(
        radians
      ) -
    localOffsetY *
      Math.sin(
        radians
      );


  const rotatedOffsetY =
    localOffsetX *
      Math.sin(
        radians
      ) +
    localOffsetY *
      Math.cos(
        radians
      );


  const centerX =
    fullCenterX +
    rotatedOffsetX;


  const centerY =
    fullCenterY +
    rotatedOffsetY;


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

    rotation:
      fullState.rotation,
  };
}


function getCenteredRect(
  sourceRect
) {
  const viewport =
    getViewportSize();


  const isMobile =
    viewport.width <=
    700;


  const ratio =
    sourceRect.width /
    Math.max(
      sourceRect.height,
      1
    );


  let width =
    isMobile
      ? Math.min(
          viewport.width *
          0.7,
          390
        )
      : Math.min(
          viewport.width *
          0.38,
          600
        );


  let height =
    width /
    Math.max(
      ratio,
      0.1
    );


  const maxHeight =
    viewport.height *
    (
      isMobile
        ? 0.58
        : 0.62
    );


  if (
    height >
    maxHeight
  ) {
    height =
      maxHeight;

    width =
      height *
      ratio;
  }


  return {
    left:
      (
        viewport.width -
        width
      ) /
      2,

    top:
      (
        viewport.height -
        height
      ) /
      2,

    width,
    height,

    rotation:
      0,
  };
}


/* =====================================================
   FRAGMENTI
   ===================================================== */

function createFragments() {
  const viewport =
    getViewportSize();


  const isMobile =
    viewport.width <=
    700;


  const columns =
    isMobile
      ? 4
      : 5;


  const rows =
    4;


  const random =
    createRandom();


  const nodes =
    Array.from(
      {
        length:
          rows +
          1,
      },
      (
        _,
        row
      ) =>
        Array.from(
          {
            length:
              columns +
              1,
          },
          (
            __,
            column
          ) => {
            const edgeX =
              column ===
                0 ||
              column ===
                columns;


            const edgeY =
              row ===
                0 ||
              row ===
                rows;


            const baseX =
              column /
              columns;


            const baseY =
              row /
              rows;


            return {
              x:
                edgeX
                  ? baseX
                  : baseX +
                    randomBetween(
                      random,
                      -0.04,
                      0.04
                    ),

              y:
                edgeY
                  ? baseY
                  : baseY +
                    randomBetween(
                      random,
                      -0.04,
                      0.04
                    ),
            };
          }
        )
    );


  const horizontalMidpoints =
    [];


  for (
    let row = 0;
    row <= rows;
    row += 1
  ) {
    horizontalMidpoints[
      row
    ] = [];


    for (
      let column = 0;
      column < columns;
      column += 1
    ) {
      const a =
        nodes[
          row
        ][
          column
        ];


      const b =
        nodes[
          row
        ][
          column +
          1
        ];


      const edge =
        row === 0 ||
        row === rows;


      horizontalMidpoints[
        row
      ][
        column
      ] = {
        x:
          (
            a.x +
            b.x
          ) /
          2,

        y:
          (
            a.y +
            b.y
          ) /
          2 +
          (
            edge
              ? 0
              : randomBetween(
                  random,
                  -0.025,
                  0.025
                )
          ),
      };
    }
  }


  const verticalMidpoints =
    [];


  for (
    let row = 0;
    row < rows;
    row += 1
  ) {
    verticalMidpoints[
      row
    ] = [];


    for (
      let column = 0;
      column <= columns;
      column += 1
    ) {
      const a =
        nodes[
          row
        ][
          column
        ];


      const b =
        nodes[
          row +
          1
        ][
          column
        ];


      const edge =
        column === 0 ||
        column ===
          columns;


      verticalMidpoints[
        row
      ][
        column
      ] = {
        x:
          (
            a.x +
            b.x
          ) /
          2 +
          (
            edge
              ? 0
              : randomBetween(
                  random,
                  -0.025,
                  0.025
                )
          ),

        y:
          (
            a.y +
            b.y
          ) /
          2,
      };
    }
  }


  const fragments =
    [];


  for (
    let row = 0;
    row < rows;
    row += 1
  ) {
    for (
      let column = 0;
      column < columns;
      column += 1
    ) {
      const topLeft =
        nodes[
          row
        ][
          column
        ];


      const topRight =
        nodes[
          row
        ][
          column +
          1
        ];


      const bottomRight =
        nodes[
          row +
          1
        ][
          column +
          1
        ];


      const bottomLeft =
        nodes[
          row +
          1
        ][
          column
        ];


      const points = [
        topLeft,

        horizontalMidpoints[
          row
        ][
          column
        ],

        topRight,

        verticalMidpoints[
          row
        ][
          column +
          1
        ],

        bottomRight,

        horizontalMidpoints[
          row +
          1
        ][
          column
        ],

        bottomLeft,

        verticalMidpoints[
          row
        ][
          column
        ],
      ];


      const centroid =
        points.reduce(
          (
            total,
            point
          ) => ({
            x:
              total.x +
              point.x /
              points.length,

            y:
              total.y +
              point.y /
              points.length,
          }),
          {
            x:
              0,

            y:
              0,
          }
        );


      let ripDirection;


      if (
        centroid.x <
        0.42
      ) {
        ripDirection =
          -1;

      } else if (
        centroid.x >
        0.58
      ) {
        ripDirection =
          1;

      } else {
        ripDirection =
          random() >
          0.5
            ? 1
            : -1;
      }


      /*
       * SADA JE HORIZONTALNO BACANJE
       * NAMERNO MALO.
       */

      const throwDistance =
        randomBetween(
          random,

          viewport.width *
          (
            isMobile
              ? 0.035
              : 0.045
          ),

          viewport.width *
          (
            isMobile
              ? 0.075
              : 0.095
          )
        );


      /*
       * KLJUČNA PROMENA:
       *
       * svi komadi u trenutku cepanja
       * prvo idu MALO NAGORE.
       */

      const throwY =
        -randomBetween(
          random,

          viewport.height *
          (
            isMobile
              ? 0.045
              : 0.055
          ),

          viewport.height *
          (
            isMobile
              ? 0.095
              : 0.115
          )
        );


      fragments.push({
        id:
          `${row}-${column}`,

        row,
        column,
        columns,
        rows,

        points,

        cx:
          centroid.x,

        cy:
          centroid.y,


        /* =================================
           STANJE
           ================================= */

        x:
          0,

        y:
          0,

        rotation:
          0,

        scale:
          1,

        opacity:
          1,

        swayAmp:
          0,

        swaySpeed:
          randomBetween(
            random,
            isMobile
              ? 1.15
              : 1.4,
            isMobile
              ? 1.85
              : 2.15
          ),

        swayPhase:
          randomBetween(
            random,
            0,
            Math.PI *
            2
          ),


        /* =================================
           HVATANJE
           ================================= */

        ripDirection,

        gripX:
          ripDirection *
          randomBetween(
            random,
            11,
            isMobile
              ? 20
              : 24
          ),

        gripY:
          randomBetween(
            random,
            -5,
            5
          ),

        gripRotation:
          ripDirection *
          randomBetween(
            random,
            1.5,
            5
          ),


        /* =================================
           OTPOR PAPIRA
           ================================= */

        tensionX:
          ripDirection *
          randomBetween(
            random,
            -5,
            -2
          ),

        tensionY:
          randomBetween(
            random,
            -2,
            2
          ),

        tensionRotation:
          ripDirection *
          randomBetween(
            random,
            -2,
            -0.7
          ),


        /* =================================
           KRATAK TRZAJ NAGORE
           ================================= */

        throwX:
          ripDirection *
          throwDistance,

        throwY,

        throwRotation:
          ripDirection *
          randomBetween(
            random,
            isMobile
              ? 18
              : 22,
            isMobile
              ? 42
              : 52
          ),

        throwDuration:
          randomBetween(
            random,
            isMobile
              ? 0.42
              : 0.38,
            isMobile
              ? 0.56
              : 0.50
          ),


        /* =================================
           POLAKO PADANJE NA VETRU
           ================================= */

        driftX:
          ripDirection *
          randomBetween(
            random,
            isMobile
              ? 15
              : 22,
            isMobile
              ? 46
              : 58
          ) +
          randomBetween(
            random,
            -18,
            18
          ),

        driftY:
          randomBetween(
            random,
            viewport.height *
            (
              isMobile
                ? 0.25
                : 0.23
            ),
            viewport.height *
            (
              isMobile
                ? 0.42
                : 0.38
            )
          ),

        driftRotation:
          ripDirection *
          randomBetween(
            random,
            10,
            isMobile
              ? 28
              : 34
          ),

        driftDuration:
          randomBetween(
            random,
            isMobile
              ? 1.28
              : TIMING.driftMin,
            isMobile
              ? 1.62
              : TIMING.driftMax
          ),


        /* =================================
           VETAR NA KRAJU
           ================================= */

        gustLift:
          randomBetween(
            random,
            -75,
            65
          ),

        gustRotation:
          randomBetween(
            random,
            -45,
            45
          ),

        gustDuration:
          randomBetween(
            random,
            isMobile
              ? 0.82
              : TIMING.gustMin,
            isMobile
              ? 1.02
              : TIMING.gustMax
          ),


        /* =================================
           POVRATAK
           ================================= */

        returnStartYOffset:
          randomBetween(
            random,
            -viewport.height *
            (
              isMobile
                ? 0.20
                : 0.28
            ),
            viewport.height *
            (
              isMobile
                ? 0.20
                : 0.28
            )
          ),

        returnStartExtra:
          randomBetween(
            random,
            isMobile
              ? 65
              : 90,
            isMobile
              ? 150
              : 220
          ),

        returnRotation:
          randomBetween(
            random,
            isMobile
              ? -56
              : -85,
            isMobile
              ? 56
              : 85
          ),

        returnPreX:
          randomBetween(
            random,
            isMobile
              ? 22
              : 32,
            isMobile
              ? 52
              : 78
          ),

        returnPreY:
          randomBetween(
            random,
            isMobile
              ? -20
              : -30,
            isMobile
              ? 20
              : 30
          ),

        returnPreRotation:
          randomBetween(
            random,
            isMobile
              ? -5
              : -9,
            isMobile
              ? 5
              : 9
          ),

        returnWindDuration:
          randomBetween(
            random,
            isMobile
              ? 1.14
              : TIMING.returnWindMin,
            isMobile
              ? 1.42
              : TIMING.returnWindMax
          ),

        returnGlueDuration:
          randomBetween(
            random,
            isMobile
              ? 0.60
              : TIMING.returnGlueMin,
            isMobile
              ? 0.78
              : TIMING.returnGlueMax
          ),
      });
    }
  }


  return fragments;
}


/* =====================================================
   CEPANJE ODOZGO NADOLЕ
   ===================================================== */

function getTearWaves(
  fragments
) {
  const ordered =
    [
      ...fragments,
    ].sort(
      (
        a,
        b
      ) => {
        /*
         * Prvo strogo odozgo nadole.
         */
        if (
          a.row !==
          b.row
        ) {
          return (
            a.row -
            b.row
          );
        }


        /*
         * Unutar reda malo prirodniji ritam:
         *
         * prvi red levo → desno,
         * drugi desno → levo,
         * pa opet obrnuto.
         *
         * I dalje se cepa JEDAN PO JEDAN.
         */

        if (
          a.row %
          2 ===
          0
        ) {
          return (
            a.column -
            b.column
          );
        }


        return (
          b.column -
          a.column
        );
      }
    );


  /*
   * Svaki wave sada ima TAČNO JEDAN komad.
   */

  return ordered.map(
    (
      fragment
    ) => [
      fragment,
    ]
  );
}


/* =====================================================
   POVRATAK — DESNO KA LEVO
   ===================================================== */

function getReturnOrder(
  fragments
) {
  return [
    ...fragments,
  ].sort(
    (
      a,
      b
    ) => {
      if (
        a.row !==
        b.row
      ) {
        return (
          a.row -
          b.row
        );
      }


      return (
        b.column -
        a.column
      );
    }
  );
}


/* =====================================================
   CANVAS
   ===================================================== */

function createTransitionLayer() {
  const root =
    document.createElement(
      "div"
    );


  root.className =
    "poster-transition";


  root.setAttribute(
    "aria-hidden",
    "true"
  );


  const blackout =
    document.createElement(
      "div"
    );


  blackout.className =
    "poster-transition__blackout";


  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.className =
    "poster-transition__canvas";


  root.append(
    blackout,
    canvas
  );


  document.body.appendChild(
    root
  );


  const viewport =
    getViewportSize();


  const pixelRatio =
    Math.min(
      window.devicePixelRatio ||
      1,

      viewport.width <=
        700
        ? 1.5
        : 2
    );


  canvas.width =
    Math.max(
      1,
      Math.round(
        viewport.width *
        pixelRatio
      )
    );


  canvas.height =
    Math.max(
      1,
      Math.round(
        viewport.height *
        pixelRatio
      )
    );


  canvas.style.width =
    `${viewport.width}px`;


  canvas.style.height =
    `${viewport.height}px`;


  const context =
    canvas.getContext(
      "2d"
    );


  if (context) {
    context.setTransform(
      pixelRatio,
      0,
      0,
      pixelRatio,
      0,
      0
    );


    context.imageSmoothingEnabled =
      true;


    context.imageSmoothingQuality =
      "high";
  }


  return {
    root,
    blackout,
    canvas,
    context,
    viewport,
  };
}


/* =====================================================
   CEO POSTER
   ===================================================== */

function drawWholeImage({
  context,
  viewport,
  image,
  crop,
  rect,
}) {
  context.clearRect(
    0,
    0,
    viewport.width,
    viewport.height
  );


  context.save();


  context.translate(
    rect.left +
    rect.width /
    2,

    rect.top +
    rect.height /
    2
  );


  context.rotate(
    (
      rect.rotation ||
      0
    ) *
    Math.PI /
    180
  );


  context.drawImage(
    image,

    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,

    -rect.width /
      2,

    -rect.height /
      2,

    rect.width,
    rect.height
  );


  context.restore();
}


/* =====================================================
   KOMADI
   ===================================================== */

function drawFragments({
  context,
  viewport,
  image,
  crop,
  rect,
  fragments,
  now,
}) {
  context.clearRect(
    0,
    0,
    viewport.width,
    viewport.height
  );


  const time =
    now /
    1000;


  const groupCenterX =
    rect.left +
    rect.width /
    2;


  const groupCenterY =
    rect.top +
    rect.height /
    2;


  const groupRotation =
    (
      rect.rotation ||
      0
    ) *
    Math.PI /
    180;


  fragments.forEach(
    (
      fragment
    ) => {
      /*
       * Prirodno lelujanje papira.
       */

      const swayX =
        Math.sin(
          time *
          fragment.swaySpeed +
          fragment.swayPhase
        ) *
        fragment.swayAmp;


      const swayY =
        Math.cos(
          time *
          (
            fragment.swaySpeed *
            0.52
          ) +
          fragment.swayPhase
        ) *
        fragment.swayAmp *
        0.085;


      const localCenterX =
        (
          fragment.cx -
          0.5
        ) *
        rect.width +
        fragment.x +
        swayX;


      const localCenterY =
        (
          fragment.cy -
          0.5
        ) *
        rect.height +
        fragment.y +
        swayY;


      function drawPath() {
        context.beginPath();


        fragment.points.forEach(
          (
            point,
            index
          ) => {
            const x =
              (
                point.x -
                fragment.cx
              ) *
              rect.width;


            const y =
              (
                point.y -
                fragment.cy
              ) *
              rect.height;


            if (
              index ===
              0
            ) {
              context.moveTo(
                x,
                y
              );

            } else {
              context.lineTo(
                x,
                y
              );
            }
          }
        );


        context.closePath();
      }


      context.save();


      context.globalAlpha =
        fragment.opacity;


      context.translate(
        groupCenterX,
        groupCenterY
      );


      context.rotate(
        groupRotation
      );


      context.translate(
        localCenterX,
        localCenterY
      );


      context.rotate(
        fragment.rotation *
        Math.PI /
        180
      );


      context.scale(
        fragment.scale,
        fragment.scale
      );


      drawPath();


      context.clip();


      context.drawImage(
        image,

        crop.sx,
        crop.sy,
        crop.sw,
        crop.sh,

        -fragment.cx *
          rect.width,

        -fragment.cy *
          rect.height,

        rect.width,
        rect.height
      );


      context.restore();


      /*
       * Diskretna pocepana ivica.
       */

      if (
        Math.abs(
          fragment.x
        ) >
          1 ||
        Math.abs(
          fragment.y
        ) >
          1
      ) {
        context.save();


        context.globalAlpha =
          fragment.opacity *
          0.12;


        context.translate(
          groupCenterX,
          groupCenterY
        );


        context.rotate(
          groupRotation
        );


        context.translate(
          localCenterX,
          localCenterY
        );


        context.rotate(
          fragment.rotation *
          Math.PI /
          180
        );


        context.scale(
          fragment.scale,
          fragment.scale
        );


        drawPath();


        context.strokeStyle =
          "rgba(242, 233, 214, 0.72)";


        context.lineWidth =
          0.7;


        context.stroke();


        context.restore();
      }
    }
  );
}


/* =====================================================
   LOOP
   ===================================================== */

function startRenderLoop(
  draw
) {
  let active =
    true;


  let frameId =
    0;


  function frame(
    now
  ) {
    if (!active) {
      return;
    }


    draw(
      now
    );


    frameId =
      requestAnimationFrame(
        frame
      );
  }


  frameId =
    requestAnimationFrame(
      frame
    );


  return () => {
    active =
      false;


    cancelAnimationFrame(
      frameId
    );
  };
}


/* =====================================================
   GSAP HELPERS
   ===================================================== */

function tweenPromise(
  target,
  vars
) {
  return new Promise(
    (
      resolve
    ) => {
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
    (
      resolve
    ) => {
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


/* =====================================================
   READY
   ===================================================== */

async function waitForPostersPageReady() {
  const result =
    await waitForElement(
      POSTERS_PAGE_SELECTOR,
      {
        timeout:
          TIMING.readyTimeout,

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
                0
            );
          },
      }
    );


  await waitForPaint(
    2
  );


  return result;
}


async function waitForRoomPostersReady() {
  const result =
    await waitForElement(
      ROOM_POSTERS_SELECTOR,
      {
        timeout:
          TIMING.readyTimeout,

        ready:
          (
            element
          ) => {
            const rect =
              element
                .getBoundingClientRect();


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
   PRELOAD
   ===================================================== */

export function preparePosterTransition() {
  preloadImage(
    POSTERS_ASSET
  );
}


export function preparePosterExitTransition() {
  const isMobile =
    window.matchMedia(
      "(max-width: 700px)"
    ).matches;


  preloadImage(
    POSTERS_ASSET
  );


  preloadImage(
    isMobile
      ? ROOM_MOBILE_BACKGROUND
      : ROOM_DESKTOP_BACKGROUND
  );
}


/* =====================================================
   SOBA → POSTERI
   ===================================================== */

export async function startPosterTransition({
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
    getPostersImage(
      sourceElement
    ) ||
    document.querySelector(
      ROOM_POSTERS_SELECTOR
    );


  if (!sourceImage) {
    navigate();

    return;
  }


  const sourceImageRect =
    getVisualBox(
      sourceImage
    );


  if (
    sourceImageRect.width <=
      0 ||
    sourceImageRect.height <=
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


  let stopRender =
    null;


  let navigationCompleted =
    false;


  try {
    preparePosterTransition();


    const image =
      sourceImage.complete &&
      sourceImage.naturalWidth >
        0
        ? sourceImage
        : await loadImage(
            POSTERS_ASSET
          );


    await decodeImage(
      image
    );


    const crop =
      getAlphaCrop(
        image
      );


    const sourceFullState =
      getPosterTransformState(
        sourceImage
      );


    const sourceRect =
      getCroppedRenderState(
        sourceFullState,
        crop
      );


    const centerRect =
      getCenteredRect(
        sourceRect
      );


    layer =
      createTransitionLayer();


    if (!layer.context) {
      navigate();

      navigationCompleted =
        true;

      return;
    }


    sourceImage
      .style
      .visibility =
      "hidden";


    const displayRect = {
      ...sourceRect,
    };


    const fragments =
      createFragments();


    let fragmentMode =
      false;


    gsap.set(
      layer.blackout,
      {
        opacity:
          0,
      }
    );


    stopRender =
      startRenderLoop(
        (
          now
        ) => {
          if (
            fragmentMode
          ) {
            drawFragments({
              context:
                layer.context,

              viewport:
                layer.viewport,

              image,
              crop,

              rect:
                displayRect,

              fragments,
              now,
            });


            return;
          }


          drawWholeImage({
            context:
              layer.context,

            viewport:
              layer.viewport,

            image,
            crop,

            rect:
              displayRect,
          });
        }
      );


    await waitForPaint(
      1
    );


    /* =====================================
       CRNILO
       ===================================== */

    await tweenPromise(
      layer.blackout,
      {
        opacity:
          1,

        duration:
          TIMING.blackout,

        ease:
          "sine.inOut",
      }
    );


    /* =====================================
       POSTER U CENTAR
       ===================================== */

    await tweenPromise(
      displayRect,
      {
        left:
          centerRect.left,

        top:
          centerRect.top,

        width:
          centerRect.width,

        height:
          centerRect.height,

        rotation:
          0,

        duration:
          TIMING.center,

        ease:
          "power3.inOut",
      }
    );


    fragmentMode =
      true;


    /* =====================================
       CEPANJE
       ===================================== */

    const tearWaves =
      getTearWaves(
        fragments
      );


    const tearTimeline =
      gsap.timeline({
        paused:
          true,
      });


    tearWaves.forEach(
      (
        wave,
        waveIndex
      ) => {
        const waveStart =
          waveIndex *
          TIMING
            .tearWaveGap;


        wave.forEach(
          (
            fragment,
            pieceIndex
          ) => {
            const start =
              waveStart +
              pieceIndex *
              TIMING
                .tearPieceStagger;


            /* ---------------------------------
               ZATEZANJE
               --------------------------------- */

            tearTimeline.to(
              fragment,
              {
                x:
                  fragment
                    .gripX,

                y:
                  fragment
                    .gripY,

                rotation:
                  fragment
                    .gripRotation,

                duration:
                  TIMING.grip,

                ease:
                  "sine.inOut",
              },
              start
            );


            /* ---------------------------------
               OTPOR PAPIRA
               --------------------------------- */

            tearTimeline.to(
              fragment,
              {
                x:
                  fragment
                    .gripX +
                  fragment
                    .tensionX,

                y:
                  fragment
                    .gripY +
                  fragment
                    .tensionY,

                rotation:
                  fragment
                    .gripRotation +
                  fragment
                    .tensionRotation,

                duration:
                  TIMING.tension,

                ease:
                  "sine.inOut",
              },
              start +
              TIMING.grip *
              0.82
            );


            /* ---------------------------------
               OTCEPLJIVANJE

               Komad malo poleće NAGORE.
               --------------------------------- */

            const ripStart =
              start +
              TIMING.grip +
              TIMING.tension *
              0.5;


            tearTimeline.to(
              fragment,
              {
                x:
                  fragment
                    .gripX +
                  fragment
                    .throwX,

                y:
                  fragment
                    .gripY +
                  fragment
                    .throwY,

                rotation:
                  fragment
                    .gripRotation +
                  fragment
                    .throwRotation,

                swayAmp:
                  5,

                duration:
                  fragment
                    .throwDuration,

                ease:
                  "power2.out",
              },
              ripStart
            );


            /* ---------------------------------
               POLAKO PADA NA VETRU

               Počinje pre nego što je završio
               prethodni pokret da nema preloma.
               --------------------------------- */

            const driftStart =
              ripStart +
              fragment
                .throwDuration *
              0.46;


            tearTimeline.to(
              fragment,
              {
                x:
                  fragment
                    .gripX +
                  fragment
                    .throwX +
                  fragment
                    .driftX,

                y:
                  fragment
                    .gripY +
                  fragment
                    .throwY +
                  fragment
                    .driftY,

                rotation:
                  fragment
                    .gripRotation +
                  fragment
                    .throwRotation +
                  fragment
                    .driftRotation,

                swayAmp:
                  14,

                duration:
                  fragment
                    .driftDuration,

                ease:
                  "sine.inOut",
              },
              driftStart
            );
          }
        );
      }
    );


    await timelinePromise(
      tearTimeline
    );


    /* =====================================
       VETAR IH ODNOSI
       ===================================== */

    const gustTimeline =
      gsap.timeline({
        paused:
          true,
      });


    fragments.forEach(
      (
        fragment,
        index
      ) => {
        gustTimeline.to(
          fragment,
          {
            x:
              fragment.x +
              (
                fragment
                  .ripDirection >
                0
                  ? layer
                      .viewport
                      .width *
                    0.72 +
                    165
                  : -layer
                      .viewport
                      .width *
                    0.72 -
                    165
              ),

            y:
              fragment.y +
              fragment
                .gustLift,

            rotation:
              fragment.rotation +
              fragment
                .gustRotation,

            swayAmp:
              8,

            duration:
              fragment
                .gustDuration,

            ease:
              "sine.inOut",
          },
          index *
          0.008
        );
      }
    );


    await timelinePromise(
      gustTimeline
    );


    /* =====================================
       POSTERI STRANICA
       ===================================== */

    navigate();


    navigationCompleted =
      true;


    await waitForPostersPageReady();


    await tweenPromise(
      layer.blackout,
      {
        opacity:
          0,

        duration:
          TIMING
            .revealPosters,

        ease:
          "sine.out",
      }
    );

  } catch (
    error
  ) {
    console.error(
      "Poster entry transition failed:",
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


    stopRender?.();


    layer
      ?.root
      ?.remove();


    restoreScroll();


    transitionInProgress =
      false;
  }
}


/* =====================================================
   POSTERI → SOBA
   ===================================================== */

export async function startPosterExitTransition({
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


  let stopRender =
    null;


  let roomPosters =
    null;


  let roomPostersPreviousVisibility =
    "";


  let navigationCompleted =
    false;


  try {
    preparePosterExitTransition();


    const image =
      await loadImage(
        POSTERS_ASSET
      );


    const crop =
      getAlphaCrop(
        image
      );


    layer =
      createTransitionLayer();


    if (!layer.context) {
      navigate();

      navigationCompleted =
        true;

      return;
    }


    const isMobile =
      layer.viewport.width <=
      700;


    gsap.set(
      layer.blackout,
      {
        opacity:
          0,
      }
    );


    /* =====================================
       PCRNI STRANICA
       ===================================== */

    await tweenPromise(
      layer.blackout,
      {
        opacity:
          1,

        duration:
          isMobile
            ? 0.46
            : TIMING
                .exitBlackout,

        ease:
          "sine.inOut",
      }
    );


    /* =====================================
       SOBA ISPOD CRNILA
       ===================================== */

    navigate();


    navigationCompleted =
      true;


    const roomResult =
      await waitForRoomPostersReady();


    roomPosters =
      roomResult.element;


    if (!roomPosters) {
      throw new Error(
        "Poster target u sobi nije pronađen."
      );
    }


    const targetFullState =
      getPosterTransformState(
        roomPosters
      );


    const targetRect =
      getCroppedRenderState(
        targetFullState,
        crop
      );


    roomPostersPreviousVisibility =
      roomPosters
        .style
        .visibility;


    roomPosters
      .style
      .visibility =
      "hidden";


    const fragments =
      createFragments();


    const displayRect = {
      ...targetRect,
    };


    /* =====================================
       KOMADI SA DESNE STRANE
       ===================================== */

    fragments.forEach(
      (
        fragment
      ) => {
        fragment.x =
          layer
            .viewport
            .width *
          (
            isMobile
              ? 0.72
              : 0.82
          ) +
          fragment
            .returnStartExtra;


        fragment.y =
          fragment
            .returnStartYOffset;


        fragment.rotation =
          fragment
            .returnRotation;


        /*
         * Telefon:
         * znatno manji sway za mekši utisak.
         */

        fragment.swayAmp =
          isMobile
            ? 14
            : 22;


        fragment.opacity =
          1;
      }
    );


    stopRender =
      startRenderLoop(
        (
          now
        ) => {
          drawFragments({
            context:
              layer.context,

            viewport:
              layer.viewport,

            image,
            crop,

            rect:
              displayRect,

            fragments,
            now,
          });
        }
      );


    await waitForPaint(
      1
    );


    /* =====================================
       VETAR NANOSI DEO PO DEO
       ===================================== */

    const returnOrder =
      getReturnOrder(
        fragments
      );


    const returnTimeline =
      gsap.timeline({
        paused:
          true,
      });


    /*
     * Na telefonu je stagger manji:
     * više komada se nalazi u pokretu
     * istovremeno i zato sve izgleda kao
     * jedan vazdušni tok.
     */

    const returnStagger =
      isMobile
        ? 0.034
        : TIMING
            .returnStagger;


    returnOrder.forEach(
      (
        fragment,
        index
      ) => {
        const start =
          index *
          returnStagger;


        /* ---------------------------------
           DOPLUTA DO POSTERA
           --------------------------------- */

        returnTimeline.to(
          fragment,
          {
            x:
              fragment
                .returnPreX,

            y:
              fragment
                .returnPreY,

            rotation:
              fragment
                .returnPreRotation,

            swayAmp:
              isMobile
                ? 4
                : 7,

            duration:
              fragment
                .returnWindDuration,

            ease:
              "sine.inOut",
          },
          start
        );


        /* ---------------------------------
           MEKO NALEGNE NA MESTO
           --------------------------------- */

        returnTimeline.to(
          fragment,
          {
            x:
              0,

            y:
              0,

            rotation:
              0,

            swayAmp:
              0,

            duration:
              fragment
                .returnGlueDuration,

            ease:
              "sine.out",
          },
          start +
          fragment
            .returnWindDuration *
          (
            isMobile
              ? 0.66
              : 0.72
          )
        );
      }
    );


    await timelinePromise(
      returnTimeline
    );


    /* =====================================
       CANVAS → DOM
       ===================================== */

    roomPosters
      .style
      .visibility =
      roomPostersPreviousVisibility;


    await waitForPaint(
      isMobile
        ? 2
        : 1
    );


    /* =====================================
       OTKRIJ SOBU
       ===================================== */

    await tweenPromise(
      layer.blackout,
      {
        opacity:
          0,

        duration:
          isMobile
            ? 0.66
            : TIMING
                .revealRoom,

        ease:
          "sine.inOut",
      }
    );

  } catch (
    error
  ) {
    console.error(
      "Poster exit transition failed:",
      error
    );


    if (
      !navigationCompleted
    ) {
      navigate();
    }

  } finally {
    if (roomPosters) {
      roomPosters
        .style
        .visibility =
        roomPostersPreviousVisibility;
    }


    stopRender?.();


    layer
      ?.root
      ?.remove();


    restoreScroll();


    transitionInProgress =
      false;
  }
}