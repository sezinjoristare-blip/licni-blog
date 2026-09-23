import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../../lib/supabaseClient";

import "../../styles/admin/AdminQuickWits.css";


const TONES = [
  {
    value: "yellow",
    label: "Жута",
  },
  {
    value: "pink",
    label: "Розе",
  },
  {
    value: "blue",
    label: "Плава",
  },
  {
    value: "green",
    label: "Зелена",
  },
  {
    value: "orange",
    label: "Наранџаста",
  },
  {
    value: "violet",
    label: "Љубичаста",
  },
];


const EMPTY_FORM = {
  text: "",
  tone: "yellow",
  rotation: 0,
  status: "draft",
};


function clampRotation(
  value
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed)
  ) {
    return 0;
  }

  return Math.max(
    -8,
    Math.min(
      8,
      Math.round(parsed)
    )
  );
}


function formatDate(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "sr-RS",
    {
      timeZone:
        "Europe/Belgrade",

      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hourCycle:
        "h23",
    }
  ).format(date);
}


function AdminQuickWits() {
  const {
    characterKey,
    noteId,
  } = useParams();

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const isNewRoute =
    location.pathname.endsWith(
      "/novi"
    );

  const isListRoute =
    !noteId &&
    !isNewRoute;

  const [
    items,
    setItems,
  ] = useState([]);

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saveState,
    setSaveState,
  ] = useState("saved");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const persistedIdRef =
    useRef(
      noteId || null
    );

  const hydratedRef =
    useRef(false);

  const saveSequenceRef =
    useRef(0);


  const selectedItem =
    useMemo(
      () =>
        items.find(
          (item) =>
            item.id ===
            noteId
        ) || null,
      [items, noteId]
    );


  useEffect(() => {
    persistedIdRef.current =
      noteId || null;
  }, [noteId]);


  useEffect(() => {
    if (
      characterKey !==
      "covek-1"
    ) {
      return;
    }

    let alive = true;


    async function loadItems() {
      setLoading(true);
      setErrorMessage("");

      const {
        data,
        error,
      } = await supabase
        .from(
          "quick_wits"
        )
        .select("*")
        .order(
          "sort_order",
          {
            ascending: true,
          }
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (!alive) {
        return;
      }

      if (error) {
        console.error(
          error
        );

        setItems([]);
        setErrorMessage(
          "Доскочице није могуће учитати."
        );
        setLoading(false);

        return;
      }

      setItems(
        data ?? []
      );

      setLoading(false);
    }


    loadItems();


    return () => {
      alive = false;
    };
  }, [characterKey]);


  useEffect(() => {
    hydratedRef.current =
      false;

    setErrorMessage("");

    if (isListRoute) {
      setForm(
        EMPTY_FORM
      );

      setSaveState(
        "saved"
      );

      hydratedRef.current =
        true;

      return;
    }

    if (isNewRoute) {
      persistedIdRef.current =
        null;

      setForm(
        EMPTY_FORM
      );

      setSaveState(
        "saved"
      );

      hydratedRef.current =
        true;

      return;
    }

    if (
      noteId &&
      selectedItem
    ) {
      persistedIdRef.current =
        selectedItem.id;

      setForm({
        text:
          selectedItem.text || "",

        tone:
          selectedItem.tone || "yellow",

        rotation:
          clampRotation(
            selectedItem.rotation
          ),

        status:
          selectedItem.status || "draft",
      });

      setSaveState(
        "saved"
      );

      hydratedRef.current =
        true;
    }
  }, [
    isListRoute,
    isNewRoute,
    noteId,
    selectedItem,
  ]);


  async function persistForm(
    formToSave = form,
    options = {}
  ) {
    const {
      force = false,
    } = options;

    const text =
      String(
        formToSave.text || ""
      );

    if (
      !force &&
      !text.trim() &&
      !persistedIdRef.current
    ) {
      setSaveState(
        "saved"
      );

      return null;
    }

    if (
      formToSave.status ===
        "published" &&
      !text.trim()
    ) {
      setErrorMessage(
        "Не можеш објавити празну доскочицу."
      );

      return null;
    }

    const sequence =
      saveSequenceRef.current +
      1;

    saveSequenceRef.current =
      sequence;

    setSaving(true);
    setSaveState(
      "saving"
    );
    setErrorMessage("");

    const payload = {
      text,
      tone:
        formToSave.tone,
      rotation:
        clampRotation(
          formToSave.rotation
        ),
      status:
        formToSave.status,
    };

    const currentId =
      persistedIdRef.current;

    if (currentId) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "quick_wits"
        )
        .update(payload)
        .eq(
          "id",
          currentId
        )
        .select("*")
        .single();

      if (error) {
        console.error(
          error
        );

        setSaving(false);
        setSaveState(
          "error"
        );
        setErrorMessage(
          "Аутоматско чување није успело."
        );

        return null;
      }

      if (
        sequence ===
        saveSequenceRef.current
      ) {
        setItems(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                  data.id
                  ? data
                  : item
            )
        );

        setSaving(false);
        setSaveState(
          "saved"
        );
      }

      return data;
    }

    const minOrder =
      items.reduce(
        (
          currentMin,
          item
        ) =>
          Math.min(
            currentMin,
            Number(
              item.sort_order ??
              0
            )
          ),
        0
      );

    const {
      data,
      error,
    } = await supabase
      .from(
        "quick_wits"
      )
      .insert({
        ...payload,
        sort_order:
          minOrder - 10,
      })
      .select("*")
      .single();

    if (error) {
      console.error(
        error
      );

      setSaving(false);
      setSaveState(
        "error"
      );
      setErrorMessage(
        "Нова доскочица није сачувана."
      );

      return null;
    }

    persistedIdRef.current =
      data.id;

    setItems(
      (current) => [
        data,
        ...current,
      ]
    );

    setSaving(false);
    setSaveState(
      "saved"
    );

    navigate(
      `/admin/likovi/covek-1/doskocice/${data.id}`,
      {
        replace: true,
      }
    );

    return data;
  }


  useEffect(() => {
    if (
      !hydratedRef.current ||
      isListRoute
    ) {
      return undefined;
    }

    setSaveState(
      "dirty"
    );

    const timeoutId =
      window.setTimeout(
        () => {
          persistForm(
            form
          );
        },
        700
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [
    form.text,
    form.tone,
    form.rotation,
    form.status,
    isListRoute,
  ]);


  function updateForm(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }


  async function deleteItem(
    item
  ) {
    const confirmed =
      window.confirm(
        "Обрисати ову доскочицу? Ово не може да се врати."
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");

    const {
      error,
    } = await supabase
      .from(
        "quick_wits"
      )
      .delete()
      .eq(
        "id",
        item.id
      );

    if (error) {
      console.error(
        error
      );

      setErrorMessage(
        "Доскочица није обрисана."
      );

      return;
    }

    setItems(
      (current) =>
        current.filter(
          (currentItem) =>
            currentItem.id !==
            item.id
        )
    );

    if (
      persistedIdRef.current ===
      item.id
    ) {
      navigate(
        "/admin/likovi/covek-1/doskocice"
      );
    }
  }


  async function togglePublished() {
    const nextStatus =
      form.status ===
        "published"
        ? "draft"
        : "published";

    if (
      nextStatus ===
        "published" &&
      !form.text.trim()
    ) {
      setErrorMessage(
        "Прво упиши доскочицу."
      );

      return;
    }

    const nextForm = {
      ...form,
      status:
        nextStatus,
    };

    setForm(
      nextForm
    );

    await persistForm(
      nextForm,
      {
        force: true,
      }
    );
  }


  async function moveItem(
    item,
    direction
  ) {
    const currentIndex =
      items.findIndex(
        (candidate) =>
          candidate.id ===
          item.id
      );

    const targetIndex =
      currentIndex +
      direction;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >=
        items.length
    ) {
      return;
    }

    const target =
      items[targetIndex];

    const itemOrder =
      Number(
        item.sort_order ??
        currentIndex * 10
      );

    const targetOrder =
      Number(
        target.sort_order ??
        targetIndex * 10
      );

    setErrorMessage("");

    const firstResult =
      await supabase
        .from(
          "quick_wits"
        )
        .update({
          sort_order:
            targetOrder,
        })
        .eq(
          "id",
          item.id
        );

    const secondResult =
      await supabase
        .from(
          "quick_wits"
        )
        .update({
          sort_order:
            itemOrder,
        })
        .eq(
          "id",
          target.id
        );

    if (
      firstResult.error ||
      secondResult.error
    ) {
      console.error(
        firstResult.error ||
        secondResult.error
      );

      setErrorMessage(
        "Редослед није сачуван."
      );

      return;
    }

    setItems(
      (current) => {
        const next =
          [...current];

        const [moved] =
          next.splice(
            currentIndex,
            1
          );

        next.splice(
          targetIndex,
          0,
          moved
        );

        return next.map(
          (currentItem) => {
            if (
              currentItem.id ===
              item.id
            ) {
              return {
                ...currentItem,
                sort_order:
                  targetOrder,
              };
            }

            if (
              currentItem.id ===
              target.id
            ) {
              return {
                ...currentItem,
                sort_order:
                  itemOrder,
              };
            }

            return currentItem;
          }
        );
      }
    );
  }


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


  if (
    loading
  ) {
    return (
      <section className="admin-quick-wits">
        <p className="admin-quick-wits__loading">
          Учитавање...
        </p>
      </section>
    );
  }


  if (
    noteId &&
    !selectedItem
  ) {
    return (
      <Navigate
        to="/admin/likovi/covek-1/doskocice"
        replace
      />
    );
  }


  if (isListRoute) {
    return (
      <section className="admin-quick-wits">
        <div className="admin-quick-wits__topbar">
          <Link
            to="/admin/likovi/covek-1"
            className="admin-quick-wits__back"
          >
            ← ЧОВЕК 1
          </Link>

          <Link
            to="/autor/covek/doskocice"
            className="admin-quick-wits__public-link"
            target="_blank"
            rel="noreferrer"
          >
            ОТВОРИ ЈАВНУ СТРАНИЦУ ↗
          </Link>
        </div>


        <header className="admin-quick-wits__heading">
          <div>
            <p className="admin-quick-wits__eyebrow">
              ЧОВЕК 1
            </p>

            <h1>
              БРЗЕ ДОСКОЧИЦЕ
            </h1>

            <p>
              Кратки записи на папирићима. Свака измена у едитору се аутоматски чува.
            </p>
          </div>

          <Link
            to="/admin/likovi/covek-1/doskocice/novi"
            className="admin-quick-wits__new"
          >
            + НОВА ДОСКОЧИЦА
          </Link>
        </header>


        {errorMessage && (
          <p className="admin-quick-wits__error">
            {errorMessage}
          </p>
        )}


        <div className="admin-quick-wits__list">
          {items.length === 0 ? (
            <div className="admin-quick-wits__empty">
              Нема доскочица. Направи прву.
            </div>
          ) : (
            items.map(
              (
                item,
                index
              ) => (
                <article
                  key={item.id}
                  className="admin-quick-wits__row"
                >
                  <div
                    className={`admin-quick-wits__mini-note admin-quick-wits__mini-note--${item.tone || "yellow"}`}
                    style={{
                      transform:
                        `rotate(${clampRotation(item.rotation)}deg)`,
                    }}
                    aria-hidden="true"
                  >
                    {item.text || "..."}
                  </div>

                  <div className="admin-quick-wits__row-main">
                    <div className="admin-quick-wits__row-meta">
                      <span
                        className={
                          item.status ===
                            "published"
                            ? "admin-quick-wits__status admin-quick-wits__status--published"
                            : "admin-quick-wits__status"
                        }
                      >
                        {item.status ===
                          "published"
                          ? "ОБЈАВЉЕНО"
                          : "DRAFT"}
                      </span>

                      <span>
                        {formatDate(
                          item.created_at
                        )}
                      </span>
                    </div>

                    <p>
                      {item.text ||
                        "Празна доскочица"}
                    </p>
                  </div>

                  <div className="admin-quick-wits__row-actions">
                    <button
                      type="button"
                      onClick={() =>
                        moveItem(
                          item,
                          -1
                        )
                      }
                      disabled={
                        index === 0
                      }
                      title="Помери горе"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        moveItem(
                          item,
                          1
                        )
                      }
                      disabled={
                        index ===
                        items.length - 1
                      }
                      title="Помери доле"
                    >
                      ↓
                    </button>

                    <Link
                      to={`/admin/likovi/covek-1/doskocice/${item.id}`}
                    >
                      УРЕДИ
                    </Link>

                    <button
                      type="button"
                      className="admin-quick-wits__delete"
                      onClick={() =>
                        deleteItem(
                          item
                        )
                      }
                    >
                      ОБРИШИ
                    </button>
                  </div>
                </article>
              )
            )
          )}
        </div>
      </section>
    );
  }


  return (
    <section className="admin-quick-wits">
      <div className="admin-quick-wits__topbar">
        <Link
          to="/admin/likovi/covek-1/doskocice"
          className="admin-quick-wits__back"
        >
          ← СВЕ ДОСКОЧИЦЕ
        </Link>

        <span
          className={
            `admin-quick-wits__save-state admin-quick-wits__save-state--${saveState}`
          }
        >
          {saving ||
          saveState ===
            "saving"
            ? "ЧУВАМ..."
            : saveState ===
                "dirty"
              ? "ИЗМЕНА..."
              : saveState ===
                  "error"
                ? "ГРЕШКА ПРИ ЧУВАЊУ"
                : "САЧУВАНО"}
        </span>
      </div>


      <header className="admin-quick-wits__heading admin-quick-wits__heading--editor">
        <div>
          <p className="admin-quick-wits__eyebrow">
            {isNewRoute
              ? "НОВА ДОСКОЧИЦА"
              : "УРЕЂИВАЊЕ"}
          </p>

          <h1>
            ПАПИРИЋ
          </h1>
        </div>

        <button
          type="button"
          className={
            form.status ===
              "published"
              ? "admin-quick-wits__publish admin-quick-wits__publish--active"
              : "admin-quick-wits__publish"
          }
          onClick={
            togglePublished
          }
        >
          {form.status ===
            "published"
            ? "ВРАТИ У DRAFT"
            : "ОБЈАВИ"}
        </button>
      </header>


      {errorMessage && (
        <p className="admin-quick-wits__error">
          {errorMessage}
        </p>
      )}


      <div className="admin-quick-wits__editor-grid">
        <div className="admin-quick-wits__form">
          <label>
            <span>
              ТЕКСТ
            </span>

            <textarea
              value={form.text}
              onChange={
                (event) =>
                  updateForm(
                    "text",
                    event.target.value
                  )
              }
              rows="10"
              autoFocus
              placeholder="Упиши доскочицу..."
            />
          </label>


          <fieldset>
            <legend>
              БОЈА ПАПИРИЋА
            </legend>

            <div className="admin-quick-wits__tones">
              {TONES.map(
                (tone) => (
                  <button
                    key={tone.value}
                    type="button"
                    className={
                      form.tone ===
                        tone.value
                        ? `admin-quick-wits__tone admin-quick-wits__tone--${tone.value} admin-quick-wits__tone--selected`
                        : `admin-quick-wits__tone admin-quick-wits__tone--${tone.value}`
                    }
                    onClick={() =>
                      updateForm(
                        "tone",
                        tone.value
                      )
                    }
                    aria-pressed={
                      form.tone ===
                      tone.value
                    }
                  >
                    {tone.label}
                  </button>
                )
              )}
            </div>
          </fieldset>


          <label>
            <span>
              НАГИБ: {form.rotation}°
            </span>

            <input
              type="range"
              min="-8"
              max="8"
              step="1"
              value={form.rotation}
              onChange={
                (event) =>
                  updateForm(
                    "rotation",
                    clampRotation(
                      event.target.value
                    )
                  )
              }
            />
          </label>


          <div className="admin-quick-wits__editor-actions">
            <button
              type="button"
              onClick={() =>
                persistForm(
                  form,
                  {
                    force: true,
                  }
                )
              }
              disabled={saving}
            >
              САЧУВАЈ САДА
            </button>

            {persistedIdRef.current && (
              <button
                type="button"
                className="admin-quick-wits__delete"
                onClick={() =>
                  deleteItem({
                    id:
                      persistedIdRef.current,
                  })
                }
              >
                ОБРИШИ
              </button>
            )}
          </div>
        </div>


        <aside className="admin-quick-wits__preview-panel">
          <p>
            ПРЕГЛЕД
          </p>

          <div
            className={`admin-quick-wits__preview-note admin-quick-wits__preview-note--${form.tone}`}
            style={{
              transform:
                `rotate(${form.rotation}deg)`,
            }}
          >
            <span className="admin-quick-wits__preview-tape" />

            <strong>
              {form.text ||
                "Твоја доскочица ће изгледати овако."}
            </strong>
          </div>
        </aside>
      </div>
    </section>
  );
}


export default AdminQuickWits;
