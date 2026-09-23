import {
  Link,
  Navigate,
  useParams,
} from "react-router-dom";

import AdminMusic
  from "./music/AdminMusic";

import "../../styles/admin/AdminSectionShell.css";


const VALID_CHARACTERS = [
  "covek-1",
  "covek-2",
];


function AdminCharacterMusic() {
  const {
    characterKey,
  } = useParams();


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


  if (
    characterKey !==
    "covek-1"
  ) {
    return (
      <section className="admin-section-shell">
        <Link
          to={`/admin/likovi/${characterKey}`}
          className="admin-section-shell__back"
        >
          ← КАБИНЕТ
        </Link>


        <header className="admin-section-shell__hero">
          <div className="admin-section-shell__hero-copy">
            <p className="eyebrow">
              ЧОВЕК 2 / МУЗИКА
            </p>

            <h1>
              Музика
            </h1>

            <p className="admin-section-shell__hero-description">
              Овај музички свет
              биће уређен посебно
              за Човека 2.
            </p>
          </div>
        </header>
      </section>
    );
  }


  return (
    <AdminMusic />
  );
}


export default AdminCharacterMusic;