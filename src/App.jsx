import {
  lazy,
  Suspense,
} from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AdminRoute
  from "./components/AdminRoute";

import ContributorRoute
  from "./components/ContributorRoute";

import PublicLayout
  from "./layouts/PublicLayout";

import CharacterSelect
  from "./pages/CharacterSelect";


const Home = lazy(
  () => import("./pages/Home")
);

const AdminLayout = lazy(
  () => import("./layouts/AdminLayout")
);

const About = lazy(
  () => import("./pages/About")
);

const ArticlePage = lazy(
  () => import("./pages/ArticlePage")
);

const CategoryPage = lazy(
  () => import("./pages/CategoryPage")
);

const HumanOneAbout = lazy(
  () => import("./pages/HumanOneAbout")
);

const HumanOneAboutReader = lazy(
  () => import("./pages/HumanOneAboutReader")
);

const HumanOneMusic = lazy(
  () => import("./pages/HumanOneMusic")
);

const HumanOneMusicAnalyses = lazy(
  () => import("./pages/HumanOneMusicAnalyses")
);

const HumanOneMusicPlaylist = lazy(
  () => import("./pages/HumanOneMusicPlaylist")
);

const HumanOneMusicPlaylists = lazy(
  () => import("./pages/HumanOneMusicPlaylists")
);

const HumanOneMusicSongs = lazy(
  () => import("./pages/HumanOneMusicSongs")
);

const HumanOneMusicGenre = lazy(
  () => import("./pages/HumanOneMusicGenre")
);

const HumanOneMusicGenres = lazy(
  () => import("./pages/HumanOneMusicGenres")
);

const HumanOneMusicReader = lazy(
  () => import("./pages/HumanOneMusicReader")
);

const HumanOneMusicSubmitRecommendation = lazy(
  () => import("./pages/HumanOneMusicSubmitRecommendation")
);

const HumanOneMessage = lazy(
  () => import("./pages/HumanOneMessage")
);

const HumanOneQuickWits = lazy(
  () => import("./pages/HumanOneQuickWits")
);

const HumanOneGame = lazy(
  () => import("./pages/HumanOneGame")
);

const HumanOneObala = lazy(
  () => import("./pages/HumanOneObala")
);

const HumanOneObalaNotebook = lazy(
  () => import("./pages/HumanOneObalaNotebook")
);

const HumanOneObalaBoard = lazy(
  () => import("./pages/HumanOneObalaBoard")
);

const HumanOneObalaGuestbook = lazy(
  () => import("./pages/HumanOneObalaGuestbook")
);

const ObalaArchiveReader = lazy(
  () => import("./pages/ObalaArchiveReader")
);

const HumanOnePosterCategory = lazy(
  () => import("./pages/HumanOnePosterCategory")
);

const HumanOnePosterEntry = lazy(
  () => import("./pages/HumanOnePosterEntry")
);

const HumanOnePosters = lazy(
  () => import("./pages/HumanOnePosters")
);

const HumanOneSkate = lazy(
  () => import("./pages/HumanOneSkate")
);

const HumanOneSkateEntry = lazy(
  () => import("./pages/HumanOneSkateEntry")
);

const HumanOneSkateSection = lazy(
  () => import("./pages/HumanOneSkateSection")
);

const HumanTwo = lazy(
  () => import("./pages/HumanTwo")
);

const Writing = lazy(
  () => import("./pages/Writing")
);

const ContributorLogin = lazy(
  () => import("./pages/contributor/ContributorLogin")
);

const ContributorRegister = lazy(
  () => import("./pages/contributor/ContributorRegister")
);

const ContributorSkatePanel = lazy(
  () => import("./pages/contributor/ContributorSkatePanel")
);

const AdminArticles = lazy(
  () => import("./pages/admin/AdminArticles")
);

const AdminCategories = lazy(
  () => import("./pages/admin/AdminCategories")
);

const AdminCharacterAbout = lazy(
  () => import("./pages/admin/AdminCharacterAbout")
);

const AdminCharacterArticles = lazy(
  () => import("./pages/admin/AdminCharacterArticles")
);

const AdminPosterCategories = lazy(
  () => import("./pages/admin/posters/AdminPosterCategories")
);

const AdminCharacterCabinet = lazy(
  () => import("./pages/admin/AdminCharacterCabinet")
);

const AdminCharacterMusic = lazy(
  () => import("./pages/admin/AdminCharacterMusic")
);

const AdminMusicGenres = lazy(
  () => import("./pages/admin/music/AdminMusicGenres")
);

const AdminMusicRecommendations = lazy(
  () => import("./pages/admin/music/AdminMusicRecommendations")
);

const AdminMusicAnalyses = lazy(
  () => import("./pages/admin/music/AdminMusicAnalyses")
);

const AdminMusicListenerRecommendations = lazy(
  () => import("./pages/admin/music/AdminMusicListenerRecommendations")
);

const AdminCharacterSkate = lazy(
  () => import("./pages/admin/AdminCharacterSkate")
);

const AdminSkateSections = lazy(
  () => import("./pages/admin/skate/AdminSkateSections")
);

const AdminSkateArchive = lazy(
  () => import("./pages/admin/skate/AdminSkateArchive")
);

const AdminObalaNotebook = lazy(
  () => import("./pages/admin/AdminObalaNotebook")
);

const AdminObalaBoard = lazy(
  () => import("./pages/admin/AdminObalaBoard")
);

const AdminQuickWits = lazy(
  () => import("./pages/admin/AdminQuickWits")
);

const AdminCharacters = lazy(
  () => import("./pages/admin/AdminCharacters")
);

const AdminCharacterSection = lazy(
  () => import("./pages/admin/AdminCharacterSection")
);

const AdminDashboard = lazy(
  () => import("./pages/admin/AdminDashboard")
);

const AdminLogin = lazy(
  () => import("./pages/admin/AdminLogin")
);

const AdminSiteSettings = lazy(
  () => import("./pages/admin/AdminSiteSettings")
);


function LazyBoundary({
  children,
}) {
  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  );
}


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
          path="autor/covek/muzika/preporuke/posalji"
          element={
            <HumanOneMusicSubmitRecommendation />
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
          <LazyBoundary>
            <ContributorLogin />
          </LazyBoundary>
        }
      />

      <Route
        path="/saradnik/registracija"
        element={
          <LazyBoundary>
            <ContributorRegister />
          </LazyBoundary>
        }
      />

      <Route
        path="/saradnik"
        element={
          <ContributorRoute>
            <LazyBoundary>
              <ContributorSkatePanel />
            </LazyBoundary>
          </ContributorRoute>
        }
      />


      {/* =====================================
          ADMIN LOGIN
          ===================================== */}

      <Route
        path="/admin/login"
        element={
          <LazyBoundary>
            <AdminLogin />
          </LazyBoundary>
        }
      />


      {/* =====================================
          ADMIN
          ===================================== */}

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <LazyBoundary>
              <AdminLayout />
            </LazyBoundary>
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

          <Route
            path="predlozi-slusalaca"
            element={
              <AdminMusicListenerRecommendations />
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