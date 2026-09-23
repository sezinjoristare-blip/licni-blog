import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  useLanguage,
} from "../i18n/LanguageContext";

import LanguageMenuControl
  from "../components/LanguageSwitcher/LanguageMenuControl";

import SkateRideRig
  from "../components/SkateRideRig.jsx";

import {
  prepareSkateWorldExitTransition,
  startSkateWorldExitTransition,
} from "../transitions/skateWorldTransition.js";

import "../styles/HumanOneSkateScene_V7_PAMETNI_OBLACICI.css";


const ZONES = [
  {
    slug: "ekipa-zid",
    className: "wall",
    image:
      "/images/human-one/skate/skate-wall.png",
    labelKey:
      "skate.zoneCrewWall",
    label:
      "ЕКИПА / ЗИД",
  },

  {
    slug: "voznja",
    className: "ride",
    image:
      "/images/human-one/skate/skate-ride.png",
    labelKey:
      "skate.zoneRide",
    label:
      "ВОЖЊА",
  },

  {
    slug: "ulica",
    className: "street",
    image:
      "/images/human-one/skate/skate-street.png",
    labelKey:
      "skate.zoneStreet",
    label:
      "УЛИЦА",
  },
];


const PEOPLE = [
  {
    key:
      "seki",

    nameKey:
      "skate.people.seki.name",

    pickerLabelKey:
      "skate.people.seki.picker",

    className:
      "dogodovstine-person",

    image:
      "/images/human-one/skate/skate-dogodovstine.png",

    name:
      "Сергеј Ристић Секи",

    pickerLabel:
      "СЕКИ",

    adventuresPath:
      "/autor/covek/skejt/dogodovstine?osoba=seki",
  },

  {
    key:
      "toka",

    nameKey:
      "skate.people.toka.name",

    pickerLabelKey:
      "skate.people.toka.picker",

    className:
      "toka",

    image:
      "/images/human-one/skate/skate-toka.png",

    name:
      "Тодор Павловић Тока",

    pickerLabel:
      "ТОКА",

    adventuresPath:
      "/autor/covek/skejt/dogodovstine?osoba=toka",
  },

  {
    key:
      "lento",

    nameKey:
      "skate.people.lento.name",

    pickerLabelKey:
      "skate.people.lento.picker",

    className:
      "lento",

    image:
      "/images/human-one/skate/skate-lento.png",

    name:
      "Огњен Леонтијевић Ленто",

    pickerLabel:
      "ЛЕНТО",

    adventuresPath:
      "/autor/covek/skejt/dogodovstine?osoba=lento",
  },

  {
    key:
      "doske",

    nameKey:
      "skate.people.doske.name",

    pickerLabelKey:
      "skate.people.doske.picker",

    className:
      "doske",

    image:
      "/images/human-one/skate/skate-doske.png",

    name:
      "Доситеј Обрадовић Доске",

    pickerLabel:
      "ДОСКЕ",

    adventuresPath:
      "/autor/covek/skejt/dogodovstine?osoba=doske",
  },

  {
    key:
      "vojin",

    nameKey:
      "skate.people.vojin.name",

    pickerLabelKey:
      "skate.people.vojin.picker",

    className:
      "vojin",

    image:
      "/images/human-one/skate/skate-vojin.png",

    name:
      "Лазар Војиновић Војин",

    pickerLabel:
      "ВОЈИН",

    adventuresPath:
      "/autor/covek/skejt/dogodovstine?osoba=vojin",
  },

  {
    key:
      "caki",

    nameKey:
      "skate.people.caki.name",

    pickerLabelKey:
      "skate.people.caki.picker",

    className:
      "caki",

    image:
      "/images/human-one/skate/skate-caki.png",

    name:
      "Андреј Филиповић Чаки",

    pickerLabel:
      "ЧАКИ",

    adventuresPath:
      "/autor/covek/skejt/dogodovstine?osoba=caki",
  },
];


const BUBBLE_VISIBLE_MS =
  5600;

