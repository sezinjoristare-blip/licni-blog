import {
  useNavigate,
} from "react-router-dom";

import "../styles/pages/DevilRoom.css";


function DevilRoom() {
  const navigate =
    useNavigate();


  function openDevilAbout() {
    navigate(
      "/autor/djavo/o-meni",
      {
        viewTransition: true,
      },
    );
  }


  function openDevilTexts() {
    navigate(
      "/autor/djavo/tekstovi",
      {
        viewTransition: true,
      },
    );
  }


  function openDevilTalks() {
    navigate(
      "/autor/djavo/razgovori",
      {
        viewTransition: true,
      },
    );
  }


  return (
    <main className="devil-room">
      <div className="devil-room__artboard">
        {/* POZADINA */}

        <img
          className="devil-room__background"
          src="/images/devil/devil-room.png"
          alt=""
        />


        {/* ĐAVO — O MENI */}

        <button
          type="button"
          className="
            devil-room__hotspot
            devil-room__hotspot--character
          "
          onClick={
            openDevilAbout
          }
          aria-label="O Đavolu"
        >
          <img
            className="
              devil-room__clickable-image
              devil-room__clickable-image--character
            "
            src="/images/devil/devil-character.png"
            alt=""
          />

          <span
            className="devil-room__edge-particles"
            aria-hidden="true"
          >
            <i className="devil-particle devil-particle--1" />
            <i className="devil-particle devil-particle--2" />
            <i className="devil-particle devil-particle--3" />
            <i className="devil-particle devil-particle--4" />
            <i className="devil-particle devil-particle--5" />
            <i className="devil-particle devil-particle--6" />
            <i className="devil-particle devil-particle--7" />
            <i className="devil-particle devil-particle--8" />
            <i className="devil-particle devil-particle--9" />
            <i className="devil-particle devil-particle--10" />
          </span>
        </button>


        {/* MALI DEMON — TEKSTOVI */}

        <button
          type="button"
          className="
            devil-room__hotspot
            devil-room__hotspot--demon
          "
          onClick={
            openDevilTexts
          }
          aria-label="Đavolovi tekstovi"
        >
          <img
            className="
              devil-room__clickable-image
              devil-room__clickable-image--demon
            "
            src="/images/devil/devil-demon.png"
            alt=""
          />
        </button>


        {/* IZGUBLJENE DUŠE — RAZGOVORI */}

        <button
          type="button"
          className="
            devil-room__hotspot
            devil-room__hotspot--souls
          "
          onClick={
            openDevilTalks
          }
          aria-label="Razgovori izgubljenih duša"
        >
          <img
            className="
              devil-room__clickable-image
              devil-room__clickable-image--souls
            "
            src="/images/devil/devil-souls.png"
            alt=""
          />
        </button>
      </div>
    </main>
  );
}

export default DevilRoom;