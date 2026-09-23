import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../lib/supabaseClient";


const BlogContext =
  createContext(null);


const defaultSiteSettings = {
  entry_image_url: "",
  entry_image_path: "",

  character_one_name:
    "ЧОВЕК 1",

  character_one_image_url:
    "",

  character_one_image_path:
    "",

  character_two_name:
    "ЧОВЕК 2",

  character_two_image_url:
    "",

  character_two_image_path:
    "",

  writing_image_url: "",
  writing_image_path: "",

  about_image_url: "",
  about_image_path: "",

  writing_label:
    "Писање",

  about_label:
    "О мени",

  about_heading:
    "О мени",

  about_text: "",
};


export function BlogProvider({
  children,
}) {
  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    articles,
    setArticles,
  ] = useState([]);

  const [
    siteSettings,
    setSiteSettings,
  ] = useState(
    defaultSiteSettings
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  const loadPublicContent =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");

      const [
        categoriesResult,
        articlesResult,
        settingsResult,
      ] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq(
            "is_visible",
            true
          )
          .order(
            "sort_order",
            {
              ascending: true,
            }
          )
          .order(
            "name",
            {
              ascending: true,
            }
          ),

        supabase
          .from("articles")
          .select(`
            *,
            categories (
              id,
              name,
              slug,
              image_url
            )
          `)
          .eq(
            "status",
            "published"
          )
          .order(
            "published_at",
            {
              ascending:
                false,
            }
          ),

        supabase
          .from(
            "site_settings"
          )
          .select("*")
          .eq("id", 1)
          .maybeSingle(),
      ]);


      if (
        categoriesResult.error
      ) {
        console.error(
          categoriesResult.error
        );

        setErrorMessage(
          categoriesResult
            .error
            .message
        );
      }


      if (
        articlesResult.error
      ) {
        console.error(
          articlesResult.error
        );

        setErrorMessage(
          articlesResult
            .error
            .message
        );
      }


      if (
        settingsResult.error
      ) {
        console.error(
          settingsResult.error
        );

        setErrorMessage(
          settingsResult
            .error
            .message
        );
      }


      setCategories(
        categoriesResult.data ??
          []
      );

      setArticles(
        articlesResult.data ??
          []
      );

      setSiteSettings({
        ...defaultSiteSettings,
        ...(
          settingsResult.data ??
          {}
        ),
      });

      setLoading(false);
    }, []);


  useEffect(() => {
    loadPublicContent();
  }, [
    loadPublicContent,
  ]);


  return (
    <BlogContext.Provider
      value={{
        categories,
        articles,
        siteSettings,
        loading,
        errorMessage,

        refreshPublicContent:
          loadPublicContent,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
}


export function useBlog() {
  const context =
    useContext(
      BlogContext
    );

  if (!context) {
    throw new Error(
      "useBlog мора бити унутар BlogProvider-а."
    );
  }

  return context;
}