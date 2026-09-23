import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  Navigate,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  playUiBack,
  playUiSelect,
} from "../audio/uiSounds";

import "../styles/HumanOnePosters.css";


function HumanOnePosterCategory() {
  const {
    categorySlug,
  } = useParams();


  const [
    category,
    setCategory,
  ] = useState(null);

  const [
    articles,
    setArticles,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    notFound,
    setNotFound,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  useEffect(() => {
    let active =
      true;


    async function loadCategory() {
      setLoading(
        true
      );

      setNotFound(
        false
      );

      setErrorMessage(
        ""
      );


      const {
        data:
          categoryData,

        error:
          categoryError,
      } =
        await supabase
          .from(
            "categories"
          )
          .select(`
            id,
            name,
            slug,
            description,
            image_url
          `)
          .eq(
            "character_key",
            "covek-1"
          )
          .eq(
            "slug",
            categorySlug
          )
          .maybeSingle();


      if (!active) {
        return;
      }


      if (
        categoryError
      ) {
        console.error(
          "Učitavanje kategorije:",
          categoryError
        );

        setErrorMessage(
          "Категорију тренутно није могуће учитати."
        );

        setLoading(
          false
        );

        return;
      }


      if (
        !categoryData
      ) {
        setNotFound(
          true
        );

        setLoading(
          false
        );

        return;
      }


      setCategory(
        categoryData
      );


      const {
        data:
          articleData,

        error:
          articleError,
      } =
        await supabase
          .from(
            "articles"
          )
          .select(`
            id,
            title,
            subtitle,
            excerpt,
            slug,
            cover_image_url,
            content_type,
            pdf_url,
            published_at,
            created_at,
            article_parts (
              id
            )
          `)
          .eq(
            "character_key",
            "covek-1"
          )
          .eq(
            "category_id",
            categoryData.id
          )
          .eq(
            "status",
            "published"
          )
          .order(
            "published_at",
            {
              ascending:
                false,
            }
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );


      if (!active) {
        return;
      }


      if (
        articleError
      ) {
        console.error(
          "Učitavanje tekstova:",
          articleError
        );

        setErrorMessage(
          "Текстове тренутно није могуће учитати."
        );

        setLoading(
          false
        );

        return;
      }


      setArticles(
        articleData ??
        []
      );

      setLoading(
        false
      );
    }


    loadCategory();


    return () => {
      active =
        false;
    };
  }, [
    categorySlug,
  ]);


  if (notFound) {
    return (
      <Navigate
        to="/autor/covek/posteri"
        replace
      />
    );
  }


  return (
    <main className="human-one-posters human-one-posters--category-page">
      <div className="human-one-posters__shell">
        <Link
          to="/autor/covek/posteri"
          className="human-one-posters__back"
          onClick={
            playUiBack
          }
        >
          ← КАТЕГОРИЈЕ
        </Link>


        <header className="human-one-posters__hero human-one-posters__hero--category">
          <p>
            СЕКИ / ПОСТЕРИ
          </p>

          <h1>
            {category
              ?.name ||
              "ТЕКСТОВИ"}
          </h1>

          {category
            ?.description ? (
            <span>
              {
                category
                  .description
              }
            </span>
          ) : (
            <span>
              Изабери текст.
            </span>
          )}
        </header>


        {loading ? (
          <div className="human-one-posters__state">
            Учитавање...
          </div>

        ) : errorMessage ? (
          <div className="human-one-posters__state">
            {errorMessage}
          </div>

        ) : !articles.length ? (
          <div className="human-one-posters__state">
            У овој категорији
            још нема објављених
            текстова.
          </div>

        ) : (
          <section className="human-one-posters__article-list">
            {articles.map(
              (
                article,
                index
              ) => {
                const partCount =
                  Array.isArray(
                    article
                      .article_parts
                  ) &&
                  article
                    .article_parts
                    .length

                    ? article
                        .article_parts
                        .length

                    : article.pdf_url
                      ? 1
                      : 0;


                return (
                  <Link
                    key={
                      article.id
                    }
                    to={
                      `/autor/covek/posteri/${categorySlug}/${article.slug}`
                    }
                    className="human-one-posters__article-card"
                    onClick={
                      playUiSelect
                    }
                  >
                    <div className="human-one-posters__article-image">
                      {article
                        .cover_image_url ? (
                        <img
                          src={
                            article
                              .cover_image_url
                          }
                          alt=""
                        />
                      ) : (
                        <span>
                          {String(
                            index +
                            1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>
                      )}
                    </div>


                    <div className="human-one-posters__article-copy">
                      <p>
                        {article
                          .content_type ===
                        "pdf"
                          ? partCount >
                            1
                            ? `PDF · ${partCount} ДЕЛА`
                            : "PDF"
                          : "ТЕКСТ"}
                      </p>

                      <h2>
                        {article.title}
                      </h2>

                      {article
                        .subtitle ? (
                        <h3>
                          {
                            article
                              .subtitle
                          }
                        </h3>
                      ) : null}

                      {article
                        .excerpt ? (
                        <span>
                          {
                            article
                              .excerpt
                          }
                        </span>
                      ) : null}
                    </div>


                    <strong
                      aria-hidden="true"
                    >
                      →
                    </strong>
                  </Link>
                );
              }
            )}
          </section>
        )}
      </div>
    </main>
  );
}


export default HumanOnePosterCategory;