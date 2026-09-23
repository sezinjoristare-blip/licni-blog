import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useParams,
} from "react-router-dom";

import "../../styles/admin/AdminSectionShell.css";


const VALID_CHARACTERS = [
  "covek-1",
  "covek-2",
];


function AdminCharacterArticles() {
  const {
    characterKey,
  } = useParams();


  const location =
    useLocation();


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
              ЧОВЕК 2 / ТЕКСТОВИ
            </p>

            <h1>
              Текстови
            </h1>

            <p className="admin-section-shell__hero-description">
              Овај део ћемо
              уредити посебно
              када Човек 2
              добије свој садржај.
            </p>

            <div className="admin-section-shell__meta">
              <span className="admin-section-shell__chip">
                У РАЗВОЈУ
              </span>
            </div>
          </div>
        </header>
      </section>
    );
  }


  const basePath =
    `/admin/likovi/${characterKey}/tekstovi`;


  const categoriesPath =
    `${basePath}/kategorije`;


  const isCategories =
    location.pathname ===
      categoriesPath ||
    location.pathname.startsWith(
      `${categoriesPath}/`
    );


  const isNew =
    location.pathname ===
    `${basePath}/novi`;


  const isEditor =
    !isCategories &&
    location.pathname !==
      basePath;


  return (
    <section className="admin-section-shell admin-section-shell--articles">
      <Link
        to={`/admin/likovi/${characterKey}`}
        className="admin-section-shell__back"
      >
        ← КАБИНЕТ ЧОВЕКА 1
      </Link>


      <header className="admin-section-shell__hero">
        <div className="admin-section-shell__hero-copy">
          <p className="eyebrow">
            ЧОВЕК 1 / САДРЖАЈ
          </p>


          <h1>
            Текстови
          </h1>


          <p className="admin-section-shell__hero-description">
            Постери, категорије,
            ручно писани радови,
            PDF документи и reader
            блокови налазе се на
            једном месту.
          </p>


          <div className="admin-section-shell__meta">
            <span className="admin-section-shell__chip admin-section-shell__chip--accent">
              READER
            </span>

            <span className="admin-section-shell__chip">
              ТЕКСТ
            </span>

            <span className="admin-section-shell__chip">
              PDF
            </span>

            <span className="admin-section-shell__chip">
              МЕДИЈИ
            </span>
          </div>
        </div>


        <div className="admin-section-shell__actions">
          <Link
            to="/autor/covek/posteri"
            target="_blank"
            rel="noreferrer"
            className="admin-section-shell__action"
          >
            ЈАВНИ ПРИКАЗ ↗
          </Link>


          {isEditor ? (
            <Link
              to={
                basePath
              }
              className="admin-section-shell__action admin-section-shell__action--primary"
            >
              ← СВИ РАДОВИ
            </Link>
          ) : (
            <Link
              to={
                `${basePath}/novi`
              }
              className="admin-section-shell__action admin-section-shell__action--primary"
            >
              + НОВИ РАД
            </Link>
          )}
        </div>
      </header>


      <nav
        className="admin-section-shell__tabs"
        aria-label="Админ текстова"
      >
        <Link
          to={
            basePath
          }
          className={
            !isCategories
              ? "admin-section-shell__tab admin-section-shell__tab--active"
              : "admin-section-shell__tab"
          }
        >
          РАДОВИ
        </Link>


        <Link
          to={
            categoriesPath
          }
          className={
            isCategories
              ? "admin-section-shell__tab admin-section-shell__tab--active"
              : "admin-section-shell__tab"
          }
        >
          КАТЕГОРИЈЕ
        </Link>
      </nav>


      {isNew ? (
        <div className="admin-section-shell__chip admin-section-shell__chip--accent">
          НОВИ ЛОКАЛНИ НАЦРТ
        </div>
      ) : null}


      <div className="admin-section-shell__panel">
        <Outlet />
      </div>
    </section>
  );
}


export default AdminCharacterArticles;