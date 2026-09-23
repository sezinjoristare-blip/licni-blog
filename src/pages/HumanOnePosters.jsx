import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  preparePosterExitTransition,
  startPosterExitTransition,
} from "../transitions/posterTransition.js";

import {
  playUiSelect,
} from "../audio/uiSounds";

import "../styles/HumanOnePosters.css";


function HumanOnePosters() {
  const navigate =
    useNavigate();


  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  useEffect(() => {
    preparePosterExitTransition();
  }, []);


  useEffect(() => {
    let active =
      true;


    async function loadCategories() {
      setLoading(
        true
      );

      setErrorMessage(
        ""
      );


      const {
        data,
        error,
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
            image_url,
            sort_order
          `)
          .eq(
            "character_key",
            "covek-1"
          )
          .order(
            "sort_order",
            {
              ascending:
                true,
            }
          )
          .order(
            "name",
            {
              ascending:
                true,
            }
          );


      if (!active) {
        return;
      }


      if (error) {
        console.error(
          "Učitavanje kategorija:",
          error
        );

        setErrorMessage(
          "Категорије тренутно није могуће учитати."
        );

        setLoading(
          false
        );

        return;
      }


      setCategories(
        data ??
        []
      );

      setLoading(
        false
      );
    }


    loadCategories();


    return () => {
      active =
        false;
    };
  }, []);


  function handleBack(
    event
  ) {
    event.preventDefault();


    startPosterExitTransition({
      navigate: () => {
        navigate(
          "/autor/covek"
        );
      },
    });
  }


  return (
    <main
      className="human-one-posters human-one-posters--shelves"
      data-poster-transition-page="true"
    >
      <div className="human-one-posters__shell">
        <Link
          to="/autor/covek"
          className="human-one-posters__back"
          onClick={
            handleBack
          }
        >
          ← СОБА
        </Link>


        <header className="human-one-posters__hero">
          <p>
            СЕКИ / ПОСТЕРИ
          </p>

          <h1>
            КАТЕГОРИЈЕ
          </h1>

          <span>
            Путовања, бајке,
            сценарији,
            свакодневица и
            остале лакше приче
            из мог света.
          </span>
        </header>


        {loading ? (
          <div className="human-one-posters__state">
            Учитавање...
          </div>

        ) : errorMessage ? (
          <div className="human-one-posters__state">
            {errorMessage}
          </div>

        ) : !categories.length ? (
          <div className="human-one-posters__state">
            Још нема категорија.
          </div>

        ) : (
          <section className="human-one-posters__category-grid">
            {categories.map(
              (
                category,
                index
              ) => (
                <Link
                  key={
                    category.id
                  }
                  to={
                    `/autor/covek/posteri/${category.slug}`
                  }
                  className={`human-one-posters__category-card human-one-posters__category-card--${
                    (
                      index %
                      4
                    ) + 1
                  }`}
                  onClick={
                    playUiSelect
                  }
                >
                  <div className="human-one-posters__category-image">
                    {category
                      .image_url ? (
                      <img
                        src={
                          category
                            .image_url
                        }
                        alt=""
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                      >
                        ✦
                      </span>
                    )}
                  </div>


                  <div className="human-one-posters__category-copy">
                    <small>
                      {String(
                        index +
                        1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </small>

                    <h2>
                      {category.name}
                    </h2>

                    {category
                      .description ? (
                      <p>
                        {
                          category
                            .description
                        }
                      </p>
                    ) : null}
                  </div>
                </Link>
              )
            )}


            {categories.length %
              2 ===
              1 && (
              <div
                className="human-one-posters__category-empty-slot"
                aria-hidden="true"
              />
            )}
          </section>
        )}
      </div>
    </main>
  );
}


export default HumanOnePosters;