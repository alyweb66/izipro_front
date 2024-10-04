import React, { useEffect, useState } from 'react';
//import { MdInstallMobile } from "react-icons/md";
import { motion } from 'framer-motion';
import Spinner from './Spinner';
import '../../styles/installPWA.scss';
// Déclare le type d'événement `beforeinstallprompt`
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
    // Verify if the app is installed as a PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      console.log('L\'application est installée en tant qu\'application autonome');

      setIsInstalled(true);
    } else {
      console.log('L\'application n\'est pas installée en tant qu\'application autonome');

      // Check if the app is installed using getInstalledRelatedApps
      if ('getInstalledRelatedApps' in navigator) {
        (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
          if (apps.length > 0) {
            console.log('L\'application est installée en tant qu\'application liée');

            setIsInstalled(true);
          }
        });
      }
    }

    // Détecter le type de navigateur
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('chrome') > -1) {
      setBrowserName('Chrome');
    } else if (userAgent.indexOf('firefox') > -1) {
      setBrowserName('Firefox');
    } else if (userAgent.indexOf('safari') > -1) {
      setBrowserName('Safari');
    } else if (userAgent.indexOf('edge') > -1) {
      setBrowserName('Edge');
    } else {
      setBrowserName('un navigateur non supporté');
    }
    // function to handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('handleBeforeInstallPrompt', e);

      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;

      setDeferredPrompt(event);
      setShowInstallButton(true);
      setEventTriggered(true);
      setIsLoading(false);
    };

    // Verify if the browser supports the beforeinstallprompt event
    if ('onbeforeinstallprompt' in window) {
      console.log('Le navigateur supporte l\'installation d\'applications');


      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      // Vérifiez si l'événement n'a pas été déclenché après 5 secondes
      setIsLoading(true);
      setTimeout(() => {
        if (!eventTriggered) {
          console.log('L\'événement beforeinstallprompt n\'a pas été déclenché. L\'application est peut-être déjà installée.');
          setIsInstalled(true);
        }
        setIsLoading(false);
      }, 3000); // 5 secondes
    } else {
      setIsCompatible(false);
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    console.log('handleInstallClick', deferredPrompt);

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log("L'utilisateur a accepté d'installer l'application");
        } else {
          console.log("L'utilisateur a refusé l'installation");
        }
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
          {/* <MdInstallMobile className="install-button"
            onClick={() => document.getElementById('install')?.click()}
            aria-label='Joindre un fichier'
          /> */}
          <div className="install-button" ></div>

          <button id="install" onClick={handleInstallClick} style={{ display: 'none' }}>
          </button>
        </>
      )}
      {!showInstallButton && !isCompatible && (
        <div className="message-PWA">
          {browserName === 'Firefox' && (
            <p className="content-PWA">L'installation de l'application n'est pas supportée sur Firefox, utilisez Chrome ou un autre navigateur pour installer l'application.</p>
          )}
          {browserName === 'Safari' && (
            <p className="content-PWA">Pour installer l'application depuis Safari, cliquez sur le bouton de partage du navigateur et sélectionnez l'option : <strong className="strong-PWA">“Ajouter à l'écran d'accueil”.</strong></p>
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
