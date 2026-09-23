export function chooseRandomHole(
  holes,
  previousHoleId = null
) {
  if (
    !Array.isArray(
      holes
    ) ||
    holes.length ===
      0
  ) {
    return null;
  }


  /*
   * Ako postoji više rupa,
   * trudimo se da ne izađe iz potpuno
   * iste rupe dva puta zaredom.
   */
  const candidates =
    holes.length >
      1
      ? holes.filter(
          (
            hole
          ) =>
            hole.id !==
            previousHoleId
        )
      : holes;


  const pool =
    candidates.length >
      0
      ? candidates
      : holes;


  const randomIndex =
    Math.floor(
      Math.random() *
      pool.length
    );


  return (
    pool[
      randomIndex
    ] ||
    null
  );
}


export function findHoleById(
  holes,
  holeId
) {
  return (
    holes.find(
      (
        hole
      ) =>
        hole.id ===
        holeId
    ) ||
    null
  );
}