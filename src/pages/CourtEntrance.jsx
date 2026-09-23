import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "../styles/pages/CourtEntrance.css";


function CourtEntrance() {
  const navigate =
    useNavigate();

  const [
    isStarting,
    setIsStarting,
  ] = useState(false);


  function handleStartTrial() {
    if (isStarting) {
      return;
    }

    setIsStarting(true);

    /*
     * Čekić ostaje potpuno miran.
     *
     * Ostavljamo kratku pauzu
     * pre prelaska na izbor.
     */
    window.setTimeout(
      () => {
        navigate(
          "/izbor",
          {
            viewTransition: true,
          },
        );
      },
      260,
    );
  }


  return (
    <main className="court-entrance">
      {/* POZADINA */}

      <img
        className="court-entrance__background"
        src="/images/court-room.png"
        alt=""
      />


      {/* ČEKIĆ — POTPUNO MIRUJE */}

      <img
        className="court-entrance__gavel"
        src="/images/court-gavel.png"
        alt=""
      />


      {/* PAPIR — KLIKABILNI ELEMENT */}

      <button
        type="button"
        className="court-entrance__paper-button"
        onClick={
          handleStartTrial
        }
        disabled={
          isStarting
        }
        aria-label="Започни суђење"
      >
        <img
          className="court-entrance__paper"
          src="/images/court-paper.png"
          alt="Започни суђење"
        />
      </button>
    </main>
  );
}


export default CourtEntrance;