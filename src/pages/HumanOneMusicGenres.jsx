import { useMusicTranslation, musicLandingLabels } from "../i18n/musicTranslations";
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
  const mt = useMusicTranslation();

  const tr = (key) => mt(musicLandingLabels[key] ?? key);

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
          {tr("backToMusic")}
        </Link>


        <header className="music-recommendations__heading">
          <p>
            {tr("sectionLabel")}
          </p>

          <h1>
            {tr("title")}
          </h1>

          <span>
            {tr("subtitle")}
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
                {tr("shelf01")}
              </small>

              <h2>
                {tr("recordsTitle")}
              </h2>

              <p>
                {tr("recordsDescription")}
              </p>

              <strong>
                {tr("openShelf")}
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
                {tr("shelf02")}
              </small>

              <h2>
                {tr("playlistsTitle")}
              </h2>

              <p>
                {tr("playlistsDescription")}
              </p>

              <strong>
                {tr("openShelf")}
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
                {tr("shelf03")}
              </small>

              <h2>
                {tr("radioDramasTitle")}
              </h2>

              <p>
                {tr("radioDramasDescription")}
              </p>

              <strong>
                {tr("openShelf")}
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
                  {tr("noteLine1")}
                  <br />
                  {tr("noteLine2")}
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
                {tr("shelf04")}
              </small>

              <h2>
                {tr("submitTitleLine1")}
                <br />
                {tr("submitTitleLine2")}
              </h2>

              <p>
                {tr("submitDescription")}
              </p>

              <strong>
                {tr("submitAction")}
              </strong>
            </div>
          </Link>
        </section>
      </div>
    </main>
  );
}


export default HumanOneMusicGenres;