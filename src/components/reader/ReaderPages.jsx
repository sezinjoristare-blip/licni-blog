import {
  useEffect,
  useRef,
} from "react";

const INTERACTIVE_TAGS =
  new Set([
    "A",
    "BUTTON",
    "INPUT",
    "TEXTAREA",
    "SELECT",
  ]);

function normalizePageIndex(
  index,
  pageCount,
  viewMode,
) {
  if (pageCount <= 0) {
    return 0;
  }

  const clamped =
    Math.min(
      Math.max(index, 0),
      pageCount - 1,
    );

  if (viewMode === "spread") {
    return clamped % 2 === 0
      ? clamped
      : clamped - 1;
  }

  return clamped;
}

function ReaderPages({
  pageCount,

  currentPageIndex,
  onCurrentPageChange,

  viewMode,
  navigationMode,

  renderPage,

  hasNextSection = false,
  onNextSection,
  scrollEndContent = null,
}) {
  const touchStartRef =
    useRef(null);

  const pageElementsRef =
    useRef({});

  const initialScrollDoneRef =
    useRef(false);

  const pageStep =
    viewMode === "spread"
      ? 2
      : 1;

  const effectivePageIndex =
    normalizePageIndex(
      currentPageIndex,
      pageCount,
      viewMode,
    );

  const lastSpreadStart =
    normalizePageIndex(
      pageCount - 1,
      pageCount,
      viewMode,
    );

  const canGoBackward =
    effectivePageIndex > 0;

  const canGoForward =
    effectivePageIndex <
    lastSpreadStart;

  const canAdvance =
    canGoForward ||
    hasNextSection;

  useEffect(() => {
    if (
      effectivePageIndex !==
      currentPageIndex
    ) {
      onCurrentPageChange(
        effectivePageIndex,
      );
    }
  }, [
    currentPageIndex,
    effectivePageIndex,
    onCurrentPageChange,
  ]);

  function goBackward() {
    if (!canGoBackward) {
      return;
    }

    onCurrentPageChange(
      normalizePageIndex(
        effectivePageIndex -
          pageStep,
        pageCount,
        viewMode,
      ),
    );
  }

  function goForward() {
    if (canGoForward) {
      onCurrentPageChange(
        normalizePageIndex(
          effectivePageIndex +
            pageStep,
          pageCount,
          viewMode,
        ),
      );

      return;
    }

    if (
      hasNextSection &&
      onNextSection
    ) {
      onNextSection();
    }
  }

  useEffect(() => {
    if (
      navigationMode !== "paged"
    ) {
      return undefined;
    }

    function handleKeyDown(event) {
      const target =
        event.target;

      if (
        target &&
        (
          INTERACTIVE_TAGS.has(
            target.tagName,
          ) ||
          target.isContentEditable
        )
      ) {
        return;
      }

      if (
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();
        goBackward();
      }

      if (
        event.key === "ArrowRight"
      ) {
        event.preventDefault();
        goForward();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  });

  function handleTouchStart(
    event,
  ) {
    if (
      navigationMode !== "paged" ||
      event.touches.length !== 1
    ) {
      touchStartRef.current =
        null;

      return;
    }

    const target =
      event.target;

    if (
      target &&
      INTERACTIVE_TAGS.has(
        target.tagName,
      )
    ) {
      return;
    }

    const touch =
      event.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function handleTouchEnd(
    event,
  ) {
    if (
      navigationMode !== "paged" ||
      !touchStartRef.current ||
      event.changedTouches.length !==
        1
    ) {
      touchStartRef.current =
        null;

      return;
    }

    const touch =
      event.changedTouches[0];

    const deltaX =
      touch.clientX -
      touchStartRef.current.x;

    const deltaY =
      touch.clientY -
      touchStartRef.current.y;

    touchStartRef.current =
      null;

    if (
      Math.abs(deltaX) < 52 ||
      Math.abs(deltaX) <=
        Math.abs(deltaY)
    ) {
      return;
    }

    if (deltaX < 0) {
      goForward();
    } else {
      goBackward();
    }
  }

  function registerPageElement(
    pageIndex,
    element,
  ) {
    if (element) {
      pageElementsRef.current[
        pageIndex
      ] = element;

      return;
    }

    delete pageElementsRef.current[
      pageIndex
    ];
  }

  useEffect(() => {
    if (
      navigationMode !== "scroll"
    ) {
      return undefined;
    }

    const elements =
      Object.values(
        pageElementsRef.current,
      );

    if (!elements.length) {
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const visibleEntries =
            entries
              .filter(
                (entry) =>
                  entry.isIntersecting,
              )
              .sort(
                (a, b) =>
                  b.intersectionRatio -
                  a.intersectionRatio,
              );

          if (!visibleEntries.length) {
            return;
          }

          const pageIndex =
            Number(
              visibleEntries[0]
                .target
                .dataset
                .readerPageIndex,
            );

          if (
            Number.isNaN(
              pageIndex,
            )
          ) {
            return;
          }

          onCurrentPageChange(
            normalizePageIndex(
              pageIndex,
              pageCount,
              viewMode,
            ),
          );
        },
        {
          threshold: [
            0.25,
            0.5,
            0.75,
          ],
        },
      );

    elements.forEach(
      (element) => {
        observer.observe(element);
      },
    );

    return () => {
      observer.disconnect();
    };
  }, [
    navigationMode,
    onCurrentPageChange,
    pageCount,
    viewMode,
  ]);

  useEffect(() => {
    if (
      navigationMode !== "scroll" ||
      initialScrollDoneRef.current ||
      effectivePageIndex <= 0
    ) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        const element =
          pageElementsRef.current[
            effectivePageIndex
          ];

        if (!element) {
          return;
        }

        element.scrollIntoView({
          block: "start",
          behavior: "auto",
        });

        initialScrollDoneRef.current =
          true;
      }, 150);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    effectivePageIndex,
    navigationMode,
  ]);

  function pageRenderer(
    pageIndex,
  ) {
    return renderPage(
      pageIndex,
      (element) =>
        registerPageElement(
          pageIndex,
          element,
        ),
    );
  }

  if (pageCount <= 0) {
    return null;
  }

  if (
    navigationMode === "scroll"
  ) {
    if (viewMode === "spread") {
      const spreads = [];

      for (
        let index = 0;
        index < pageCount;
        index += 2
      ) {
        spreads.push(index);
      }

      return (
        <>
          <article className="blog-reader-content blog-reader-content--scroll blog-reader-content--spread">
            {spreads.map(
              (pageIndex) => (
                <div
                  key={pageIndex}
                  className="blog-reader-spread"
                >
                  {pageRenderer(
                    pageIndex,
                  )}

                  {pageIndex + 1 <
                  pageCount ? (
                    pageRenderer(
                      pageIndex + 1,
                    )
                  ) : (
                    <div
                      className="blog-reader-sheet blog-reader-sheet--empty"
                      aria-hidden="true"
                    />
                  )}
                </div>
              ),
            )}
          </article>

          {scrollEndContent}
        </>
      );
    }

    return (
      <>
        <article className="blog-reader-content blog-reader-content--scroll blog-reader-content--single">
          {Array.from(
            {
              length:
                pageCount,
            },
            (_, index) =>
              pageRenderer(index),
          )}
        </article>

        {scrollEndContent}
      </>
    );
  }

  const visiblePageIndexes =
    viewMode === "spread"
      ? [
          effectivePageIndex,
          effectivePageIndex + 1,
        ].filter(
          (pageIndex) =>
            pageIndex <
            pageCount,
        )
      : [
          effectivePageIndex,
        ];

  const displayedEndPage =
    Math.min(
      effectivePageIndex +
        pageStep,
      pageCount,
    );

  return (
    <article
      className={`blog-reader-content blog-reader-content--paged blog-reader-content--${viewMode}`}
      onTouchStart={
        handleTouchStart
      }
      onTouchEnd={
        handleTouchEnd
      }
    >
      <div
        className={
          viewMode === "spread"
            ? "blog-reader-spread blog-reader-spread--paged"
            : "blog-reader-paged-single"
        }
      >
        {visiblePageIndexes.map(
          (pageIndex) =>
            pageRenderer(
              pageIndex,
            ),
        )}

        {viewMode === "spread" &&
        visiblePageIndexes.length ===
          1 ? (
          <div
            className="blog-reader-sheet blog-reader-sheet--empty"
            aria-hidden="true"
          />
        ) : null}
      </div>

      <nav
        className="blog-reader-navigation"
        aria-label="Listanje rada"
      >
        <button
          type="button"
          onClick={goBackward}
          disabled={
            !canGoBackward
          }
          aria-label="Prethodna strana"
        >
          ←
        </button>

        <span>
          {viewMode === "spread" &&
          displayedEndPage >
            effectivePageIndex + 1
            ? `${effectivePageIndex + 1}–${displayedEndPage}`
            : `${effectivePageIndex + 1}`}

          {" / "}

          {pageCount}
        </span>

        <button
          type="button"
          onClick={goForward}
          disabled={
            !canAdvance
          }
          aria-label={
            canGoForward
              ? "Sledeća strana"
              : hasNextSection
                ? "Otvori sledeći deo"
                : "Kraj rada"
          }
          title={
            !canGoForward &&
            hasNextSection
              ? "Sledeći deo"
              : undefined
          }
        >
          →
        </button>
      </nav>
    </article>
  );
}

export default ReaderPages;
