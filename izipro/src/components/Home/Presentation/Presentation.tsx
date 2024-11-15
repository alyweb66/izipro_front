import { useEffect, useState } from 'react';
import InstallPWA from '../../Hook/InstallPWA';
import './Presentation.scss';
import { AnimatePresence, motion } from 'framer-motion';


function Presentation() {
  // State 
  const [index, setIndex] = useState(0);
  const [proIndex, setProIndex] = useState(0);
  const [imagePosition, setImagePosition] = useState(false);

  const imageParticular = [
    '/images/Familly.webp',
    '/images/Fix-washing-machine.webp',
    '/images/Hurry.webp'

  ];

  const imagePro = [
    '/images/Welding.webp',
    '/images/Start-up.webp',
    '/images/Deal.webp'
  ];

  // Image transition
  useEffect(() => {
    const intervalPro = setInterval(() => {
      setProIndex((prevProIndex) => (prevProIndex + 1) % imagePro.length);
    }, 5000); // Change image every 3 seconds

    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % imageParticular.length);
    }, 5000); // Change image every 3 seconds

    return () => {
      clearInterval(interval);
      clearInterval(intervalPro);
    };
  }, [index, proIndex]);

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
          <div
            className="image image-1"
          // Fade duration
          >
            <AnimatePresence >
              <motion.img
                key={imageParticular[index]} // key is important for AnimatePresence to work properly
                src={imageParticular[index]}
                alt={`Slide ${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3 }}
                style={{
                  position: "absolute", // Ensure images overlap during transition
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </AnimatePresence>
          </div>
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
            <div
              className="image image-1"
            >
              <AnimatePresence >
                <motion.img
                  key={imagePro[proIndex]}
                  src={imagePro[proIndex]}
                  alt={`Slide ${proIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 3 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </AnimatePresence>
            </div>
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
            <div
              className="image image-1"
            >
              <AnimatePresence >
                <motion.img
                  key={imagePro[proIndex]}
                  src={imagePro[proIndex]}
                  alt={`Slide ${proIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 3 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </AnimatePresence>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Presentation;