import { useEffect, useState } from 'react';
import InstallPWA from '../../Hook/InstallPWA';
import './Presentation.scss';


function Presentation() {
  // State 
  const [imagePosition, setImagePosition] = useState(false);

  // useEffect to check the size of the window
  useEffect(() => {

    // function to check the size of the window
    const handleResize = () => {
      if (window.innerWidth < 800) {
        setImagePosition(true);
      } else {
        setImagePosition(false);
      }
    };

    // add event listener to check the size of the window
    window.addEventListener('resize', handleResize);

    // 	call the function to check the size of the window
    handleResize();

    // remove the event listener when the component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="presentation-container">
      <div className="install-application">
        <h2 className="title">Installer l'application :</h2>
        <InstallPWA />
      </div>
      <h1 className="presentation-container__title">La solution pour connecter efficacement particuliers et professionnels.</h1>
      <div>
        {/* Autres contenus de la page */}
      </div>
      <section className="presentation-container__particular" aria-labelledby="particular-section">
        <h2 id="particular-section" className="visually-hidden">Particuliers</h2>
        <div className="presentation-container__particular image">
          <div className="image image-1" role="img" aria-label="Image de particulier 1"></div>
          <div className="image image-2" role="img" aria-label="Image de particulier 2"></div>
        </div>
        <h2 id="content-section" className="visually-hidden">Contenu</h2>
        <p className="content">
          Plus de temps à perdre ? Dites adieu aux recherches fastidieuses de professionnels. Simplifiez votre vie avec notre plateforme pratique pour faire vos demandes de devis ou d'urgence aux professionnels. Faites place à l'efficacité et gagnez du temps pour ce qui compte vraiment.
        </p>
      </section>

      {imagePosition ? (
        <>
          <section className="presentation-container__particular-pro" aria-labelledby="particular-pro-section">
            <h2 id="particular-pro-section" className="visually-hidden">Particuliers et Professionnels</h2>
            <div className="image image-1" role="img" aria-label="Image de particulier et professionnel 1"></div>
            <div className="image image-2" role="img" aria-label="Image de particulier et professionnel 2"></div>
            <div className="image image-3" role="img" aria-label="Image de particulier et professionnel 3"></div>
          </section>
          <section className="presentation-container__content" aria-labelledby="content-pro-section">
            <h2 id="content-pro-section" className="visually-hidden">Contenu pour Professionnels</h2>
            <p className="content">
              Avec notre plateforme, les jeunes entrepreneurs comme vous peuvent enfin se lancer dans leurs projets avec confiance et facilité. Plus besoin de chercher désespérément des clients - notre réseau dynamique vous met en contact avec les bonnes personnes au bon moment.
            </p>
          </section>
        </>
      ) : (
        <>
          <section className="presentation-container__content" aria-labelledby="content-pro-section">
            <h2 id="content-pro-section" className="visually-hidden">Contenu pour Professionnels</h2>
            <p className="content">
              Avec notre plateforme, les jeunes entrepreneurs comme vous peuvent enfin se lancer dans leurs projets avec confiance et facilité. Plus besoin de chercher désespérément des clients - notre réseau dynamique vous met en contact avec les bonnes personnes au bon moment.
            </p>
          </section>
          <section className="presentation-container__particular-pro" aria-labelledby="particular-pro-section">
            <h2 id="particular-pro-section" className="visually-hidden">Particuliers et Professionnels</h2>
            <div className="image image-1" role="img" aria-label="Image de particulier et professionnel 1"></div>
            <div className="image image-2" role="img" aria-label="Image de particulier et professionnel 2"></div>
            <div className="image image-3" role="img" aria-label="Image de particulier et professionnel 3"></div>
          </section>
        </>
      )}
    </div>
  );
}

export default Presentation;