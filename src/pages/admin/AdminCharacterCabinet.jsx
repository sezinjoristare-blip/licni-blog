import {
  Link,
  Navigate,
  useParams,
} from "react-router-dom";

import {
  useBlog,
} from "../../context/BlogContext";

import "../../styles/admin/AdminCharacters.css";


const VALID_CHARACTERS = [
  "covek-1",
  "covek-2",
];


function AdminCharacterCabinet() {
  const {
    characterKey,
  } = useParams();


  const {
    siteSettings,
  } = useBlog();


  if (
    !VALID_CHARACTERS.includes(
      characterKey
    )
  ) {
    return (
      <Navigate
        to="/admin/likovi"
        replace
      />
    );
  }


  const isCharacterOne =
    characterKey ===
    "covek-1";


  const characterName =
    isCharacterOne
      ? (
          siteSettings
            .character_one_name ||
          "ЧОВЕК 1"
        )
      : (
          siteSettings
            .character_two_name ||
          "ЧОВЕК 2"
        );


  const characterImage =
    isCharacterOne
      ? (
          siteSettings
            .character_one_image_url ||
          siteSettings
            .entry_image_url ||
          ""
        )
      : (
          siteSettings
            .character_two_image_url ||
          ""
        );


  const baseCards = [
    {
      key:
        "identitet",

      group:
        "osnova",

      number:
        "01",

      eyebrow:
        "ОСНОВА",

      title:
        "ИДЕНТИТЕТ",

      description:
        "Име, фотографија и основни подаци лика.",

      to:
        `/admin/likovi/${characterKey}/identitet`,

      preview:
        characterImage,
    },

    {
      key:
        "o-meni",

      group:
        "osnova",

      number:
        "02",

      eyebrow:
        "ОСНОВА",

      title:
        "О МЕНИ",

      description:
        "Унутрашњи свет, биографија и лични текстови.",

      to:
        `/admin/likovi/${characterKey}/o-meni`,

      preview:
        isCharacterOne
          ? "/images/human-one/profile-poster.png"
          : characterImage,
    },

    {
      key:
        "soba",

      group:
        "osnova",

      number:
        "03",

      eyebrow:
        "ОСНОВА",

      title:
        "СОБА",

      description:
        "Изглед собе, сценографија и интерактивни предмети.",

      to:
        `/admin/likovi/${characterKey}/soba`,

      preview:
        isCharacterOne
          ? "/images/human-one/room-bg.png"
          : characterImage,
    },

    {
      key:
        "muzika",

      group:
        "sadrzaj",

      number:
        "04",

      eyebrow:
        "САДРЖАЈ",

      title:
        "МУЗИКА",

      description:
        "Жанрови, препоруке, анализе, преводи и радио.",

      to:
        `/admin/likovi/${characterKey}/muzika`,

      preview:
        isCharacterOne
          ? "/images/human-one/boombox.png"
          : characterImage,
    },

    {
      key:
        "tekstovi",

      group:
        "sadrzaj",

      number:
        "05",

      eyebrow:
        "САДРЖАЈ",

      title:
        "ТЕКСТОВИ",

      description:
        "Постери, категорије, текстови, PDF радови и reader.",

      to:
        `/admin/likovi/${characterKey}/tekstovi`,

      preview:
        isCharacterOne
          ? "/images/human-one/posters.png"
          : characterImage,
    },

    ...(isCharacterOne
      ? [
          {
            key:
              "doskocice",

            group:
              "sadrzaj",

            number:
              "06",

            eyebrow:
              "САДРЖАЈ",

            title:
              "БРЗЕ ДОСКОЧИЦЕ",

            description:
              "Кратке мисли и досетке са сата у соби.",

            to:
              `/admin/likovi/${characterKey}/doskocice`,

            preview:
              "/images/human-one/digital-clock.png",
          },
        ]
      : []),
  ];


  const characterOneCards =
    isCharacterOne
      ? [
          {
            key:
              "skejt",

            group:
              "svetovi",

            number:
              "07",

            eyebrow:
              "СВЕТ",

            title:
              "СКЕЈТ",

            description:
              "Вожња, екипа, догодовштине, графити и street архива.",

            to:
              `/admin/likovi/${characterKey}/skejt`,

            preview:
              "/images/human-one/skateboard.png",
          },

          {
            key:
              "obala-sveska",

            group:
              "svetovi",

            number:
              "08",

            eyebrow:
              "АКЦ ОБАЛА",

            title:
              "ОБАЛА — СВЕСКА",

            description:
              "Текстови, медији и део „Шта ме је инспирисало?“.",

            to:
              `/admin/likovi/${characterKey}/obala-sveska`,

            preview:
              "/images/human-one/obala/obala-notebook.png",
          },

          {
            key:
              "obala-pano",

            group:
              "svetovi",

            number:
              "09",

            eyebrow:
              "АКЦ ОБАЛА",

            title:
              "ОБАЛА — ПАНО",

            description:
              "Догађаји, постери, рокови, reader блокови и архива.",

            to:
              `/admin/likovi/${characterKey}/obala-pano`,

            preview:
              "/images/human-one/obala/obala-board.png",
          },
        ]
      : [];


  const cards = [
    ...baseCards,
    ...characterOneCards,
  ];


  const groups = [
    {
      key:
        "osnova",

      index:
        "I",

      title:
        "Основа лика",

      description:
        "Идентитет, лични текстови и простор у ком лик живи.",
    },

    {
      key:
        "sadrzaj",

      index:
        "II",

      title:
        "Садржај",

      description:
        "Материјал који читалац отвара, чита, слуша и истражује.",
    },

    ...(isCharacterOne
      ? [
          {
            key:
              "svetovi",

            index:
              "III",

            title:
              "Светови",

            description:
              "Веће интерактивне целине које имају сопствене архиве и правила.",
          },
        ]
      : []),
  ];


  return (
    <section className="admin-character-cabinet">
      <Link
        to="/admin/likovi"
        className="admin-characters__back"
      >
        ← ЛИКОВИ
      </Link>


      <header className="admin-character-cabinet__hero">
        <div className="admin-character-cabinet__portrait-wrap">
          {characterImage ? (
            <img
              className="admin-character-cabinet__portrait"
              src={
                characterImage
              }
              alt=""
            />
          ) : (
            <div className="admin-character-cabinet__portrait-fallback">
              {isCharacterOne
                ? "01"
                : "02"}
            </div>
          )}


          <div
            className="admin-character-cabinet__portrait-index"
            aria-hidden="true"
          >
            {isCharacterOne
              ? "01"
              : "02"}
          </div>
        </div>


        <div className="admin-character-cabinet__hero-copy">
          <p className="eyebrow">
            {isCharacterOne
              ? "ЧОВЕК 1 / КАБИНЕТ"
              : "ЧОВЕК 2 / КАБИНЕТ"}
          </p>


          <h1>
            {characterName}
          </h1>


          <p className="admin-character-cabinet__lead">
            Изабери област коју
            желиш да уређујеш.
            Свака целина има свој
            садржај, архиву и
            подешавања.
          </p>


          <div className="admin-character-cabinet__meta">
            <span className="admin-badge admin-badge--accent">
              {cards.length}
              {" "}
              СЕКЦИЈА
            </span>


            <span className="admin-badge admin-badge--success">
              АКТИВАН
            </span>


            {isCharacterOne ? (
              <span className="admin-badge">
                ГЛАВНИ ЛИК
              </span>
            ) : (
              <span className="admin-badge admin-badge--draft">
                У РАЗВОЈУ
              </span>
            )}
          </div>
        </div>


        <div
          className="admin-character-cabinet__hero-mark"
          aria-hidden="true"
        >
          <small>
            CHARACTER
          </small>

          <strong>
            {isCharacterOne
              ? "01"
              : "02"}
          </strong>

          <span>
            FILE
          </span>
        </div>
      </header>


      <div className="admin-character-cabinet__groups">
        {groups.map(
          (
            group
          ) => {
            const groupCards =
              cards.filter(
                (
                  card
                ) =>
                  card.group ===
                  group.key
              );


            if (
              !groupCards.length
            ) {
              return null;
            }


            return (
              <section
                key={
                  group.key
                }
                className="admin-character-cabinet__group"
              >
                <header className="admin-character-cabinet__group-heading">
                  <div className="admin-character-cabinet__group-index">
                    {group.index}
                  </div>


                  <div>
                    <h2>
                      {group.title}
                    </h2>

                    <p>
                      {group.description}
                    </p>
                  </div>
                </header>


                <div className="admin-character-options">
                  {groupCards.map(
                    (
                      card
                    ) => (
                      <Link
                        key={
                          card.key
                        }
                        to={
                          card.to
                        }
                        className="admin-character-option"
                      >
                        <div className="admin-character-option__preview">
                          {card.preview ? (
                            <img
                              src={
                                card.preview
                              }
                              alt=""
                            />
                          ) : (
                            <div className="admin-character-option__fallback">
                              {card.number}
                            </div>
                          )}


                          <div
                            className="admin-character-option__shade"
                            aria-hidden="true"
                          />


                          <span className="admin-character-option__number">
                            {card.number}
                          </span>


                          <span className="admin-character-option__preview-label">
                            {card.title}
                          </span>
                        </div>


                        <div className="admin-character-option__body">
                          <div className="admin-character-option__body-top">
                            <p>
                              {card.eyebrow}
                            </p>

                            <span
                              aria-hidden="true"
                            >
                              ↗
                            </span>
                          </div>


                          <h3>
                            {card.title}
                          </h3>


                          <p className="admin-character-option__description">
                            {card.description}
                          </p>


                          <div className="admin-character-option__footer">
                            <span>
                              ОТВОРИ СЕКЦИЈУ
                            </span>

                            <span
                              aria-hidden="true"
                            >
                              →
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  )}
                </div>
              </section>
            );
          }
        )}
      </div>
    </section>
  );
}


export default AdminCharacterCabinet;