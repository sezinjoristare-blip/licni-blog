import { useState } from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function AdminLogin() {
  const navigate = useNavigate();

  const {
    login,
    isAdmin,
    loading,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  if (loading) {
    return (
      <div className="admin-login-page">
        <p>Provera naloga...</p>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      await login(email, password);

      navigate("/admin", {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Prijava nije uspela."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-login-page">
      <form
        className="admin-login-card"
        onSubmit={handleSubmit}
      >
        <p className="eyebrow">
          PRIVATNI PRISTUP
        </p>

        <h1>Administracija</h1>

        <label>
          Email

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            required
            autoComplete="email"
          />
        </label>

        <label>
          Lozinka

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            required
            autoComplete="current-password"
          />
        </label>

        {errorMessage && (
          <p className="error-message">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          className="primary-button"
          disabled={submitting}
        >
          {submitting
            ? "Prijavljivanje..."
            : "Prijavi se"}
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;