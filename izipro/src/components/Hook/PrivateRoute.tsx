import { Navigate } from 'react-router-dom';
import Dashboard  from '../Dashboard/Dashboard';
import { useEffect, useState } from 'react';

const PrivateRoute = () => {
    const [loading, setLoading] = useState(true); // Indique si l'authentification est en cours
    const [isAuthenticated, setIsAuthenticated] = useState(false);
  
    useEffect(() => {
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
    }, []);
  
    if (loading) {
      return <div>Loading...</div>; // 
    }



  // Redirect to home page if the user is not authenticated
  return isAuthenticated ? <Dashboard /> : <Navigate to="/" />;
};

export default PrivateRoute;