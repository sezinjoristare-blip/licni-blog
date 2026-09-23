import {
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  LanguageProvider,
} from "../i18n/LanguageContext";

import LanguageSwitcher
  from "../components/LanguageSwitcher/LanguageSwitcher";

import {
  HumanOneMusicPlaybackProvider,
} from "../context/HumanOneMusicPlaybackContext";


function PublicLayout() {
  const location =
    useLocation();


  const isEntry =
    location.pathname ===
    "/";


  return (
    <LanguageProvider>
      <HumanOneMusicPlaybackProvider>
        <div className="public-shell">
          <LanguageSwitcher
            variant={
              isEntry
                ? "entry"
                : "compact"
            }
          />

          <Outlet />
        </div>
      </HumanOneMusicPlaybackProvider>
    </LanguageProvider>
  );
}


export default PublicLayout;
