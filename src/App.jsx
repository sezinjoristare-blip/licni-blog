import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AdminRoute
  from "./components/AdminRoute";

import ContributorRoute
  from "./components/ContributorRoute";

import AdminLayout
  from "./layouts/AdminLayout";

import PublicLayout
  from "./layouts/PublicLayout";

import About
  from "./pages/About";

import ArticlePage
  from "./pages/ArticlePage";

import CategoryPage
  from "./pages/CategoryPage";

import CharacterSelect
  from "./pages/CharacterSelect";

import Home
  from "./pages/Home";

import HumanOneAbout
  from "./pages/HumanOneAbout";

import HumanOneAboutReader
  from "./pages/HumanOneAboutReader";

import HumanOneMusic
  from "./pages/HumanOneMusic";

import HumanOneMusicAnalyses
  from "./pages/HumanOneMusicAnalyses";

import HumanOneMusicPlaylist
  from "./pages/HumanOneMusicPlaylist";

import HumanOneMusicPlaylists
  from "./pages/HumanOneMusicPlaylists";

import HumanOneMusicSongs
  from "./pages/HumanOneMusicSongs";

import HumanOneMusicGenre
  from "./pages/HumanOneMusicGenre";

import HumanOneMusicGenres
  from "./pages/HumanOneMusicGenres";

import HumanOneMusicReader
  from "./pages/HumanOneMusicReader";

import HumanOneMessage
  from "./pages/HumanOneMessage";

import HumanOneQuickWits
  from "./pages/HumanOneQuickWits";

import HumanOneGame
  from "./pages/HumanOneGame";

import HumanOneObala
  from "./pages/HumanOneObala";

import HumanOneObalaNotebook
  from "./pages/HumanOneObalaNotebook";

import HumanOneObalaBoard
  from "./pages/HumanOneObalaBoard";

import HumanOneObalaGuestbook
  from "./pages/HumanOneObalaGuestbook";

import ObalaArchiveReader
  from "./pages/ObalaArchiveReader";

import HumanOnePosterCategory
  from "./pages/HumanOnePosterCategory";

import HumanOnePosterEntry
  from "./pages/HumanOnePosterEntry";

import HumanOnePosters
  from "./pages/HumanOnePosters";

import HumanOneSkate
  from "./pages/HumanOneSkate";

import HumanOneSkateEntry
  from "./pages/HumanOneSkateEntry";

import HumanOneSkateSection
  from "./pages/HumanOneSkateSection";

import HumanTwo
  from "./pages/HumanTwo";

import Writing
  from "./pages/Writing";

import ContributorLogin
  from "./pages/contributor/ContributorLogin";

import ContributorRegister
  from "./pages/contributor/ContributorRegister";

import ContributorSkatePanel
  from "./pages/contributor/ContributorSkatePanel";

import AdminArticles
  from "./pages/admin/AdminArticles";

import AdminCategories
  from "./pages/admin/AdminCategories";

import AdminCharacterAbout
  from "./pages/admin/AdminCharacterAbout";

import AdminCharacterArticles
  from "./pages/admin/AdminCharacterArticles";

import AdminPosterCategories
  from "./pages/admin/posters/AdminPosterCategories";

import AdminCharacterCabinet
  from "./pages/admin/AdminCharacterCabinet";

import AdminCharacterMusic
  from "./pages/admin/AdminCharacterMusic";

import AdminMusicGenres
  from "./pages/admin/music/AdminMusicGenres";

import AdminMusicRecommendations
  from "./pages/admin/music/AdminMusicRecommendations";

import AdminMusicAnalyses
  from "./pages/admin/music/AdminMusicAnalyses";

import AdminCharacterSkate
  from "./pages/admin/AdminCharacterSkate";

import AdminSkateSections
  from "./pages/admin/skate/AdminSkateSections";

import AdminSkateArchive
  from "./pages/admin/skate/AdminSkateArchive";

import AdminObalaNotebook
  from "./pages/admin/AdminObalaNotebook";

import AdminObalaBoard
  from "./pages/admin/AdminObalaBoard";

