import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";


const ROOT =
  process.cwd();

const IMAGE_DIR =
  path.join(
    ROOT,
    "public",
    "images",
    "human-one"
  );

const SOURCE_DIR =
  path.join(
    ROOT,
    "src"
  );


/*
 * Slike koje trenutno čine samu
 * Sergejevu sobu.
 *
 * NE diramo transition svetove.
 * NE diramo muziku.
 * NE diramo već postojeći WebP
 * game-console-screen.webp.
 */
const IMAGES = [
  {
    name: "room-bg",
    quality: 82,
    preset: "photo",
  },
  {
    name: "room-bg-mobile",
    quality: 82,
    preset: "photo",
  },
  {
    name: "back-sign",
    quality: 86,
    preset: "picture",
  },
  {
    name: "digital-clock",
    quality: 86,
    preset: "picture",
  },
  {
    name: "skateboard",
    quality: 84,
    preset: "picture",
  },
  {
    name: "boombox",
    quality: 84,
    preset: "picture",
  },
  {
    name: "guitar",
    quality: 84,
    preset: "picture",
  },
  {
    name: "posters",
    quality: 86,
    preset: "picture",
  },
  {
    name: "profile-poster",
    quality: 86,
    preset: "picture",
  },
  {
    name: "mailbox",
    quality: 84,
    preset: "picture",
  },
  {
    name: "game-console-off",
    quality: 86,
    preset: "picture",
  },
];


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


async function convertImages() {
  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    " SERGEJEVA SOBA — PNG → WEBP"
  );
  console.log(
    "======================================"
  );
  console.log("");


  let totalBefore =
    0;

  let totalAfter =
    0;


  for (
    const image of IMAGES
  ) {
    const inputPath =
      path.join(
        IMAGE_DIR,
        `${image.name}.png`
      );

    const outputPath =
      path.join(
        IMAGE_DIR,
        `${image.name}.webp`
      );


    if (
      !fs.existsSync(
        inputPath
      )
    ) {
      console.log(
        `⚠ Nema fajla: ${image.name}.png`
      );

      continue;
    }


    const beforeSize =
      fs.statSync(
        inputPath
      ).size;


    await sharp(
      inputPath
    )
      .webp({
        quality:
          image.quality,

        alphaQuality:
          100,

        effort:
          6,

        smartSubsample:
          true,

        preset:
          image.preset,
      })
      .toFile(
        outputPath
      );


    const afterSize =
      fs.statSync(
        outputPath
      ).size;


    totalBefore +=
      beforeSize;

    totalAfter +=
      afterSize;


    const saving =
      (
        1 -
        afterSize /
          beforeSize
      ) * 100;


    console.log(
      `${image.name}`
    );

    console.log(
      `   PNG : ${formatBytes(
        beforeSize
      )}`
    );

    console.log(
      `   WebP: ${formatBytes(
        afterSize
      )}`
    );

    console.log(
      `   Ušteda: ${saving.toFixed(
        1
      )}%`
    );

    console.log("");
  }


  console.log(
    "--------------------------------------"
  );

  console.log(
    `UKUPNO PNG : ${formatBytes(
      totalBefore
    )}`
  );

  console.log(
    `UKUPNO WebP: ${formatBytes(
      totalAfter
    )}`
  );


  if (
    totalBefore > 0
  ) {
    const totalSaving =
      (
        1 -
        totalAfter /
          totalBefore
      ) * 100;

    console.log(
      `UKUPNA UŠTEDA: ${totalSaving.toFixed(
        1
      )}%`
    );
  }

  console.log(
    "--------------------------------------"
  );

  console.log("");
}


function getSourceFiles(
  directory
) {
  if (
    !fs.existsSync(
      directory
    )
  ) {
    return [];
  }


  const entries =
    fs.readdirSync(
      directory,
      {
        withFileTypes:
          true,
      }
    );


  const files =
    [];


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
      files.push(
        ...getSourceFiles(
          fullPath
        )
      );

      continue;
    }


    if (
      /\.(js|jsx|ts|tsx|css|scss|html)$/i.test(
        entry.name
      )
    ) {
      files.push(
        fullPath
      );
    }
  }


  return files;
}


function replaceSourceReferences() {
  console.log(
    "Menjam reference PNG → WebP..."
  );

  console.log("");


  const files =
    getSourceFiles(
      SOURCE_DIR
    );


  let changedFiles =
    0;

  let replacements =
    0;


  for (
    const filePath of files
  ) {
    let content =
      fs.readFileSync(
        filePath,
        "utf8"
      );

    const originalContent =
      content;


    for (
      const image of IMAGES
    ) {
      const pngName =
        `${image.name}.png`;

      const webpName =
        `${image.name}.webp`;


      const occurrences =
        content.split(
          pngName
        ).length - 1;


      if (
        occurrences > 0
      ) {
        replacements +=
          occurrences;

        content =
          content
            .split(
              pngName
            )
            .join(
              webpName
            );
      }
    }


    if (
      content !==
      originalContent
    ) {
      fs.writeFileSync(
        filePath,
        content,
        "utf8"
      );

      changedFiles +=
        1;

      console.log(
        `✓ ${path.relative(
          ROOT,
          filePath
        )}`
      );
    }
  }


  console.log("");

  console.log(
    `Promenjeno fajlova: ${changedFiles}`
  );

  console.log(
    `Promenjeno referenci: ${replacements}`
  );

  console.log("");
}


async function main() {
  if (
    !fs.existsSync(
      IMAGE_DIR
    )
  ) {
    console.error(
      "❌ Ne postoji folder:"
    );

    console.error(
      IMAGE_DIR
    );

    process.exit(1);
  }


  await convertImages();

  replaceSourceReferences();


  console.log(
    "======================================"
  );

  console.log(
    " GOTOVO"
  );

  console.log(
    "======================================"
  );

  console.log("");

  console.log(
    "PNG originali NISU obrisani."
  );

  console.log(
    "WebP kopije su napravljene."
  );

  console.log(
    "Reference u src folderu su ažurirane."
  );

  console.log("");
}


main().catch(
  (error) => {
    console.error(
      "❌ Konverzija nije uspela:"
    );

    console.error(
      error
    );

    process.exit(1);
  }
);