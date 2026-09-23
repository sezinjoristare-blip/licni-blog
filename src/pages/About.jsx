import {
  Link,
} from "react-router-dom";

import {
  useBlog,
} from "../context/BlogContext";


function About() {
  const {
    siteSettings,
  } = useBlog();


  return (
    <main className="scene-page about-scene">
      <Link
        to="/autor/covek"
        className="scene-back"
        aria-label="Назад у собу"
      >
        ←
      </Link>


      <section className="about-content">
        {siteSettings.about_image_url && (
          <img
            className="about-photo"
            src={
              siteSettings
                .about_image_url
            }
            alt=""
          />
        )}


        <div className="about-text">
          <p className="about-label">
            O MENI
          </p>


          <h1>
            {siteSettings
              .about_heading ||
              "O meni"}
          </h1>


          <div className="about-biography">
            {siteSettings
              .about_text ||
              "Ovde će stajati tekst koji uneseš kroz administraciju."}
          </div>
        </div>
      </section>
    </main>
  );
}


export default About;