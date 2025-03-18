import { Navigate } from 'react-router';
import { ReactNode } from 'react';

const PrivateRoute = ({ children }: { children: ReactNode }) => {
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
  } else {
    localStorage.removeItem('login');
  }
};

export default PrivateRoute;
