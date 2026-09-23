function numberFromPercent(
  value
) {
  return Number.parseFloat(
    String(
      value
    )
  );
}


export function getResponsiveCheesePosition(
  cheese,
  isPortrait
) {
  return {
    x:
      numberFromPercent(
        isPortrait
          ? cheese.mobileX
          : cheese.x
      ),

    y:
      numberFromPercent(
        isPortrait
          ? cheese.mobileY
          : cheese.y
      ),
  };
}


export function getResponsiveHoleSpawn(
  hole,
  isPortrait
) {
  return {
    x:
      isPortrait
        ? hole.mobileSpawnX
        : hole.spawnX,

    y:
      isPortrait
        ? hole.mobileSpawnY
        : hole.spawnY,
  };
}


function distanceInPixels(
  from,
  to,
  rect
) {
  const dx =
    (
      to.x -
      from.x
    ) /
    100 *
    rect.width;


  const dy =
    (
      to.y -
      from.y
    ) /
    100 *
    rect.height;


  return Math.hypot(
    dx,
    dy
  );
}


export function findNearestActiveCheese(
  from,
  cheeses,
  isPortrait,
  rect
) {
  let bestIndex =
    -1;


  let bestDistance =
    Infinity;


  cheeses.forEach(
    (
      cheese,
      index
    ) => {
      if (
        !cheese.active
      ) {
        return;
      }


      const position =
        getResponsiveCheesePosition(
          cheese,
          isPortrait
        );


      const distance =
        distanceInPixels(
          from,
          position,
          rect
        );


      if (
        distance <
        bestDistance
      ) {
        bestDistance =
          distance;

        bestIndex =
          index;
      }
    }
  );


  return bestIndex;
}


export function moveTowards(
  current,
  target,
  rect,
  speedFactor,
  deltaSeconds
) {
  const dxPixels =
    (
      target.x -
      current.x
    ) /
    100 *
    rect.width;


  const dyPixels =
    (
      target.y -
      current.y
    ) /
    100 *
    rect.height;


  const distance =
    Math.hypot(
      dxPixels,
      dyPixels
    );


  /*
   * Brzina je vezana za manju dimenziju terena,
   * pa se miš ponaša slično na velikom i malom ekranu.
   */
  const speedPixels =
    Math.min(
      rect.width,
      rect.height
    ) *
    speedFactor;


  const step =
    speedPixels *
    deltaSeconds;


  const rotation =
    Math.atan2(
      dyPixels,
      dxPixels
    ) *
    180 /
    Math.PI -
    90;


  if (
    distance <=
      step ||
    distance <=
      1
  ) {
    return {
      position: {
        x:
          target.x,

        y:
          target.y,
      },

      reached:
        true,

      rotation,
    };
  }


  const ratio =
    step /
    distance;


  const nextXPixels =
    dxPixels *
    ratio;


  const nextYPixels =
    dyPixels *
    ratio;


  return {
    position: {
      x:
        current.x +
        nextXPixels /
        rect.width *
        100,

      y:
        current.y +
        nextYPixels /
        rect.height *
        100,
    },

    reached:
      false,

    rotation,
  };
}