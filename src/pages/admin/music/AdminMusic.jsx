import {
  Link,
  Outlet,
  useLocation,
  useParams,
} from "react-router-dom";

import "../../../styles/admin/AdminMusic.css";
import "../../../styles/admin/AdminSectionShell.css";


function AdminMusic() {
  const {
    characterKey =
      "covek-1",
  } = useParams();


  const location =
    useLocation();


  const basePath =
    `/admin/likovi/${characterKey}/muzika`;


  const genresPath =
    `${basePath}/zanrovi`;


  const recommendationsPath =
    `${basePath}/preporuke`;


  const playlistsPath =
    `${recommendationsPath}?tip=plejliste`;


  const radioDramasPath =
    `${recommendationsPath}?tip=radio-drame`;


  const analysesPath =
    `${basePath}/analize`;


  const recommendationType =
    new URLSearchParams(
      location.search
    ).get(
      "tip"
    );


  const isGenres =
    location.pathname ===
      genresPath ||
    location.pathname.startsWith(
      `${genresPath}/`
    );


  const isRecommendationRoute =
    location.pathname ===
      recommendationsPath ||
    location.pathname.startsWith(
      `${recommendationsPath}/`
    );


  const isDiscs =
    isRecommendationRoute &&
    (
      location.pathname.startsWith(
        `${recommendationsPath}/`
      ) ||
      !recommendationType ||
      recommendationType ===
        "diskovi"
    );


  const isPlaylists =
    location.pathname ===
      recommendationsPath &&
    recommendationType ===
      "plejliste";


  const isRadioDramas =
    location.pathname ===
      recommendationsPath &&
    recommendationType ===
      "radio-drame";


  const isAnalyses =
    location.pathname ===
      analysesPath ||
    location.pathname.startsWith(
      `${analysesPath}/`
    );


  return (
    <section className="admin-section-shell admin-section-shell--music">
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
            Музика
          </h1>


          <p className="admin-section-shell__hero-description">
            Организуј жанрове,
            дискове, плејлисте,
            радио драме, анализе
            и преводе из једног
            музичког кабинета.
          </p>


          <div className="admin-section-shell__meta">
            <span className="admin-section-shell__chip admin-section-shell__chip--accent">
              РАДИО
            </span>

            <span className="admin-section-shell__chip">
              ДИСКОВИ
            </span>

            <span className="admin-section-shell__chip">
              ПЛЕЈЛИСТЕ
            </span>

            <span className="admin-section-shell__chip">
              РАДИО ДРАМЕ
            </span>

            <span className="admin-section-shell__chip">
              ПРЕВОДИ
            </span>

            <span className="admin-section-shell__chip">
              АНАЛИЗЕ
            </span>
          </div>
        </div>


        <div className="admin-section-shell__actions">
          <Link
            to="/autor/covek/muzika"
            target="_blank"
            rel="noreferrer"
            className="admin-section-shell__action admin-section-shell__action--primary"
          >
            ОТВОРИ МУЗИКУ ↗
          </Link>
        </div>
      </header>


      <nav
        className="admin-section-shell__tabs"
        aria-label="Музички админ"
      >
        <Link
          to={
            genresPath
          }
          className={
            isGenres
              ? "admin-section-shell__tab admin-section-shell__tab--active"
              : "admin-section-shell__tab"
          }
        >
          ЖАНРОВИ
        </Link>


        <Link
          to={
            recommendationsPath
          }
          className={
            isDiscs
              ? "admin-section-shell__tab admin-section-shell__tab--active"
              : "admin-section-shell__tab"
          }
        >
          ДИСКОВИ
        </Link>


        <Link
          to={
            playlistsPath
          }
          className={
            isPlaylists
              ? "admin-section-shell__tab admin-section-shell__tab--active"
              : "admin-section-shell__tab"
          }
        >
          ПЛЕЈЛИСТЕ
        </Link>


        <Link
          to={
            radioDramasPath
          }
          className={
            isRadioDramas
              ? "admin-section-shell__tab admin-section-shell__tab--active"
              : "admin-section-shell__tab"
          }
        >
          РАДИО ДРАМЕ
        </Link>


        <Link
          to={
            analysesPath
          }
          className={
            isAnalyses
              ? "admin-section-shell__tab admin-section-shell__tab--active"
              : "admin-section-shell__tab"
          }
        >
          АНАЛИЗЕ И ПРЕВОДИ
        </Link>
      </nav>


      <div className="admin-section-shell__panel admin-music__panel">
        <Outlet />
      </div>
    </section>
  );
}


export default AdminMusic;
