import Login from './LoginRegister/Login';
import Register from './LoginRegister/Register';
import Presentation from './Presentation/Presentation';
import Footer from '../Footer/Footer';
import { useNavigate } from 'react-router-dom';
import './Home.scss';
import { useEffect } from 'react';


function Home() {
	const navigate = useNavigate();

	// check if user is logged in and if cookie consents are accepted
	useEffect(() => {
		// condition if user not logged in
		const getItem = localStorage.getItem('chekayl');
		if (!getItem) {	
			return;
		}
		const decodeData = atob(getItem || '');
		let isLogged;
		console.log('isLogged', isLogged);
		
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