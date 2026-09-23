import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useParams,
} from "react-router-dom";

import "../../styles/admin/AdminSkate.css";
import "../../styles/admin/AdminSectionShell.css";


function AdminCharacterSkate() {
  const {
    characterKey,
  } = useParams();


  const location =
    useLocation();


  if (
    characterKey !==
    "covek-1"
  ) {
    return (
      <Navigate
        to={`/admin/likovi/${characterKey}`}
        replace
      />
    );
  }


  const basePath =
    `/admin/likovi/${characterKey}/skejt`;


  const zonesPath =
    `${basePath}/zone`;


  const archivePath =
    `${basePath}/arhiva`;


  const isZones =
    location.pathname ===
      zonesPath ||
    location.pathname.startsWith(
      `${zonesPath}/`
    );


  const isArchive =
    location.pathname ===
      archivePath ||
    location.pathname.startsWith(
      `${archivePath}/`
    );


  const isArchiveEditor =
    location.pathname !==
      archivePath &&
    location.pathname.startsWith(
      `${archivePath}/`
    );


  const isNewEntry =
    location.pathname ===
    `${archivePath}/novi`;


  const isMedia =
    location.pathname.endsWith(
      "/mediji"
    );


  return (
    <section className="admin-section-shell admin-section-shell--skate">
      <Link
        to="/admin/likovi/covek-1"
        className="admin-section-shell__back"
      >
        ← КАБИНЕТ ЧОВЕКА 1
      </Link>


      <header className="admin-section-shell__hero">
        <div className="admin-section-shell__hero-copy">
          <p className="eyebrow">
            ЧОВЕК 1 / СВЕТ
          </p>


          <h1>
            Скејт
          </h1>


          <p className="admin-section-shell__hero-description">
            Зоне Скејт света и
            архива личних вожњи,
            догодовштина, снимака,
            фотографија и уличних
            прича.
          </p>


          <div className="admin-section-shell__meta">
            <span className="admin-section-shell__chip admin-section-shell__chip--accent">
              STREET
            </span>

            <span className="admin-section-shell__chip">
              4 ЗОНЕ
            </span>

            <span className="admin-section-shell__chip">
              АРХИВА
            </span>

            <span className="admin-section-shell__chip">
              МЕДИЈИ
            </span>
          </div>
        </div>


        <div className="admin-section-shell__actions">
          <Link
            to="/autor/covek/skejt"
            target="_blank"
            rel="noreferrer"
            className="admin-section-shell__action"
          >
            ЈАВНИ СКЕЈТ ↗
          </Link>


          {isArchiveEditor ? (
            <Link
              to={
                archivePath
              }
              className="admin-section-shell__action admin-section-shell__action--primary"
            >
              ← АРХИВА
            </Link>
          ) : (
            <Link
              to={
                `${archivePath}/novi`
              }
              className="admin-section-shell__action admin-section-shell__action--primary"
            >
              + НОВИ ЗАПИС
            </Link>
          )}
        </div>
      </header>


      <nav
        className="admin-section-shell__tabs"
        aria-label="Скејт админ"
      >
        <Link
          to={
            zonesPath
          }
          className={
            isZones
              ? "admin-section-shell__tab admin-section-shell__tab--active"
              : "admin-section-shell__tab"
          }
        >
          ЗОНЕ
        </Link>


        <Link
          to={
            archivePath
          }
          className={
            isArchive
              ? "admin-section-shell__tab admin-section-shell__tab--active"
              : "admin-section-shell__tab"
          }
        >
          АРХИВА
        </Link>
      </nav>


      {isNewEntry ? (
        <span className="admin-section-shell__chip admin-section-shell__chip--accent">
          НОВИ ЛОКАЛНИ НАЦРТ
        </span>
      ) : null}


      {isMedia ? (
        <span className="admin-section-shell__chip">
          УРЕЂИВАЊЕ МЕДИЈА
        </span>
      ) : null}


      <div className="admin-section-shell__panel">
        <Outlet />
      </div>
    </section>
  );
}


export default AdminCharacterSkate;