const BUBBLE_FADE_MS =
  450;

const BUBBLE_WIDTH =
  320;

const BUBBLE_HEIGHT =
  140;

const BUBBLE_GAP =
  14;

const BUBBLE_SAFE_MARGIN =
  10;


function getPersonMessage(
  personName,
  hasAdventures,
  t
) {
  if (
    hasAdventures
  ) {
    return (
      t(
        "skate.personMessageWithAdventuresBefore"
      ) +
      personName +
      t(
        "skate.personMessageWithAdventuresAfter"
      )
    );
  }


  return (
    t(
      "skate.personMessageWithoutAdventuresBefore"
    ) +
    personName +
    t(
      "skate.personMessageWithoutAdventuresAfter"
    )
  );
}


function getBubbleCandidateRect(
  placement,
  triggerRect,
  bubbleWidth,
  bubbleHeight
) {
  const centerX =
    triggerRect.left +
    triggerRect.width /
      2;


  const centerY =
    triggerRect.top +
    triggerRect.height /
      2;


  if (
    placement ===
    "top"
  ) {
    return {
      left:
        centerX -
        bubbleWidth /
          2,

      top:
        triggerRect.top -
        BUBBLE_GAP -
        bubbleHeight,

      width:
        bubbleWidth,

      height:
        bubbleHeight,
    };
  }


  if (
    placement ===
    "left"
  ) {
    return {
      left:
        triggerRect.left -
        BUBBLE_GAP -
        bubbleWidth,

      top:
        centerY -
        bubbleHeight /
          2,

      width:
        bubbleWidth,

      height:
        bubbleHeight,
    };
  }


  if (
    placement ===
    "right"
  ) {
    return {
      left:
        triggerRect.right +
        BUBBLE_GAP,

      top:
        centerY -
        bubbleHeight /
          2,

      width:
        bubbleWidth,

      height:
        bubbleHeight,
    };
  }


  return {
    left:
      centerX -
      bubbleWidth /
        2,

    top:
      triggerRect.bottom +
      BUBBLE_GAP,

    width:
      bubbleWidth,

    height:
      bubbleHeight,
  };
}


function getBubbleOverflow(
  rect,
  stageRect
) {
  const safeLeft =
    stageRect.left +
    BUBBLE_SAFE_MARGIN;


  const safeRight =
    stageRect.right -
    BUBBLE_SAFE_MARGIN;


  const safeTop =
    stageRect.top +
    BUBBLE_SAFE_MARGIN;


  const safeBottom =
    stageRect.bottom -
    BUBBLE_SAFE_MARGIN;


  const left =
    Math.max(
      0,

      safeLeft -
        rect.left
    );


  const right =
    Math.max(
      0,

      rect.left +
        rect.width -
        safeRight
    );


  const top =
    Math.max(
      0,

      safeTop -
        rect.top
    );


  const bottom =
    Math.max(
      0,

      rect.top +
        rect.height -
        safeBottom
    );


  return {
    left,
    right,
    top,
    bottom,

    total:
      left +
      right +
      top +
      bottom,
  };
}


function getBubbleNudge(
  rect,
  stageRect
) {
  const safeLeft =
    stageRect.left +
    BUBBLE_SAFE_MARGIN;


  const safeRight =
    stageRect.right -
    BUBBLE_SAFE_MARGIN;


  const safeTop =
    stageRect.top +
    BUBBLE_SAFE_MARGIN;


  const safeBottom =
    stageRect.bottom -
    BUBBLE_SAFE_MARGIN;


  let x =
    0;

  let y =
    0;


  if (
    rect.left <
    safeLeft
  ) {
    x =
      safeLeft -
      rect.left;

  } else if (
    rect.left +
      rect.width >
    safeRight
  ) {
    x =
      safeRight -
      (
        rect.left +
        rect.width
      );
  }


  if (
    rect.top <
    safeTop
  ) {
    y =
      safeTop -
      rect.top;

  } else if (
    rect.top +
      rect.height >
    safeBottom
  ) {
    y =
      safeBottom -
      (
        rect.top +
        rect.height
      );
  }


  return {
    x,
    y,
  };
}


