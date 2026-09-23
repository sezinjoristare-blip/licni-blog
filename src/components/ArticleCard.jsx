import { Link } from "react-router-dom";

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "sr-RS",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(new Date(value));
}

function ArticleCard({ article }) {
  return (
    <article className="article-card">
      <div className="article-card-meta">
        {article.categories?.name && (
          <span>
            {article.categories.name}
          </span>
        )}

        {article.published_at && (
          <span>
            {formatDate(
              article.published_at
            )}
          </span>
        )}
      </div>

      <h2>{article.title}</h2>

      {article.subtitle && (
        <p className="article-subtitle">
          {article.subtitle}
        </p>
      )}

      {article.excerpt && (
        <p>{article.excerpt}</p>
      )}

      <Link
        className="read-more"
        to={`/tekst/${article.slug}`}
      >
        Čitaj tekst →
      </Link>
    </article>
  );
}

export default ArticleCard;