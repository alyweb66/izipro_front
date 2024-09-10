import { Navigate } from 'react-router-dom';
import Dashboard  from '../Dashboard/Dashboard';
import { useEffect, useState } from 'react';

const PrivateRoute = () => {
    const [loading, setLoading] = useState(true); // Indique si l'authentification est en cours
    const [isAuthenticated, setIsAuthenticated] = useState(false);
  
    useEffect(() => {
      const login = localStorage.getItem('login');
      if (login) {
        setIsAuthenticated(true); // L'utilisateur est authentifié
      }
      setLoading(false); // Chargement terminé
    }, []);
  
    // Si en cours de vérification, on affiche un indicateur de chargement (ou rien)
    if (loading) {
      return <div>Loading...</div>; // Ou un spinner, etc.
    }

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page d'accueil
  return isAuthenticated ? <Dashboard /> : <Navigate to="/" />;
};

export default PrivateRoute;