function pickBestBubblePlacement(
  stageRect,
  triggerRect,
  bubbleRect
) {
  if (
    !stageRect ||
    !triggerRect
  ) {
    return {
      placement:
        "bottom",

      x:
        0,

      y:
        0,
    };
  }


  const bubbleWidth =
    bubbleRect?.width ||
    BUBBLE_WIDTH;


  const bubbleHeight =
    bubbleRect?.height ||
    BUBBLE_HEIGHT;


  const spaces = {
    top:
      triggerRect.top -
      stageRect.top,

    bottom:
      stageRect.bottom -
      triggerRect.bottom,

    left:
      triggerRect.left -
      stageRect.left,

    right:
      stageRect.right -
      triggerRect.right,
  };


  const priority = [
    "bottom",
    "top",
    "right",
    "left",
  ];


  const candidates =
    priority.map(
      (
        placement,
        index
      ) => {
        const rect =
          getBubbleCandidateRect(
            placement,
            triggerRect,
            bubbleWidth,
            bubbleHeight
          );


        const overflow =
          getBubbleOverflow(
            rect,
            stageRect
          );


        return {
          placement,
          rect,
          overflow,

          free:
            spaces[
              placement
            ],

          priority:
            index,
        };
      }
    );


  candidates.sort(
    (
      first,
      second
    ) => {
      if (
        first
          .overflow
          .total !==
        second
          .overflow
          .total
      ) {
        return (
          first
            .overflow
            .total -
          second
            .overflow
            .total
        );
      }


      if (
        first.free !==
        second.free
      ) {
        return (
          second.free -
          first.free
        );
      }


      return (
        first.priority -
        second.priority
      );
    }
  );


  const best =
    candidates[
      0
    ];


  const nudge =
    getBubbleNudge(
      best.rect,
      stageRect
    );


  return {
    placement:
      best.placement,

    x:
      nudge.x,

    y:
      nudge.y,
  };
}


