import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";


const ROOT =
  process.cwd();

const PUBLIC_IMAGES_DIR =
  path.join(
    ROOT,
    "public",
    "images"
  );

const SOURCE_DIR =
  path.join(
    ROOT,
    "src"
  );


const MIN_SIZE_BYTES =
  100 * 1024;


const EXTENSIONS =
  new Set([
    ".png",
    ".jpg",
    ".jpeg",
  ]);


function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} MB`;
}


function walkFiles(directory) {
  const results =
    [];

  if (
    !fs.existsSync(
      directory
    )
  ) {
    return results;
  }

  const entries =
    fs.readdirSync(
      directory,
      {
        withFileTypes:
          true,
      }
    );

  for (
    const entry of entries
  ) {
    const fullPath =
      path.join(
        directory,
        entry.name
      );

    if (
      entry.isDirectory()
    ) {
      results.push(
        ...walkFiles(
          fullPath
        )
      );

      continue;
    }

    results.push(
      fullPath
    );
  }

  return results;
}


function getSourceFiles(
  directory
) {
  return walkFiles(
    directory
  ).filter(
    (filePath) =>
      /\.(js|jsx|ts|tsx|css|scss|html)$/i.test(
        filePath
      )
  );
}


async function convertImage(
  inputPath
) {
  const extension =
    path.extname(
      inputPath
    ).toLowerCase();

  if (
    !EXTENSIONS.has(
      extension
    )
  ) {
    return null;
  }


  const stat =
    fs.statSync(
      inputPath
    );

  if (
    stat.size <
    MIN_SIZE_BYTES
  ) {
    return null;
  }


  const outputPath =
    inputPath.replace(
      /\.(png|jpe?g)$/i,
      ".webp"
    );


  /*
   * Ako WebP već postoji,
   * ne pravimo ga ponovo.
   */
  if (
    fs.existsSync(
      outputPath
    )
  ) {
    return {
      inputPath,
      outputPath,
      beforeSize:
        stat.size,

      afterSize:
        fs.statSync(
          outputPath
        ).size,

      skippedExisting:
        true,
    };
  }


  const image =
    sharp(
      inputPath
    );

  const metadata =
    await image.metadata();


  const hasAlpha =
    Boolean(
      metadata.hasAlpha
    );


  /*
   * Background / JPEG:
   * malo jača kompresija.
   *
   * PNG sa providnošću:
   * malo viši kvalitet,
   * alpha čuvamo maksimalno.
   */
  const quality =
    hasAlpha
      ? 86
      : 82;


  await image
    .webp({
      quality,

      alphaQuality:
        100,

      effort:
        6,

      smartSubsample:
        true,
    })
    .toFile(
      outputPath
    );


  return {
    inputPath,
    outputPath,

    beforeSize:
      stat.size,

    afterSize:
      fs.statSync(
        outputPath
      ).size,

    skippedExisting:
      false,
  };
}


function replaceReferences(
  conversions
) {
  const sourceFiles =
    getSourceFiles(
      SOURCE_DIR
    );

  let changedFiles =
    0;

  let replacements =
    0;


  for (
    const sourceFile of
    sourceFiles
  ) {
    let content =
      fs.readFileSync(
        sourceFile,
        "utf8"
      );

    const original =
      content;


    for (
      const conversion of
      conversions
  ) {
      const oldName =
        path.basename(
          conversion.inputPath
        );

      const newName =
        path.basename(
          conversion.outputPath
        );


      const count =
        content.split(
          oldName
        ).length - 1;


      if (
        count > 0
      ) {
        replacements +=
          count;

        content =
          content
            .split(
              oldName
            )
            .join(
              newName
            );
      }
    }


    if (
      content !==
      original
    ) {
      fs.writeFileSync(
        sourceFile,
        content,
        "utf8"
      );

      changedFiles +=
        1;

      console.log(
        `✓ reference: ${path.relative(
          ROOT,
          sourceFile
        )}`
      );
    }
  }


  return {
    changedFiles,
    replacements,
  };
}


async function main() {
  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    " GLOBAL SITE IMAGE OPTIMIZATION"
  );
  console.log(
    " PNG / JPG / JPEG → WEBP"
  );
  console.log(
    "========================================"
  );
  console.log("");


  const allFiles =
    walkFiles(
      PUBLIC_IMAGES_DIR
    );


  const candidateFiles =
    allFiles.filter(
      (filePath) =>
        EXTENSIONS.has(
          path
            .extname(
              filePath
            )
            .toLowerCase()
        )
    );


  const conversions =
    [];

  let totalBefore =
    0;

  let totalAfter =
    0;


  for (
    const filePath of
    candidateFiles
  ) {
    const result =
      await convertImage(
        filePath
      );


    if (!result) {
      continue;
    }


    conversions.push(
      result
    );


    totalBefore +=
      result.beforeSize;

    totalAfter +=
      result.afterSize;


    const saving =
      (
        1 -
        result.afterSize /
          result.beforeSize
      ) * 100;


    console.log(
      path.relative(
        PUBLIC_IMAGES_DIR,
        result.inputPath
      )
    );

    console.log(
      `   ${formatBytes(
        result.beforeSize
      )} → ${formatBytes(
        result.afterSize
      )}`
    );

    console.log(
      `   ušteda: ${saving.toFixed(
        1
      )}%${
        result.skippedExisting
          ? "  [WebP već postoji]"
          : ""
      }`
    );

    console.log("");
  }


  console.log(
    "----------------------------------------"
  );

  console.log(
    "Menjam reference u src..."
  );

  console.log("");


  const {
    changedFiles,
    replacements,
  } =
    replaceReferences(
      conversions
    );


  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    " GOTOVO"
  );
  console.log(
    "========================================"
  );


  console.log(
    `Konvertovano / pronađeno WebP: ${conversions.length}`
  );

  console.log(
    `Promenjeno source fajlova: ${changedFiles}`
  );

  console.log(
    `Promenjeno referenci: ${replacements}`
  );


  console.log("");

  console.log(
    `Pre: ${formatBytes(
      totalBefore
    )}`
  );

  console.log(
    `Posle: ${formatBytes(
      totalAfter
    )}`
  );


  if (
    totalBefore > 0
  ) {
    const saving =
      (
        1 -
        totalAfter /
          totalBefore
      ) * 100;

    console.log(
      `Ukupna ušteda: ${saving.toFixed(
        1
      )}%`
    );
  }


  console.log("");
  console.log(
    "Originalni PNG/JPG fajlovi NISU obrisani."
  );
  console.log("");
}


main().catch(
  (error) => {
    console.error(
      error
    );

    process.exit(1);
  }
);