const SOUND_STORAGE_KEY =
  "licni-blog-sfx-enabled";

let audioContext = null;


function getAudioContext() {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const AudioContextClass =
    window.AudioContext ||
    window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext =
      new AudioContextClass();
  }

  return audioContext;
}


export function getStoredSoundEnabled() {
  if (
    typeof window === "undefined"
  ) {
    return true;
  }

  return (
    window.localStorage.getItem(
      SOUND_STORAGE_KEY,
    ) !== "off"
  );
}


export function setStoredSoundEnabled(
  enabled,
) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  window.localStorage.setItem(
    SOUND_STORAGE_KEY,
    enabled
      ? "on"
      : "off",
  );
}


export async function playEnterSound() {
  if (!getStoredSoundEnabled()) {
    return;
  }

  const context =
    getAudioContext();

  if (!context) {
    return;
  }

  if (
    context.state === "suspended"
  ) {
    await context.resume();
  }

  const now =
    context.currentTime;


  /* GLAVNI IZLAZ */

  const master =
    context.createGain();

  master.gain.setValueAtTime(
    0.0001,
    now,
  );

  master.gain.exponentialRampToValueAtTime(
    0.16,
    now + 0.008,
  );

  master.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.38,
  );

  master.connect(
    context.destination,
  );


  /* DUBOKI ARCADE UDAR */

  const bass =
    context.createOscillator();

  const bassGain =
    context.createGain();

  bass.type =
    "sawtooth";

  bass.frequency.setValueAtTime(
    125,
    now,
  );

  bass.frequency.exponentialRampToValueAtTime(
    44,
    now + 0.28,
  );

  bassGain.gain.setValueAtTime(
    0.32,
    now,
  );

  bassGain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.3,
  );

  bass.connect(
    bassGain,
  );

  bassGain.connect(
    master,
  );

  bass.start(now);
  bass.stop(
    now + 0.31,
  );


  /* DIGITALNI KLIK */

  const click =
    context.createOscillator();

  const clickGain =
    context.createGain();

  click.type =
    "square";

  click.frequency.setValueAtTime(
    580,
    now,
  );

  click.frequency.exponentialRampToValueAtTime(
    150,
    now + 0.09,
  );

  clickGain.gain.setValueAtTime(
    0.11,
    now,
  );

  clickGain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.1,
  );

  click.connect(
    clickGain,
  );

  clickGain.connect(
    master,
  );

  click.start(now);
  click.stop(
    now + 0.11,
  );


  /* KRATAK ŠUM */

  const noiseLength =
    Math.floor(
      context.sampleRate *
        0.13,
    );

  const noiseBuffer =
    context.createBuffer(
      1,
      noiseLength,
      context.sampleRate,
    );

  const noiseData =
    noiseBuffer.getChannelData(
      0,
    );

  for (
    let index = 0;
    index < noiseLength;
    index += 1
  ) {
    noiseData[index] =
      (
        Math.random() *
        2
      ) -
      1;
  }

  const noise =
    context.createBufferSource();

  const noiseFilter =
    context.createBiquadFilter();

  const noiseGain =
    context.createGain();

  noise.buffer =
    noiseBuffer;

  noiseFilter.type =
    "lowpass";

  noiseFilter.frequency.value =
    1400;

  noiseGain.gain.setValueAtTime(
    0.09,
    now,
  );

  noiseGain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.13,
  );

  noise.connect(
    noiseFilter,
  );

  noiseFilter.connect(
    noiseGain,
  );

  noiseGain.connect(
    master,
  );

  noise.start(now);
}
export async function playCourtGavelSound() {
  if (!getStoredSoundEnabled()) {
    return;
  }

  const context =
    getAudioContext();

  if (!context) {
    return;
  }

  if (
    context.state === "suspended"
  ) {
    await context.resume();
  }

  const now =
    context.currentTime;


  /*
   * Veoma tih, mekan udar drveta.
   *
   * Nije presuda.
   * Samo početak suđenja.
   */

  const master =
    context.createGain();

  master.gain.setValueAtTime(
    0.0001,
    now,
  );

  master.gain.exponentialRampToValueAtTime(
    0.07,
    now + 0.006,
  );

  master.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.22,
  );

  master.connect(
    context.destination,
  );


  const knock =
    context.createOscillator();

  const knockGain =
    context.createGain();

  knock.type =
    "sine";

  knock.frequency.setValueAtTime(
    115,
    now,
  );

  knock.frequency.exponentialRampToValueAtTime(
    72,
    now + 0.15,
  );

  knockGain.gain.setValueAtTime(
    0.15,
    now,
  );

  knockGain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.18,
  );

  knock.connect(
    knockGain,
  );

  knockGain.connect(
    master,
  );

  knock.start(now);

  knock.stop(
    now + 0.19,
  );


  /*
   * Vrlo malo drvenog šuma.
   */

  const noiseLength =
    Math.floor(
      context.sampleRate *
        0.055,
    );

  const noiseBuffer =
    context.createBuffer(
      1,
      noiseLength,
      context.sampleRate,
    );

  const data =
    noiseBuffer.getChannelData(
      0,
    );

  for (
    let index = 0;
    index < noiseLength;
    index += 1
  ) {
    data[index] =
      Math.random() * 2 - 1;
  }

  const noise =
    context.createBufferSource();

  const filter =
    context.createBiquadFilter();

  const noiseGain =
    context.createGain();

  noise.buffer =
    noiseBuffer;

  filter.type =
    "lowpass";

  filter.frequency.value =
    650;

  noiseGain.gain.setValueAtTime(
    0.035,
    now,
  );

  noiseGain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.055,
  );

  noise.connect(filter);

  filter.connect(
    noiseGain,
  );

  noiseGain.connect(
    master,
  );

  noise.start(now);
}