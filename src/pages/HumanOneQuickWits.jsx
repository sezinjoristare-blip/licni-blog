import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import "../styles/pages/HumanOneQuickWits.css";


const VALID_TONES = new Set([
  "yellow",
  "pink",
  "blue",
  "green",
  "orange",
  "violet",
]);


function normalizeTone(
  tone
) {
  return VALID_TONES.has(
    tone
  )
    ? tone
    : "yellow";
}


function normalizeRotation(
  value
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed)
  ) {
    return 0;
  }

  return Math.max(
    -8,
    Math.min(
      8,
      parsed
    )
  );
}


function formatBelgradeStamp(
  value
) {
  if (!value) {
    return {
      date: "",
      time: "",
    };
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return {
      date: "",
      time: "",
    };
  }

  const dateText =
    new Intl.DateTimeFormat(
      "sr-RS",
      {
        timeZone:
          "Europe/Belgrade",

        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric",
      }
    )
      .format(date)
      .replaceAll(
        " ",
        ""
      );

  const timeText =
    new Intl.DateTimeFormat(
      "sr-RS",
      {
        timeZone:
          "Europe/Belgrade",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hourCycle:
          "h23",
      }
    )
      .format(date);

  return {
    date: dateText,
    time: timeText,
  };
}


function HumanOneQuickWits() {
  const navigate =
    useNavigate();

  const [
    notes,
    setNotes,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    selectedNote,
    setSelectedNote,
  ] = useState(null);

  const [
    sourceRect,
    setSourceRect,
  ] = useState(null);

  const [
    readerOpen,
    setReaderOpen,
  ] = useState(false);


  useEffect(() => {
    let alive = true;


    async function loadNotes() {
      setLoading(true);
      setErrorMessage("");

      const {
        data,
        error,
      } = await supabase
        .from(
          "quick_wits"
        )
        .select(`
          id,
          text,
          tone,
          rotation,
          sort_order,
          created_at
        `)
        .eq(
          "status",
          "published"
        )
        .order(
          "sort_order",
          {
            ascending: true,
          }
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (!alive) {
        return;
      }

      if (error) {
        console.error(
          error
        );

        setNotes([]);
        setErrorMessage(
          "Доскочице тренутно није могуће учитати."
        );
        setLoading(false);

        return;
      }

      setNotes(
        (data ?? []).map(
          (note) => {
            const stamp =
              formatBelgradeStamp(
                note.created_at
              );

            return {
              ...note,

              tone:
                normalizeTone(
                  note.tone
                ),

              rotation:
                normalizeRotation(
                  note.rotation
                ),

              date:
                stamp.date,

              time:
                stamp.time,
            };
          }
        )
      );

      setLoading(false);
    }


    loadNotes();


    return () => {
      alive = false;
    };
  }, []);


  function handleBack() {
    navigate(
      "/autor/covek"
    );
  }


  function openNote(
    note,
    event
  ) {
    const rect =
      event.currentTarget
        .getBoundingClientRect();

    setSourceRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });

    setSelectedNote(
      note
    );

    setReaderOpen(
      false
    );

    window.requestAnimationFrame(
      () => {
        window.requestAnimationFrame(
          () => {
            setReaderOpen(
              true
            );
          }
        );
      }
    );
  }


  function closeNote() {
    setReaderOpen(
      false
    );

    window.setTimeout(
      () => {
        setSelectedNote(
          null
        );

        setSourceRect(
          null
        );
      },
      430
    );
  }


  useEffect(() => {
    if (!selectedNote) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";


    function handleKeyDown(
      event
    ) {
      if (
        event.key === "Escape"
      ) {
        closeNote();
      }
    }


    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [selectedNote]);


  return (
    <main className="quick-wits">
      <div
        className="quick-wits__wall"
        aria-hidden="true"
      />


      <button
        type="button"
        className="quick-wits__back"
        onClick={handleBack}
      >
        ← СОБА
      </button>


      <header className="quick-wits__header">
        <h1>
          БРЗЕ ДОСКОЧИЦЕ
        </h1>
      </header>


      {loading && (
        <p className="quick-wits__state">
          УЧИТАВАМ...
        </p>
      )}


      {!loading &&
        errorMessage && (
          <p className="quick-wits__state quick-wits__state--error">
            {errorMessage}
          </p>
        )}


      {!loading &&
        !errorMessage &&
        notes.length === 0 && (
          <p className="quick-wits__state">
            Још нема доскочица.
          </p>
        )}


      {!loading &&
        !errorMessage &&
        notes.length > 0 && (
          <section
            className="quick-wits__board"
            aria-label="Брзе доскочице"
          >
            {notes.map(
              (note) => (
                <button
                  key={note.id}
                  type="button"
                  className={
                    selectedNote?.id ===
                      note.id
                      ? `
                        quick-wits__note
                        quick-wits__note--${note.tone}
                        quick-wits__note--source-hidden
                      `
                      : `
                        quick-wits__note
                        quick-wits__note--${note.tone}
                      `
                  }
                  style={{
                    "--note-rotation":
                      `${note.rotation}deg`,
                  }}
                  onClick={
                    (event) =>
                      openNote(
                        note,
                        event
                      )
                  }
                  aria-label="Отвори доскочицу"
                >
                  <span className="quick-wits__note-tape" />

                  <span className="quick-wits__note-copy">
                    {note.text}
                  </span>

                  <span className="quick-wits__note-stamp">
                    {note.date}

                    <small>
                      {note.time}
                    </small>
                  </span>
                </button>
              )
            )}
          </section>
        )}


      {selectedNote &&
        sourceRect && (
          <div
            className={
              readerOpen
                ? `
                  quick-wits__reader-layer
                  quick-wits__reader-layer--open
                `
                : "quick-wits__reader-layer"
            }
            role="presentation"
            onPointerDown={
              (event) => {
                if (
                  event.target ===
                    event.currentTarget
                ) {
                  closeNote();
                }
              }
            }
          >
            <article
              className={
                readerOpen
                  ? `
                    quick-wits__reader-note
                    quick-wits__reader-note--${selectedNote.tone}
                    quick-wits__reader-note--open
                  `
                  : `
                    quick-wits__reader-note
                    quick-wits__reader-note--${selectedNote.tone}
                  `
              }
              style={{
                "--source-top":
                  `${sourceRect.top}px`,

                "--source-left":
                  `${sourceRect.left}px`,

                "--source-width":
                  `${sourceRect.width}px`,

                "--source-height":
                  `${sourceRect.height}px`,

                "--source-rotation":
                  `${selectedNote.rotation}deg`,
              }}
              aria-label="Доскочица"
            >
              <span
                className="quick-wits__reader-tape"
                aria-hidden="true"
              />

              <button
                type="button"
                className="quick-wits__reader-close"
                onClick={closeNote}
                aria-label="Затвори доскочицу"
              >
                ×
              </button>

              <div className="quick-wits__reader-meta">
                <span>
                  {selectedNote.date}
                </span>

                <span>
                  {selectedNote.time}
                </span>
              </div>

              <p className="quick-wits__reader-copy">
                {selectedNote.text}
              </p>

              <span
                className="quick-wits__reader-scribble"
                aria-hidden="true"
              >
                ~
              </span>
            </article>
          </div>
        )}
    </main>
  );
}


export default HumanOneQuickWits;