import {
  Link,
  useParams,
} from "react-router-dom";

import { useBlog } from "../context/BlogContext";

function CategoryPage() {
  const { slug } = useParams();

  const {
    categories,
    articles,
    loading,
  } = useBlog();

  if (loading) {
    return (
      <main className="scene-page">
        <p className="scene-message">
          Učitavanje...
        </p>
      </main>
    );
  }

  const category =
    categories.find(
      (item) =>
        item.slug === slug
    );

  if (!category) {
    return (
      <main className="scene-page">
        <Link
          to="/pisanje"
          className="scene-back"
        >
          ←
        </Link>

        <p className="scene-message">
          Kategorija nije pronađena.
        </p>
      </main>
    );
  }

  const categoryArticles =
    articles.filter(
      (article) =>
        article.category_id ===
        category.id
    );

  return (
    <main className="scene-page works-page">
      <Link
        to="/pisanje"
        className="scene-back"
      >
        ←
      </Link>

      <header className="works-heading">
        <p>KATEGORIJA</p>

        <h1>
          {category.name}
        </h1>

        {category.description && (
          <div>
            {category.description}
          </div>
        )}
      </header>

      {!categoryArticles.length ? (
        <p className="scene-message">
          U ovoj kategoriji još nema
          objavljenih radova.
        </p>
      ) : (
        <div className="works-grid">
          {categoryArticles.map(
            (article) => (
              <Link
                key={article.id}
                to={`/tekst/${article.slug}`}
                className="work-card"
              >
                {article.cover_image_url && (
                  <img
                    src={
                      article.cover_image_url
                    }
                    alt=""
                  />
                )}

                <div className="work-card-overlay" />

                <div className="work-card-content">
                  <h2>
                    {article.title}
                  </h2>

                  {article.subtitle && (
                    <p>
                      {article.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            )
          )}
        </div>
      )}
    </main>
  );
}

export default CategoryPage;