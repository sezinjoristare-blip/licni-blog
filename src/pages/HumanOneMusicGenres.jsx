import {
  Link,
} from "react-router-dom";

import {
  playUiBack,
  playUiSelect,
} from "../audio/uiSounds";

import "../styles/HumanOneMusicRecommendations.css";
import "../styles/HumanOneMusicSubmitRecommendation.css";


function HumanOneMusicGenres() {
  return (
    <main className="music-recommendations music-recommendations--landing">
      <div className="music-recommendations__shell">
        <Link
          to="/autor/covek/muzika"
          className="music-recommendations__back"
          onClick={
            playUiBack
          }
        >
          ← МУЗИКА
        </Link>


        <header className="music-recommendations__heading">
          <p>
            ПРЕПОРУКЕ / 01
          </p>

          <h1>
            ШТА ТРАЖИШ?
          </h1>

          <span>
            Изабери полицу.
          </span>
        </header>


        <section className="music-recommendations__entrance-grid">
          <Link
            to="/autor/covek/muzika/preporuke/pesme"
            className="music-recommendations__entrance-card music-recommendations__entrance-card--songs"
            onClick={
              playUiSelect
            }
          >
            <div
              className="music-recommendations__entrance-visual"
              aria-hidden="true"
            >
              <div className="music-recommendations__record-stack">
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="music-recommendations__record-front">
                <i />
              </div>
            </div>


            <div className="music-recommendations__entrance-copy">
              <small>
                ПОЛИЦА 01
              </small>

              <h2>
                ДИСКОВИ
              </h2>

              <p>
                Појединачне препоруке.
                Претражуј по жанру,
                извођачу и години.
              </p>

              <strong>
                ОТВОРИ ПОЛИЦУ →
              </strong>
            </div>
          </Link>


          <Link
            to="/autor/covek/muzika/preporuke/plejliste"
            className="music-recommendations__entrance-card music-recommendations__entrance-card--playlists"
            onClick={
              playUiSelect
            }
          >
            <div
              className="music-recommendations__entrance-visual"
              aria-hidden="true"
            >
              <div className="music-recommendations__bulk">
                <div className="music-recommendations__bulk-lid" />

                <div className="music-recommendations__bulk-discs">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div className="music-recommendations__bulk-pin" />

                <div className="music-recommendations__bulk-base" />
              </div>
            </div>


            <div className="music-recommendations__entrance-copy">
              <small>
                ПОЛИЦА 02
              </small>

              <h2>
                ПЛЕЈЛИСТЕ
              </h2>

              <p>
                Моји сетови песама,
                сложени као пластични
                балк дискова.
              </p>

              <strong>
                ОТВОРИ ПОЛИЦУ →
              </strong>
            </div>
          </Link>


          <Link
            to="/autor/covek/muzika/preporuke/radio-drame"
            className="music-recommendations__entrance-card music-recommendations__entrance-card--radio-dramas"
            onClick={
              playUiSelect
            }
          >
            <div
              className="music-recommendations__entrance-visual"
              aria-hidden="true"
            >
              <div className="music-recommendations__cassette">
                <span className="music-recommendations__cassette-label">
                  RADIO
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
            </div>


            <div className="music-recommendations__entrance-copy">
              <small>
                ПОЛИЦА 03
              </small>

              <h2>
                РАДИО ДРАМЕ
              </h2>

              <p>
                Приче за слушање,
                сложене као старе
                аудио касете.
              </p>

              <strong>
                ОТВОРИ ПОЛИЦУ →
              </strong>
            </div>
          </Link>


          <Link
            to="/autor/covek/muzika/preporuke/posalji"
            className="music-recommendations__entrance-card music-recommendations__entrance-card--submit"
            onClick={
              playUiSelect
            }
          >
            <div
              className="music-recommendations__entrance-visual"
              aria-hidden="true"
            >
              <div className="music-recommendations__suggestion-note">
                <span className="music-recommendations__suggestion-tape" />

                <strong>
                  ТВОЈА
                  <br />
                  ПРЕПОРУКА
                </strong>

                <i />
                <i />
                <i />

                <b>
                  →
                </b>
              </div>
            </div>


            <div className="music-recommendations__entrance-copy">
              <small>
                ПОЛИЦА 04
              </small>

              <h2>
                ПОШАЉИ
                <br />
                ПРЕПОРУКУ
              </h2>

              <p>
                Пошаљи ми песму,
                плејлисту или радио
                драму коју вреди чути.
              </p>

              <strong>
                ОСТАВИ ПРЕПОРУКУ →
              </strong>
            </div>
          </Link>
        </section>
      </div>
    </main>
  );
}


export default HumanOneMusicGenres;