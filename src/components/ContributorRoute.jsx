import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";


function ContributorRoute({
  children,
}) {
  const [
    state,
    setState,
  ] = useState({
    loading: true,
    allowed: false,
  });


  useEffect(() => {
    let active = true;


    async function checkAccess() {
      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser();


      if (!active) {
        return;
      }


      if (
        userError ||
        !userData?.user
      ) {
        setState({
          loading: false,
          allowed: false,
        });

        return;
      }


      const {
        data: contributor,
        error: contributorError,
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
          userData.user.id
        )
        .maybeSingle();


      if (!active) {
        return;
      }


      setState({
        loading: false,

        allowed:
          !contributorError &&
          Boolean(
            contributor
          ),
      });
    }


    checkAccess();


    const {
      data: authListener,
    } =
      supabase.auth
        .onAuthStateChange(
          () => {
            checkAccess();
          }
        );


    return () => {
      active = false;

      authListener
        ?.subscription
        ?.unsubscribe();
    };
  }, []);


  if (state.loading) {
    return (
      <main
        style={{
          minHeight:
            "100dvh",

          display:
            "grid",

          placeItems:
            "center",

          background:
            "#111",

          color:
            "#f5f0e4",

          fontFamily:
            '"Courier New", monospace',

          fontWeight:
            900,
        }}
      >
        ПРОВЕРА ПРИСТУПА...
      </main>
    );
  }


  if (!state.allowed) {
    return (
      <Navigate
        to="/saradnik/prijava"
        replace
      />
    );
  }


  return children;
}


export default ContributorRoute;
