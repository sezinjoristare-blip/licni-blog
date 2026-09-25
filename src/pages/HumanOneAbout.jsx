import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  startAboutPosterExitTransition,
} from "../transitions/aboutPosterTransition.js";

import "../styles/HumanOneAbout.css";


const ABOUT_SECTIONS = [
  {
    key:
      "sudbina",

    title:
      "СУДБИНА",

    image:
      "/images/human-one/about/fate.webp",

    className:
      "human-one-about__sticker--fate",
  },

  {
    key:
      "licni-principi",

    title:
      "ЛИЧНИ ПРИНЦИПИ",

    image:
      "/images/human-one/about/principles.webp",

    className:
      "human-one-about__sticker--principles",
  },

  {
    key:
      "zelje",

    title:
      "ЖЕЉЕ",

    image:
      "/images/human-one/about/desires.webp",

    className:
      "human-one-about__sticker--desires",
  },

  {
    key:
      "put",

    title:
      "ПУТ",

    image:
      "/images/human-one/about/path.webp",

    className:
      "human-one-about__sticker--path",
  },

  {
    key:
      "filozofija",

    title:
      "ФИЛОЗОФИЈА",

    image:
      "/images/human-one/about/philosophy.webp",

    className:
      "human-one-about__sticker--philosophy",
  },
];


function HumanOneAbout() {
  const navigate =
    useNavigate();


  function handleBackToRoom() {
    const sourceElement =
      document.querySelector(
        '[data-about-poster-transition-target="map-profile-poster"]'
      );


    startAboutPosterExitTransition({
      sourceElement,

      navigate: () => {
        navigate(
          "/autor/covek"
        );
      },
    });
  }


  return (
    <main className="human-one-about">
      <section className="human-one-about__world">
        <picture className="human-one-about__map-picture">
          <source
            media="(max-width: 700px)"
            srcSet="/images/human-one/about/about-map-mobile.webp"
          />

          <img
            className="human-one-about__map"
            src="/images/human-one/about/about-map-desktop.webp"
            alt=""
            draggable="false"
          />
        </picture>


        <div
          className="human-one-about__map-shade"
          aria-hidden="true"
        />


        <button
          type="button"
          className="human-one-about__back"
          onClick={
            handleBackToRoom
          }
        >
          ← НАЗАД У СОБУ
        </button>


        <div
          className="human-one-about__profile-poster-anchor"
          data-about-poster-transition-target="map-profile-poster"
          aria-hidden="true"
        >
          <img
            className="human-one-about__profile-poster-sticker"
            src="/images/human-one/about/unwanted-sticker.webp"
            alt=""
            draggable="false"
          />
        </div>


        <nav
          className="human-one-about__stickers"
          aria-label="О мени — избор теме"
        >
          {ABOUT_SECTIONS.map(
            (section) => (
              <Link
                key={
                  section.key
                }
                to={
                  `/autor/covek/o-meni/${section.key}`
                }
                className={`human-one-about__sticker ${section.className}`}
                aria-label={
                  section.title
                }
              >
                <img
                  src={
                    section.image
                  }
                  alt=""
                  draggable="false"
                />

                <span className="human-one-about__sticker-label">
                  {section.title}
                </span>
              </Link>
            )
          )}
        </nav>
      </section>
    </main>
  );
}


export default HumanOneAbout;