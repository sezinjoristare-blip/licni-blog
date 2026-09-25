import {
  Suspense,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  LanguageProvider,
} from "../i18n/LanguageContext";

import LanguageSwitcher
  from "../components/LanguageSwitcher/LanguageSwitcher";

import NotificationControl
  from "../components/notifications/NotificationControl";

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

          <NotificationControl />

          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
      </HumanOneMusicPlaybackProvider>
    </LanguageProvider>
  );
}


export default PublicLayout;