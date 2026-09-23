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


const HUMAN_ONE_ABOUT_SECTIONS = [
  {
    key:
      "licni-principi",

    title:
      "ЛИЧНИ ПРИНЦИПИ",

    number:
      "01",
  },

  {
    key:
      "filozofija",

    title:
      "ФИЛОЗОФИЈА",

    number:
      "02",
  },

  {
    key:
      "sudbina",

    title:
      "СУДБИНА",

    number:
      "03",
  },

  {
    key:
      "put",

    title:
      "ПУТ",

    number:
      "04",
  },

  {
    key:
      "zelje",

    title:
      "ЖЕЉЕ",

    number:
      "05",
  },
];


function AdminCharacterAbout() {
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


  return (
    <section className="admin-character-about">
      <Link
        to={
          `/admin/likovi/${characterKey}`
        }
        className="admin-characters__back"
      >
        ← Кабинет
      </Link>


      <div className="admin-page-heading">
        <p className="eyebrow">
          {characterName}
        </p>

        <h1>О мени</h1>

        <p>
          Свака целина има свој
          засебан текст.
        </p>
      </div>


      {isCharacterOne ? (
        <div className="admin-about-grid">
          {HUMAN_ONE_ABOUT_SECTIONS.map(
            (section) => (
              <Link
                key={
                  section.key
                }
                to={
                  `/admin/likovi/${characterKey}/o-meni/${section.key}`
                }
                className={
                  `admin-about-card admin-about-card--${section.key}`
                }
              >
                <div className="admin-about-card__preview">
                  <span>
                    {
                      section.number
                    }
                  </span>

                  <strong>
                    {
                      section.title
                    }
                  </strong>
                </div>


                <h2>
                  {section.title}
                </h2>

                <p>
                  Отвори и уреди текст.
                </p>
              </Link>
            )
          )}
        </div>
      ) : (
        <div className="admin-character-empty">
          <span>
            02
          </span>

          <h2>
            „О мени“ Човека 2
          </h2>

          <p>
            Његове целине још нисмо
            дефинисали. Нећемо копирати
            структуру Човека 1 јер ова
            два лика треба да имају
            различит идентитет.
          </p>
        </div>
      )}
    </section>
  );
}


export default AdminCharacterAbout;