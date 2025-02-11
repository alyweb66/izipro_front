//import { Outlet } from "react-router";
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Outlet, useLocation } from 'react-router';
import './Root.scss';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

function Root() {
  let navigate = useNavigate();
  const location = useLocation();
  // state
  const [isFooter, setIsFooter] = useState(true);
  
  const isConfirmEmailRoute = location.pathname === '/confirm-email';
  // disable background image on home page
  useEffect(() => {
    // check whitch page is active
    /* if (window.location.pathname === '/') {
      //add className to root
      document.querySelector('.root')?.classList.add('no-background-image');
    } */

    if (
      localStorage.getItem('login') === null &&
      window.location.pathname !== '/forgot-password' &&
      window.location.pathname !== '/confirm-email'
    ) {
      navigate('/', { replace: true });
    }
  }, []);

  // useEffect to check the size of the window
  useEffect(() => {
    // function to check the size of the window
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setIsFooter(false);
      } else {
        setIsFooter(true);
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
    <div className="root">
      {!isConfirmEmailRoute && <Header />}
      <Outlet />
      {isFooter && !isConfirmEmailRoute && <Footer />}
    </div>
  );
}

export default Root;
