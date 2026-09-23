export function distanceBetweenPositions(
  first,
  second,
  rect
) {
  const dx =
    (
      second.x -
      first.x
    ) /
    100 *
    rect.width;


  const dy =
    (
      second.y -
      first.y
    ) /
    100 *
    rect.height;


  return Math.hypot(
    dx,
    dy
  );
}


export function arePositionsTouching(
  first,
  second,
  rect,
  radiusFactor
) {
  const collisionDistance =
    Math.min(
      rect.width,
      rect.height
    ) *
    radiusFactor;


  return (
    distanceBetweenPositions(
      first,
      second,
      rect
    ) <=
    collisionDistance
  );
}