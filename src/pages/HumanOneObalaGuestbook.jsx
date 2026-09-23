import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import "../styles/pages/HumanOneObalaGuestbook.css";


const MAX_NAME_LENGTH = 24;
const MAX_MESSAGE_LENGTH = 400;

const PAGE_MARGIN_X = 5;
const PAGE_MARGIN_TOP = 6;
const PAGE_MARGIN_BOTTOM = 8;
const NOTE_GAP = 2.2;

const FONT_FAMILIES = [
  '"Segoe Print", "Comic Sans MS", cursive',
  '"Segoe Script", "Segoe Print", cursive',
  '"Lucida Handwriting", "Segoe Print", cursive',
  '"Comic Sans MS", "Segoe Print", cursive',
  '"Brush Script MT", "Segoe Print", cursive',
];

const INK_VARIANTS = [
  "black",
  "blue",
  "brown",
  "faded",
];


function hashString(value) {
  let hash = 2166136261;

  const text =
    String(value ?? "");

  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    hash ^=
      text.charCodeAt(index);

    hash =
      Math.imul(
        hash,
        16777619
      );
  }

  return hash >>> 0;
}


function createRandom(seed) {
  let state =
    seed >>> 0;

  return function random() {
    state +=
      0x6d2b79f5;

    let value =
      state;

    value =
      Math.imul(
        value ^
          (value >>> 15),
        value | 1
      );

    value ^=
      value +
      Math.imul(
        value ^
          (value >>> 7),
        value | 61
      );

    return (
      (
        value ^
        (value >>> 14)
      ) >>> 0
    ) /
      4294967296;
  };
}


function rectanglesOverlap(
  first,
  second,
  gap = NOTE_GAP
) {
  return !(
    first.left +
      first.width +
      gap <=
        second.left ||
    second.left +
      second.width +
      gap <=
        first.left ||
    first.top +
      first.height +
      gap <=
        second.top ||
    second.top +
      second.height +
      gap <=
        first.top
  );
}


function getNoteSize(entry) {
  const cleanMessage =
    entry.message
      .trim();

  const lineBreakCount =
    (
      cleanMessage.match(
        /\n/g
      ) ?? []
    ).length;

  const messageLength =
    cleanMessage.length +
    lineBreakCount *
      18;

  if (
    messageLength <=
    55
  ) {
    return {
      sizeKey:
        "short",

      width:
        31,

      height:
        21,
    };
  }

  if (
    messageLength <=
    120
  ) {
    return {
      sizeKey:
        "medium",

      width:
        37,

      height:
        27,
    };
  }

  if (
    messageLength <=
    220
  ) {
    return {
      sizeKey:
        "long",

      width:
        44,

      height:
        35,
    };
  }

  return {
    sizeKey:
      "xlong",

    width:
      53,

    height:
      46,
  };
}


function createNoteModel(entry) {
  const seed =
    hashString(
      `${entry.id}|${entry.name}|${entry.message}|${entry.created_at}`
    );

  const random =
    createRandom(seed);

  const baseSize =
    getNoteSize(entry);

  const widthVariation =
    (
      random() -
      0.5
    ) *
    2.4;

  const heightVariation =
    (
      random() -
      0.5
    ) *
    2.2;

  let rotation =
    -4.2 +
    random() *
      8.4;

  if (
    Math.abs(rotation) <
    0.7
  ) {
    rotation =
      rotation < 0
        ? -1
        : 1;
  }

  return {
    ...entry,

    seed,

    sizeKey:
      baseSize.sizeKey,

    width:
      Math.max(
        28,
        baseSize.width +
          widthVariation
      ),

    height:
      Math.max(
        19,
        baseSize.height +
          heightVariation
      ),

    rotation,

    fontFamily:
      FONT_FAMILIES[
        Math.floor(
          random() *
          FONT_FAMILIES.length
        )
      ],

    inkVariant:
      INK_VARIANTS[
        Math.floor(
          random() *
          INK_VARIANTS.length
        )
      ],

    emphasis:
      random() >
      0.68,
  };
}


