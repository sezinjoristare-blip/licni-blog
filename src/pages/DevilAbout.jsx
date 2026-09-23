import {
  useNavigate,
} from "react-router-dom";


function DevilAbout() {
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
        O Đavolu
      </h1>
    </main>
  );
}

export default DevilAbout;