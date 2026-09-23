import {
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";

import useHumanOneMusicController
  from "../pages/useHumanOneMusicController";


const HumanOneMusicPlaybackContext =
  createContext(
    null
  );


function setMediaAction(
  action,
  handler
) {
  if (
    typeof navigator ===
      "undefined" ||
    !(
      "mediaSession" in
      navigator
    )
  ) {
    return;
  }


  try {
    navigator.mediaSession
      .setActionHandler(
        action,
        handler
      );
  } catch {
    // Neke Media Session akcije
    // nisu dostupne u svakom browseru.
  }
}


export function HumanOneMusicPlaybackProvider({
  children,
}) {
  /*
   * Jedan jedini globalni controller.
   *
   * Živi iznad Outlet-a i zato se ne gasi
   * pri promeni javnih stranica.
   */
  const controller =
    useHumanOneMusicController();


  /*
   * Uvek čuvamo najnoviju verziju controller-a
   * za Media Session handlere.
   */
  const latestControllerRef =
    useRef(
      controller
    );


  latestControllerRef.current =
    controller;


  /* =====================================================
     MEDIA SESSION KOMANDE

     Rade i za radio i za YouTube playback.
     ===================================================== */

  useEffect(
    () => {
      if (
        typeof navigator ===
          "undefined" ||
        !(
          "mediaSession" in
          navigator
        )
      ) {
        return undefined;
      }


      setMediaAction(
        "play",
        () => {
          const current =
            latestControllerRef
              .current;


          if (
            !current.activePlayback
          ) {
            current
              .handlePlayPause();
          }
        }
      );


      setMediaAction(
        "pause",
        () => {
          const current =
            latestControllerRef
              .current;


          if (
            current.activePlayback
          ) {
            current
              .handlePlayPause();
          }
        }
      );


      setMediaAction(
        "previoustrack",
        () => {
          latestControllerRef
            .current
            .handlePrevious();
        }
      );


      setMediaAction(
        "nexttrack",
        () => {
          latestControllerRef
            .current
            .handleNext();
        }
      );


      return () => {
        setMediaAction(
          "play",
          null
        );


        setMediaAction(
          "pause",
          null
        );


        setMediaAction(
          "previoustrack",
          null
        );


        setMediaAction(
          "nexttrack",
          null
        );
      };
    },
    []
  );


  /* =====================================================
     MEDIA SESSION METADATA
     ===================================================== */

  useEffect(
    () => {
      if (
        typeof navigator ===
          "undefined" ||
        typeof window ===
          "undefined" ||
        !(
          "mediaSession" in
          navigator
        )
      ) {
        return;
      }


      const mediaSession =
        navigator.mediaSession;


      let title =
        "";

      let artist =
        "";

      let album =
        "";


      if (
        controller.radioMode
      ) {
        title =
          controller
            .radioNowPlaying
            ?.title ||
          controller
            .radioNowPlaying
            ?.raw ||
          controller
            .currentStation
            ?.name ||
          "РАДИО";


        artist =
          controller
            .radioNowPlaying
            ?.artist ||
          controller
            .currentStation
            ?.location ||
          "";


        album =
          `SEKI / РАДИО • ${
            controller
              .stationBandLabel ||
            ""
          }`;

      } else if (
        controller.currentTrack
      ) {
        title =
          controller
            .currentTrack
            .title ||
          "SEKI / ЗВУЧНИК";


        artist =
          controller
            .currentTrack
            .artist ||
          "";


        album =
          controller
            .currentTrack
            .sourceLabel ||
          "SEKI / ЗВУЧНИК";
      }


      if (
        title &&
        "MediaMetadata" in
          window
      ) {
        try {
          mediaSession.metadata =
            new window.MediaMetadata({
              title,
              artist,
              album,
            });
        } catch {
          // Metadata nije uslov
          // za sam playback.
        }

      } else {
        try {
          mediaSession.metadata =
            null;
        } catch {
          // ignorišemo
        }
      }


      try {
        if (
          controller.activePlayback
        ) {
          mediaSession.playbackState =
            "playing";

        } else if (
          controller.playbackStarted ||
          controller.radioMode
        ) {
          mediaSession.playbackState =
            "paused";

        } else {
          mediaSession.playbackState =
            "none";
        }
      } catch {
        // Browser može da ignoriše
        // playbackState.
      }
    },
    [
      controller.radioMode,
      controller.radioPlaying,
      controller.radioNowPlaying,
      controller.currentStation,
      controller.stationBandLabel,
      controller.currentTrack,
      controller.playbackStarted,
      controller.activePlayback,
    ]
  );


  /* =====================================================
     POZICIJA YOUTUBE PESME
     ===================================================== */

  useEffect(
    () => {
      if (
        typeof navigator ===
          "undefined" ||
        !(
          "mediaSession" in
          navigator
        ) ||
        controller.radioMode ||
        !Number.isFinite(
          controller.duration
        ) ||
        controller.duration <=
          0
      ) {
        return;
      }


      try {
        navigator.mediaSession
          .setPositionState({
            duration:
              controller.duration,

            playbackRate:
              1,

            position:
              Math.min(
                Math.max(
                  Number.isFinite(
                    controller.currentTime
                  )
                    ? controller.currentTime
                    : 0,
                  0
                ),
                Math.max(
                  controller.duration -
                    0.01,
                  0
                )
              ),
          });
      } catch {
        // Nije podržano u svakom browseru.
      }
    },
    [
      controller.radioMode,
      controller.currentTime,
      controller.duration,
    ]
  );


  return (
    <HumanOneMusicPlaybackContext.Provider
      value={
        controller
      }
    >
      {/* =================================================
          JEDINI TRAJNI YOUTUBE HOST

          OVO JE KLJUČNA ISPRAVKA.

          Player više nije deo HumanOneMusicView-a.
          Zato promena rute ne uništava iframe.
          ================================================= */}

      <div
        aria-hidden="true"
        style={{
          position:
            "fixed",

          left:
            "-10000px",

          top:
            "-10000px",

          width:
            "200px",

          height:
            "200px",

          overflow:
            "hidden",

          pointerEvents:
            "none",
        }}
      >
        <div
          ref={
            controller.youtubeHostRef
          }
        />
      </div>


      {children}
    </HumanOneMusicPlaybackContext.Provider>
  );
}


export function useHumanOneMusicPlayback() {
  const context =
    useContext(
      HumanOneMusicPlaybackContext
    );


  if (
    !context
  ) {
    throw new Error(
      "useHumanOneMusicPlayback mora biti unutar HumanOneMusicPlaybackProvider-a."
    );
  }


  return context;
}


export default HumanOneMusicPlaybackContext;