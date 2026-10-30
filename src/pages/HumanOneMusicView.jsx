import { translateMusicText } from "../i18n/musicTranslations";
import { Link } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext";

import {
  playUiBack,
  playUiSelect,
} from "../audio/uiSounds";

import {
  EQUALIZER_BARS,
  RADIO_STATIONS,
  formatTime,
} from "./HumanOneMusicCore";


function HumanOneMusicView({ controller }) {
  const { t, language } = useLanguage();

  // Prevodi samo tekst za prikaz.
  // Interne vrednosti kontrolera ostaju iste.
  const localizeMusicLabel = (value) => {
    const keys = {
      "ПРЕПОРУКА": "music.player.recommendation",
      "ПЛЕЈЛИСТА": "music.player.playlist",
      "АНАЛИЗА": "music.player.analysis",
      "РАДИО ДРАМА": "music.player.radioDrama",
      "РАДИО-ДРАМА": "music.player.radioDrama",
      "ЧИТАЈ": "common.read",
      "РАДИО НИЈЕ ДОСТУПАН": "music.player.radioUnavailable",
      "ПЕСМА НИЈЕ ДОСТУПНА": "music.player.trackUnavailable",
      "ПЛЕЈЕР НИЈЕ ДОСТУПАН": "music.player.playerUnavailable",
      "НЕМА YOUTUBE ЛИНКА": "music.player.noYoutubeLink",
      "СТАНИЦА НИЈЕ ДОСТУПНА": "music.player.stationUnavailable",
      "ПЛЕЈЕР СЕ УЧИТАВА": "music.player.loadingPlayer",
      "БЕОГРАД": "music.player.belgrade",
      "ЛЕСКОВАЦ": "music.player.leskovac",
      "НЕМАЧКА • WEB": "music.player.germanyWeb",
      "НОВИ САД • WEB": "music.player.noviSadWeb",
    };

    const key = keys[value];
    return key ? t(key, value) : translateMusicText(value, language);
  };

  const {
    radioMode,
    radioPlaying,
    radioError,
    radioNowPlaying,

    currentTrack,
    currentStation,
    stationBandLabel,

    playerError,
    playbackStarted,
    isPlaying,
    currentTime,
    duration,
    lcdLoaded,
    lcdIndex,

    equalizerLevels,
    equalizerMode,

    musicReturnPath,
    musicReturnState,
    musicReturnLabel,
    autoplayEnabled,

    volume,
    volumeAngle,

    stationIndex,
    stationAngle,

    activePlayback,

    handlePrevious,
    handleNext,
    handleAutoplayToggle,
    handleRadioToggle,
    handlePlayPause,

    handleVolumePointerDown,
    handleVolumePointerMove,
    handleVolumePointerUp,
    handleVolumeWheel,
    handleVolumeKeyDown,

    handleStationPointerDown,
    handleStationPointerMove,
    handleStationPointerUp,
    handleStationWheel,
    handleStationKeyDown,
  } = controller;

  return (
    <main
      className="
        human-one-music
        human-one-music--hub
      "
    >
      <div className="human-one-music__scene">

        {/* =====================================
            IZLAZ
            ===================================== */}

        <Link
          to="/autor/covek"
          className="
            human-one-music__scene-control
            human-one-music__scene-control--exit
          "
          onClick={playUiBack}
          aria-label={t("music.player.backToRoom")}
        >
          <img
            src="/images/human-one/music/music-exit-button.webp"
            alt=""
            draggable="false"
          />
        </Link>


        {/* =====================================
            PREVIOUS
            ===================================== */}

        <button
          type="button"
          className="
            human-one-music__scene-control
            human-one-music__scene-control--previous
          "
          onClick={handlePrevious}
          aria-label={
            radioMode
              ? t("music.player.previousRadioStation")
              : t("music.player.previousTrack")
          }
        >
          <img
            src="/images/human-one/music/music-prev-button.webp"
            alt=""
            draggable="false"
          />
        </button>


        {/* =====================================
            NEXT
            ===================================== */}

        <button
          type="button"
          className="
            human-one-music__scene-control
            human-one-music__scene-control--next
          "
          onClick={handleNext}
          aria-label={
            radioMode
              ? t("music.player.nextRadioStation")
              : t("music.player.nextTrack")
          }
        >
          <img
            src="/images/human-one/music/music-next-button.webp"
            alt=""
            draggable="false"
          />
        </button>


        {/* =====================================
            LCD
            ===================================== */}

        <div className="human-one-music__lcd">
          <p className="human-one-music__lcd-status">
            {radioMode
              ? localizeMusicLabel(radioError) ||
                `${t("music.player.radio")} • ${stationBandLabel}`
              : playerError
                ? localizeMusicLabel(playerError)
                : currentTrack
                  ? localizeMusicLabel(currentTrack.sourceLabel)
                  : t("music.player.brand")}
          </p>

          {radioMode ? (
            <div className="human-one-music__lcd-body">
              <div className="human-one-music__lcd-track">
                <div className="human-one-music__lcd-song">
                  <strong>
                    {currentStation.name}
                  </strong>

                  {radioNowPlaying ? (
                    <div className="human-one-music__lcd-radio-now">
                      {radioNowPlaying.artist && (
                        <span className="human-one-music__lcd-radio-artist">
                          {radioNowPlaying.artist}
                        </span>
                      )}

                      <span className="human-one-music__lcd-radio-title">
                        {radioNowPlaying.title ||
                          radioNowPlaying.raw ||
                          radioNowPlaying.artist}
                      </span>
                    </div>
                  ) : (
                    <span>
                      {localizeMusicLabel(
                        currentStation.location
                      )}
                    </span>
                  )}
                </div>

                <div className="human-one-music__lcd-live">
                  {radioPlaying
                    ? t("music.player.live")
                    : t("music.player.paused")}
                </div>
              </div>

              <div
                className={`
                  human-one-music__lcd-equalizer
                  is-visible
                  is-reactive
                  ${
                    radioPlaying
                      ? "is-playing"
                      : "is-paused"
                  }
                `}
                data-spectrum-mode={equalizerMode}
                aria-hidden="true"
              >
                {EQUALIZER_BARS.map((bar, index) => (
                  <span
                    key={index}
                    style={{
                      "--eq-level":
                        equalizerLevels[index] ?? 0.1,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : currentTrack ? (
            <div className="human-one-music__lcd-body">
              <div className="human-one-music__lcd-track">
                <div
                  key={`${currentTrack.source}-${currentTrack.id}-${lcdIndex}`}
                  className="human-one-music__lcd-song"
                >
                  <strong>
                    {currentTrack.title}
                  </strong>

                  <span>
                    {currentTrack.artist ||
                      t("music.player.unknownArtist")}
                  </span>
                </div>

                {playbackStarted && (
                  <div className="human-one-music__lcd-time">
                    <span>
                      {formatTime(currentTime)}
                    </span>

                    <span>/</span>

                    <span>
                      {formatTime(duration)}
                    </span>
                  </div>
                )}
              </div>

              <div
                className={`
                  human-one-music__lcd-equalizer
                  is-reactive
                  ${
                    playbackStarted
                      ? "is-visible"
                      : ""
                  }
                  ${
                    isPlaying
                      ? "is-playing"
                      : "is-paused"
                  }
                `}
                data-spectrum-mode={equalizerMode}
                aria-hidden="true"
              >
                {EQUALIZER_BARS.map((bar, index) => (
                  <span
                    key={index}
                    style={{
                      "--eq-level":
                        equalizerLevels[index] ?? 0.1,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="human-one-music__lcd-song">
              <strong>
                {lcdLoaded
                  ? t("music.player.noTracks")
                  : t("music.player.loadingCollection")}
              </strong>

              <span>
                {t("music.player.brand")}
              </span>
            </div>
          )}
        </div>


        {/* =====================================
            ČITAJ
            ===================================== */}

        {musicReturnPath && (
          <div
            className="
              human-one-music__mini-control
              human-one-music__mini-control--read
            "
          >
            <img
              className="human-one-music__mini-frame"
              src="/images/human-one/music/music-mini-frame.webp"
              alt=""
              draggable="false"
              aria-hidden="true"
            />

            <Link
              to={musicReturnPath}
              state={musicReturnState}
              className="human-one-music__mini-button"
              onClick={playUiSelect}
              aria-label={
                localizeMusicLabel(musicReturnLabel)
              }
              title={
                localizeMusicLabel(musicReturnLabel)
              }
            >
              <img
                src="/images/human-one/music/music-read-button.webp"
                alt=""
                draggable="false"
              />
            </Link>
          </div>
        )}


        {/* =====================================
            AUTOPLAY
            ===================================== */}

        <div
          className="
            human-one-music__mini-control
            human-one-music__mini-control--autoplay
          "
        >
          <img
            className="human-one-music__mini-frame"
            src="/images/human-one/music/music-mini-frame.webp"
            alt=""
            draggable="false"
            aria-hidden="true"
          />

          <button
            type="button"
            className="human-one-music__mini-button"
            onClick={handleAutoplayToggle}
            aria-label={
              autoplayEnabled
                ? t("music.player.disableAutoplay")
                : t("music.player.enableAutoplay")
            }
            aria-pressed={autoplayEnabled}
          >
            <img
              src={
                autoplayEnabled
                  ? "/images/human-one/music/music-autoplay-button-on.webp"
                  : "/images/human-one/music/music-autoplay-button.webp"
              }
              alt=""
              draggable="false"
            />
          </button>
        </div>


        {/* =====================================
            RADIO
            ===================================== */}

        <button
          type="button"
          className={`
            human-one-music__scene-control
            human-one-music__scene-control--radio
            ${
              radioMode
                ? "is-active"
                : ""
            }
          `}
          onClick={handleRadioToggle}
          aria-label={
            radioMode
              ? t("music.player.turnOffRadio")
              : t("music.player.turnOnRadio")
          }
        >
          <img
            src="/images/human-one/music/music-radio-button.webp"
            alt=""
            draggable="false"
          />

          <span
            className="human-one-music__radio-light"
            aria-hidden="true"
          />
        </button>


        {/* =====================================
            GLASNOĆA
            ===================================== */}

        <button
          type="button"
          role="slider"
          className="
            human-one-music__scene-control
            human-one-music__scene-control--volume
            human-one-music__scene-knob
          "
          aria-label={t("music.player.volume")}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={volume}
          aria-valuetext={`${volume}%`}
          title={t("music.player.volumeHint")}
          onPointerDown={handleVolumePointerDown}
          onPointerMove={handleVolumePointerMove}
          onPointerUp={handleVolumePointerUp}
          onPointerCancel={handleVolumePointerUp}
          onWheel={handleVolumeWheel}
          onKeyDown={handleVolumeKeyDown}
        >
          <img
            src="/images/human-one/music/music-volume-knob.webp"
            alt=""
            draggable="false"
            style={{
              "--knob-angle": `${volumeAngle}deg`,
            }}
          />
        </button>


        {/* =====================================
            RADIO STANICA
            ===================================== */}

        <button
          type="button"
          role="slider"
          className="
            human-one-music__scene-control
            human-one-music__scene-control--station
            human-one-music__scene-knob
          "
          aria-label={t("music.player.selectStation")}
          aria-valuemin="0"
          aria-valuemax={RADIO_STATIONS.length - 1}
          aria-valuenow={stationIndex}
          aria-valuetext={
            `${currentStation.name}, ${stationBandLabel}`
          }
          title={t("music.player.stationHint")}
          onPointerDown={handleStationPointerDown}
          onPointerMove={handleStationPointerMove}
          onPointerUp={handleStationPointerUp}
          onPointerCancel={handleStationPointerUp}
          onWheel={handleStationWheel}
          onKeyDown={handleStationKeyDown}
        >
          <img
            src="/images/human-one/music/music-station-knob.webp"
            alt=""
            draggable="false"
            style={{
              "--knob-angle": `${stationAngle}deg`,
            }}
          />
        </button>


        {/* =====================================
            PLAY / PAUSE
            ===================================== */}

        <button
          type="button"
          className="
            human-one-music__scene-control
            human-one-music__scene-control--play
          "
          onClick={handlePlayPause}
          aria-label={
            activePlayback
              ? t("music.player.pause")
              : t("music.player.play")
          }
        >
          <img
            className={`
              human-one-music__play-image
              ${
                activePlayback
                  ? "human-one-music__play-image--pause"
                  : ""
              }
            `}
            src={
              activePlayback
                ? "/images/human-one/music/music-pause-button.webp"
                : "/images/human-one/music/music-play-button.webp"
            }
            alt=""
            draggable="false"
          />
        </button>


        {/* =====================================
            PREPORUKE
            ===================================== */}

        <Link
          to="/autor/covek/muzika/preporuke"
          className="
            human-one-music__shop-object
            human-one-music__shop-object--recommendations
          "
          onClick={playUiSelect}
          aria-label={t("music.recommendations")}
        >
          <picture>
            <source
              media="(max-width: 767px) and (orientation: portrait)"
              srcSet="/images/human-one/music/mobile/music-recommendations-mobile.webp"
            />

            <img
              src="/images/human-one/music/music-recommendations-shelf.webp"
              alt=""
              draggable="false"
            />
          </picture>
        </Link>


        {/* =====================================
            PREVODI I ANALIZE
            ===================================== */}

        <Link
          to="/autor/covek/muzika/analize"
          className="
            human-one-music__shop-object
            human-one-music__shop-object--analyses
          "
          onClick={playUiSelect}
          aria-label={
            t("music.player.translationsAndAnalyses")
          }
        >
          <picture>
            <source
              media="(max-width: 767px) and (orientation: portrait)"
              srcSet="/images/human-one/music/mobile/music-analyses-mobile.webp"
            />

            <img
              src="/images/human-one/music/music-analyses-desk.webp"
              alt=""
              draggable="false"
            />
          </picture>
        </Link>
      </div>
    </main>
  );
}


export default HumanOneMusicView;