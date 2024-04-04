import Login from './LoginRegister/Login';
import Register from './LoginRegister/Register';
import Presentation from './Presentation/Presentation';
import Footer from '../Footer/Footer';
import { useNavigate } from 'react-router-dom';
import './Home.scss';
import { useEffect } from 'react';

function Home() {
	const navigate = useNavigate();

	// condition if user not logged in
	const isLogged = localStorage.getItem('ayl') || sessionStorage.getItem('ayl');
	console.log(isLogged);
	
	useEffect(() => {
		if (isLogged) {
			navigate('/dashboard');
		}
	}, [navigate]);

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