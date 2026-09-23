import {
  Link,
} from "react-router-dom";

import {
  useBlog,
} from "../../context/BlogContext";

import "../../styles/admin/AdminCharacters.css";


function AdminCharacters() {
  const {
    siteSettings,
  } = useBlog();


  const characterOneName =
    siteSettings
      .character_one_name ||
    "ЧОВЕК 1";

  const characterTwoName =
    siteSettings
      .character_two_name ||
    "ЧОВЕК 2";


  const characterOneImage =
    siteSettings
      .character_one_image_url ||
    siteSettings
      .entry_image_url ||
    "";

  const characterTwoImage =
    siteSettings
      .character_two_image_url ||
    "";


  return (
    <section className="admin-characters">
      <div className="admin-page-heading">
        <p className="eyebrow">
          ЛИКОВИ
        </p>

        <h1>Изабери лика</h1>

        <p>
          Сваки лик има свој засебан
          кабинет.
        </p>
      </div>


      <div className="admin-characters__grid">
        {/* =====================================
            ČOVEK 1
            ===================================== */}

        <Link
          to="/admin/likovi/covek-1"
          className="admin-character-card"
        >
          <h2>
            {characterOneName}
          </h2>

          <div className="admin-character-card__image">
            {characterOneImage ? (
              <img
                src={
                  characterOneImage
                }
                alt=""
              />
            ) : (
              <div className="admin-character-card__placeholder">
                01
              </div>
            )}
          </div>

          <span>
            ЧОВЕК 1
          </span>
        </Link>


        {/* =====================================
            ČOVEK 2
            ===================================== */}

        <Link
          to="/admin/likovi/covek-2"
          className="admin-character-card"
        >
          <h2>
            {characterTwoName}
          </h2>

          <div className="admin-character-card__image">
            {characterTwoImage ? (
              <img
                src={
                  characterTwoImage
                }
                alt=""
              />
            ) : (
              <div className="admin-character-card__placeholder">
                02
              </div>
            )}
          </div>

          <span>
            ЧОВЕК 2
          </span>
        </Link>
      </div>
    </section>
  );
}


export default AdminCharacters;