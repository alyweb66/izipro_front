import { createBrowserRouter } from 'react-router-dom';
import  Root  from './routes/Root/Root';
import  Home  from './components/Home/Home';
import Dashboard  from './components/Dashboard/Dashboard';
import PrivateRoute  from './components/Hook/PrivateRoute';
import ConfirmEmail  from './components/ConfirmEmail/ConfirmEmail';
import ForgotPassword  from './components/ForgotPassword/ForgotPassword';
import NotFound  from './components/NotFound/NotFound';

export const router = createBrowserRouter([
	{
		path: '/',
		element: <Root />,
		errorElement: <NotFound />,
		children: [
			{
				children: [
					{
						index: true,
						element: <Home />,
					},
					{
						path: '/dashboard',
						element:  <PrivateRoute />,
					},
					{
						path: '/confirm-email',
						element: <ConfirmEmail />,
					},
					{
						path: '/forgot-password',
						element: <ForgotPassword />,
					}
				]
			},
		]
	}
    
]);