import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  playUiBack,
  playUiSelect,
} from "../audio/uiSounds";

import "../styles/HumanOneMusicRecommendations.css";


function CassetteVisual() {
  return (
    <div
      className="music-recommendations__cassette"
      aria-hidden="true"
    >
      <span className="music-recommendations__cassette-label">
        RADIO DRAMA
      </span>

      <span className="music-recommendations__cassette-window">
        <i />
        <i />
      </span>

      <span className="music-recommendations__cassette-tape" />

      <span className="music-recommendations__cassette-bottom">
        <i />
        <i />
      </span>

      <b className="music-recommendations__cassette-screw music-recommendations__cassette-screw--one" />
      <b className="music-recommendations__cassette-screw music-recommendations__cassette-screw--two" />
      <b className="music-recommendations__cassette-screw music-recommendations__cassette-screw--three" />
      <b className="music-recommendations__cassette-screw music-recommendations__cassette-screw--four" />
    </div>
  );
}


function HumanOneMusicRadioDramas() {
  const [
    dramas,
    setDramas,
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
    let active = true;


    async function loadDramas() {
      setLoading(true);
      setErrorMessage("");


      const {
        data,
        error,
      } = await supabase
        .from(
          "music_radio_dramas"
        )
        .select(`
          id,
          title,
          author,
          slug,
          sort_order
        `)
        .eq(
          "status",
          "published"
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
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


      if (error) {
        console.error(
          "Učitavanje radio drama:",
          error
        );

        setErrorMessage(
          "Радио драме тренутно није могуће учитати."
        );

        setLoading(false);
        return;
      }


      setDramas(
        data ??
        []
      );

      setLoading(false);
    }


    loadDramas();


    return () => {
      active = false;
    };
  }, []);


  return (
    <main className="music-recommendations music-recommendations--radio-dramas">
      <div className="music-recommendations__shell">
        <Link
          to="/autor/covek/muzika/preporuke"
          className="music-recommendations__back"
          onClick={
            playUiBack
          }
        >
          ← ПРЕПОРУКЕ
        </Link>


        <header className="music-recommendations__heading">
          <p>
            ПРЕПОРУКЕ / РАДИО ДРАМЕ
          </p>

          <h1>
            КАСЕТЕ
          </h1>

          <span>
            Изабери касету.
          </span>
        </header>


        {loading ? (
          <div className="music-recommendations__state">
            Учитавање касета...
          </div>

        ) : errorMessage ? (
          <div className="music-recommendations__state">
            {errorMessage}
          </div>

        ) : !dramas.length ? (
          <div className="music-recommendations__state">
            Још нема објављених
            радио драма.
          </div>

        ) : (
          <section className="music-recommendations__radio-drama-grid">
            {dramas.map(
              (
                drama
              ) => (
                <Link
                  key={
                    drama.id
                  }
                  to={
                    `/autor/covek/muzika/preporuke/radio-drame/${drama.slug}`
                  }
                  className="music-recommendations__radio-drama-card"
                  onClick={
                    playUiSelect
                  }
                >
                  <CassetteVisual />


                  <div className="music-recommendations__radio-drama-card-copy">
                    <h2>
                      {drama.title}
                    </h2>

                    <p>
                      {drama.author ||
                        "НЕПОЗНАТ АУТОР"}
                    </p>
                  </div>
                </Link>
              )
            )}
          </section>
        )}
      </div>
    </main>
  );
}


export default HumanOneMusicRadioDramas;
