const UI_SELECT_SOUND =
  "/audio/human-one/ui-select.m4a";

const UI_BACK_SOUND =
  "/audio/human-one/ui-back.m4a";


const UI_SELECT_VOLUME =
  0.58;

const UI_BACK_VOLUME =
  0.58;


/*
 * BACK zvuk preskače prvih 5 stotinki.
 *
 * Ako hoćeš kasnije još preciznije:
 *
 * 0.03 = 3 stotinke
 * 0.05 = 5 stotinki
 * 0.07 = 7 stotinki
 */
const UI_BACK_START_TIME =
  0.15;


let selectAudio =
  null;

let backAudio =
  null;


/* =====================================
   GLOBALNI SFX STATUS
   ===================================== */

function soundIsEnabled() {
  try {
    return (
      localStorage.getItem(
        "human-one-sound"
      ) !== "off"
    );
  } catch {
    return true;
  }
}


/* =====================================
   SELECT AUDIO
   ===================================== */

function getSelectAudio() {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }


  if (!selectAudio) {
    selectAudio =
      new Audio(
        UI_SELECT_SOUND
      );


    selectAudio.preload =
      "auto";


    selectAudio.volume =
      UI_SELECT_VOLUME;
  }


  return selectAudio;
}


/* =====================================
   BACK AUDIO
   ===================================== */

function getBackAudio() {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }


  if (!backAudio) {
    backAudio =
      new Audio(
        UI_BACK_SOUND
      );


    backAudio.preload =
      "auto";


    backAudio.volume =
      UI_BACK_VOLUME;
  }


  return backAudio;
}


/* =====================================
   PRELOAD
   ===================================== */

export function prepareUiSounds() {
  getSelectAudio()
    ?.load();


  getBackAudio()
    ?.load();
}


/* =====================================
   SELECT
   ===================================== */

export function playUiSelect() {
  if (!soundIsEnabled()) {
    return;
  }


  const audio =
    getSelectAudio();


  if (!audio) {
    return;
  }


  audio.pause();


  try {
    audio.currentTime =
      0;
  } catch {
    // Audio još nije spreman.
  }


  audio.volume =
    UI_SELECT_VOLUME;


  audio
    .play()
    .catch(
      () => {
        /*
         * Zvuk nikada ne sme
         * da blokira navigaciju.
         */
      }
    );
}


/* =====================================
   BACK
   ===================================== */

export function playUiBack() {
  if (!soundIsEnabled()) {
    return;
  }


  const audio =
    getBackAudio();


  if (!audio) {
    return;
  }


  audio.pause();


  try {
    /*
     * Ne krećemo baš od 0.
     *
     * Preskačemo prvih 0.05 s
     * da BACK deluje momentalnije.
     */
    audio.currentTime =
      UI_BACK_START_TIME;
  } catch {
    // Audio još nije spreman.
  }


  audio.volume =
    UI_BACK_VOLUME;


  audio
    .play()
    .catch(
      () => {
        /*
         * Zvuk nikada ne sme
         * da blokira navigaciju.
         */
      }
    );
}