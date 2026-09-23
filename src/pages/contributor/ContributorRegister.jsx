import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  supabase,
} from "../../lib/supabaseClient";

import "../../styles/ContributorSkate.css";


function ContributorRegister() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] =
    useSearchParams();

  const inviteToken =
    searchParams.get(
      "poziv"
    ) || "";

  const [
    invite,
    setInvite,
  ] = useState(null);

  const [
    loadingInvite,
    setLoadingInvite,
  ] = useState(true);

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    passwordAgain,
    setPasswordAgain,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  useEffect(() => {
    let active = true;


    async function loadInvite() {
      setLoadingInvite(
        true
      );

      setErrorMessage("");


      if (!inviteToken) {
        setInvite(null);

        setErrorMessage(
          "Позивница недостаје."
        );

        setLoadingInvite(
          false
        );

        return;
      }


      const {
        data,
        error,
      } = await supabase.rpc(
        "preview_skate_invite",
        {
          p_invite_token:
            inviteToken,
        }
      );


      if (!active) {
        return;
      }


      if (
        error ||
        !Array.isArray(data) ||
        !data.length
      ) {
        setInvite(null);

        setErrorMessage(
          "Ова позивница није важећа или је већ искоришћена."
        );

        setLoadingInvite(
          false
        );

        return;
      }


      setInvite(
        data[0]
      );

      setLoadingInvite(
        false
      );
    }


    loadInvite();


    return () => {
      active = false;
    };
  }, [inviteToken]);


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    if (!invite) {
      return;
    }


    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");


    try {
      const cleanEmail =
        email.trim()
          .toLowerCase();


      if (!cleanEmail) {
        throw new Error(
          "Унеси своју имејл адресу."
        );
      }


      if (
        password.length < 8
      ) {
        throw new Error(
          "Лозинка мора да има најмање 8 знакова."
        );
      }


      if (
        password !==
        passwordAgain
      ) {
        throw new Error(
          "Лозинке се не поклапају."
        );
      }


      const {
        data,
        error,
      } =
        await supabase.auth
          .signUp({
            email:
              cleanEmail,

            password,

            options: {
              data: {
                skate_invite_token:
                  inviteToken,
              },
            },
          });


      if (error) {
        throw error;
      }


      /*
        Ako je Confirm Email isključen,
        Supabase odmah vraća session.

        Ako je uključen, DB trigger je
        saradnika već povezao sa njegovim
        likom, a on samo treba da potvrdi
        email i zatim se prijavi.
      */
      if (data?.session) {
        navigate(
          "/saradnik",
          {
            replace: true,
          }
        );

        return;
      }


      setSuccessMessage(
        "Налог је направљен. Провери свој имејл, потврди налог ако Supabase то тражи, па се пријави."
      );

      setPassword("");
      setPasswordAgain("");

    } catch (error) {
      console.error(
        "Registracija saradnika:",
        error
      );

      setErrorMessage(
        error?.message ||
        "Регистрација није успела."
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <main className="contributor-auth">
      <section className="contributor-auth__card">
        <p className="contributor-auth__eyebrow">
          SKEJT / PRIVATNI POZIV
        </p>

        <h1>
          САРАДНИЧКИ НАЛОГ
        </h1>


        {loadingInvite ? (
          <p className="contributor-auth__state">
            ПРОВЕРА ПОЗИВНИЦЕ...
          </p>

        ) : !invite ? (
          <>
            <p className="contributor-auth__error">
              {errorMessage}
            </p>

            <Link
              className="contributor-auth__link"
              to="/"
            >
              ← НАЗАД НА САЈТ
            </Link>
          </>

        ) : (
          <>
            <div className="contributor-auth__identity">
              <span>
                ОВА ПОЗИВНИЦА ЈЕ ЗА
              </span>

              <strong>
                {invite.display_name}
              </strong>
            </div>


            <p className="contributor-auth__copy">
              Направи свој налог. Овим налогом моћи ћеш да додајеш,
              мењаш и бришеш искључиво своје догодовштине.
            </p>


            <form
              className="contributor-auth__form"
              onSubmit={
                handleSubmit
              }
            >
              <label>
                Твој имејл

                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={
                    (event) =>
                      setEmail(
                        event.target
                          .value
                      )
                  }
                  required
                />
              </label>


              <label>
                Лозинка

                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={
                    (event) =>
                      setPassword(
                        event.target
                          .value
                      )
                  }
                  minLength="8"
                  required
                />
              </label>


              <label>
                Понови лозинку

                <input
                  type="password"
                  autoComplete="new-password"
                  value={
                    passwordAgain
                  }
                  onChange={
                    (event) =>
                      setPasswordAgain(
                        event.target
                          .value
                      )
                  }
                  minLength="8"
                  required
                />
              </label>


              {errorMessage && (
                <p className="contributor-auth__error">
                  {errorMessage}
                </p>
              )}


              {successMessage && (
                <p className="contributor-auth__success">
                  {successMessage}
                </p>
              )}


              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "ПРАВИМ НАЛОГ..."
                  : "НАПРАВИ МОЈ НАЛОГ"}
              </button>
            </form>


            <p className="contributor-auth__footer">
              Већ имаш налог?
              {" "}

              <Link
                to="/saradnik/prijava"
              >
                Пријави се
              </Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}


export default ContributorRegister;
