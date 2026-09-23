import {
  useHumanOneMusicPlayback,
} from "../context/HumanOneMusicPlaybackContext";

import HumanOneMusicView
  from "./HumanOneMusicView";

import "../styles/HumanOneMusic.css";


function HumanOneMusic() {
  const controller =
    useHumanOneMusicPlayback();


  return (
    <HumanOneMusicView
      controller={
        controller
      }
    />
  );
}


export default HumanOneMusic;
