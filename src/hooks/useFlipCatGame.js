import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CAT_BOUNDS,
  CAT_START_POSITION,
  CHEESE_POSITIONS,
  COLLISION_RADII,
  HOLES,
} from "../game/flip-cat/config";

import {
  arePositionsTouching,
} from "../game/flip-cat/collisionLogic";

import {
  getResponsiveCheesePosition,
  getResponsiveHoleSpawn,
  moveTowards,
} from "../game/flip-cat/mouseLogic";

import {
  chooseRandomHole,
  findHoleById,
} from "../game/flip-cat/spawnLogic";

import {
  chooseMouseType,
  getDifficultyState,
  getMouseTypeConfig,
  normalizeDifficulty,
} from "../game/flip-cat/progression";


const MAX_LIVES =
  CHEESE_POSITIONS.length;


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


function createInitialCheeses() {
  return CHEESE_POSITIONS.map(
    (
      cheese,
      index
    ) => ({
      ...cheese,

      id:
        index,

      active:
        true,
    })
  );
}


function createSpawnController() {
  return {
    nextSpawnAt:
      0,

    lastHoleId:
      null,

    nextMouseId:
      1,
  };
}


export function useFlipCatGame({
  difficulty:
    difficultyProp =
      "easy",

  onGameOver,
} = {}) {
  const difficulty =
    normalizeDifficulty(
      difficultyProp
    );


  const playfieldRef =
    useRef(null);


  const touchDragRef =
    useRef(null);


  const desktopLockedRef =
    useRef(false);


  const resumeRequestedRef =
    useRef(false);


  const cheesesRef =
    useRef(
      createInitialCheeses()
    );


  const catPositionRef =
    useRef({
      ...CAT_START_POSITION,
    });


  const miceRuntimeRef =
    useRef([]);


  const spawnControllerRef =
    useRef(
      createSpawnController()
    );


  const droppedCheesesRef =
    useRef([]);


  const performActionRef =
    useRef(null);


  const togglePauseRef =
    useRef(null);


  const gamePhaseRef =
    useRef(
      "ready"
    );


  const pauseStartedAtRef =
    useRef(null);


  const livesRef =
    useRef(
      MAX_LIVES
    );


  const scoreRef =
    useRef(0);


  const gameOverSentRef =
    useRef(false);


  const [
    cheeses,
    setCheeses,
  ] = useState(
    createInitialCheeses
  );


  const [
    catPosition,
    setCatPosition,
  ] = useState({
    ...CAT_START_POSITION,
  });


  const [
    isDragging,
    setIsDragging,
  ] = useState(false);


  const [
    mice,
    setMice,
  ] = useState([]);


  const [
    droppedCheeses,
    setDroppedCheesesState,
  ] = useState([]);


  const [
    availableAction,
    setAvailableAction,
  ] = useState(null);


  const [
    score,
    setScoreState,
  ] = useState(0);


  const [
    lives,
    setLives,
  ] = useState(
    MAX_LIVES
  );


  const [
    gamePhase,
    setGamePhaseState,
  ] = useState(
    "ready"
  );


  const [
    countdown,
    setCountdown,
  ] = useState(null);


  const [
    gameClock,
    setGameClock,
  ] = useState(0);


  function setGamePhase(
    nextPhase
  ) {
    gamePhaseRef.current =
      nextPhase;

    setGamePhaseState(
      nextPhase
    );
  }


  function setScore(
    nextValue
  ) {
    const resolved =
      typeof nextValue ===
        "function"
        ? nextValue(
            scoreRef.current
          )
        : nextValue;

    scoreRef.current =
      resolved;

    setScoreState(
      resolved
    );
  }


  function setDroppedCheeses(
    nextValue
  ) {
    droppedCheesesRef.current =
      nextValue;

    setDroppedCheesesState(
      nextValue
    );
  }


  function setLivesValue(
    nextValue
  ) {
    livesRef.current =
      nextValue;

    setLives(
      nextValue
    );
  }


  function publishCat(
    nextPosition
  ) {
    catPositionRef.current =
      nextPosition;

    setCatPosition(
      nextPosition
    );
  }


  function getBounds(
    rect
  ) {
    return rect.height >
      rect.width
      ? CAT_BOUNDS.portrait
      : CAT_BOUNDS.landscape;
  }


  function isDesktopPointer() {
    if (
      typeof window ===
        "undefined" ||
      typeof window.matchMedia !==
        "function"
    ) {
      return true;
    }

    return window
      .matchMedia(
        "(hover: hover) and (pointer: fine)"
      )
      .matches;
  }


  function distanceInPixels(
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


  function getFieldCheeseCount() {
    const placed =
      cheesesRef.current.filter(
        (
          cheese
        ) =>
          cheese.active
      ).length;

    const dropped =
      droppedCheesesRef.current.filter(
        (
          cheese
        ) =>
          cheese.active
      ).length;

    return (
      placed +
      dropped
    );
  }


  function getCurrentDifficultyState() {
    return getDifficultyState({
      difficulty,

      score:
        scoreRef.current,

      fieldCheeseCount:
        getFieldCheeseCount(),
    });
  }


  const progressionState =
    useMemo(
      () =>
        getDifficultyState({
          difficulty,

          score,

          fieldCheeseCount:
            cheeses.filter(
              (
                cheese
              ) =>
                cheese.active
            ).length +
            droppedCheeses.filter(
              (
                cheese
              ) =>
                cheese.active
            ).length,
        }),

      [
        difficulty,
        score,
        cheeses,
        droppedCheeses,
      ]
    );


  const activeHoles =
    useMemo(
      () =>
        HOLES.filter(
          (
            hole
          ) =>
            progressionState
              .activeHoleIds
              .includes(
                hole.id
              )
        ),

      [
        progressionState
          .activeHoleIds,
      ]
    );


  function getReservedTargetKeys(
    excludeMouseId = null,

    allowSharedLastCheese =
      false
  ) {
    if (
      allowSharedLastCheese
    ) {
      return new Set();
    }

    const reserved =
      new Set();

    miceRuntimeRef.current.forEach(
      (
        mouse
      ) => {
        if (
          !mouse.visible ||
          mouse.id ===
            excludeMouseId ||
          mouse.phase !==
            "to-cheese"
        ) {
          return;
        }

        if (
          mouse.targetSource ===
          "placed"
        ) {
          reserved.add(
            `placed:${mouse.targetCheeseIndex}`
          );

          return;
        }

        if (
          mouse.targetSource ===
          "dropped"
        ) {
          reserved.add(
            `dropped:${mouse.targetDroppedId}`
          );
        }
      }
    );

    return reserved;
  }


  function findNearestCheeseTarget(
    from,
    isPortrait,
    rect,
    reservedKeys =
      new Set()
  ) {
    let nearest =
      null;

    let nearestDistance =
      Infinity;


    cheesesRef.current.forEach(
      (
        cheese
      ) => {
        if (
          !cheese.active ||
          reservedKeys.has(
            `placed:${cheese.id}`
          )
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
          nearestDistance
        ) {
          nearestDistance =
            distance;

          nearest = {
            source:
              "placed",

            cheeseId:
              cheese.id,

            droppedId:
              null,

            position,

            rotation:
              cheese.rotation,
          };
        }
      }
    );


    droppedCheesesRef.current.forEach(
      (
        cheese
      ) => {
        if (
          !cheese.active ||
          reservedKeys.has(
            `dropped:${cheese.id}`
          )
        ) {
          return;
        }

        const position = {
          x:
            cheese.x,

          y:
            cheese.y,
        };

        const distance =
          distanceInPixels(
            from,
            position,
            rect
          );

        if (
          distance <
          nearestDistance
        ) {
          nearestDistance =
            distance;

          nearest = {
            source:
              "dropped",

            cheeseId:
              cheese.cheeseId,

            droppedId:
              cheese.id,

            position,

            rotation:
              cheese.rotation,
          };
        }
      }
    );

    return nearest;
  }


  function getCurrentCheeseTarget(
    mouse,
    isPortrait
  ) {
    if (
      mouse.targetSource ===
      "placed"
    ) {
      const cheese =
        cheesesRef.current[
          mouse.targetCheeseIndex
        ];

      if (
        !cheese ||
        !cheese.active
      ) {
        return null;
      }

      return {
        source:
          "placed",

        cheeseId:
          cheese.id,

        droppedId:
          null,

        position:
          getResponsiveCheesePosition(
            cheese,
            isPortrait
          ),

        rotation:
          cheese.rotation,
      };
    }


    if (
      mouse.targetSource ===
      "dropped"
    ) {
      const cheese =
        droppedCheesesRef.current.find(
          (
            item
          ) =>
            item.id ===
              mouse.targetDroppedId &&
            item.active
        );

      if (!cheese) {
        return null;
      }

      return {
        source:
          "dropped",

        cheeseId:
          cheese.cheeseId,

        droppedId:
          cheese.id,

        position: {
          x:
            cheese.x,

          y:
            cheese.y,
        },

        rotation:
          cheese.rotation,
      };
    }

    return null;
  }


  function removeTargetCheese(
    target
  ) {
    if (
      target.source ===
      "placed"
    ) {
      const nextCheeses =
        cheesesRef.current.map(
          (
            cheese
          ) =>
            cheese.id ===
            target.cheeseId
              ? {
                  ...cheese,

                  active:
                    false,
                }
              : cheese
        );

      cheesesRef.current =
        nextCheeses;

      setCheeses(
        nextCheeses
      );

      return;
    }


    if (
      target.source ===
      "dropped"
    ) {
      setDroppedCheeses(
        droppedCheesesRef.current.filter(
          (
            cheese
          ) =>
            cheese.id !==
            target.droppedId
        )
      );
    }
  }


  function getActiveHoles(
    state
  ) {
    return HOLES.filter(
      (
        hole
      ) =>
        state
          .activeHoleIds
          .includes(
            hole.id
          )
    );
  }


  function findNearestHole(
    from,
    isPortrait,
    rect,
    state
  ) {
    let nearestHole =
      null;

    let nearestDistance =
      Infinity;


    getActiveHoles(
      state
    ).forEach(
      (
        hole
      ) => {
        const position =
          getResponsiveHoleSpawn(
            hole,
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
          nearestDistance
        ) {
          nearestDistance =
            distance;

          nearestHole =
            hole;
        }
      }
    );

    return nearestHole;
  }


  function publishMice(
    timestamp
  ) {
    setGameClock(
      timestamp
    );

    setMice(
      miceRuntimeRef.current.map(
        (
          mouse
        ) => {
          const config =
            getMouseTypeConfig(
              mouse.type
            );

          return {
            ...mouse,

            frameIndex:
              Math.floor(
                timestamp /
                config.frameDuration
              ) %
              config.frames.length,

            isHitFlashing:
              Boolean(
                mouse.hitFlashUntil &&
                timestamp <
                  mouse.hitFlashUntil
              ),
          };
        }
      )
    );
  }


  function resetGame() {
    resumeRequestedRef.current =
      false;

    pauseStartedAtRef.current =
      null;

    touchDragRef.current =
      null;

    gameOverSentRef.current =
      false;

    const freshCheeses =
      createInitialCheeses();

    cheesesRef.current =
      freshCheeses;

    miceRuntimeRef.current =
      [];

    spawnControllerRef.current =
      createSpawnController();

    droppedCheesesRef.current =
      [];

    catPositionRef.current = {
      ...CAT_START_POSITION,
    };

    livesRef.current =
      MAX_LIVES;

    scoreRef.current =
      0;

    setCheeses(
      freshCheeses
    );

    setMice([]);

    setDroppedCheesesState(
      []
    );

    setCatPosition({
      ...CAT_START_POSITION,
    });

    setScoreState(0);

    setLives(
      MAX_LIVES
    );

    setAvailableAction(
      null
    );

    setCountdown(
      null
    );

    setIsDragging(
      false
    );

    setGamePhase(
      "ready"
    );

    if (
      document.pointerLockElement
    ) {
      document
        .exitPointerLock();
    }
  }


  function finishGame(
    finalLives =
      livesRef.current
  ) {
    miceRuntimeRef.current =
      [];

    setMice([]);

    setAvailableAction(
      null
    );

    setGamePhase(
      "game-over"
    );

    if (
      document.pointerLockElement
    ) {
      document
        .exitPointerLock();
    }

    if (
      !gameOverSentRef.current
    ) {
      gameOverSentRef.current =
        true;

      onGameOver?.({
        score:
          scoreRef.current,

        difficulty,

        lives:
          finalLives,
      });
    }
  }


  function loseLife() {
    const nextLives =
      Math.max(
        0,
        livesRef.current -
          1
      );

    setLivesValue(
      nextLives
    );

    /*
     * NOVO PRAVILO:
     * kada miš uspešno odnese pretposlednji sir
     * i ostane samo jedan život / sir, partija je gotova.
     */
    if (
      nextLives >
      1
    ) {
      return false;
    }

    finishGame(
      nextLives
    );

    return true;
  }


  function requestDesktopPointerLock() {
    const playfield =
      playfieldRef.current;

    if (!playfield) {
      return;
    }

    if (
      document.pointerLockElement ===
      playfield
    ) {
      return;
    }

    try {
      const result =
        playfield
          .requestPointerLock();

      if (
        result &&
        typeof result.then ===
          "function"
      ) {
        result.catch(
          (
            error
          ) => {
            console.error(
              "FLIP CAT pointer lock:",
              error
            );

            resumeRequestedRef.current =
              false;
          }
        );
      }
    } catch (
      error
    ) {
      console.error(
        "FLIP CAT pointer lock:",
        error
      );

      resumeRequestedRef.current =
        false;
    }
  }


  function startGame(
    event
  ) {
    if (
      gamePhaseRef.current !==
      "ready"
    ) {
      return;
    }

    event?.preventDefault?.();

    gameOverSentRef.current =
      false;

    if (
      event?.pointerType ===
        "mouse" ||
      event?.type ===
        "click"
    ) {
      requestDesktopPointerLock();

      return;
    }

    setGamePhase(
      "countdown"
    );
  }


  useEffect(() => {
    if (
      gamePhase !==
      "countdown"
    ) {
      return undefined;
    }

    setCountdown(3);

    const timerTwo =
      window.setTimeout(
        () => {
          setCountdown(2);
        },
        800
      );

    const timerOne =
      window.setTimeout(
        () => {
          setCountdown(1);
        },
        1600
      );

    const timerStart =
      window.setTimeout(
        () => {
          setCountdown(null);

          miceRuntimeRef.current =
            [];

          spawnControllerRef.current =
            createSpawnController();

          setGamePhase(
            "playing"
          );
        },
        2400
      );

    return () => {
      window.clearTimeout(
        timerTwo
      );

      window.clearTimeout(
        timerOne
      );

      window.clearTimeout(
        timerStart
      );
    };
  }, [
    gamePhase,
  ]);


  function pauseGame() {
    if (
      gamePhaseRef.current !==
      "playing"
    ) {
      return;
    }

    pauseStartedAtRef.current =
      performance.now();

    touchDragRef.current =
      null;

    setAvailableAction(
      null
    );

    setGamePhase(
      "paused"
    );

    if (
      document.pointerLockElement
    ) {
      document
        .exitPointerLock();
    }
  }


  function completeResume() {
    if (
      gamePhaseRef.current !==
      "paused"
    ) {
      return;
    }

    const now =
      performance.now();

    const pausedDuration =
      pauseStartedAtRef.current ===
      null
        ? 0
        : now -
          pauseStartedAtRef.current;

    const controller =
      spawnControllerRef.current;

    if (
      Number.isFinite(
        controller.nextSpawnAt
      ) &&
      controller.nextSpawnAt >
        0
    ) {
      spawnControllerRef.current = {
        ...controller,

        nextSpawnAt:
          controller.nextSpawnAt +
          pausedDuration,
      };
    }

    pauseStartedAtRef.current =
      null;

    resumeRequestedRef.current =
      false;

    setGamePhase(
      "playing"
    );
  }


  function resumeGame(
    event
  ) {
    if (
      gamePhaseRef.current !==
      "paused"
    ) {
      return;
    }

    event?.preventDefault?.();

    if (
      !isDesktopPointer()
    ) {
      completeResume();

      return;
    }

    const playfield =
      playfieldRef.current;

    if (
      playfield &&
      document.pointerLockElement ===
        playfield
    ) {
      completeResume();

      return;
    }

    resumeRequestedRef.current =
      true;

    requestDesktopPointerLock();
  }


  function togglePause(
    event
  ) {
    if (
      gamePhaseRef.current ===
      "playing"
    ) {
      pauseGame();

      return;
    }

    if (
      gamePhaseRef.current ===
      "paused"
    ) {
      resumeGame(
        event
      );
    }
  }


  function updateDesktopCat(
    movementX,
    movementY
  ) {
    if (
      gamePhaseRef.current ===
        "paused" ||
      gamePhaseRef.current ===
        "game-over"
    ) {
      return;
    }

    const playfield =
      playfieldRef.current;

    if (!playfield) {
      return;
    }

    const rect =
      playfield
        .getBoundingClientRect();

    const bounds =
      getBounds(
        rect
      );

    const current =
      catPositionRef.current;

    publishCat({
      x:
        clamp(
          current.x +
            (
              movementX /
              rect.width
            ) *
            100,

          bounds.minX,
          bounds.maxX
        ),

      y:
        clamp(
          current.y +
            (
              movementY /
              rect.height
            ) *
            100,

          bounds.minY,
          bounds.maxY
        ),
    });
  }


  useEffect(() => {
    function handlePointerLockChange() {
      const playfield =
        playfieldRef.current;

      const locked =
        Boolean(
          playfield &&
          document.pointerLockElement ===
            playfield
        );

      desktopLockedRef.current =
        locked;

      setIsDragging(
        locked
      );

      if (locked) {
        if (
          gamePhaseRef.current ===
          "ready"
        ) {
          setGamePhase(
            "countdown"
          );

          return;
        }

        if (
          gamePhaseRef.current ===
            "paused" &&
          resumeRequestedRef.current
        ) {
          completeResume();
        }

        return;
      }

      if (
        gamePhaseRef.current ===
        "playing"
      ) {
        pauseStartedAtRef.current =
          performance.now();

        setAvailableAction(
          null
        );

        setGamePhase(
          "paused"
        );
      }
    }


    function handlePointerLockError() {
      desktopLockedRef.current =
        false;

      resumeRequestedRef.current =
        false;

      setIsDragging(
        false
      );
    }


    function handleMouseMove(
      event
    ) {
      if (
        !desktopLockedRef.current
      ) {
        return;
      }

      updateDesktopCat(
        event.movementX,
        event.movementY
      );
    }


    document.addEventListener(
      "pointerlockchange",
      handlePointerLockChange
    );

    document.addEventListener(
      "pointerlockerror",
      handlePointerLockError
    );

    document.addEventListener(
      "mousemove",
      handleMouseMove
    );


    return () => {
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange
      );

      document.removeEventListener(
        "pointerlockerror",
        handlePointerLockError
      );

      document.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      const playfield =
        playfieldRef.current;

      if (
        playfield &&
        document.pointerLockElement ===
          playfield
      ) {
        document
          .exitPointerLock();
      }
    };
  }, []);


  function startTouchDrag(
    event
  ) {
    if (
      gamePhaseRef.current !==
      "playing"
    ) {
      return;
    }

    const playfield =
      playfieldRef.current;

    if (!playfield) {
      return;
    }

    event.preventDefault();

    const rect =
      playfield
        .getBoundingClientRect();

    touchDragRef.current = {
      pointerId:
        event.pointerId,

      startPointerX:
        event.clientX,

      startPointerY:
        event.clientY,

      startCatX:
        catPositionRef
          .current
          .x,

      startCatY:
        catPositionRef
          .current
          .y,

      rect,
    };

    try {
      playfield
        .setPointerCapture(
          event.pointerId
        );
    } catch {
      // Nije kritično.
    }

    setIsDragging(
      true
    );
  }


  function handlePointerDown(
    event
  ) {
    if (
      event.pointerType ===
      "mouse"
    ) {
      if (
        gamePhaseRef.current !==
          "ready" &&
        gamePhaseRef.current !==
          "paused" &&
        document.pointerLockElement !==
          playfieldRef.current
      ) {
        requestDesktopPointerLock();
      }

      return;
    }

    startTouchDrag(
      event
    );
  }


  useEffect(() => {
    function handleTouchMove(
      event
    ) {
      const drag =
        touchDragRef.current;

      if (
        !drag ||
        drag.pointerId !==
          event.pointerId ||
        gamePhaseRef.current !==
          "playing"
      ) {
        return;
      }

      event.preventDefault();

      const deltaX =
        (
          (
            event.clientX -
            drag.startPointerX
          ) /
          drag.rect.width
        ) *
        100;

      const deltaY =
        (
          (
            event.clientY -
            drag.startPointerY
          ) /
          drag.rect.height
        ) *
        100;

      const bounds =
        getBounds(
          drag.rect
        );

      publishCat({
        x:
          clamp(
            drag.startCatX +
              deltaX,

            bounds.minX,
            bounds.maxX
          ),

        y:
          clamp(
            drag.startCatY +
              deltaY,

            bounds.minY,
            bounds.maxY
          ),
      });
    }


    function finishTouchDrag(
      event
    ) {
      const drag =
        touchDragRef.current;

      if (
        !drag ||
        drag.pointerId !==
          event.pointerId
      ) {
        return;
      }

      const playfield =
        playfieldRef.current;

      if (playfield) {
        try {
          if (
            playfield
              .hasPointerCapture(
                event.pointerId
              )
          ) {
            playfield
              .releasePointerCapture(
                event.pointerId
              );
          }
        } catch {
          // Pointer više nije aktivan.
        }
      }

      touchDragRef.current =
        null;

      if (
        !desktopLockedRef.current
      ) {
        setIsDragging(
          false
        );
      }
    }


    window.addEventListener(
      "pointermove",
      handleTouchMove,
      {
        passive:
          false,
      }
    );

    window.addEventListener(
      "pointerup",
      finishTouchDrag
    );

    window.addEventListener(
      "pointercancel",
      finishTouchDrag
    );


    return () => {
      window.removeEventListener(
        "pointermove",
        handleTouchMove
      );

      window.removeEventListener(
        "pointerup",
        finishTouchDrag
      );

      window.removeEventListener(
        "pointercancel",
        finishTouchDrag
      );
    };
  }, []);


  function spawnMouse(
    timestamp,
    rect,
    isPortrait,
    state
  ) {
    const holes =
      getActiveHoles(
        state
      );

    if (
      holes.length ===
      0
    ) {
      return false;
    }

    const controller =
      spawnControllerRef.current;

    const hole =
      chooseRandomHole(
        holes,
        controller.lastHoleId
      );

    if (!hole) {
      return false;
    }

    const spawnPosition =
      getResponsiveHoleSpawn(
        hole,
        isPortrait
      );

    const reservedKeys =
      getReservedTargetKeys(
        null,
        state
          .allowSharedLastCheese
      );

    const target =
      findNearestCheeseTarget(
        spawnPosition,
        isPortrait,
        rect,
        reservedKeys
      );

    if (!target) {
      return false;
    }

    const type =
      chooseMouseType(
        state
      );

    const mouseConfig =
      getMouseTypeConfig(
        type
      );

    const newMouse = {
      id:
        controller.nextMouseId,

      type,

      visible:
        true,

      x:
        spawnPosition.x,

      y:
        spawnPosition.y,

      rotation:
        0,

      frameIndex:
        0,

      carryingCheese:
        false,

      targetSource:
        target.source,

      targetCheeseIndex:
        target.cheeseId,

      targetDroppedId:
        target.droppedId,

      spawnHoleId:
        hole.id,

      returnHoleId:
        null,

      phase:
        "to-cheese",

      hitPoints:
        mouseConfig.hitPoints,

      maxHitPoints:
        mouseConfig.hitPoints,

      hitFlashUntil:
        0,

      isHitFlashing:
        false,
    };

    miceRuntimeRef.current = [
      ...miceRuntimeRef.current,
      newMouse,
    ];

    spawnControllerRef.current = {
      nextSpawnAt:
        timestamp +
        state.spawnInterval,

      lastHoleId:
        hole.id,

      nextMouseId:
        controller.nextMouseId +
        1,
    };

    return true;
  }


  useEffect(() => {
    if (
      gamePhase !==
      "playing"
    ) {
      return undefined;
    }

    let animationId =
      null;

    let cancelled =
      false;

    let previousTimestamp =
      null;


    function tick(
      timestamp
    ) {
      if (
        cancelled ||
        gamePhaseRef.current !==
          "playing"
      ) {
        return;
      }

      const playfield =
        playfieldRef.current;

      if (!playfield) {
        animationId =
          requestAnimationFrame(
            tick
          );

        return;
      }

      if (
        previousTimestamp ===
        null
      ) {
        previousTimestamp =
          timestamp;
      }

      const deltaSeconds =
        Math.min(
          (
            timestamp -
            previousTimestamp
          ) /
          1000,

          0.05
        );

      previousTimestamp =
        timestamp;

      const rect =
        playfield
          .getBoundingClientRect();

      const isPortrait =
        rect.height >
        rect.width;

      const state =
        getCurrentDifficultyState();

      const activeMouseCount =
        miceRuntimeRef.current.filter(
          (
            mouse
          ) =>
            mouse.visible &&
            (
              mouse.phase ===
                "to-cheese" ||
              mouse.phase ===
                "to-hole" ||
              mouse.phase ===
                "retreat"
            )
        ).length;


      if (
        activeMouseCount <
          state.maxActiveMice &&
        timestamp >=
          spawnControllerRef
            .current
            .nextSpawnAt
      ) {
        const spawned =
          spawnMouse(
            timestamp,
            rect,
            isPortrait,
            state
          );

        if (!spawned) {
          spawnControllerRef.current = {
            ...spawnControllerRef.current,

            nextSpawnAt:
              timestamp +
              160,
          };
        }
      }


      let gameOver =
        false;

      const nextMice =
        [];


      for (
        const currentMouse
        of miceRuntimeRef.current
      ) {
        if (
          !currentMouse.visible
        ) {
          continue;
        }

        let mouse = {
          ...currentMouse,
        };

        const mouseConfig =
          getMouseTypeConfig(
            mouse.type
          );

        const movementSpeed =
          mouseConfig.speed *
          state.speedMultiplier;


        if (
          mouse.phase ===
          "to-cheese"
        ) {
          let target =
            getCurrentCheeseTarget(
              mouse,
              isPortrait
            );


          if (!target) {
            const refreshedState =
              getCurrentDifficultyState();

            const reservedKeys =
              getReservedTargetKeys(
                mouse.id,
                refreshedState
                  .allowSharedLastCheese
              );

            target =
              findNearestCheeseTarget(
                {
                  x:
                    mouse.x,

                  y:
                    mouse.y,
                },

                isPortrait,
                rect,
                reservedKeys
              );


            if (!target) {
              const retreatHole =
                findNearestHole(
                  {
                    x:
                      mouse.x,

                    y:
                      mouse.y,
                  },

                  isPortrait,
                  rect,
                  refreshedState
                );

              if (!retreatHole) {
                continue;
              }

              mouse = {
                ...mouse,

                returnHoleId:
                  retreatHole.id,

                phase:
                  "retreat",
              };

              nextMice.push(
                mouse
              );

              continue;
            }


            mouse = {
              ...mouse,

              targetSource:
                target.source,

              targetCheeseIndex:
                target.cheeseId,

              targetDroppedId:
                target.droppedId,
            };
          }


          const movement =
            moveTowards(
              {
                x:
                  mouse.x,

                y:
                  mouse.y,
              },

              target.position,
              rect,
              movementSpeed,
              deltaSeconds
            );

          mouse = {
            ...mouse,

            x:
              movement.position.x,

            y:
              movement.position.y,

            rotation:
              movement.rotation,
          };


          if (
            movement.reached
          ) {
            const stillAvailable =
              target.source ===
                "placed"
                ? Boolean(
                    cheesesRef.current[
                      target.cheeseId
                    ]?.active
                  )
                : droppedCheesesRef.current.some(
                    (
                      cheese
                    ) =>
                      cheese.id ===
                        target.droppedId &&
                      cheese.active
                  );


            if (
              !stillAvailable
            ) {
              nextMice.push(
                mouse
              );

              continue;
            }


            removeTargetCheese(
              target
            );

            const refreshedState =
              getCurrentDifficultyState();

            const returnHole =
              findNearestHole(
                {
                  x:
                    movement.position.x,

                  y:
                    movement.position.y,
                },

                isPortrait,
                rect,
                refreshedState
              );

            if (!returnHole) {
              continue;
            }


            mouse = {
              ...mouse,

              carryingCheese:
                true,

              targetSource:
                "carried",

              targetCheeseIndex:
                target.cheeseId,

              targetDroppedId:
                null,

              returnHoleId:
                returnHole.id,

              phase:
                "to-hole",
            };
          }

          nextMice.push(
            mouse
          );

          continue;
        }


        if (
          mouse.phase ===
          "to-hole"
        ) {
          const refreshedState =
            getCurrentDifficultyState();

          let returnHole =
            findHoleById(
              HOLES,
              mouse.returnHoleId
            );

          if (
            !returnHole ||
            !refreshedState
              .activeHoleIds
              .includes(
                returnHole.id
              )
          ) {
            returnHole =
              findNearestHole(
                {
                  x:
                    mouse.x,

                  y:
                    mouse.y,
                },

                isPortrait,
                rect,
                refreshedState
              );

            if (
              returnHole
            ) {
              mouse = {
                ...mouse,

                returnHoleId:
                  returnHole.id,
              };
            }
          }

          if (!returnHole) {
            continue;
          }

          const holeSpawn =
            getResponsiveHoleSpawn(
              returnHole,
              isPortrait
            );

          const movement =
            moveTowards(
              {
                x:
                  mouse.x,

                y:
                  mouse.y,
              },

              holeSpawn,
              rect,
              movementSpeed,
              deltaSeconds
            );

          mouse = {
            ...mouse,

            x:
              movement.position.x,

            y:
              movement.position.y,

            rotation:
              movement.rotation,
          };


          if (
            movement.reached
          ) {
            gameOver =
              loseLife();

            if (
              gameOver
            ) {
              break;
            }

            continue;
          }

          nextMice.push(
            mouse
          );

          continue;
        }


        if (
          mouse.phase ===
          "retreat"
        ) {
          const refreshedState =
            getCurrentDifficultyState();

          let returnHole =
            findHoleById(
              HOLES,
              mouse.returnHoleId
            );

          if (
            !returnHole ||
            !refreshedState
              .activeHoleIds
              .includes(
                returnHole.id
              )
          ) {
            returnHole =
              findNearestHole(
                {
                  x:
                    mouse.x,

                  y:
                    mouse.y,
                },

                isPortrait,
                rect,
                refreshedState
              );

            if (
              returnHole
            ) {
              mouse = {
                ...mouse,

                returnHoleId:
                  returnHole.id,
              };
            }
          }

          if (!returnHole) {
            continue;
          }

          const holeSpawn =
            getResponsiveHoleSpawn(
              returnHole,
              isPortrait
            );

          const movement =
            moveTowards(
              {
                x:
                  mouse.x,

                y:
                  mouse.y,
              },

              holeSpawn,
              rect,
              movementSpeed,
              deltaSeconds
            );

          if (
            movement.reached
          ) {
            continue;
          }

          nextMice.push({
            ...mouse,

            x:
              movement.position.x,

            y:
              movement.position.y,

            rotation:
              movement.rotation,
          });
        }
      }


      if (
        !gameOver
      ) {
        miceRuntimeRef.current =
          nextMice;

        publishMice(
          timestamp
        );

        animationId =
          requestAnimationFrame(
            tick
          );
      }
    }


    animationId =
      requestAnimationFrame(
        tick
      );


    return () => {
      cancelled =
        true;

      if (
        animationId !==
        null
      ) {
        cancelAnimationFrame(
          animationId
        );
      }
    };
  }, [
    gamePhase,
  ]);


  useEffect(() => {
    if (
      gamePhase !==
      "playing"
    ) {
      setAvailableAction(
        null
      );

      return;
    }

    const playfield =
      playfieldRef.current;

    if (!playfield) {
      setAvailableAction(
        null
      );

      return;
    }

    const rect =
      playfield
        .getBoundingClientRect();

    const touchingMouse =
      mice.find(
        (
          mouse
        ) =>
          mouse.visible &&
          (
            mouse.phase ===
              "to-cheese" ||
            mouse.phase ===
              "to-hole"
          ) &&
          arePositionsTouching(
            catPosition,

            {
              x:
                mouse.x,

              y:
                mouse.y,
            },

            rect,

            mouse.type ===
              "big"
              ? COLLISION_RADII
                  .catBigMouse
              : COLLISION_RADII
                  .catMouse
          )
      );

    if (
      touchingMouse
    ) {
      setAvailableAction(
        "eat"
      );

      return;
    }

    const touchingDropped =
      droppedCheeses.find(
        (
          cheese
        ) =>
          arePositionsTouching(
            catPosition,
            cheese,
            rect,
            COLLISION_RADII
              .catDroppedCheese
          )
      );

    if (
      touchingDropped
    ) {
      setAvailableAction(
        "return-cheese"
      );

      return;
    }

    setAvailableAction(
      null
    );
  }, [
    gamePhase,
    catPosition,
    mice,
    droppedCheeses,
    gameClock,
  ]);


  function performAction() {
    if (
      gamePhaseRef.current !==
      "playing"
    ) {
      return;
    }

    const playfield =
      playfieldRef.current;

    if (!playfield) {
      return;
    }

    const rect =
      playfield
        .getBoundingClientRect();


    const collidingMice =
      miceRuntimeRef.current
        .filter(
          (
            mouse
          ) =>
            mouse.visible &&
            (
              mouse.phase ===
                "to-cheese" ||
              mouse.phase ===
                "to-hole"
            ) &&
            arePositionsTouching(
              catPositionRef.current,

              {
                x:
                  mouse.x,

                y:
                  mouse.y,
              },

              rect,

              mouse.type ===
                "big"
                ? COLLISION_RADII
                    .catBigMouse
                : COLLISION_RADII
                    .catMouse
            )
        )
        .sort(
          (
            first,
            second
          ) =>
            distanceInPixels(
              catPositionRef.current,
              first,
              rect
            ) -
            distanceInPixels(
              catPositionRef.current,
              second,
              rect
            )
        );


    const hitMouse =
      collidingMice[0];


    if (
      hitMouse
    ) {
      if (
        hitMouse.hitPoints >
        1
      ) {
        const hitTime =
          performance.now();

        miceRuntimeRef.current =
          miceRuntimeRef.current.map(
            (
              mouse
            ) =>
              mouse.id ===
              hitMouse.id
                ? {
                    ...mouse,

                    hitPoints:
                      mouse.hitPoints -
                      1,

                    hitFlashUntil:
                      hitTime +
                      190,
                  }
                : mouse
          );

        publishMice(
          hitTime
        );

        return;
      }


      if (
        hitMouse.carryingCheese &&
        hitMouse.targetCheeseIndex >=
          0
      ) {
        const originalCheese =
          CHEESE_POSITIONS[
            hitMouse.targetCheeseIndex
          ];

        const dropped = {
          id:
            `${hitMouse.targetCheeseIndex}-${hitMouse.id}-${Date.now()}`,

          active:
            true,

          cheeseId:
            hitMouse.targetCheeseIndex,

          x:
            hitMouse.x,

          y:
            hitMouse.y,

          rotation:
            originalCheese
              ?.rotation ||
            "0deg",
        };

        setDroppedCheeses([
          ...droppedCheesesRef.current,
          dropped,
        ]);
      }


      miceRuntimeRef.current =
        miceRuntimeRef.current.filter(
          (
            mouse
          ) =>
            mouse.id !==
            hitMouse.id
        );

      setMice(
        (
          current
        ) =>
          current.filter(
            (
              mouse
            ) =>
              mouse.id !==
              hitMouse.id
          )
      );

      const mouseConfig =
        getMouseTypeConfig(
          hitMouse.type
        );

      setScore(
        (
          currentScore
        ) =>
          currentScore +
          mouseConfig.score
      );

      setAvailableAction(
        null
      );

      return;
    }


    const touchingDropped =
      droppedCheesesRef.current.find(
        (
          cheese
        ) =>
          arePositionsTouching(
            catPositionRef.current,
            cheese,
            rect,
            COLLISION_RADII
              .catDroppedCheese
          )
      );

    if (
      !touchingDropped
    ) {
      return;
    }


    const nextCheeses =
      cheesesRef.current.map(
        (
          cheese
        ) =>
          cheese.id ===
          touchingDropped.cheeseId
            ? {
                ...cheese,

                active:
                  true,
              }
            : cheese
      );

    cheesesRef.current =
      nextCheeses;

    setCheeses(
      nextCheeses
    );

    setDroppedCheeses(
      droppedCheesesRef.current.filter(
        (
          cheese
        ) =>
          cheese.id !==
          touchingDropped.id
      )
    );

    setAvailableAction(
      null
    );
  }


  useEffect(() => {
    performActionRef.current =
      performAction;
  });


  useEffect(() => {
    function handleDesktopMouseDown(
      event
    ) {
      if (
        event.button !==
        0
      ) {
        return;
      }

      const playfield =
        playfieldRef.current;

      if (
        !playfield ||
        document.pointerLockElement !==
          playfield ||
        gamePhaseRef.current !==
          "playing"
      ) {
        return;
      }

      event.preventDefault();

      performActionRef
        .current
        ?.();
    }

    document.addEventListener(
      "mousedown",
      handleDesktopMouseDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleDesktopMouseDown
      );
    };
  }, []);


  useEffect(() => {
    togglePauseRef.current =
      togglePause;
  });


  useEffect(() => {
    function handlePauseKeyDown(
      event
    ) {
      if (
        event.code !==
          "Space" ||
        event.repeat
      ) {
        return;
      }

      const phase =
        gamePhaseRef.current;

      if (
        phase !==
          "playing" &&
        phase !==
          "paused"
      ) {
        return;
      }

      event.preventDefault();

      togglePauseRef
        .current
        ?.(
          event
        );
    }

    window.addEventListener(
      "keydown",
      handlePauseKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handlePauseKeyDown
      );
    };
  }, []);


  return {
    playfieldRef,

    catPosition,

    cheeses,

    mice,

    droppedCheeses,

    availableAction,

    score,

    lives,

    maxLives:
      MAX_LIVES,

    difficulty,

    progressionState,

    activeHoles,

    gamePhase,

    countdown,

    isDragging,

    startGame,

    pauseGame,

    resumeGame,

    togglePause,

    resetGame,

    performAction,

    pointerHandlers: {
      onPointerDown:
        handlePointerDown,
    },
  };
}