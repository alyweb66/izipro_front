import { createBrowserRouter } from 'react-router-dom';
import  Root  from './routes/Root/Root';
import NotFound  from './components/NotFound/NotFound';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Root />,
        errorElement: <NotFound />,
    },
    
]);