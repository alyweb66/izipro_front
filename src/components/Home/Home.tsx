// Composants
import Login from './LoginRegister/Login';
import Register from './LoginRegister/Register';
import Presentation from './Presentation/Presentation';
import Footer from '../Footer/Footer';

// Styles
import './Home.scss';

// Hooks React
import { useEffect, useState } from 'react';

function Home() {
  /* let navigate = useNavigate(); */
  const [isFooter, setIsFooter] = useState(false);
  const [loginVisibility, setLoginVisibility] = useState(true);
  const [isServiceWorker, setIsServiceWorker] = useState(false);

  const userAgent = navigator.userAgent.toLowerCase();
  const isInAppBrowser =
    userAgent.includes('instagram') ||
    userAgent.includes('fbav') ||
    userAgent.includes('fban') ||
    userAgent.includes('gsa') ||
    userAgent.includes('GSA');

  // useEffect to check the size of the window
  useEffect(() => {
    // function to check the size of the window
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setIsFooter(true);
      } else {
        setIsFooter(false);
      }
    };

    // add event listener to check the size of the window
    window.addEventListener('resize', handleResize);

    // 	call the function to check the size of the window
    handleResize();

    // remove the event listener when the component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // send a message to the service worker
  function sendMessageToServiceWorker(message: { type: string }) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }
  useEffect(() => {
    const checkServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) {
        setIsServiceWorker(false);
        return;
      }

      try {
        // 1. Vérifier les inscriptions existantes
        const registrations = await navigator.serviceWorker.getRegistrations();

        // 2. Vérifier si au moins un SW contrôle la page
        const isActive = registrations.some(
          (reg) => reg.active && reg.active.state === 'activated'
        );

        // 3. Vérifier via le controller
        const hasController = !!navigator.serviceWorker.controller;

        setIsServiceWorker(isActive || hasController);
      } catch (error) {
        // console.error('Erreur de vérification:', error);
        setIsServiceWorker(false);
      }
    };

    checkServiceWorker();
    // clear the cache if the user is not logged in
    if (isServiceWorker && !localStorage.getItem('login') && !isInAppBrowser) {
      sendMessageToServiceWorker({ type: 'CLEAR_CACHE' });
    }
  }, []);

  return (
    <div className="home">
      {window.innerWidth < 480 ? loginVisibility && <Login /> : <Login />}
      <Register
        setLoginVisibility={setLoginVisibility}
        loginVisibility={loginVisibility}
      />
      <Presentation />
      {isFooter && <Footer />}
    </div>
  );
}

export default Home;
