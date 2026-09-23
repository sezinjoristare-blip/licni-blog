import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ReaderPages
  from "./ReaderPages";

import {
  buildManualBlocks,
  buildManualPages,
} from "../../utils/blogReaderPagination";


function getYoutubeEmbedUrl(
  rawUrl
) {
  try {
    const url =
      new URL(
        rawUrl
      );

    const host =
      url.hostname
        .replace(
          /^www\./,
          ""
        )
        .toLowerCase();


    if (
      host ===
      "youtu.be"
    ) {
      const id =
        url.pathname
          .replace(
            "/",
            ""
          )
          .trim();

      return id
        ? `https://www.youtube.com/embed/${id}`
        : "";
    }


    if (
      host ===
        "youtube.com" ||
      host.endsWith(
        ".youtube.com"
      )
    ) {
      const id =
        url.searchParams
          .get("v");


      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }


      const match =
        url.pathname.match(
          /\/(?:embed|shorts)\/([^/?#]+)/
        );


      return match
        ? `https://www.youtube.com/embed/${match[1]}`
        : "";
    }
  } catch {
    return "";
  }


  return "";
}


function normalizeRichItems(
  blocks
) {
  const ordered =
    blocks
      .slice()
      .sort(
        (
          first,
          second
        ) =>
          (
            first.sort_order ??
            0
          ) -
          (
            second.sort_order ??
            0
          )
      );


  const items =
    [];


  ordered.forEach(
    (
      block,
      blockIndex
    ) => {
      if (
        block.block_type ===
        "text"
      ) {
        const textBlocks =
          buildManualBlocks(
            block.text_content ||
            ""
          );


        textBlocks.forEach(
          (
            textBlock,
            textIndex
          ) => {
            items.push({
              ...textBlock,

              richItemId:
                `text-${blockIndex}-${textIndex}-${textBlock.id}`,

              sourceBlockIndex:
                blockIndex,
            });
          }
        );


        return;
      }


      if (
        !block.media_url
      ) {
        return;
      }


      items.push({
        kind:
          "media",

        richItemId:
          `media-${blockIndex}`,

        sourceBlockIndex:
          blockIndex,

        previousBlockType:
          ordered[
            blockIndex - 1
          ]?.block_type ||
          null,

        mediaType:
          block.block_type,

        position:
          block.position ||
          "right",

        mediaUrl:
          block.media_url,

        caption:
          block.caption ||
          "",
      });
    }
  );


  return items;
}


function createMeasurementNode(
  item
) {
  if (
    item.kind ===
    "media"
  ) {
    const figure =
      document.createElement(
        "figure"
      );


    figure.className =
      `blog-reader-rich-media blog-reader-rich-media--${item.position || "right"}`;


    const frame =
      document.createElement(
        "div"
      );


    if (
      item.mediaType ===
        "video" ||
      item.mediaType ===
        "youtube"
    ) {
      frame.className =
        "blog-reader-rich-video-frame";
    } else {
      frame.className =
        "blog-reader-rich-image-mask";
    }


    const placeholder =
      document.createElement(
        "div"
      );


    placeholder.className =
      item.mediaType ===
      "youtube"
        ? "blog-reader-rich-measure-media blog-reader-rich-measure-media--youtube"
        : "blog-reader-rich-measure-media";


    frame.appendChild(
      placeholder
    );

    figure.appendChild(
      frame
    );


    if (item.caption) {
      const caption =
        document.createElement(
          "figcaption"
        );

      caption.textContent =
        item.caption;

      figure.appendChild(
        caption
      );
    }


    return figure;
  }


  if (
    item.type ===
    "heading"
  ) {
    const heading =
      document.createElement(
        "h2"
      );

    heading.className =
      "blog-reader-manual-heading";

    heading.textContent =
      item.text || "";

    return heading;
  }


  if (
    item.type ===
    "divider"
  ) {
    const divider =
      document.createElement(
        "div"
      );

    divider.className =
      "blog-reader-manual-divider";

    divider.textContent =
      "✦";

    return divider;
  }


  const paragraph =
    document.createElement(
      "p"
    );

  paragraph.className =
    "blog-reader-manual-paragraph";

  paragraph.textContent =
    item.text || "";

  return paragraph;
}


function pageFits(
  body,
  items
) {
  if (!body) {
    return false;
  }


  body.replaceChildren();


  items.forEach(
    (item) => {
      body.appendChild(
        createMeasurementNode(
          item
        )
      );
    }
  );


  /*
    Float elementi se inače
    ne računaju u normalnu
    visinu roditelja.

    Ovaj clearfix tera browser
    da u merenje uključi i dno
    fotografije / videa.
  */

  const clear =
    document.createElement(
      "div"
    );

  clear.className =
    "blog-reader-rich-clear";

  body.appendChild(
    clear
  );


  const availableHeight =
    body.clientHeight;

  const usedHeight =
    body.scrollHeight;


  return (
    availableHeight > 0 &&
    usedHeight <=
      availableHeight + 2
  );
}


function findMaximumWordsThatFit({
  body,
  pageItems,
  paragraph,
  words,
  pieceIndex,
}) {
  let low =
    1;

  let high =
    words.length;

  let best =
    0;


  while (
    low <= high
  ) {
    const middle =
      Math.floor(
        (
          low +
          high
        ) /
        2
      );


    const candidate = {
      ...paragraph,

      richItemId:
        `${paragraph.richItemId}-piece-${pieceIndex}`,

      text:
        words
          .slice(
            0,
            middle
          )
          .join(" "),
    };


    if (
      pageFits(
        body,
        [
          ...pageItems,
          candidate,
        ]
      )
    ) {
      best =
        middle;

      low =
        middle + 1;
    } else {
      high =
        middle - 1;
    }
  }


  return best;
}


function buildMeasuredPages(
  items,
  body
) {
  if (
    !items.length
  ) {
    return [[]];
  }


  const pages =
    [];

  let currentPage =
    [];


  function finishPage() {
    if (
      !currentPage.length
    ) {
      return;
    }


    pages.push(
      currentPage
    );

    currentPage =
      [];
  }


  /*
    Bočni medij sme da ode ispred
    teksta na istoj strani.

    Ne menjamo redosled samog teksta,
    samo fotografiju/video stavljamo
    na slobodnu levu/desnu površinu
    kako bi tekst mogao da teče oko
    njega.
  */

  function createSideMediaCandidate(
    pageItems,
    mediaItem
  ) {
    /*
      Ako je u adminu neposredno
      iznad medija TEKST, onda
      fotografija/video pripada
      baš TOM tekstualnom bloku.
    */

    if (
      mediaItem
        .previousBlockType ===
      "text"
    ) {
      const targetBlockIndex =
        mediaItem
          .sourceBlockIndex -
        1;


      const targetTextIndex =
        pageItems.findIndex(
          (pageItem) =>
            pageItem
              .sourceBlockIndex ===
            targetBlockIndex
        );


      if (
        targetTextIndex !==
        -1
      ) {
        return [
          ...pageItems.slice(
            0,
            targetTextIndex
          ),

          mediaItem,

          ...pageItems.slice(
            targetTextIndex
          ),
        ];
      }
    }


    /*
      Ako iznad medija nije tekst
      nego npr. druga fotografija
      ili video, ne vraćamo ga
      ispred drugih elemenata.

      Samo nastavlja redom.
    */

    return [
      ...pageItems,
      mediaItem,
    ];
  }


  /*
    Ovo je deo koji nam je falio.

    Kada naiđe slika/video, prvo
    proveravamo POSLEDNJU već
    završenu stranu.

    Ako tamo postoji slobodan prostor,
    medij se vraća na nju umesto da
    bez potrebe otvara/puni sledeću.
  */

  function tryBackfillPreviousPage(
    mediaItem
  ) {
    if (
      pages.length ===
      0
    ) {
      return false;
    }


    const previousIndex =
      pages.length - 1;

    const previousPage =
      pages[
        previousIndex
      ];


    let candidate;


    if (
      mediaItem.position ===
      "full"
    ) {
      /*
        Full element ne sme da ode
        ispred prethodnog teksta.

        Samo proverava da li može
        normalno da stane ISPOD njega.
      */

      candidate = [
        ...previousPage,
        mediaItem,
      ];
    } else {
      /*
        Levo/desno može da zauzme
        slobodan bok stranice, pa
        ga stavljamo pre teksta kako
        bi browser mogao stvarno da
        obavije tekst oko njega.
      */

      candidate =
        createSideMediaCandidate(
          previousPage,
          mediaItem
        );
    }


    if (
      !pageFits(
        body,
        candidate
      )
    ) {
      return false;
    }


    pages[
      previousIndex
    ] =
      candidate;


    return true;
  }


  /*
    Isto pravilo važi i za stranu
    koju trenutno gradimo.
  */

  function tryPlaceMediaOnCurrentPage(
    mediaItem
  ) {
    let candidate;


    if (
      mediaItem.position ===
      "full"
    ) {
      candidate = [
        ...currentPage,
        mediaItem,
      ];
    } else {
      candidate =
        createSideMediaCandidate(
          currentPage,
          mediaItem
        );
    }


    if (
      !pageFits(
        body,
        candidate
      )
    ) {
      return false;
    }


    currentPage =
      candidate;


    return true;
  }


  for (
    let itemIndex = 0;
    itemIndex <
    items.length;
    itemIndex += 1
  ) {
    const item =
      items[
        itemIndex
      ];


    /*
      ===============================================
      MEDIJ
      ===============================================
    */

    if (
      item.kind ===
      "media"
    ) {
      /*
        PRIORITET 1:
        rupa na prethodnoj strani.
      */

      if (
        tryBackfillPreviousPage(
          item
        )
      ) {
        continue;
      }


      /*
        PRIORITET 2:
        trenutna strana.
      */

      if (
        tryPlaceMediaOnCurrentPage(
          item
        )
      ) {
        continue;
      }


      /*
        Ako nema mesta ni tamo,
        završavamo trenutnu stranu.
      */

      if (
        currentPage.length
      ) {
        finishPage();
      }


      /*
        Medij sada dobija novu stranu.
      */

      currentPage = [
        item,
      ];


      /*
        Ekstremna zaštita:
        ako je element fizički veći
        od reader strane, ipak ga
        završavamo kao zasebnu stranu
        da ostatak sadržaja ne nestane.
      */

      if (
        !pageFits(
          body,
          currentPage
        )
      ) {
        finishPage();
      }


      continue;
    }


    /*
      ===============================================
      NASLOV / RAZDELNIK
      ===============================================
    */

    if (
      item.type ===
        "heading" ||
      item.type ===
        "divider"
    ) {
      if (
        pageFits(
          body,
          [
            ...currentPage,
            item,
          ]
        )
      ) {
        currentPage.push(
          item
        );

        continue;
      }


      if (
        currentPage.length
      ) {
        finishPage();
      }


      currentPage.push(
        item
      );


      continue;
    }


    /*
      ===============================================
      PARAGRAF
      ===============================================
    */

    const fullParagraph = {
      ...item,

      richItemId:
        `${item.richItemId}-full`,
    };


    /*
      Prvo pokušavamo CEO paragraf.

      Ako postoji slika/video levo
      ili desno, browser ovde stvarno
      računa tok teksta oko njega.
    */

    if (
      pageFits(
        body,
        [
          ...currentPage,
          fullParagraph,
        ]
      )
    ) {
      currentPage.push(
        fullParagraph
      );

      continue;
    }


    const words =
      String(
        item.text ||
        ""
      )
        .trim()
        .split(/\s+/)
        .filter(Boolean);


    if (
      !words.length
    ) {
      continue;
    }


    let remainingWords =
      [
        ...words,
      ];

    let pieceIndex =
      0;


    while (
      remainingWords.length
    ) {
      const fittingWords =
        findMaximumWordsThatFit({
          body,

          pageItems:
            currentPage,

          paragraph:
            item,

          words:
            remainingWords,

          pieceIndex,
        });


      if (
        fittingWords > 0
      ) {
        currentPage.push({
          ...item,

          richItemId:
            `${item.richItemId}-piece-${pieceIndex}`,

          text:
            remainingWords
              .slice(
                0,
                fittingWords
              )
              .join(" "),
        });


        remainingWords =
          remainingWords.slice(
            fittingWords
          );


        pieceIndex +=
          1;


        /*
          Ako paragraf još nije
          završen, ova strana je
          stvarno puna.
        */

        if (
          remainingWords.length
        ) {
          finishPage();
        }


        continue;
      }


      /*
        Ni jedna reč više ne staje
        na trenutnu stranu.
      */

      if (
        currentPage.length
      ) {
        finishPage();

        continue;
      }


      /*
        Zaštita za jednu nenormalno
        dugu reč koja sama ne može
        da stane.
      */

      currentPage.push({
        ...item,

        richItemId:
          `${item.richItemId}-piece-${pieceIndex}`,

        text:
          remainingWords[0],
      });


      remainingWords =
        remainingWords.slice(
          1
        );

      pieceIndex +=
        1;


      finishPage();
    }
  }


  finishPage();


  return pages.length
    ? pages
    : [[]];
}


function ManualReaderContent({
  content,
  blocks = null,

  viewMode,
  navigationMode,

  currentPageIndex,
  onCurrentPageChange,

  bookmarkPage,
  isBookmarkMode,
  onSelectBookmarkPage,

  onPageCountChange,
}) {
  const measureRootRef =
    useRef(null);

  const measureBodyRef =
    useRef(null);


  const [
    measuredPages,
    setMeasuredPages,
  ] = useState([
    [],
  ]);


  const hasRichBlocks =
    Array.isArray(
      blocks
    ) &&
    blocks.length > 0;


  const legacyBlocks =
    useMemo(
      () =>
        buildManualBlocks(
          content
        ),
      [
        content,
      ]
    );


  const legacyPages =
    useMemo(
      () =>
        buildManualPages(
          legacyBlocks
        ),
      [
        legacyBlocks,
      ]
    );


  const richItems =
    useMemo(
      () =>
        hasRichBlocks
          ? normalizeRichItems(
              blocks
            )
          : [],
      [
        blocks,
        hasRichBlocks,
      ]
    );


  /*
    Browser ovde stvarno meri
    stranicu.

    ResizeObserver znači da se
    raspored ponovo izračuna i kada
    promenimo širinu prozora,
    orijentaciju ili 1/2 strane.
  */

  useLayoutEffect(() => {
    if (
      !hasRichBlocks
    ) {
      return undefined;
    }


    const measureRoot =
      measureRootRef.current;

    const measureBody =
      measureBodyRef.current;


    if (
      !measureRoot ||
      !measureBody
    ) {
      return undefined;
    }


    let frameId =
      null;


    function calculatePages() {
      const reader =
        measureRoot.closest(
          ".blog-reader"
        );


      if (!reader) {
        return;
      }


      const readerStyles =
        window.getComputedStyle(
          reader
        );


      const paddingLeft =
        Number.parseFloat(
          readerStyles
            .paddingLeft
        ) || 0;

      const paddingRight =
        Number.parseFloat(
          readerStyles
            .paddingRight
        ) || 0;


      const availableWidth =
        Math.max(
          280,

          reader.clientWidth -
            paddingLeft -
            paddingRight
        );


      measureRoot.style.width =
        `${availableWidth}px`;


      /*
        Čekamo sledeći frame da
        browser primeni novu širinu,
        pa tek onda merimo visinu.
      */

      cancelAnimationFrame(
        frameId
      );


      frameId =
        requestAnimationFrame(
          () => {
            const nextPages =
              buildMeasuredPages(
                richItems,
                measureBody
              );


            setMeasuredPages(
              nextPages
            );
          }
        );
    }


    calculatePages();


    const observer =
      new ResizeObserver(
        calculatePages
      );


    const reader =
      measureRoot.closest(
        ".blog-reader"
      );


    if (reader) {
      observer.observe(
        reader
      );
    }


    window.addEventListener(
      "orientationchange",
      calculatePages
    );


    return () => {
      observer.disconnect();

      window.removeEventListener(
        "orientationchange",
        calculatePages
      );

      if (frameId) {
        cancelAnimationFrame(
          frameId
        );
      }
    };
  }, [
    hasRichBlocks,
    richItems,
    viewMode,
    navigationMode,
  ]);


  const pages =
    hasRichBlocks
      ? measuredPages
      : legacyPages;


  useEffect(() => {
    onPageCountChange?.(
      pages.length
    );
  }, [
    onPageCountChange,
    pages.length,
  ]);


  function renderMediaBlock(
    block
  ) {
    const position =
      block.position ||
      "right";


    const className =
      `blog-reader-rich-media blog-reader-rich-media--${position} blog-reader-rich-reveal`;


    if (
      block.mediaType ===
      "youtube"
    ) {
      const embedUrl =
        getYoutubeEmbedUrl(
          block.mediaUrl
        );


      if (!embedUrl) {
        return null;
      }


      return (
        <figure
          key={
            block.richItemId
          }
          className={
            className
          }
        >
          <div className="blog-reader-rich-video-frame">
            <iframe
              src={
                embedUrl
              }
              title={
                block.caption ||
                "YouTube video"
              }
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>


          {block.caption ? (
            <figcaption>
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }


    if (
      block.mediaType ===
      "video"
    ) {
      return (
        <figure
          key={
            block.richItemId
          }
          className={
            className
          }
        >
          <div className="blog-reader-rich-video-frame">
            <video
              controls
              playsInline
              preload="metadata"
              src={
                block.mediaUrl
              }
            >
              Tvoj pregledač ne može
              da prikaže ovaj video.
            </video>
          </div>


          {block.caption ? (
            <figcaption>
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }


    if (
      block.mediaType ===
        "image" ||
      block.mediaType ===
        "gif"
    ) {
      return (
        <figure
          key={
            block.richItemId
          }
          className={
            className
          }
        >
          <div className="blog-reader-rich-image-mask">
            <img
              src={
                block.mediaUrl
              }
              alt={
                block.caption ||
                ""
              }
              loading="lazy"
            />
          </div>


          {block.caption ? (
            <figcaption>
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }


    return null;
  }


  function renderBlock(
    block
  ) {
    if (
      block.kind ===
      "media"
    ) {
      return renderMediaBlock(
        block
      );
    }


    if (
      block.type ===
      "heading"
    ) {
      return (
        <h2
          key={
            block.richItemId ||
            block.id
          }
          className={
            hasRichBlocks
              ? "blog-reader-manual-heading blog-reader-rich-reveal"
              : "blog-reader-manual-heading"
          }
        >
          {block.text}
        </h2>
      );
    }


    if (
      block.type ===
      "divider"
    ) {
      return (
        <div
          key={
            block.richItemId ||
            block.id
          }
          className={
            hasRichBlocks
              ? "blog-reader-manual-divider blog-reader-rich-reveal"
              : "blog-reader-manual-divider"
          }
        >
          ✦
        </div>
      );
    }


    return (
      <p
        key={
          block.richItemId ||
          block.id
        }
        className={
          hasRichBlocks
            ? "blog-reader-manual-paragraph blog-reader-rich-reveal"
            : "blog-reader-manual-paragraph"
        }
      >
        {block.text}
      </p>
    );
  }


  function renderPage(
    pageIndex,
    pageRef
  ) {
    const page =
      pages[pageIndex] ||
      [];


    const isBookmarked =
      bookmarkPage ===
      pageIndex;


    const isSelectable =
      Boolean(
        isBookmarkMode &&
        onSelectBookmarkPage
      );


    const classNames = [
      "blog-reader-sheet",
    ];


    if (hasRichBlocks) {
      classNames.push(
        "blog-reader-sheet--rich"
      );
    }


    if (isBookmarked) {
      classNames.push(
        "blog-reader-sheet--bookmarked"
      );
    }


    if (isSelectable) {
      classNames.push(
        "blog-reader-sheet--bookmark-selectable"
      );
    }


    return (
      <section
        key={
          pageIndex
        }
        ref={
          pageRef
        }
        data-reader-page-index={
          pageIndex
        }
        className={
          classNames.join(
            " "
          )
        }
        onClick={
          isSelectable
            ? () =>
                onSelectBookmarkPage(
                  pageIndex
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
            ? (
                event
              ) => {
                if (
                  event.key ===
                    "Enter" ||
                  event.key ===
                    " "
                ) {
                  event.preventDefault();


                  onSelectBookmarkPage(
                    pageIndex
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
        <div className="blog-reader-sheet__body">
          {page.map(
            renderBlock
          )}


          {hasRichBlocks ? (
            <div className="blog-reader-rich-clear" />
          ) : null}
        </div>


        <footer className="blog-reader-sheet__number">
          {pageIndex + 1}
        </footer>
      </section>
    );
  }


  return (
    <>
      {hasRichBlocks ? (
        <article
          ref={
            measureRootRef
          }
          className={[
            "blog-reader-content",
            "blog-reader-rich-measure-root",
            `blog-reader-content--${viewMode}`,
          ].join(" ")}
          aria-hidden="true"
        >
          <div
            className={
              viewMode ===
              "spread"
                ? "blog-reader-spread"
                : "blog-reader-paged-single"
            }
          >
            <section className="blog-reader-sheet blog-reader-sheet--rich blog-reader-sheet--measure">
              <div
                ref={
                  measureBodyRef
                }
                className="blog-reader-sheet__body"
              />

              <footer className="blog-reader-sheet__number">
                1
              </footer>
            </section>


            {viewMode ===
            "spread" ? (
              <div
                className="blog-reader-sheet blog-reader-sheet--empty"
                aria-hidden="true"
              />
            ) : null}
          </div>
        </article>
      ) : null}


      <ReaderPages
        pageCount={
          pages.length
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
      />
    </>
  );
}


export default ManualReaderContent;