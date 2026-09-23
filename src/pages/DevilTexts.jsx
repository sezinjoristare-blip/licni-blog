import {
  useNavigate,
} from "react-router-dom";


function DevilTexts() {
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
        Đavolovi tekstovi
      </h1>
    </main>
  );
}

export default DevilTexts;