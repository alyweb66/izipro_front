import { createBrowserRouter } from 'react-router';
import  Root  from './routes/Root/Root';
import  Home  from './components/Home/Home';
//import PrivateRoute  from './components/Hook/PrivateRoute';
import ConfirmEmail  from './components/ConfirmEmail/ConfirmEmail';
import ForgotPassword  from './components/ForgotPassword/ForgotPassword';
import DisplayError  from './components/DisplayError/DisplayError';
import Dashboard from './components/Dashboard/Dashboard';

export const router = createBrowserRouter([
	{
		path: '/',
		element: <Root />,
		errorElement: <DisplayError />,
		children: [
			{
				children: [
					{
						index: true,
						element: <Home />,
					},
					{
						path: '/dashboard',
						element:  <Dashboard />,
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