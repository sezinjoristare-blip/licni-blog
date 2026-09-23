const STORAGE_KEY =
  "seki-article-progress-v1";


function readAllProgress() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(
        STORAGE_KEY
      ) || "{}"
    );

    return (
      parsed &&
      typeof parsed ===
        "object"
        ? parsed
        : {}
    );
  } catch {
    return {};
  }
}


export function getArticleProgress(
  articleId
) {
  if (!articleId) {
    return null;
  }

  const allProgress =
    readAllProgress();

  return (
    allProgress[articleId] ||
    null
  );
}


export function saveArticleProgress(
  articleId,
  progress
) {
  if (!articleId) {
    return;
  }

  const allProgress =
    readAllProgress();

  allProgress[articleId] = {
    ...progress,

    updatedAt:
      new Date()
        .toISOString(),
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      allProgress
    )
  );
}


export function removeArticleProgress(
  articleId
) {
  if (!articleId) {
    return;
  }

  const allProgress =
    readAllProgress();

  delete allProgress[
    articleId
  ];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      allProgress
    )
  );
}


export {
  STORAGE_KEY as
    ARTICLE_PROGRESS_STORAGE_KEY,
};