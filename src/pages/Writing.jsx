import { Link } from "react-router-dom";

import { useBlog } from "../context/BlogContext";

function Writing() {
  const {
    categories,
    loading,
  } = useBlog();

  if (loading) {
    return (
      <main className="scene-page">
        <p className="scene-message">
          Učitavanje kategorija...
        </p>
      </main>
    );
  }

  return (
    <main className="scene-page writing-page">
      <Link
        to="/izbor"
        className="scene-back"
      >
        ←
      </Link>

      {!categories.length ? (
        <p className="scene-message">
          Još nema kategorija.
        </p>
      ) : (
        <div className="category-stage">
          {categories.map(
            (category) => (
              <Link
                key={category.id}
                to={`/kategorija/${category.slug}`}
                className="category-bubble"
              >
                {category.image_url && (
                  <img
                    src={category.image_url}
                    alt={category.name}
                  />
                )}

                <div className="category-overlay" />

                <span className="category-name">
                  {category.name}
                </span>
              </Link>
            )
          )}
        </div>
      )}
    </main>
  );
}

export default Writing;