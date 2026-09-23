import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../../lib/supabaseClient";


const FIXED_ZONES = [
  {
    slug:
      "ekipa-zid",

    name:
      "ЕКИПА / ЗИД",

    position:
      "ГОРЕ / ЗИД",

    purpose:
      "Заједничке вожње, стара скејт и паркур екипа, снимци, фотографије и приче.",
  },

  {
    slug:
      "dogodovstine",

    name:
      "ЛИЧНЕ ДОГОДОВШТИНЕ",

    position:
      "ВРХ ЗИДА",

    purpose:
      "Личне приче, случајеви, успомене и ситне авантуре из свакодневног живота.",
  },

  {
    slug:
      "voznja",

    name:
      "ВОЖЊА",

    position:
      "ДОЛЕ ЛЕВО",

    purpose:
      "Лична вожња: ролери, скејт, BMX, тротинет и други снимци и фотографије.",
  },

  {
    slug:
      "ulica",

    name:
      "УЛИЦА",

    position:
      "ДОЛЕ ДЕСНО",

    purpose:
      "Графити, street art, занимљиви зидови, град и ситне приче са улице.",
  },
];


function AdminSkateSections() {
  const [
    sections,
    setSections,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  useEffect(() => {
    let active =
      true;


    async function loadSections() {
      setLoading(
        true
      );

      setErrorMessage(
        ""
      );


      const {
        data,
        error,
      } = await supabase
        .from(
          "skate_sections"
        )
        .select("*")
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        )
        .order(
          "created_at",
          {
            ascending:
              true,
          }
        );


      if (!active) {
        return;
      }


      if (error) {
        setErrorMessage(
          error.message
        );

        setLoading(
          false
        );

        return;
      }


      setSections(
        data ?? []
      );

      setLoading(
        false
      );
    }


    loadSections();


    return () => {
      active =
        false;
    };
  }, []);


  if (loading) {
    return (
      <p>
        Учитавање зона...
      </p>
    );
  }


  if (errorMessage) {
    return (
      <p className="error-message">
        {errorMessage}
      </p>
    );
  }


  const resolvedZones =
    FIXED_ZONES.map(
      (
        fixedZone
      ) => ({
        ...fixedZone,

        section:
          sections.find(
            (
              item
            ) =>
              item.slug ===
              fixedZone.slug
          ) ||
          null,
      })
    );


  return (
    <section className="admin-skate__section">
      <div className="admin-skate__section-heading">
        <div>
          <p className="eyebrow">
            СКЕЈТ / ЗОНЕ
          </p>

          <h2>
            Четири стална света
          </h2>
        </div>

        <p>
          Скејт свет има четири
          фиксне зоне. Нове зоне
          се не додају и постојеће
          се не бришу.
        </p>
      </div>


      <div className="admin-list">
        {resolvedZones.map(
          ({
            slug,
            name,
            position,
            purpose,
            section,
          }) => (
            <article
              key={
                slug
              }
              className="admin-list-item"
            >
              <div className="admin-list-info">
                {section
                  ?.image_url ? (
                  <img
                    className="admin-list-thumb"
                    src={
                      section
                        .image_url
                    }
                    alt=""
                  />
                ) : null}


                <div>
                  <p className="admin-status">
                    СТАЛНА ЗОНА
                    {" · "}
                    {position}

                    {section ? (
                      <>
                        {" · "}

                        {section.status ===
                        "published"
                          ? "ОБЈАВЉЕНА"
                          : "НАЦРТ"}
                      </>
                    ) : null}
                  </p>


                  <h3>
                    {name}
                  </h3>


                  {section ? (
                    <>
                      <p>
                        {section.description ||
                          purpose}
                      </p>

                      {!section.image_url ? (
                        <p>
                          <strong>
                            Илустрација:
                          </strong>
                          {" "}
                          додаћемо је
                          касније.
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="error-message">
                      Ова зона није
                      пронађена у бази.
                    </p>
                  )}
                </div>
              </div>
            </article>
          )
        )}
      </div>
    </section>
  );
}


export default AdminSkateSections;