function findPlacement(
  note,
  placedNotes
) {
  const random =
    createRandom(
      note.seed ^
      0x9e3779b9
    );

  const maximumLeft =
    100 -
    PAGE_MARGIN_X -
    note.width;

  const maximumTop =
    100 -
    PAGE_MARGIN_BOTTOM -
    note.height;

  if (
    maximumLeft <
      PAGE_MARGIN_X ||
    maximumTop <
      PAGE_MARGIN_TOP
  ) {
    return null;
  }

  for (
    let attempt = 0;
    attempt < 180;
    attempt += 1
  ) {
    const candidate = {
      left:
        PAGE_MARGIN_X +
        random() *
          (
            maximumLeft -
            PAGE_MARGIN_X
          ),

      top:
        PAGE_MARGIN_TOP +
        random() *
          (
            maximumTop -
            PAGE_MARGIN_TOP
          ),

      width:
        note.width,

      height:
        note.height,
    };

    const collision =
      placedNotes.some(
        (
          placed
        ) =>
          rectanglesOverlap(
            candidate,
            placed
          )
      );

    if (!collision) {
      return candidate;
    }
  }

  /*
   * Ako random pokušaji ne nađu dobar džep,
   * radimo precizan scan strane od vrha ka dnu.
   */
  for (
    let top = PAGE_MARGIN_TOP;
    top <= maximumTop;
    top += 1.6
  ) {
    for (
      let left = PAGE_MARGIN_X;
      left <= maximumLeft;
      left += 1.6
    ) {
      const candidate = {
        left,
        top,
        width:
          note.width,
        height:
          note.height,
      };

      const collision =
        placedNotes.some(
          (
            placed
          ) =>
            rectanglesOverlap(
              candidate,
              placed
            )
        );

      if (!collision) {
        return candidate;
      }
    }
  }

  return null;
}


function buildGuestbookPages(entries) {
  const pages = [
    [],
  ];

  entries.forEach(
    (
      entry
    ) => {
      const note =
        createNoteModel(entry);

      let pageIndex =
        pages.length - 1;

      let placement =
        findPlacement(
          note,
          pages[
            pageIndex
          ]
        );

      if (!placement) {
        pages.push([]);

        pageIndex =
          pages.length - 1;

        placement =
          findPlacement(
            note,
            []
          );
      }

      if (!placement) {
        return;
      }

      pages[
        pageIndex
      ].push({
        ...note,
        ...placement,
      });
    }
  );

  return pages;
}


