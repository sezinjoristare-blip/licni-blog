import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import {
  AdminDraftProvider,
} from "../admin-safety/AdminDraftContext";

import AdminSaveStatus
  from "../components/admin/AdminSaveStatus";

import "../styles/admin/AdminShared.css";
import "../styles/admin/AdminLayout.css";


const NAV_GROUPS = [
  {
    label:
      "ГЛАВНО",

    items: [
      {
        label:
          "Контролна табла",

        to:
          "/admin",

        end:
          true,

        icon:
          "⌂",
      },

      {
        label:
          "Ликови",

        to:
          "/admin/likovi",

        end:
          true,

        icon:
          "◉",
      },

      {
        label:
          "Изглед сајта",

        to:
          "/admin/izgled",

        icon:
          "◇",
      },
    ],
  },

  {
    label:
      "ЧОВЕК 1",

    items: [
      {
        label:
          "Кабинет",

        to:
          "/admin/likovi/covek-1",

        end:
          true,

        icon:
          "01",
      },

      {
        label:
          "О мени",

        to:
          "/admin/likovi/covek-1/o-meni",

        icon:
          "⌁",
      },

      {
        label:
          "Музика",

        to:
          "/admin/likovi/covek-1/muzika",

        icon:
          "♫",
      },

      {
        label:
          "Текстови",

        to:
          "/admin/likovi/covek-1/tekstovi",

        icon:
          "¶",
      },

      {
        label:
          "Скејт",

        to:
          "/admin/likovi/covek-1/skejt",

        icon:
          "↗",
      },

      {
        label:
          "Обала — Свеска",

        to:
          "/admin/likovi/covek-1/obala-sveska",

        icon:
          "□",
      },

      {
        label:
          "Обала — Пано",

        to:
          "/admin/likovi/covek-1/obala-pano",

        icon:
          "▤",
      },
    ],
  },

  {
    label:
      "ОПШТЕ",

    items: [
      {
        label:
          "Категорије",

        to:
          "/admin/kategorije",

        icon:
          "≡",
      },

      {
        label:
          "Сви текстови",

        to:
          "/admin/tekstovi",

        icon:
          "T",
      },
    ],
  },
];


function getRouteMeta(
  pathname
) {
  if (
    pathname ===
    "/admin"
  ) {
    return {
      group:
        "ADMIN",

      title:
        "Контролна табла",
    };
  }


  if (
    pathname ===
    "/admin/likovi"
  ) {
    return {
      group:
        "ADMIN / ЛИКОВИ",

      title:
        "Ликови",
    };
  }


  if (
    pathname ===
    "/admin/likovi/covek-1"
  ) {
    return {
      group:
        "ЧОВЕК 1",

      title:
        "Кабинет",
    };
  }


  if (
    pathname.includes(
      "/o-meni"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1",

      title:
        "О мени",
    };
  }


  if (
    pathname.includes(
      "/muzika/zanrovi"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / МУЗИКА",

      title:
        "Жанрови",
    };
  }


  if (
    pathname.includes(
      "/muzika/preporuke"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / МУЗИКА",

      title:
        "Препоруке",
    };
  }


  if (
    pathname.includes(
      "/muzika/analize"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / МУЗИКА",

      title:
        "Анализе и преводи",
    };
  }


  if (
    pathname.includes(
      "/muzika"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1",

      title:
        "Музика",
    };
  }


  if (
    pathname.includes(
      "/tekstovi/kategorije"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / ТЕКСТОВИ",

      title:
        "Категорије",
    };
  }


  if (
    pathname.includes(
      "/tekstovi/novi"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / ТЕКСТОВИ",

      title:
        "Нови текст",
    };
  }


  if (
    pathname.includes(
      "/likovi/covek-1/tekstovi/"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / ТЕКСТОВИ",

      title:
        "Уређивање текста",
    };
  }


  if (
    pathname ===
    "/admin/likovi/covek-1/tekstovi"
  ) {
    return {
      group:
        "ЧОВЕК 1",

      title:
        "Текстови",
    };
  }


  if (
    pathname.includes(
      "/skejt/zone"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / СКЕЈТ",

      title:
        "Зоне",
    };
  }


  if (
    pathname.includes(
      "/skejt/arhiva/novi"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / СКЕЈТ",

      title:
        "Нова догодовштина",
    };
  }


  if (
    pathname.includes(
      "/skejt/arhiva"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / СКЕЈТ",

      title:
        "Архива",
    };
  }


  if (
    pathname.includes(
      "/skejt"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1",

      title:
        "Скејт",
    };
  }


  if (
    pathname.includes(
      "/obala-sveska/novi"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / ОБАЛА",

      title:
        "Нови запис у Свесци",
    };
  }


  if (
    pathname.includes(
      "/obala-sveska/"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / ОБАЛА",

      title:
        "Уређивање Свеске",
    };
  }


  if (
    pathname.includes(
      "/obala-sveska"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / ОБАЛА",

      title:
        "Свеска",
    };
  }


  if (
    pathname.includes(
      "/obala-pano/novi"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / ОБАЛА",

      title:
        "Нови догађај",
    };
  }


  if (
    pathname.includes(
      "/obala-pano/"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / ОБАЛА",

      title:
        "Уређивање догађаја",
    };
  }


  if (
    pathname.includes(
      "/obala-pano"
    )
  ) {
    return {
      group:
        "ЧОВЕК 1 / ОБАЛА",

      title:
        "Пано",
    };
  }


  if (
    pathname ===
    "/admin/kategorije"
  ) {
    return {
      group:
        "САДРЖАЈ",

      title:
        "Категорије",
    };
  }


  if (
    pathname.includes(
      "/admin/tekstovi"
    )
  ) {
    return {
      group:
        "САДРЖАЈ",

      title:
        "Сви текстови",
    };
  }


  if (
    pathname ===
    "/admin/izgled"
  ) {
    return {
      group:
        "СИСТЕМ",

      title:
        "Изглед сајта",
    };
  }


  return {
    group:
      "ADMIN",

    title:
      "Уређивање",
  };
}


