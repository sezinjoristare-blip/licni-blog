import {
  useNavigate,
} from "react-router-dom";


function DevilTalks() {
  const navigate =
    useNavigate();

  return (
    <main>
      <button
        type="button"
        onClick={
          () => navigate(
            "/autor/djavo",
          )
        }
      >
        ← Nazad
      </button>

      <h1>
        Izgubljene duše
      </h1>
    </main>
  );
}

export default DevilTalks;