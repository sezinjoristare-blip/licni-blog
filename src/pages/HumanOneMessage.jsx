import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import "../styles/pages/HumanOneMessage.css";


function HumanOneMessage() {
  const navigate =
    useNavigate();

  const [
    statusMessage,
    setStatusMessage,
  ] = useState("");

  const [
    isSending,
    setIsSending,
  ] = useState(false);


  function handleBack() {
    navigate(
      "/autor/covek"
    );
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (isSending) {
      return;
    }

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    const payload = {
      name:
        String(
          formData.get("name") ||
          ""
        ).trim(),

      email:
        String(
          formData.get("email") ||
          ""
        ).trim(),

      subject:
        String(
          formData.get("subject") ||
          ""
        ).trim(),

      message:
        String(
          formData.get("message") ||
          ""
        ).trim(),

      website:
        String(
          formData.get("website") ||
          ""
        ).trim(),
    };


    setIsSending(true);

    setStatusMessage(
      "ШАЉЕМ ПОРУКУ..."
    );


    try {
      const {
        data,
        error,
      } =
        await supabase
          .functions
          .invoke(
            "send-contact-message",
            {
              body:
                payload,
            }
          );


      if (error) {
        throw error;
      }


      if (
        data?.error
      ) {
        throw new Error(
          data.error
        );
      }


      if (
        !data?.success
      ) {
        throw new Error(
          "Није добијена потврда о слању."
        );
      }


      form.reset();

      setStatusMessage(
        "ПОРУКА ЈЕ ПОСЛАТА. ХВАЛА!"
      );
    } catch (error) {
      console.error(
        "Slanje poruke:",
        error
      );

      setStatusMessage(
        "ПОРУКА ТРЕНУТНО НЕ МОЖЕ ДА СЕ ПОШАЉЕ. ПОКУШАЈ ПОНОВО."
      );
    } finally {
      setIsSending(false);
    }
  }


  return (
    <main className="human-one-message">
      <div
        className="human-one-message__noise"
        aria-hidden="true"
      />

      <button
        type="button"
        className="human-one-message__back"
        onClick={
          handleBack
        }
      >
        ← НАЗАД У СОБУ
      </button>

      <section className="human-one-message__desk">
        <div
          className="human-one-message__stamp"
          aria-hidden="true"
        >
          ПОШТА
        </div>

        <div className="human-one-message__paper">
          <header className="human-one-message__header">
            <p>
              ИМАШ НЕШТО ДА МИ КАЖЕШ?
            </p>

            <h1>
              ПОШАЉИ МИ ПОРУКУ
            </h1>

            <span>
              Писмо, питање, идеја, предлог или само поздрав.
            </span>
          </header>

          <form
            className="human-one-message__form"
            onSubmit={
              handleSubmit
            }
          >
            <label>
              <span>ИМЕ</span>

              <input
                type="text"
                name="name"
                autoComplete="name"
                maxLength="80"
                required
              />
            </label>

            <label>
              <span>Е-МЕЈЛ</span>

              <input
                type="email"
                name="email"
                autoComplete="email"
                maxLength="160"
                required
              />
            </label>

            <label className="human-one-message__wide-field">
              <span>НАСЛОВ</span>

              <input
                type="text"
                name="subject"
                maxLength="140"
                required
              />
            </label>

            <label className="human-one-message__wide-field">
              <span>ПОРУКА</span>

              <textarea
                name="message"
                rows="8"
                maxLength="5000"
                required
              />
            </label>

            <div
              aria-hidden="true"
              style={{
                position:
                  "absolute",

                left:
                  "-10000px",

                width:
                  "1px",

                height:
                  "1px",

                overflow:
                  "hidden",
              }}
            >
              <label>
                Website

                <input
                  type="text"
                  name="website"
                  tabIndex="-1"
                  autoComplete="off"
                />
              </label>
            </div>

            <div className="human-one-message__footer">
              <p
                className="human-one-message__status"
                aria-live="polite"
              >
                {statusMessage}
              </p>

              <button
                type="submit"
                className="human-one-message__submit"
                disabled={
                  isSending
                }
              >
                {isSending
                  ? "ШАЉЕМ..."
                  : "ПОШАЉИ ПОРУКУ"}
              </button>
            </div>
          </form>
        </div>

        <div
          className="human-one-message__tape human-one-message__tape--left"
          aria-hidden="true"
        />

        <div
          className="human-one-message__tape human-one-message__tape--right"
          aria-hidden="true"
        />
      </section>
    </main>
  );
}


export default HumanOneMessage;