function AdminNavigationItem({
  item,
  onNavigate,
}) {
  return (
    <NavLink
      to={
        item.to
      }
      end={
        item.end
      }
      onClick={
        onNavigate
      }
      className={({
        isActive,
      }) =>
        isActive
          ? "active"
          : undefined
      }
    >
      <span
        className="admin-nav__icon"
        aria-hidden="true"
      >
        {item.icon}
      </span>

      <span>
        {item.label}
      </span>
    </NavLink>
  );
}


function AdminLayoutContent() {
  const navigate =
    useNavigate();

  const location =
    useLocation();


  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);


  const [
    userEmail,
    setUserEmail,
  ] = useState("");


  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);


  const routeMeta =
    useMemo(
      () =>
        getRouteMeta(
          location.pathname
        ),
      [
        location.pathname,
      ]
    );


  useEffect(() => {
    setSidebarOpen(
      false
    );
  }, [
    location.pathname,
  ]);


  useEffect(() => {
    let active =
      true;


    async function loadUser() {
      const {
        data,
      } =
        await supabase.auth
          .getUser();


      if (
        active &&
        data?.user
      ) {
        setUserEmail(
          data.user.email ||
          ""
        );
      }
    }


    loadUser();


    const {
      data:
        authListener,
    } =
      supabase.auth
        .onAuthStateChange(
          (
            _event,
            session
          ) => {
            if (!active) {
              return;
            }


            setUserEmail(
              session
                ?.user
                ?.email ||
              ""
            );
          }
        );


    return () => {
      active =
        false;


      authListener
        ?.subscription
        ?.unsubscribe();
    };
  }, []);


  useEffect(() => {
    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setSidebarOpen(
          false
        );
      }
    }


    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);


  useEffect(() => {
    if (!sidebarOpen) {
      return undefined;
    }


    const previousOverflow =
      document.body
        .style
        .overflow;


    document.body
      .style
      .overflow =
      "hidden";


    return () => {
      document.body
        .style
        .overflow =
        previousOverflow;
    };
  }, [
    sidebarOpen,
  ]);


  async function handleLogout() {
    if (loggingOut) {
      return;
    }


    setLoggingOut(
      true
    );


    try {
      await supabase.auth
        .signOut();

    } catch (
      error
    ) {
      console.error(
        "Admin logout:",
        error
      );

    } finally {
      navigate(
        "/admin/login",
        {
          replace:
            true,
        }
      );
    }
  }


  const initials =
    userEmail
      ? userEmail
          .slice(
            0,
            2
          )
          .toUpperCase()
      : "SR";


  return (
    <div
      className={
        sidebarOpen
          ? "admin-shell admin-shell--sidebar-open"
          : "admin-shell"
      }
    >
      <button
        type="button"
        className="admin-sidebar-overlay"
        onClick={() =>
          setSidebarOpen(
            false
          )
        }
        aria-label="Затвори мени"
      />


      <aside className="admin-sidebar">
        <header className="admin-sidebar__brand">
          <div
            className="admin-sidebar__mark"
            aria-hidden="true"
          >
            SR
          </div>


          <p className="admin-sidebar__eyebrow">
            АУТОРСКИ CMS
          </p>


          <h1>
            Секијев
            <br />
            кабинет
          </h1>


          <p>
            Садржај, ликови,
            архиве и светови.
          </p>
        </header>


        <nav
          className="admin-nav"
          aria-label="Администрација"
        >
          {NAV_GROUPS.map(
            (
              group
            ) => (
              <div
                key={
                  group.label
                }
                className="admin-nav__group"
              >
                <p className="admin-nav__label">
                  {group.label}
                </p>


                {group.items.map(
                  (
                    item
                  ) => (
                    <AdminNavigationItem
                      key={
                        item.to
                      }
                      item={
                        item
                      }
                      onNavigate={() =>
                        setSidebarOpen(
                          false
                        )
                      }
                    />
                  )
                )}
              </div>
            )
          )}
        </nav>


        <footer className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div
              className="admin-sidebar__avatar"
              aria-hidden="true"
            >
              {initials}
            </div>


            <div className="admin-sidebar__user-copy">
              <strong>
                Администратор
              </strong>

              <small>
                {userEmail ||
                  "Приватни кабинет"}
              </small>
            </div>
          </div>


          <button
            type="button"
            onClick={
              handleLogout
            }
            disabled={
              loggingOut
            }
          >
            {loggingOut
              ? "ОДЈАВЉУЈЕМ..."
              : "ОДЈАВИ СЕ"}
          </button>
        </footer>
      </aside>


      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              type="button"
              className="admin-mobile-menu-button"
              onClick={() =>
                setSidebarOpen(
                  (
                    current
                  ) =>
                    !current
                )
              }
              aria-label="Отвори мени"
              aria-expanded={
                sidebarOpen
              }
            >
              ☰
            </button>


            <div className="admin-topbar__section">
              <small>
                {routeMeta.group}
              </small>

              <strong>
                {routeMeta.title}
              </strong>
            </div>
          </div>


          <div className="admin-topbar__right">
            <div className="admin-topbar__save">
              <AdminSaveStatus />
            </div>


            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="admin-topbar__site-link"
            >
              Отвори сајт ↗
            </a>
          </div>
        </header>


        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


function AdminLayout() {
  return (
    <AdminDraftProvider>
      <AdminLayoutContent />
    </AdminDraftProvider>
  );
}


export default AdminLayout;