import AdminQuickWits
  from "./pages/admin/AdminQuickWits";

import AdminCharacters
  from "./pages/admin/AdminCharacters";

import AdminCharacterSection
  from "./pages/admin/AdminCharacterSection";

import AdminDashboard
  from "./pages/admin/AdminDashboard";

import AdminLogin
  from "./pages/admin/AdminLogin";

import AdminSiteSettings
  from "./pages/admin/AdminSiteSettings";


function App() {
  return (
    <Routes>
      {/* =====================================
          JAVNI DEO
          ===================================== */}

      <Route
        element={
          <PublicLayout />
        }
      >
        <Route
          index
          element={
            <CharacterSelect />
          }
        />


        {/* =====================================
            ČOVEK 1 — SOBA
            ===================================== */}

        <Route
          path="autor/covek"
          element={
            <Home />
          }
        />


        {/* =====================================
            ČOVEK 1 — O MENI
            ===================================== */}

        <Route
          path="autor/covek/o-meni"
          element={
            <HumanOneAbout />
          }
        />

        <Route
          path="autor/covek/o-meni/:sectionKey"
          element={
            <HumanOneAboutReader />
          }
        />


        {/* =====================================
            ČOVEK 1 — MUZIKA
            ===================================== */}

        <Route
          path="autor/covek/muzika"
          element={
            <HumanOneMusic />
          }
        />

        <Route
          path="autor/covek/muzika/preporuke"
          element={
            <HumanOneMusicGenres />
          }
        />

        <Route
          path="autor/covek/muzika/preporuke/pesme"
          element={
            <HumanOneMusicSongs />
          }
        />

        <Route
          path="autor/covek/muzika/preporuke/plejliste"
          element={
            <HumanOneMusicPlaylists />
          }
        />

        <Route
          path="autor/covek/muzika/preporuke/plejliste/:playlistSlug"
          element={
            <HumanOneMusicPlaylist />
          }
        />

        <Route
          path="autor/covek/muzika/preporuke/:genreSlug"
          element={
            <HumanOneMusicGenre />
          }
        />

        <Route
          path="autor/covek/muzika/preporuke/:genreSlug/:songSlug"
          element={
            <HumanOneMusicReader
              mode="recommendation"
            />
          }
        />

        <Route
          path="autor/covek/muzika/analize"
          element={
            <HumanOneMusicAnalyses />
          }
        />

        <Route
          path="autor/covek/muzika/analize/:songSlug"
          element={
            <HumanOneMusicReader
              mode="analysis"
            />
          }
        />


        {/* =====================================
            ČOVEK 1 — POSTERI / TEKSTOVI
            ===================================== */}

        <Route
          path="autor/covek/posteri"
          element={
            <HumanOnePosters />
          }
        />

        <Route
          path="autor/covek/posteri/:categorySlug"
          element={
            <HumanOnePosterCategory />
          }
        />

        <Route
          path="autor/covek/posteri/:categorySlug/:articleSlug"
          element={
            <HumanOnePosterEntry />
          }
        />


        {/* =====================================
            ČOVEK 1 — SKEJT
            ===================================== */}

        <Route
          path="autor/covek/skejt"
          element={
            <HumanOneSkate />
          }
        />

        <Route
          path="autor/covek/skejt/:sectionSlug"
          element={
            <HumanOneSkateSection />
          }
        />

        <Route
          path="autor/covek/skejt/:sectionSlug/:entrySlug"
          element={
            <HumanOneSkateEntry />
          }
        />


        {/* =====================================
            ČOVEK 1 — PORUKA
            ===================================== */}

        <Route
          path="autor/covek/poruka"
          element={
            <HumanOneMessage />
          }
        />


        {/* =====================================
            ČOVEK 1 — BRZE DOSKOČICE
            ===================================== */}

        <Route
          path="autor/covek/doskocice"
          element={
            <HumanOneQuickWits />
          }
        />


        {/* =====================================
            ČOVEK 1 — FLIP CAT
            ===================================== */}

        <Route
          path="autor/covek/igra"
          element={
            <HumanOneGame />
          }
        />


        {/* =====================================
            ČOVEK 1 — AKC OBALA
            ===================================== */}

        <Route
          path="autor/covek/obala"
          element={
            <HumanOneObala />
          }
        />


        {/* OBALA — SVESKA */}

        <Route
          path="autor/covek/obala/sveska"
          element={
            <HumanOneObalaNotebook />
          }
        />


        {/* OBALA — PANO */}

        <Route
          path="autor/covek/obala/pano"
          element={
            <HumanOneObalaBoard />
          }
        />


        {/* OBALA — KNJIGA UTISAKA */}

        <Route
          path="autor/covek/obala/utisci"
          element={
            <HumanOneObalaGuestbook />
          }
        />


        {/* OBALA — READER */}

        <Route
          path="autor/covek/obala/reader/:sourceType/:entryId"
          element={
            <ObalaArchiveReader />
          }
        />


        {/* =====================================
            ČOVEK 2
            ===================================== */}

        <Route
          path="autor/covek-2"
          element={
            <HumanTwo />
          }
        />


        {/* =====================================
            STARI JAVNI DELOVI
            ===================================== */}

        <Route
          path="pisanje"
          element={
            <Writing />
          }
        />

        <Route
          path="kategorija/:slug"
          element={
            <CategoryPage />
          }
        />

        <Route
          path="tekst/:slug"
          element={
            <ArticlePage />
          }
        />

        <Route
          path="o-meni"
          element={
            <About />
          }
        />
      </Route>


      {/* =====================================
          SARADNICI
          ===================================== */}

      <Route
        path="/saradnik/prijava"
        element={
          <ContributorLogin />
        }
      />

      <Route
        path="/saradnik/registracija"
        element={
          <ContributorRegister />
        }
      />

      <Route
        path="/saradnik"
        element={
          <ContributorRoute>
            <ContributorSkatePanel />
          </ContributorRoute>
        }
      />


      {/* =====================================
          ADMIN LOGIN
          ===================================== */}

      <Route
        path="/admin/login"
        element={
          <AdminLogin />
        }
      />


      {/* =====================================
          ADMIN
          ===================================== */}

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        {/* =====================================
            DASHBOARD
            ===================================== */}

        <Route
          index
          element={
            <AdminDashboard />
          }
        />


        {/* =====================================
            LIKOVI
            ===================================== */}

        <Route
          path="likovi"
          element={
            <AdminCharacters />
          }
        />

        <Route
          path="likovi/:characterKey"
          element={
            <AdminCharacterCabinet />
          }
        />


        {/* =====================================
            O MENI
            ===================================== */}

        <Route
          path="likovi/:characterKey/o-meni"
          element={
            <AdminCharacterAbout />
          }
        />

        <Route
          path="likovi/:characterKey/o-meni/:sectionKey"
          element={
            <AdminCharacterSection />
          }
        />


        {/* =====================================
            MUZIKA V2
            ===================================== */}

        <Route
          path="likovi/:characterKey/muzika"
          element={
            <AdminCharacterMusic />
          }
        >
          <Route
            index
            element={
              <Navigate
                to="zanrovi"
                replace
              />
            }
          />


          {/* ŽANROVI */}

          <Route
            path="zanrovi"
            element={
              <AdminMusicGenres />
            }
          />

          <Route
            path="zanrovi/:genreId"
            element={
              <AdminMusicGenres />
            }
          />


          {/* PREPORUKE */}

          <Route
            path="preporuke"
            element={
              <AdminMusicRecommendations />
            }
          />

          <Route
            path="preporuke/:recommendationId"
            element={
              <AdminMusicRecommendations />
            }
          />


          {/* ANALIZE / PREVODI */}

          <Route
            path="analize"
            element={
              <AdminMusicAnalyses />
            }
          />

          <Route
            path="analize/:workId"
            element={
              <AdminMusicAnalyses />
            }
          />
        </Route>


        {/* =====================================
            TEKSTOVI / POSTERI V2
            ===================================== */}

        <Route
          path="likovi/:characterKey/tekstovi"
          element={
            <AdminCharacterArticles />
          }
        >
          {/* LISTA TEKSTOVA */}

          <Route
            index
            element={
              <AdminArticles />
            }
          />


          {/* NOVI TEKST */}

          <Route
            path="novi"
            element={
              <AdminArticles />
            }
          />


          {/* KATEGORIJE */}

          <Route
            path="kategorije"
            element={
              <AdminPosterCategories />
            }
          />


          {/* IZMENA TEKSTA */}

          <Route
            path=":articleId"
            element={
              <AdminArticles />
            }
          />
        </Route>


        {/* =====================================
            SKEJT V2
            ===================================== */}

        <Route
          path="likovi/:characterKey/skejt"
          element={
            <AdminCharacterSkate />
          }
        >
          <Route
            index
            element={
              <Navigate
                to="zone"
                replace
              />
            }
          />


          {/* ZONE */}

          <Route
            path="zone"
            element={
              <AdminSkateSections />
            }
          />


          {/* ARHIVA — LISTA */}

          <Route
            path="arhiva"
            element={
              <AdminSkateArchive />
            }
          />


          {/* ARHIVA — NOVI ZAPIS */}

          <Route
            path="arhiva/novi"
            element={
              <AdminSkateArchive />
            }
          />


          {/* ARHIVA — MEDIJI
              Mora pre dinamičke izmene
              radi preglednosti. */}

          <Route
            path="arhiva/:entryId/mediji"
            element={
              <AdminSkateArchive />
            }
          />


          {/* ARHIVA — IZMENA */}

          <Route
            path="arhiva/:entryId"
            element={
              <AdminSkateArchive />
            }
          />
        </Route>


        {/* =====================================
            OBALA V2 — SVESKA
            ===================================== */}

        <Route
          path="likovi/:characterKey/obala-sveska"
          element={
            <AdminObalaNotebook />
          }
        />

        <Route
          path="likovi/:characterKey/obala-sveska/novi"
          element={
            <AdminObalaNotebook />
          }
        />

        <Route
          path="likovi/:characterKey/obala-sveska/:entryId"
          element={
            <AdminObalaNotebook />
          }
        />


        {/* =====================================
            OBALA V2 — PANO
            ===================================== */}

        <Route
          path="likovi/:characterKey/obala-pano"
          element={
            <AdminObalaBoard />
          }
        />

        <Route
          path="likovi/:characterKey/obala-pano/novi"
          element={
            <AdminObalaBoard />
          }
        />

        <Route
          path="likovi/:characterKey/obala-pano/:eventId"
          element={
            <AdminObalaBoard />
          }
        />


        {/* =====================================
            BRZE DOSKOČICE
            ===================================== */}

        <Route
          path="likovi/:characterKey/doskocice"
          element={
            <AdminQuickWits />
          }
        />

        <Route
          path="likovi/:characterKey/doskocice/novi"
          element={
            <AdminQuickWits />
          }
        />

        <Route
          path="likovi/:characterKey/doskocice/:noteId"
          element={
            <AdminQuickWits />
          }
        />


        {/* =====================================
            GENERIČKA SEKCIJA LIKA
            ===================================== */}

        <Route
          path="likovi/:characterKey/:sectionKey"
          element={
            <AdminCharacterSection />
          }
        />


        {/* =====================================
            GLOBALNE KATEGORIJE
            ===================================== */}

        <Route
          path="kategorije"
          element={
            <AdminCategories />
          }
        />


        {/* =====================================
            GLOBALNI TEKSTOVI V2
            ===================================== */}

        <Route
          path="tekstovi"
          element={
            <AdminArticles />
          }
        />

        <Route
          path="tekstovi/novi"
          element={
            <AdminArticles />
          }
        />

        <Route
          path="tekstovi/:articleId"
          element={
            <AdminArticles />
          }
        />


        {/* =====================================
            IZGLED SAJTA
            ===================================== */}

        <Route
          path="izgled"
          element={
            <AdminSiteSettings />
          }
        />
      </Route>


      {/* =====================================
          FALLBACK
          ===================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}


export default App;