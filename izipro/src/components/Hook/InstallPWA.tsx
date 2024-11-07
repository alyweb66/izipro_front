import React, { useEffect, useState } from 'react';
//import { MdInstallMobile } from "react-icons/md";
import { motion } from 'framer-motion';
import Spinner from './Spinner';
import UAParser from 'ua-parser-js';
import '../../styles/installPWA.scss';

// type of event `beforeinstallprompt`
interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isCompatible, setIsCompatible] = useState(true);
  const [browserName, setBrowserName] = useState('');
  const [isInstalled, setIsInstalled] = useState(false);
  const [eventTriggered, setEventTriggered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
        // Réinitialiser l'état pour éviter des valeurs conservées incorrectement
        setIsInstalled(false);
    // Verify if the app is installed as a PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      // console.log('L\'application est installée en tant qu\'application autonome');

      setIsInstalled(true);
    } else {
      // console.log('L\'application n\'est pas installée en tant qu\'application autonome');

      // Check if the app is installed using getInstalledRelatedApps
      if ('getInstalledRelatedApps' in navigator) {
        (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
          if (apps.length > 0) {
            //  console.log('L\'application est installée en tant qu\'application liée');

            setIsInstalled(true);
          }
        });
      }
    }

    // Detect type of browser
    const userAgent = navigator.userAgent.toLowerCase();
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const nameBrowser: string = result.browser.name || 'un navigateur non supporté';
    setBrowserName(nameBrowser);


    // function to handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // console.log('handleBeforeInstallPrompt', e);

      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;

      setDeferredPrompt(event);
      setShowInstallButton(true);
      setEventTriggered(true);
      setIsLoading(false);
    };

    // Verify if the browser supports the beforeinstallprompt event
    if ('onbeforeinstallprompt' in window) {
      // console.log('Le navigateur supporte l\'installation d\'applications');
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      // Verify if the event was triggered
      setIsLoading(true);
      setTimeout(() => {
        if (!eventTriggered) {
          //  console.log('L\'événement beforeinstallprompt n\'a pas été déclenché. L\'application est peut-être déjà installée.');
          setIsInstalled(true);
        }
        setIsLoading(false);
      }, 1000); // 1 secondes
    } else {
      setIsCompatible(false);
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Function to handle the installation of the app
  const handleInstallClick = () => {

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setShowInstallButton(false);
        setIsInstalled(true);
      });
    }
  };

  return (
    <>
      {showInstallButton && (
        <>
          <div
            className="install-button"
            onClick={() => document.getElementById('install')?.click()}
            aria-label='Joindre un fichier'
          >
          </div>

          <button id="install" onClick={handleInstallClick} style={{ display: 'none' }}>
          </button>
        </>
      )}
      {!showInstallButton && !isCompatible && (
        <div className="message-PWA">
          {browserName === 'firefox' && (
            <p className="content-PWA">L'installation de l'application n'est pas supportée sur Firefox, utilisez Chrome ou un autre navigateur pour installer l'application.</p>
          )}
          {(browserName === 'Safari' || browserName === 'Mobile Safari') && (
            <p className="content-PWA">Pour installer l'application depuis Safari, cliquez sur le bouton de partage du navigateur et sélectionnez l'option : <strong className="strong-PWA">“Sur l'écran d'accueil”.</strong></p>
          )}
          {browserName === 'un navigateur non supporté' && (
            <p className="content-PWA">L'installation de l'application n'est pas supportée sur ce navigateur.</p>
          )}
        </div>
      )}
      {isInstalled && !showInstallButton && (
        <div className="message-PWA">
          {isLoading ? (
            <Spinner className="small-spinner" />
          ) :
            (
              <motion.p
                className="content-PWA"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
                transition={{ duration: 0.1, type: 'tween' }}
              >
                L'application est déjà installé, pour la réinstaller manuellement sélectionner <strong className="strong-PWA">“Ajouter à l'écran d'accueil”</strong> dans le menu de votre navigateur </motion.p>
            )
          }
        </div>
      )}
    </>
  );
};

export default InstallPWA;
