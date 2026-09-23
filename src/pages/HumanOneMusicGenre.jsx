import {
  Navigate,
  useParams,
} from "react-router-dom";

import HumanOneMusicRadioDramas
  from "./HumanOneMusicRadioDramas";


function HumanOneMusicGenre() {
  const {
    genreSlug,
  } = useParams();


  if (
    genreSlug ===
    "radio-drame"
  ) {
    return (
      <HumanOneMusicRadioDramas />
    );
  }


  return (
    <Navigate
      to={
        `/autor/covek/muzika/preporuke/pesme?zanr=${encodeURIComponent(
          genreSlug || ""
        )}`
      }
      replace
    />
  );
}


export default HumanOneMusicGenre;