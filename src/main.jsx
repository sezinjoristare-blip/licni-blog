import {
  StrictMode,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import App from "./App";

import {
  AuthProvider,
} from "./context/AuthContext";

import {
  BlogProvider,
} from "./context/BlogContext";

import "./index.css";


if (
  "serviceWorker" in navigator
) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register(
          "/sw.js",
          {
            scope: "/",
          }
        )
        .catch(
          (error) => {
            console.error(
              "Service worker nije registrovan:",
              error
            );
          }
        );
    }
  );
}


createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BlogProvider>
          <App />
        </BlogProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);