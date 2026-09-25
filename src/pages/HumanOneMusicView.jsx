import {
  Link,
} from "react-router-dom";

import {
  playUiBack,
  playUiSelect,
} from "../audio/uiSounds";

import {
  EQUALIZER_BARS,
  RADIO_STATIONS,
  formatTime,
} from "./HumanOneMusicCore";


function HumanOneMusicView({
  controller,
}) {
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
  } =
    controller;

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
          onClick={
            playUiBack
          }
          aria-label="Назад у собу"
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
          onClick={
            handlePrevious
          }
          aria-label={
            radioMode
              ? "Претходна радио станица"
              : "Претходна песма"
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
          onClick={
            handleNext
          }
          aria-label={
            radioMode
              ? "Следећа радио станица"
              : "Следећа песма"
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
              ? radioError ||
                `РАДИО • ${stationBandLabel}`
              : playerError
                ? playerError
                : currentTrack
                  ? currentTrack
                      .sourceLabel
                  : "SEKI / ЗВУЧНИК"}
          </p>


          {radioMode ? (
            <div className="human-one-music__lcd-body">
              <div className="human-one-music__lcd-track">
                <div className="human-one-music__lcd-song">
                  <strong>
                    {
                      currentStation.name
                    }
                  </strong>

                  {
                    radioNowPlaying
                      ? (
                          <div className="human-one-music__lcd-radio-now">
                            {
                              radioNowPlaying.artist && (
                                <span className="human-one-music__lcd-radio-artist">
                                  {
                                    radioNowPlaying.artist
                                  }
                                </span>
                              )
                            }

                            <span className="human-one-music__lcd-radio-title">
                              {
                                radioNowPlaying.title ||
                                radioNowPlaying.raw ||
                                radioNowPlaying.artist
                              }
                            </span>
                          </div>
                        )
                      : (
                          <span>
                            {
                              currentStation.location
                            }
                          </span>
                        )
                  }
                </div>


                <div className="human-one-music__lcd-live">
                  {radioPlaying
                    ? "УЖИВО"
                    : "ПАУЗА"}
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
                data-spectrum-mode={
                  equalizerMode
                }
                aria-hidden="true"
              >
                {EQUALIZER_BARS.map(
                  (
                    bar,
                    index
                  ) => (
                    <span
                      key={
                        index
                      }
                      style={{
                        "--eq-level":
                          equalizerLevels[
                            index
                          ] ??
                          0.1,
                      }}
                    />
                  )
                )}
              </div>
            </div>

          ) : currentTrack ? (
            <div className="human-one-music__lcd-body">
              <div className="human-one-music__lcd-track">
                <div
                  key={
                    `${currentTrack.source}-${currentTrack.id}-${lcdIndex}`
                  }
                  className="human-one-music__lcd-song"
                >
                  <strong>
                    {
                      currentTrack.title
                    }
                  </strong>

                  <span>
                    {
                      currentTrack.artist ||
                      "НЕПОЗНАТ ИЗВОЂАЧ"
                    }
                  </span>
                </div>


                {playbackStarted && (
                  <div className="human-one-music__lcd-time">
                    <span>
                      {
                        formatTime(
                          currentTime
                        )
                      }
                    </span>

                    <span>
                      /
                    </span>

                    <span>
                      {
                        formatTime(
                          duration
                        )
                      }
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
                data-spectrum-mode={
                  equalizerMode
                }
                aria-hidden="true"
              >
                {EQUALIZER_BARS.map(
                  (
                    bar,
                    index
                  ) => (
                    <span
                      key={
                        index
                      }
                      style={{
                        "--eq-level":
                          equalizerLevels[
                            index
                          ] ??
                          0.1,
                      }}
                    />
                  )
                )}
              </div>
            </div>

          ) : (
            <div className="human-one-music__lcd-song">
              <strong>
                {lcdLoaded
                  ? "ЈОШ НЕМА ПЕСАМА"
                  : "УЧИТАВАМ КОЛЕКЦИЈУ..."}
              </strong>

              <span>
                SEKI / ЗВУЧНИК
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
              to={
                musicReturnPath
              }
              state={
                musicReturnState
              }
              className="human-one-music__mini-button"
              onClick={
                playUiSelect
              }
              aria-label={
                musicReturnLabel
              }
              title={
                musicReturnLabel
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
            onClick={
              handleAutoplayToggle
            }
            aria-label={
              autoplayEnabled
                ? "Искључи аутоплеј"
                : "Укључи аутоплеј"
            }
            aria-pressed={
              autoplayEnabled
            }
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
          onClick={
            handleRadioToggle
          }
          aria-label={
            radioMode
              ? "Искључи радио"
              : "Укључи радио"
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
          aria-label="Гласноћа"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={
            volume
          }
          aria-valuetext={
            `${volume}%`
          }
          title="Превуци горе/доле или користи точкић миша"
          onPointerDown={
            handleVolumePointerDown
          }
          onPointerMove={
            handleVolumePointerMove
          }
          onPointerUp={
            handleVolumePointerUp
          }
          onPointerCancel={
            handleVolumePointerUp
          }
          onWheel={
            handleVolumeWheel
          }
          onKeyDown={
            handleVolumeKeyDown
          }
        >
          <img
            src="/images/human-one/music/music-volume-knob.webp"
            alt=""
            draggable="false"
            style={{
              "--knob-angle":
                `${volumeAngle}deg`,
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
          aria-label="Избор радио станице"
          aria-valuemin="0"
          aria-valuemax={
            RADIO_STATIONS.length -
            1
          }
          aria-valuenow={
            stationIndex
          }
          aria-valuetext={
            `${currentStation.name}, ${stationBandLabel}`
          }
          title="Превуци горе/доле, кликни или користи точкић миша"
          onPointerDown={
            handleStationPointerDown
          }
          onPointerMove={
            handleStationPointerMove
          }
          onPointerUp={
            handleStationPointerUp
          }
          onPointerCancel={
            handleStationPointerUp
          }
          onWheel={
            handleStationWheel
          }
          onKeyDown={
            handleStationKeyDown
          }
        >
          <img
            src="/images/human-one/music/music-station-knob.webp"
            alt=""
            draggable="false"
            style={{
              "--knob-angle":
                `${stationAngle}deg`,
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
          onClick={
            handlePlayPause
          }
          aria-label={
            activePlayback
              ? "Паузирај"
              : "Пусти"
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
          onClick={
            playUiSelect
          }
          aria-label="Препоруке"
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
          onClick={
            playUiSelect
          }
          aria-label="Преводи и анализе"
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