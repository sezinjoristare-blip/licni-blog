import {
  useEffect,
  useRef,
  useState,
} from "react";

function BlogReaderToolbar({
  viewMode,
  navigationMode,
  isAutomaticView,

  hasBookmark,
  isBookmarkMode,

  onSetSinglePage,
  onSetTwoPages,
  onUseAutomaticView,

  onSetScrollMode,
  onSetPagedMode,

  onToggleBookmarkMode,
  onClose,
}) {
  const [
    isMenuOpen,
    setIsMenuOpen,
  ] = useState(false);

  const panelRef =
    useRef(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event,
    ) {
      if (
        event.key === "Escape"
      ) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isMenuOpen]);

  function handleOverlayPointerDown(
    event,
  ) {
    if (
      panelRef.current &&
      !panelRef.current.contains(
        event.target,
      )
    ) {
      setIsMenuOpen(false);
    }
  }

  return (
    <>
      <div className="blog-reader-toolbar">
        <button
          type="button"
          onClick={onClose}
          aria-label="Zatvori rad"
          title="Zatvori"
        >
          ×
        </button>

        <button
          type="button"
          onClick={() =>
            setIsMenuOpen(true)
          }
          aria-label="Podešavanja čitanja"
          title="Podešavanja"
        >
          ⚙
        </button>

        <button
          type="button"
          className={[
            "blog-reader-bookmark-button",
            hasBookmark
              ? "blog-reader-bookmark-button--saved"
              : "",
            isBookmarkMode
              ? "blog-reader-bookmark-button--active"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={
            onToggleBookmarkMode
          }
          aria-label="Obeleživač"
          aria-pressed={
            isBookmarkMode
          }
          title={
            isBookmarkMode
              ? "Otkaži izbor obeleživača"
              : hasBookmark
                ? "Promeni obeleživač"
                : "Postavi obeleživač"
          }
        >
          🔖
        </button>
      </div>

      {isBookmarkMode ? (
        <div
          className="blog-reader-bookmark-prompt"
          role="status"
        >
          <strong>
            🔖 Izaberi stranicu
          </strong>

          <span>
            Klikni stranicu koju želiš da obeležiš.
            Klik na već obeleženu stranicu uklanja obeleživač.
          </span>
        </div>
      ) : null}

      {isMenuOpen && (
        <div
          className="blog-reader-settings-overlay"
          onPointerDown={
            handleOverlayPointerDown
          }
        >
          <section
            ref={panelRef}
            className="blog-reader-settings"
            role="dialog"
            aria-modal="true"
          >
            <header className="blog-reader-settings__header">
              <div>
                <p>
                  ČITAČ
                </p>

                <h2>
                  Podešavanja
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsMenuOpen(false)
                }
              >
                ×
              </button>
            </header>

            <div className="blog-reader-settings__group">
              <h3>
                Prikaz stranica
              </h3>

              <div className="blog-reader-settings__choices">
                <button
                  type="button"
                  className={
                    viewMode ===
                    "single"
                      ? "active"
                      : ""
                  }
                  onClick={
                    onSetSinglePage
                  }
                >
                  <span className="blog-reader-icon-page" />

                  Jedna strana
                </button>

                <button
                  type="button"
                  className={
                    viewMode ===
                    "spread"
                      ? "active"
                      : ""
                  }
                  onClick={
                    onSetTwoPages
                  }
                >
                  <span className="blog-reader-icon-spread">
                    <i />
                    <i />
                  </span>

                  Dve strane
                </button>
              </div>

              <button
                type="button"
                className={
                  isAutomaticView
                    ? "blog-reader-auto blog-reader-auto--active"
                    : "blog-reader-auto"
                }
                onClick={
                  onUseAutomaticView
                }
              >
                {isAutomaticView
                  ? "✓ Automatsko prilagođavanje uključeno"
                  : "Vrati automatsko prilagođavanje"}
              </button>
            </div>

            <div className="blog-reader-settings__group">
              <h3>
                Kretanje
              </h3>

              <div className="blog-reader-settings__choices">
                <button
                  type="button"
                  className={
                    navigationMode ===
                    "scroll"
                      ? "active"
                      : ""
                  }
                  onClick={
                    onSetScrollMode
                  }
                >
                  <strong>↕</strong>
                  Skrolovanje
                </button>

                <button
                  type="button"
                  className={
                    navigationMode ===
                    "paged"
                      ? "active"
                      : ""
                  }
                  onClick={
                    onSetPagedMode
                  }
                >
                  <strong>⇆</strong>
                  Listanje
                </button>
              </div>
            </div>

            <button
              type="button"
              className="blog-reader-settings__done"
              onClick={() =>
                setIsMenuOpen(false)
              }
            >
              Gotovo
            </button>
          </section>
        </div>
      )}
    </>
  );
}

export default BlogReaderToolbar;
