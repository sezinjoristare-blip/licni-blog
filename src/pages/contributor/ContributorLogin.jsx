import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../../lib/supabaseClient";

import "../../styles/ContributorSkate.css";


function ContributorLogin() {
  const navigate =
    useNavigate();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");


    try {
      const {
        data,
        error,
      } =
        await supabase.auth
          .signInWithPassword({
            email:
              email
                .trim()
                .toLowerCase(),

            password,
          });


      if (
        error ||
        !data?.user
      ) {
        throw new Error(
          "Погрешан имејл или лозинка."
        );
      }


      const {
        data: contributor,
        error:
          contributorError,
      } = await supabase
        .from(
          "skate_contributors"
        )
        .select(`
          user_id,
          person_key,
          display_name
        `)
        .eq(
          "user_id",
          data.user.id
        )
        .maybeSingle();


      if (
        contributorError ||
        !contributor
      ) {
        await supabase.auth
          .signOut();

        throw new Error(
          "Овај налог нема приступ сарадничком панелу."
        );
      }


      navigate(
        "/saradnik",
        {
          replace: true,
        }
      );

    } catch (error) {
      setErrorMessage(
        error?.message ||
        "Пријава није успела."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="contributor-auth">
      <section className="contributor-auth__card">
        <p className="contributor-auth__eyebrow">
          SKEJT / SARADNIK
        </p>

        <h1>
          ПРИЈАВА
        </h1>

        <p className="contributor-auth__copy">
          Ово је приватни улаз за људе који уређују своје догодовштине.
        </p>


        <form
          className="contributor-auth__form"
          onSubmit={
            handleSubmit
          }
        >
          <label>
            Имејл

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
              autoComplete="current-password"
              value={password}
              onChange={
                (event) =>
                  setPassword(
                    event.target
                      .value
                  )
              }
              required
            />
          </label>


          {errorMessage && (
            <p className="contributor-auth__error">
              {errorMessage}
            </p>
          )}


          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "ПРИЈАВЉУЈЕМ..."
              : "УЂИ У МОЈ ПАНЕЛ"}
          </button>
        </form>


        <Link
          className="contributor-auth__link"
          to="/"
        >
          ← НАЗАД НА САЈТ
        </Link>
      </section>
    </main>
  );
}


export default ContributorLogin;
