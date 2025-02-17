import { Navigate } from 'react-router';
import { ReactNode, useEffect } from 'react';
import { serverErrorStore } from '../../store/LoginRegister';
import { useShallow } from 'zustand/shallow';

// PrivateDasboardRoute component to check if the user is authenticated
const PrivateDasboardRoute = ({ children }: { children: ReactNode }) => {

  const [serverErrorText, resetServerError] = serverErrorStore(
    useShallow((state) => [state.statusText, state.resetServerError])
  );

     useEffect(() => {
        if (serverErrorText === 'UNAUTHENTICATED') {
          resetServerError();
          sessionStorage.clear();
          localStorage.removeItem('login');
        }
      }, [serverErrorText, resetServerError]);
    
      if (serverErrorText === 'UNAUTHENTICATED') {
        return <Navigate to="/" replace />;
      }
    
      return children;

};

export default PrivateDasboardRoute;