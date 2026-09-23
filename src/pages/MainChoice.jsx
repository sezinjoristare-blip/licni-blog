import { Link } from "react-router-dom";

import { useBlog } from "../context/BlogContext";

function MainChoice() {
  const {
    siteSettings,
  } = useBlog();

  return (
    <main className="choice-page">
      <Link
        to="/pisanje"
        className="main-choice-card"
      >
        {siteSettings.writing_image_url && (
          <img
            src={
              siteSettings.writing_image_url
            }
            alt=""
          />
        )}

        <div className="choice-overlay" />

        <span>
          {siteSettings.writing_label ||
            "Pisanje"}
        </span>
      </Link>

      <Link
        to="/o-meni"
        className="main-choice-card"
      >
        {siteSettings.about_image_url && (
          <img
            src={
              siteSettings.about_image_url
            }
            alt=""
          />
        )}

        <div className="choice-overlay" />

        <span>
          {siteSettings.about_label ||
            "O meni"}
        </span>
      </Link>
    </main>
  );
}

export default MainChoice;