function HumanOneObalaGuestbook() {
  const navigate =
    useNavigate();

  const bookRef =
    useRef(null);

  const pointerStartRef =
    useRef(null);

  const [
    entries,
    setEntries,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    isSinglePage,
    setIsSinglePage,
  ] = useState(false);

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    isWriting,
    setIsWriting,
  ] = useState(false);

  const [
    name,
    setName,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    jumpToEnd,
    setJumpToEnd,
  ] = useState(false);


  const pages =
    useMemo(
      () =>
        buildGuestbookPages(
          entries
        ),
      [
        entries,
      ]
    );


  const displayPages =
    useMemo(
      () => {
        if (
          isSinglePage ||
          pages.length % 2 ===
            0
        ) {
          return pages;
        }

        return [
          ...pages,
          [],
        ];
      },
      [
        isSinglePage,
        pages,
      ]
    );


  const visiblePageCount =
    isSinglePage
      ? 1
      : 2;


  const goBack =
    useCallback(
      () => {
        navigate(
          "/autor/covek/obala"
        );
      },
      [
        navigate,
      ]
    );


  const goPrevious =
    useCallback(
      () => {
        setCurrentIndex(
          (
            current
          ) =>
            Math.max(
              0,
              current -
                visiblePageCount
            )
        );
      },
      [
        visiblePageCount,
      ]
    );


  const goNext =
    useCallback(
      () => {
        setCurrentIndex(
          (
            current
          ) => {
            const maximumIndex =
              Math.max(
                0,
                displayPages.length -
                  visiblePageCount
              );

            return Math.min(
              maximumIndex,
              current +
                visiblePageCount
            );
          }
        );
      },
      [
        displayPages.length,
        visiblePageCount,
      ]
    );


  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(max-width: 760px), (orientation: portrait)"
      );

    function updateLayout() {
      setIsSinglePage(
        mediaQuery.matches
      );
    }

    updateLayout();

    mediaQuery.addEventListener?.(
      "change",
      updateLayout
    );

    return () => {
      mediaQuery.removeEventListener?.(
        "change",
        updateLayout
      );
    };
  }, []);


  useEffect(() => {
    let active =
      true;

    async function loadEntries() {
      setLoading(true);
      setLoadError("");

      const {
        data,
        error,
      } = await supabase
        .from(
          "obala_guestbook_entries"
        )
        .select(`
          id,
          name,
          message,
          created_at
        `)
        .eq(
          "is_visible",
          true
        )
        .order(
          "created_at",
          {
            ascending:
              true,
          }
        )
        .limit(500);

      if (!active) {
        return;
      }

      if (error) {
        console.error(
          "OBALA guestbook load:",
          error
        );

        setEntries([]);
        setLoadError(
          "Књига утисака тренутно не може да се учита."
        );
        setLoading(false);

        return;
      }

      setEntries(
        data ?? []
      );
      setLoading(false);
    }

    loadEntries();

    return () => {
      active =
        false;
    };
  }, []);


  useEffect(() => {
    setCurrentIndex(
      (
        current
      ) => {
        if (
          isSinglePage
        ) {
          return Math.min(
            current,
            Math.max(
              0,
              displayPages.length - 1
            )
          );
        }

        const aligned =
          Math.floor(
            current / 2
          ) * 2;

        return Math.min(
          aligned,
          Math.max(
            0,
            displayPages.length - 2
          )
        );
      }
    );
  }, [
    isSinglePage,
    displayPages.length,
  ]);


  useEffect(() => {
    if (!jumpToEnd) {
      return;
    }

    if (
      isSinglePage
    ) {
      setCurrentIndex(
        Math.max(
          0,
          displayPages.length - 1
        )
      );
    } else {
      const lastIndex =
        Math.max(
          0,
          displayPages.length - 1
        );

      setCurrentIndex(
        Math.floor(
          lastIndex / 2
        ) * 2
      );
    }

    setJumpToEnd(false);
  }, [
    isSinglePage,
    jumpToEnd,
    displayPages.length,
  ]);


  useEffect(() => {
    function handleKeyDown(
      event
    ) {
      if (isWriting) {
        if (
          event.key ===
          "Escape"
        ) {
          setIsWriting(false);
          setFormError("");
        }

        return;
      }

      if (
        event.key ===
        "ArrowLeft"
      ) {
        goPrevious();
      }

      if (
        event.key ===
        "ArrowRight"
      ) {
        goNext();
      }

      if (
        event.key ===
        "Escape"
      ) {
        goBack();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    goBack,
    goNext,
    goPrevious,
    isWriting,
  ]);


  function handlePointerDown(
    event
  ) {
    if (isWriting) {
      return;
    }

    pointerStartRef.current = {
      x:
        event.clientX,
      y:
        event.clientY,
    };
  }


  function handlePointerUp(
    event
  ) {
    if (isWriting) {
      return;
    }

    const start =
      pointerStartRef.current;

    pointerStartRef.current =
      null;

    if (!start) {
      return;
    }

    const deltaX =
      event.clientX -
      start.x;

    const deltaY =
      event.clientY -
      start.y;

    if (
      Math.abs(deltaX) <
        55 ||
      Math.abs(deltaX) <=
        Math.abs(deltaY)
    ) {
      return;
    }

    if (
      deltaX < 0
    ) {
      goNext();

      return;
    }

    goPrevious();
  }


  function handlePointerCancel() {
    /*
     * Browser može da prekine pointer gest
     * zbog skrolovanja, zoom-a, promene
     * orijentacije ili drugog sistemskog gesta.
     *
     * U tom slučaju samo zaboravljamo početnu
     * tačku swipe-a da sledeći dodir ne koristi
     * zastarelu poziciju.
     */
    pointerStartRef.current =
      null;
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const cleanName =
      name
        .trim()
        .replace(
          /\s+/g,
          " "
        );

    const cleanMessage =
      message
        .trim()
        .replace(
          /\n{3,}/g,
          "\n\n"
        );

    if (!cleanName) {
      setFormError(
        "Упиши име."
      );

      return;
    }

    if (!cleanMessage) {
      setFormError(
        "Напиши утисак."
      );

      return;
    }

    if (
      cleanName.length >
      MAX_NAME_LENGTH
    ) {
      setFormError(
        `Име може имати највише ${MAX_NAME_LENGTH} знака.`
      );

      return;
    }

    if (
      cleanMessage.length >
      MAX_MESSAGE_LENGTH
    ) {
      setFormError(
        `Утисак може имати највише ${MAX_MESSAGE_LENGTH} знакова.`
      );

      return;
    }

    setSaving(true);
    setFormError("");

    const {
      data,
      error,
    } = await supabase
      .from(
        "obala_guestbook_entries"
      )
      .insert({
        name:
          cleanName,
        message:
          cleanMessage,
      })
      .select(`
        id,
        name,
        message,
        created_at
      `)
      .single();

    if (error) {
      console.error(
        "OBALA guestbook insert:",
        error
      );

      setFormError(
        "Утисак није сачуван. Покушај поново."
      );
      setSaving(false);

      return;
    }

    setEntries(
      (
        current
      ) => [
        ...current,
        data,
      ]
    );

    setName("");
    setMessage("");
    setSaving(false);
    setIsWriting(false);
    setJumpToEnd(true);
  }


  function renderPage(
    notes,
    pageIndex
  ) {
    const pageNumber =
      pageIndex + 1;

    return (
      <article className="obala-guestbook__paper">
        {notes.length ===
          0 &&
          entries.length ===
            0 &&
          pageIndex ===
            0 && (
          <div className="obala-guestbook__empty-page">
            <span>
              КЊИГА УТИСАКА
            </span>

            <small>
              Узми оловку и остави први траг.
            </small>
          </div>
        )}

        {notes.map(
          (
            note
          ) => (
            <section
              key={
                note.id
              }
              className={`obala-guestbook__note obala-guestbook__note--ink-${note.inkVariant} obala-guestbook__note--${note.sizeKey}${note.emphasis ? " is-emphasized" : ""}`}
              style={{
                left:
                  `${note.left}%`,
                top:
                  `${note.top}%`,
                width:
                  `${note.width}%`,
                height:
                  `${note.height}%`,
                transform:
                  `rotate(${note.rotation}deg)`,
                fontFamily:
                  note.fontFamily,
              }}
            >
              <p className="obala-guestbook__note-message">
                {
                  note.message
                }
              </p>

              <p className="obala-guestbook__note-signature">
                <span>—</span>

                <strong>
                  {
                    note.name
                  }
                </strong>
              </p>
            </section>
          )
        )}

        <span className="obala-guestbook__page-number">
          {pageNumber}
        </span>
      </article>
    );
  }


  const leftPage =
    displayPages[
      currentIndex
    ] ?? [];

  const rightPage =
    isSinglePage
      ? null
      : displayPages[
          currentIndex + 1
        ] ?? [];

  const canGoPrevious =
    currentIndex > 0;

  const canGoNext =
    currentIndex +
      visiblePageCount <
    displayPages.length;

  const firstVisiblePage =
    currentIndex + 1;

  const lastVisiblePage =
    Math.min(
      displayPages.length,
      currentIndex +
        visiblePageCount
    );


  return (
    <main className="obala-guestbook">
      <div className="obala-guestbook__topbar">
        <button
          type="button"
          className="obala-guestbook__back"
          onClick={
            goBack
          }
        >
          ← ОБАЛА
        </button>

        <span className="obala-guestbook__counter">
          {firstVisiblePage}
          {lastVisiblePage >
            firstVisiblePage
            ? `–${lastVisiblePage}`
            : ""}
          {" / "}
          {displayPages.length}
        </span>
      </div>


      <section
        ref={
          bookRef
        }
        className={
          isSinglePage
            ? "obala-guestbook__book obala-guestbook__book--single"
            : "obala-guestbook__book"
        }
        onPointerDown={
          handlePointerDown
        }
        onPointerUp={
          handlePointerUp
        }
        onPointerCancel={
          handlePointerCancel
        }
      >
        {loading && (
          <div className="obala-guestbook__state">
            Отварам књигу...
          </div>
        )}

        {!loading &&
          loadError && (
          <div className="obala-guestbook__state obala-guestbook__state--error">
            {
              loadError
            }
          </div>
        )}

        {!loading &&
          !loadError && (
          <>
            <div className="obala-guestbook__page-slot">
              {renderPage(
                leftPage,
                currentIndex
              )}
            </div>

            {!isSinglePage && (
              <>
                <div
                  className="obala-guestbook__spine"
                  aria-hidden="true"
                >
                  {Array.from({
                    length:
                      18,
                  }).map(
                    (
                      _,
                      index
                    ) => (
                      <i
                        key={
                          index
                        }
                      />
                    )
                  )}
                </div>

                <div className="obala-guestbook__page-slot">
                  {renderPage(
                    rightPage,
                    currentIndex + 1
                  )}
                </div>
              </>
            )}
          </>
        )}
      </section>


      <div className="obala-guestbook__controls">
        <button
          type="button"
          className="obala-guestbook__turn"
          onClick={
            goPrevious
          }
          disabled={
            !canGoPrevious
          }
          aria-label="Претходна страна"
        >
          ←
        </button>


        <button
          type="button"
          className="obala-guestbook__pencil"
          onClick={
            () => {
              setFormError("");
              setIsWriting(true);
            }
          }
          aria-label="Упиши утисак"
        >
          <span aria-hidden="true">
            ✎
          </span>

          <small>
            УПИШИ СЕ
          </small>
        </button>


        <button
          type="button"
          className="obala-guestbook__turn"
          onClick={
            goNext
          }
          disabled={
            !canGoNext
          }
          aria-label="Следећа страна"
        >
          →
        </button>
      </div>


      {isWriting && (
        <div
          className="obala-guestbook__write-overlay"
          role="presentation"
          onPointerDown={
            (
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setIsWriting(false);
                setFormError("");
              }
            }
          }
        >
          <form
            className="obala-guestbook__write-card"
            onSubmit={
              handleSubmit
            }
          >
            <button
              type="button"
              className="obala-guestbook__write-close"
              onClick={
                () => {
                  setIsWriting(false);
                  setFormError("");
                }
              }
              aria-label="Затвори"
            >
              ×
            </button>


            <label className="obala-guestbook__field">
              <span>
                УПИШИТЕ ИМЕ
              </span>

              <input
                type="text"
                value={
                  name
                }
                onChange={
                  (
                    event
                  ) =>
                    setName(
                      event.target.value
                    )
                }
                maxLength={
                  MAX_NAME_LENGTH
                }
                autoFocus
                required
              />

              <small>
                {name.length}/{MAX_NAME_LENGTH}
              </small>
            </label>


            <label className="obala-guestbook__field obala-guestbook__field--message">
              <span>
                ДОДАЈТЕ УТИСАК
              </span>

              <textarea
                value={
                  message
                }
                onChange={
                  (
                    event
                  ) =>
                    setMessage(
                      event.target.value
                    )
                }
                maxLength={
                  MAX_MESSAGE_LENGTH
                }
                required
              />

              <small>
                {message.length}/{MAX_MESSAGE_LENGTH}
              </small>
            </label>


            {formError && (
              <p className="obala-guestbook__form-error">
                {
                  formError
                }
              </p>
            )}


            <button
              type="submit"
              className="obala-guestbook__submit"
              disabled={
                saving
              }
            >
              {saving
                ? "УПИСУЈЕМ..."
                : "УПИШИ У КЊИГУ"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}


export default HumanOneObalaGuestbook;
