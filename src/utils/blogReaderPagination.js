const READER_PAGE_CAPACITY = 20;

const READER_TEXT_WIDTH_FACTOR = 1.2;

function estimateTextUnits(
  text,
  charsPerUnit = 220,
) {
  const length =
    typeof text === "string"
      ? text.trim().length
      : 0;

  return Math.max(
    1,
    Math.ceil(
      length / charsPerUnit,
    ),
  );
}

function estimateBlockUnits(block) {
  if (!block) {
    return 1;
  }

  if (block.type === "heading") {
    return 4;
  }

  if (block.type === "divider") {
    return 2;
  }

  return Math.ceil(
    estimateTextUnits(
      block.text,
      220,
    ) *
      READER_TEXT_WIDTH_FACTOR,
  );
}

export function buildManualBlocks(
  content,
) {
  if (
    typeof content !== "string" ||
    !content.trim()
  ) {
    return [];
  }

  const normalized =
    content
      .replace(/\r\n/g, "\n")
      .trim();

  return normalized
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((text, index) => {
      if (
        text === "---" ||
        text === "***"
      ) {
        return {
          id: `divider-${index}`,
          type: "divider",
        };
      }

      const headingMatch =
        text.match(
          /^(#{1,3})\s+(.+)$/,
        );

      if (headingMatch) {
        return {
          id: `heading-${index}`,
          type: "heading",
          text:
            headingMatch[2].trim(),
        };
      }

      return {
        id: `paragraph-${index}`,
        type: "paragraph",
        text,
      };
    });
}

export function buildManualPages(
  blocks,
) {
  if (
    !Array.isArray(blocks) ||
    blocks.length === 0
  ) {
    return [];
  }

  const pages = [];

  let currentPage = [];
  let currentUnits = 0;

  blocks.forEach((block) => {
    const blockUnits =
      estimateBlockUnits(block);

    const shouldStartNewPage =
      currentPage.length > 0 &&
      (
        currentUnits +
          blockUnits >
          READER_PAGE_CAPACITY ||
        (
          block.type ===
            "heading" &&
          currentUnits >=
            READER_PAGE_CAPACITY *
              0.78
        )
      );

    if (shouldStartNewPage) {
      pages.push(currentPage);

      currentPage = [];
      currentUnits = 0;
    }

    currentPage.push(block);

    currentUnits +=
      blockUnits;
  });

  if (currentPage.length) {
    pages.push(currentPage);
  }

  return pages;
}