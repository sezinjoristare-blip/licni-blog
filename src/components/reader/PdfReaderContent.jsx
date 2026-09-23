import {
  useEffect,
  useRef,
  useState,
} from "react";

import * as pdfjsLib
  from "pdfjs-dist/legacy/build/pdf.mjs";

import pdfWorkerUrl
  from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

import ReaderPages
  from "./ReaderPages";


pdfjsLib.GlobalWorkerOptions.workerSrc =
  pdfWorkerUrl;


function PdfCanvasPage({
  pdfDocument,
  pageNumber,
}) {
  const canvasRef =
    useRef(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    viewportWidth,
    setViewportWidth,
  ] = useState(
    () =>
      typeof window !==
      "undefined"
        ? window.innerWidth
        : 900,
  );


  useEffect(() => {
    let frameId = null;


    function handleResize() {
      if (frameId !== null) {
        window.cancelAnimationFrame(
          frameId,
        );
      }


      frameId =
        window.requestAnimationFrame(
          () => {
            setViewportWidth(
              window.innerWidth,
            );

            frameId = null;
          },
        );
    }


    window.addEventListener(
      "resize",
      handleResize,
    );


    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(
          frameId,
        );
      }


      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, []);


  useEffect(() => {
    let cancelled = false;
    let renderTask = null;


    async function renderPdfPage() {
      const canvas =
        canvasRef.current;


      if (
        !pdfDocument ||
        !canvas
      ) {
        return;
      }


      setErrorMessage("");


      try {
        const page =
          await pdfDocument.getPage(
            pageNumber,
          );


        if (cancelled) {
          return;
        }


        const isMobile =
          viewportWidth <=
          700;


        const baseViewport =
          page.getViewport({
            scale: 1,
          });


        /*
          Desktop ostaje kao ranije.

          Telefon renderujemo dovoljno kvalitetno,
          ali više ne pokušavamo da celu A4 stranu
          uguramo ili ručno zumiramo u viewport.
        */
        const desiredWidth =
          isMobile
            ? 760
            : 900;


        const scale =
          desiredWidth /
          baseViewport.width;


        const viewport =
          page.getViewport({
            scale,
          });


        const deviceScale =
          window.devicePixelRatio ||
          1;


        const outputScale =
          isMobile
            ? Math.min(
                deviceScale,
                2,
              )
            : deviceScale;


        /*
          Render ide prvo na privremeni canvas.
          Posle toga na telefonu odsecamo samo
          prazne leve/desne margine.
        */
        const renderCanvas =
          document.createElement(
            "canvas",
          );


        renderCanvas.width =
          Math.floor(
            viewport.width *
              outputScale,
          );


        renderCanvas.height =
          Math.floor(
            viewport.height *
              outputScale,
          );


        const transform =
          outputScale !== 1
            ? [
                outputScale,
                0,
                0,
                outputScale,
                0,
                0,
              ]
            : undefined;


        renderTask =
          page.render({
            canvas:
              renderCanvas,

            viewport,

            transform,

            background:
              "#ffffff",

            intent:
              "display",
          });


        await renderTask.promise;


        if (cancelled) {
          return;
        }


        let cropLeft =
          0;

        let cropRight =
          viewport.width;


        /*
          Na telefonu pokušavamo da nađemo stvarnu
          širinu tekstualnog bloka pomoću PDF text layer-a.

          Rezultat:
          prikaz počinje malo pre prvog slova i završava
          malo posle poslednjeg slova — bez ogromnih A4 margina.
        */
        if (isMobile) {
          try {
            const textContent =
              await page.getTextContent();


            let minX =
              Number.POSITIVE_INFINITY;

            let maxX =
              Number.NEGATIVE_INFINITY;


            textContent.items.forEach(
              (
                item
              ) => {
                if (
                  !item?.str?.trim() ||
                  !Number.isFinite(
                    item.width,
                  )
                ) {
                  return;
                }


                const textTransform =
                  pdfjsLib.Util.transform(
                    viewport.transform,
                    item.transform,
                  );


                const x =
                  textTransform[4];


                const width =
                  Math.abs(
                    item.width *
                      viewport.scale,
                  );


                const left =
                  Math.min(
                    x,
                    x + width,
                  );


                const right =
                  Math.max(
                    x,
                    x + width,
                  );


                minX =
                  Math.min(
                    minX,
                    left,
                  );


                maxX =
                  Math.max(
                    maxX,
                    right,
                  );
              },
            );


            if (
              Number.isFinite(
                minX,
              ) &&
              Number.isFinite(
                maxX,
              ) &&
              maxX >
                minX
            ) {
              const padding =
                18;


              let detectedLeft =
                Math.max(
                  0,
                  minX -
                    padding,
                );


              let detectedRight =
                Math.min(
                  viewport.width,
                  maxX +
                    padding,
                );


              /*
                Zaštita za naslovne ili skoro prazne strane:
                nikada ne zumiramo na manje od 60% pune
                širine strane.
              */
              const minimumWidth =
                viewport.width *
                0.60;


              const detectedWidth =
                detectedRight -
                detectedLeft;


              if (
                detectedWidth <
                minimumWidth
              ) {
                const center =
                  (
                    detectedLeft +
                    detectedRight
                  ) /
                  2;


                detectedLeft =
                  Math.max(
                    0,
                    center -
                      minimumWidth /
                        2,
                  );


                detectedRight =
                  Math.min(
                    viewport.width,
                    detectedLeft +
                      minimumWidth,
                  );


                if (
                  detectedRight -
                    detectedLeft <
                  minimumWidth
                ) {
                  detectedLeft =
                    Math.max(
                      0,
                      detectedRight -
                        minimumWidth,
                    );
                }
              }


              cropLeft =
                detectedLeft;


              cropRight =
                detectedRight;
            }
          } catch (
            textError
          ) {
            /*
              Ako neki PDF nema pravi text layer
              (npr. sken), samo pokažemo celu stranu.
            */
            console.warn(
              `PDF strana ${pageNumber}: nije moguće izračunati tekstualne margine.`,
              textError,
            );
          }
        }


        const cropLeftPixels =
          Math.max(
            0,
            Math.floor(
              cropLeft *
                outputScale,
            ),
          );


        const cropRightPixels =
          Math.min(
            renderCanvas.width,
            Math.ceil(
              cropRight *
                outputScale,
            ),
          );


        const cropWidthPixels =
          Math.max(
            1,
            cropRightPixels -
              cropLeftPixels,
          );


        canvas.width =
          cropWidthPixels;


        canvas.height =
          renderCanvas.height;


        const context =
          canvas.getContext(
            "2d",
            {
              alpha: false,
            },
          );


        context.fillStyle =
          "#ffffff";


        context.fillRect(
          0,
          0,
          canvas.width,
          canvas.height,
        );


        context.drawImage(
          renderCanvas,

          cropLeftPixels,
          0,

          cropWidthPixels,
          renderCanvas.height,

          0,
          0,

          cropWidthPixels,
          renderCanvas.height,
        );


        /*
          Browser sada samo skalira već isečeni sadržaj
          na širinu readera. Nema bočnog scrolla i nema
          prikaza ogromnih praznih margina.
        */
        if (isMobile) {
          canvas.style.width =
            "100%";

          canvas.style.height =
            "auto";
        } else {
          canvas.style.width =
            `${Math.floor(
              viewport.width,
            )}px`;

          canvas.style.height =
            `${Math.floor(
              viewport.height,
            )}px`;
        }


        page.cleanup();
      } catch (error) {
        if (
          cancelled ||
          error?.name ===
            "RenderingCancelledException"
        ) {
          return;
        }


        console.error(
          `PDF strana ${pageNumber} nije renderovana:`,
          error,
        );


        setErrorMessage(
          `Greška pri prikazu PDF strane ${pageNumber}.`,
        );
      }
    }


    renderPdfPage();


    return () => {
      cancelled =
        true;


      try {
        renderTask?.cancel();
      } catch {
        /* Render je već završen. */
      }
    };
  }, [
    pageNumber,
    pdfDocument,
    viewportWidth,
  ]);


  return (
    <div className="blog-reader-pdf-canvas-wrap">
      <canvas
        ref={canvasRef}
        className="blog-reader-pdf-canvas"
        aria-label={`PDF strana ${pageNumber}`}
      />


      {errorMessage && (
        <p className="blog-reader-pdf-error">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function PdfReaderContent({
  pdfUrl,

  viewMode,
  navigationMode,

  currentPageIndex,
  onCurrentPageChange,

  bookmarkPage,
  isBookmarkMode,
  onSelectBookmarkPage,

  onPageCountChange,

  hasNextSection = false,
  onNextSection,
  scrollEndContent = null,
}) {
  const [
    pdfDocument,
    setPdfDocument,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let cancelled = false;
    let loadingTask = null;

    async function loadPdf() {
      setLoading(true);
      setErrorMessage("");
      setPdfDocument(null);

      try {
        loadingTask =
          pdfjsLib.getDocument({
            url: pdfUrl,
          });

        const document =
          await loadingTask.promise;

        if (cancelled) {
          await document.destroy();
          return;
        }

        setPdfDocument(
          document,
        );

        onPageCountChange?.(
          document.numPages,
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "PDF nije učitan:",
          error,
        );

        setErrorMessage(
          "PDF dokument nije moguće učitati.",
        );

        onPageCountChange?.(0);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (pdfUrl) {
      loadPdf();
    } else {
      setLoading(false);

      setErrorMessage(
        "PDF dokument nije pronađen.",
      );

      onPageCountChange?.(0);
    }

    return () => {
      cancelled = true;

      try {
        loadingTask?.destroy();
      } catch {
        /* PDF je već zatvoren. */
      }
    };
  }, [
    onPageCountChange,
    pdfUrl,
  ]);

  if (loading) {
    return (
      <p className="blog-reader-state">
        Učitavanje PDF dokumenta...
      </p>
    );
  }

  if (
    errorMessage ||
    !pdfDocument
  ) {
    return (
      <p className="blog-reader-state blog-reader-state--error">
        {errorMessage ||
          "PDF nije pronađen."}
      </p>
    );
  }

  function renderPage(
    pageIndex,
    pageRef,
  ) {
    const isBookmarked =
      bookmarkPage ===
      pageIndex;

    const isSelectable =
      Boolean(
        isBookmarkMode &&
        onSelectBookmarkPage,
      );

    const classNames = [
      "blog-reader-sheet",
      "blog-reader-sheet--pdf",
    ];

    if (isBookmarked) {
      classNames.push(
        "blog-reader-sheet--bookmarked",
      );
    }

    if (isSelectable) {
      classNames.push(
        "blog-reader-sheet--bookmark-selectable",
      );
    }

    return (
      <section
        key={pageIndex}
        ref={pageRef}
        data-reader-page-index={
          pageIndex
        }
        className={
          classNames.join(" ")
        }
        onClick={
          isSelectable
            ? () =>
                onSelectBookmarkPage(
                  pageIndex,
                )
            : undefined
        }
        role={
          isSelectable
            ? "button"
            : undefined
        }
        tabIndex={
          isSelectable
            ? 0
            : undefined
        }
        onKeyDown={
          isSelectable
            ? (event) => {
                if (
                  event.key ===
                    "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();

                  onSelectBookmarkPage(
                    pageIndex,
                  );
                }
              }
            : undefined
        }
        aria-label={
          isSelectable
            ? `Postavi obeleživač na stranu ${pageIndex + 1}`
            : undefined
        }
      >
        <div className="blog-reader-pdf-page">
          <PdfCanvasPage
            pdfDocument={
              pdfDocument
            }
            pageNumber={
              pageIndex + 1
            }
          />
        </div>

        <footer className="blog-reader-sheet__number">
          {pageIndex + 1}
        </footer>
      </section>
    );
  }

  return (
    <ReaderPages
      pageCount={
        pdfDocument.numPages
      }
      currentPageIndex={
        currentPageIndex
      }
      onCurrentPageChange={
        onCurrentPageChange
      }
      viewMode={
        viewMode
      }
      navigationMode={
        navigationMode
      }
      renderPage={
        renderPage
      }
      hasNextSection={
        hasNextSection
      }
      onNextSection={
        onNextSection
      }
      scrollEndContent={
        scrollEndContent
      }
    />
  );
}

export default PdfReaderContent;