// Composants
import Login from './LoginRegister/Login';
import Register from './LoginRegister/Register';
import Presentation from './Presentation/Presentation';
import Footer from '../Footer/Footer';

// React Router
import { useNavigate } from 'react-router-dom';

// Styles
import './Home.scss';

// Hooks React
import { useEffect } from 'react';



function Home() {
	const navigate = useNavigate();

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
			navigate('/dashboard');
		}
		
	},[]);

	return (
		<div className="home">
			<Login />
			<Register />
			<Presentation />
			<Footer />
		</div>
	);
}

export default Home;