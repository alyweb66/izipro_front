import { Navigate } from 'react-router';
//import Dashboard  from '../Dashboard/Dashboard';
//import { useState } from 'react';

import { ReactNode } from 'react';

const PrivateRoute = ({children}: {children: ReactNode}) => {
   // const [loading, setLoading] = useState(true); // Indique si l'authentification est en cours
  //  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
 /*    useEffect(() => {
      const getItem = localStorage.getItem('login');
      let decodeData;
      if (getItem) {
        try {
          decodeData = JSON.parse(atob(getItem));
        } catch (error) {
          console.error('Error parsing JSON:', error);
          decodeData = null;
        }
      }
      if (decodeData && (decodeData.value === 'session' || decodeData.value === 'true')) {
        setIsAuthenticated(true); // Authentified user
      } else {
        localStorage.removeItem('login');
      }
      setLoading(false);
    }, []); */
  
      // check if user is logged in and if cookie consents are accepted
   //
  
    // condition if user not logged in
    const getItem = localStorage.getItem('login');
    if (!getItem) {
      return children;
    }
    const decodeData = atob(getItem || '');
    let isLogged;

    if (decodeData === 'session' || decodeData === 'true') {
      isLogged = { value: true };
    } else {
      isLogged = JSON.parse(decodeData || '{}');
    }
    if (isLogged) {
   
     // navigate('/dashboard', { replace: true });
     return <Navigate to="/dashboard" replace />;
     //setIsAuthenticated(true);
    }else {
   
      localStorage.removeItem('login');
      
    }

  //};
   /*  if (loading) {
      return <div>Loading...</div>; // 
    }
 */


  // Redirect to home page if the user is not authenticated
  //return isAuthenticated ? <Dashboard /> : <Home />;
};

export default PrivateRoute;