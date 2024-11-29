// Composants
import Login from './LoginRegister/Login';
import Register from './LoginRegister/Register';
import Presentation from './Presentation/Presentation';
import Footer from '../Footer/Footer';

// React Router
import { useNavigate } from 'react-router';

// Styles
import './Home.scss';

// Hooks React
import { useEffect, useState } from 'react';

function Home() {
  let navigate = useNavigate();
  const [isFooter, setIsFooter] = useState(false);
  const [loginVisibility, setLoginVisibility] = useState(true);

  // check if user is logged in and if cookie consents are accepted
  useEffect(() => {
    // condition if user not logged in
    const getItem = localStorage.getItem('login');
    if (!getItem) {
      return;
    }
    const decodeData = atob(getItem || '');
    let isLogged;

    if (decodeData === 'session') {
      isLogged = { value: true };
    } else {
      isLogged = JSON.parse(decodeData || '{}');
    }
    if (isLogged) {
      navigate('/dashboard', { replace: true });
    }
  }, []);

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
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }

  // clear the cache if the user is not logged in
  if (!localStorage.getItem('login')) {
    sendMessageToServiceWorker({ type: 'CLEAR_CACHE' });
  }

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