function HumanOneSkate() {
  const navigate =
    useNavigate();


  const {
    t,
  } =
    useLanguage();


  const [
    sections,
    setSections,
  ] =
    useState(
      []
    );


  const [
    adventureKeys,
    setAdventureKeys,
  ] =
    useState(
      []
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    backgroundReady,
    setBackgroundReady,
  ] =
    useState(
      false
    );


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState(
      ""
    );


  const [
    activeBubble,
    setActiveBubble,
  ] =
    useState(
      null
    );


  const [
    closingBubble,
    setClosingBubble,
  ] =
    useState(
      null
    );


  const [
    bubblePlacements,
    setBubblePlacements,
  ] =
    useState(
      {}
    );


  const [
    bubbleOffsets,
    setBubbleOffsets,
  ] =
    useState(
      {}
    );


  const [
    showCategoryPicker,
    setShowCategoryPicker,
  ] =
    useState(
      false
    );


  const stageRef =
    useRef(
      null
    );


  const personRefs =
    useRef(
      {}
    );


  const speechRefs =
    useRef(
      {}
    );


  const autoCloseRef =
    useRef(
      null
    );


  const fadeOutRef =
    useRef(
      null
    );


  function clearBubbleTimers() {
    if (
      autoCloseRef
        .current
    ) {
      window
        .clearTimeout(
          autoCloseRef
            .current
        );


      autoCloseRef
        .current =
        null;
    }


    if (
      fadeOutRef
        .current
    ) {
      window
        .clearTimeout(
          fadeOutRef
            .current
        );


      fadeOutRef
        .current =
        null;
    }
  }


  function finalizeClose(
    bubbleKey
  ) {
    setActiveBubble(
      (
        current
      ) =>
        current ===
        bubbleKey
          ? null
          : current
    );


    setClosingBubble(
      (
        current
      ) =>
        current ===
        bubbleKey
          ? null
          : current
    );
  }


  function closeBubbleWithFade(
    bubbleKey
  ) {
    if (
      !bubbleKey
    ) {
      return;
    }


    clearBubbleTimers();


    setClosingBubble(
      bubbleKey
    );


    fadeOutRef
      .current =
      window
        .setTimeout(
          () => {
            finalizeClose(
              bubbleKey
            );
          },

          BUBBLE_FADE_MS
        );
  }


  function updateBubblePlacement(
    personKey
  ) {
    const stageNode =
      stageRef
        .current;


    const personNode =
      personRefs
        .current[
          personKey
        ];


    const speechNode =
      speechRefs
        .current[
          personKey
        ];


    if (
      !stageNode ||
      !personNode
    ) {
      return;
    }


    const stageRect =
      stageNode
        .getBoundingClientRect();


    const triggerRect =
      personNode
        .getBoundingClientRect();


    const bubbleRect =
      speechNode
        ?.getBoundingClientRect();


    const result =
      pickBestBubblePlacement(
        stageRect,
        triggerRect,
        bubbleRect
      );


    setBubblePlacements(
      (
        current
      ) => ({
        ...current,

        [personKey]:
          result
            .placement,
      })
    );


    setBubbleOffsets(
      (
        current
      ) => ({
        ...current,

        [personKey]:
          {
            x:
              result
                .x,

            y:
              result
                .y,
          },
      })
    );
  }


  function openBubble(
    personKey
  ) {
    clearBubbleTimers();


    setClosingBubble(
      null
    );


    setActiveBubble(
      personKey
    );


    window
      .requestAnimationFrame(
        () => {
          window
            .requestAnimationFrame(
              () => {
                updateBubblePlacement(
                  personKey
                );
              }
            );
        }
      );
  }


  function handlePersonClick(
    person,
    hasAdventures
  ) {
    const isSameOpenBubble =
      activeBubble ===
        person.key &&
      !closingBubble;


    /*
      IMA DOGODOVŠTINE:
      prvi klik = oblačić
      drugi klik = ulazak u dogodovštine
    */

    if (
      hasAdventures &&
      isSameOpenBubble
    ) {
      clearBubbleTimers();


      setActiveBubble(
        null
      );


      setClosingBubble(
        null
      );


      navigate(
        person
          .adventuresPath
      );


      return;
    }


    /*
      NEMA DOGODOVŠTINE:
      prvi klik = oblačić
      drugi klik = zatvaranje oblačića
    */

    if (
      !hasAdventures &&
      isSameOpenBubble
    ) {
      closeBubbleWithFade(
        person.key
      );


      return;
    }


    openBubble(
      person.key
    );
  }


  function openCategoryPicker() {
    clearBubbleTimers();


    setActiveBubble(
      null
    );


    setClosingBubble(
      null
    );


    setShowCategoryPicker(
      true
    );
  }


  function closeCategoryPicker() {
    setShowCategoryPicker(
      false
    );
  }


  function handleZoneCategory(
    zone
  ) {
    setShowCategoryPicker(
      false
    );


    navigate(
      `/autor/covek/skejt/${zone.slug}`
    );
  }


  function handlePersonCategory(
    person
  ) {
    const hasAdventures =
      adventureKeys
        .includes(
          person.key
        );


    setShowCategoryPicker(
      false
    );


    /*
      Picker koristi ISTU logiku
      kao direktan klik na lika.
    */

    window
      .requestAnimationFrame(
        () => {
          handlePersonClick(
            person,
            hasAdventures
          );
        }
      );
  }


  useEffect(
    () => {
      let active =
        true;


      async function loadSections() {
        setLoading(
          true
        );


        setErrorMessage(
          ""
        );


        const {
          data,
          error,
        } =
          await supabase
            .from(
              "skate_sections"
            )
            .select(`
              id,
              name,
              slug,
              status,
              sort_order
            `)
            .eq(
              "status",
              "published"
            )
            .order(
              "sort_order",
              {
                ascending:
                  true,
              }
            );


        if (
          !active
        ) {
          return;
        }


        if (
          error
        ) {
          console.error(
            "Učitavanje Skejt sveta:",
            error
          );


          setErrorMessage(
            "skate.unavailable"
          );


          setLoading(
            false
          );


          return;
        }


        const loadedSections =
          data ??
          [];


        setSections(
          loadedSections
        );


        const dogodovstineSection =
          loadedSections
            .find(
              (
                section
              ) =>
                section
                  .slug ===
                "dogodovstine"
            );


        if (
          dogodovstineSection
            ?.id
        ) {
          const {
            data:
              adventureData,

            error:
              adventureError,
          } =
            await supabase
              .from(
                "skate_entries"
              )
              .select(
                "person_key"
              )
              .eq(
                "section_id",
                dogodovstineSection
                  .id
              )
              .eq(
                "status",
                "published"
              )
              .not(
                "person_key",
                "is",
                null
              );


          if (
            !active
          ) {
            return;
          }


          if (
            adventureError
          ) {
            console.error(
              "Učitavanje ličnih dogodovština:",
              adventureError
            );


            setAdventureKeys(
              []
            );

          } else {
            setAdventureKeys(
              Array.from(
                new Set(
                  (
                    adventureData ??
                    []
                  )
                    .map(
                      (
                        entry
                      ) =>
                        entry
                          .person_key
                    )
                    .filter(
                      Boolean
                    )
                )
              )
            );
          }

        } else {
          setAdventureKeys(
            []
          );
        }


        setLoading(
          false
        );
      }


      loadSections();


      return () => {
        active =
          false;
      };
    },

    []
  );


  useEffect(
    () => {
      prepareSkateWorldExitTransition();
    },

    []
  );


  useEffect(
    () => {
      if (
        !activeBubble
      ) {
        clearBubbleTimers();

        return;
      }


      autoCloseRef
        .current =
        window
          .setTimeout(
            () => {
              closeBubbleWithFade(
                activeBubble
              );
            },

            BUBBLE_VISIBLE_MS
          );


      return () => {
        clearBubbleTimers();
      };
    },

    [
      activeBubble,
    ]
  );


  useEffect(
    () => {
      if (
        !activeBubble
      ) {
        return;
      }


      function handleOutsidePointer(
        event
      ) {
        const target =
          event.target;


        const clickedPerson =
          Object
            .values(
              personRefs
                .current
            )
            .some(
              (
                node
              ) =>
                node &&
                node
                  .contains(
                    target
                  )
            );


        if (
          clickedPerson
        ) {
          return;
        }


        closeBubbleWithFade(
          activeBubble
        );
      }


      function handleEscape(
        event
      ) {
        if (
          event.key ===
          "Escape"
        ) {
          closeBubbleWithFade(
            activeBubble
          );
        }
      }


      document
        .addEventListener(
          "pointerdown",
          handleOutsidePointer
        );


      document
        .addEventListener(
          "keydown",
          handleEscape
        );


      return () => {
        document
          .removeEventListener(
            "pointerdown",
            handleOutsidePointer
          );


        document
          .removeEventListener(
            "keydown",
            handleEscape
          );
      };
    },

    [
      activeBubble,
    ]
  );


  useEffect(
    () => {
      if (
        !activeBubble
      ) {
        return;
      }


      function handleResize() {
        updateBubblePlacement(
          activeBubble
        );
      }


      window
        .addEventListener(
          "resize",
          handleResize
        );


      return () => {
        window
          .removeEventListener(
            "resize",
            handleResize
          );
      };
    },

    [
      activeBubble,
    ]
  );


  useEffect(
    () => {
      return () => {
        clearBubbleTimers();
      };
    },

    []
  );


  const sectionsBySlug =
    useMemo(
      () =>
        Object
          .fromEntries(
            sections
              .map(
                (
                  section
                ) => [
                  section
                    .slug,

                  section,
                ]
              )
          ),

      [
        sections,
      ]
    );


  function handleBackToRoom(
    event
  ) {
    const isModifiedClick =
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey;


    if (
      event.button !==
        0 ||
      isModifiedClick
    ) {
      return;
    }


    event
      .preventDefault();


    startSkateWorldExitTransition({
      navigate:
        () => {
          navigate(
            "/autor/covek"
          );
        },
    });
  }


  const transitionReady =
    !loading &&
    backgroundReady;


  return (
    <main
      className="human-one-skate-scene"
      data-skate-world-transition-ready={
        transitionReady
          ? "true"
          : undefined
      }
    >
      <div
        ref={
          stageRef
        }
        className="human-one-skate-scene__stage"
      >
        <picture className="human-one-skate-scene__background-picture">
          <source
            media="(max-width: 700px)"
            srcSet="/images/human-one/skate/skate-scene-mobile.png"
          />

          <img
            className="human-one-skate-scene__background"
            src="/images/human-one/skate/skate-background.png"
            alt=""
            draggable="false"
            onLoad={
              () =>
                setBackgroundReady(
                  true
                )
            }
            onError={
              () =>
                setBackgroundReady(
                  true
                )
            }
          />
        </picture>


        <div className="skate-ride-rig-test">
          <SkateRideRig />
        </div>


        <Link
          to="/autor/covek"
          className="human-one-skate-scene__back"
          onClick={
            handleBackToRoom
          }
          aria-label={
            t(
              "skate.backToRoomAria"
            )
          }
        >
          {t(
            "skate.backToRoomShort"
          )}
        </Link>


        <button
          type="button"
          className="human-one-skate-scene__category-button"
          onClick={
            openCategoryPicker
          }
          aria-label={
            t(
              "skate.chooseCategory"
            )
          }
          aria-expanded={
            showCategoryPicker
          }
          aria-controls="human-one-skate-mobile-category-picker"
        >
          <span
            aria-hidden="true"
          >
            ☰
          </span>
        </button>


        {loading ? (
          <div className="human-one-skate-scene__state">
            {t(
              "common.loading"
            )}
          </div>

        ) : errorMessage ? (
          <div className="human-one-skate-scene__state">
            {t(
              errorMessage
            )}
          </div>

        ) : (
          <>
            {ZONES.map(
              (
                zone
              ) => {
                const section =
                  sectionsBySlug[
                    zone.slug
                  ];


                if (
                  !section
                ) {
                  return null;
                }


                return (
                  <Link
                    key={
                      section.id
                    }
                    to={
                      `/autor/covek/skejt/${section.slug}`
                    }
                    className={
                      `human-one-skate-scene__object human-one-skate-scene__${zone.className}`
                    }
                    aria-label={
                      t(
                        zone.labelKey,
                        zone.label
                      )
                    }
                  >
                    <img
                      src={
                        zone.image
                      }
                      alt=""
                      draggable="false"
                    />
                  </Link>
                );
              }
            )}


            {sectionsBySlug[
              "ekipa-zid"
            ] && (
              <Link
                to="/autor/covek/skejt/ekipa-zid"
                className="human-one-skate-scene__object human-one-skate-scene__pateb-sign"
                aria-label={
                  t(
                    "skate.patebCrew"
                  )
                }
              >
                <img
                  src="/images/human-one/skate/pateb-sign.png"
                  alt=""
                  draggable="false"
                />
              </Link>
            )}


            {PEOPLE.map(
              (
                person
              ) => {
                const hasAdventures =
                  adventureKeys
                    .includes(
                      person.key
                    );


                const isActive =
                  activeBubble ===
                  person.key;


                const isClosing =
                  closingBubble ===
                  person.key;


                const shouldRenderBubble =
                  isActive ||
                  isClosing;


                const bubblePlacement =
                  bubblePlacements[
                    person.key
                  ] ||
                  "bottom";


                const bubbleOffset =
                  bubbleOffsets[
                    person.key
                  ] || {
                    x:
                      0,

                    y:
                      0,
                  };


                const isSpeaking =
                  isActive ||
                  isClosing;


                const personName =
                  t(
                    person.nameKey,
                    person.name
                  );


                return (
                  <button
                    key={
                      person.key
                    }
                    type="button"
                    ref={(
                      node
                    ) => {
                      personRefs
                        .current[
                          person.key
                        ] =
                        node;
                    }}
                    className={[
                      "human-one-skate-scene__object",

                      "human-one-skate-scene__person",

                      `human-one-skate-scene__${person.className}`,

                      isSpeaking
                        ? "human-one-skate-scene__person--speaking"
                        : "",
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        " "
                      )}
                    onClick={
                      () =>
                        handlePersonClick(
                          person,
                          hasAdventures
                        )
                    }
                    aria-label={
                      personName
                    }
                    aria-expanded={
                      isActive
                    }
                  >
                    <img
                      src={
                        person.image
                      }
                      alt=""
                      draggable="false"
                    />


                    {shouldRenderBubble && (
                      <span
                        ref={(
                          node
                        ) => {
                          speechRefs
                            .current[
                              person.key
                            ] =
                            node;
                        }}
                        className={[
                          "human-one-skate-scene__speech",

                          `human-one-skate-scene__speech--${bubblePlacement}`,

                          isActive
                            ? "human-one-skate-scene__speech--visible"
                            : "human-one-skate-scene__speech--closing",
                        ].join(
                          " "
                        )}
                        style={{
                          "--bubble-shift-x":
                            `${bubbleOffset.x}px`,

                          "--bubble-shift-y":
                            `${bubbleOffset.y}px`,
                        }}
                      >
                        {getPersonMessage(
                          personName,
                          hasAdventures,
                          t
                        )}
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </>
        )}


        {showCategoryPicker && (
          <section
            className="human-one-skate-scene__category-picker"
            id="human-one-skate-mobile-category-picker"
            aria-label={
              t(
                "skate.categoryPickerLabel"
              )
            }
          >
            <div className="human-one-skate-scene__category-picker-top">
              <button
                type="button"
                className="human-one-skate-scene__category-close"
                onClick={
                  closeCategoryPicker
                }
              >
                {t(
                  "skate.backToWorld"
                )}
              </button>


              <p>
                {t(
                  "skate.swipe"
                )}
              </p>
            </div>


            <LanguageMenuControl />


            <div className="human-one-skate-scene__category-track">
              {ZONES.map(
                (
                  zone
                ) => {
                  const section =
                    sectionsBySlug[
                      zone.slug
                    ];


                  if (
                    !section
                  ) {
                    return null;
                  }


                  return (
                    <button
                      key={
                        `zone-${zone.slug}`
                      }
                      type="button"
                      className="human-one-skate-scene__category-card"
                      onClick={
                        () =>
                          handleZoneCategory(
                            zone
                          )
                      }
                    >
                      <span>
                        {t(
                          zone.labelKey,
                          zone.label
                        )}
                      </span>


                      <img
                        src={
                          zone.image
                        }
                        alt=""
                        draggable="false"
                      />
                    </button>
                  );
                }
              )}


              {PEOPLE.map(
                (
                  person
                ) => {
                  const personName =
                    t(
                      person.nameKey,
                      person.name
                    );


                  const pickerLabel =
                    t(
                      person.pickerLabelKey,
                      person.pickerLabel
                    );


                  return (
                    <button
                      key={
                        `person-${person.key}`
                      }
                      type="button"
                      className="
                        human-one-skate-scene__category-card
                        human-one-skate-scene__category-card--person
                      "
                      onClick={
                        () =>
                          handlePersonCategory(
                            person
                          )
                      }
                      aria-label={
                        personName
                      }
                    >
                      <span>
                        {
                          pickerLabel
                        }
                      </span>


                      <img
                        src={
                          person.image
                        }
                        alt=""
                        draggable="false"
                      />
                    </button>
                  );
                }
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}


export default HumanOneSkate;