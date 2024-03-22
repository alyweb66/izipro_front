import Login from './LoginRegister/Login';
import Register from './LoginRegister/Register';
import Presentation from './Presentation/Presentation';
import { useNavigate } from 'react-router-dom';
import Footer from '../Footer/Footer';
import './Home.scss';
import { useEffect } from 'react';
// @ts-expect-error bcrypt is not typed
import bcrypt from 'bcryptjs';

function Home() {
	const navigate = useNavigate();
	
	const hasheIsLogged = localStorage.getItem('ayl');
	useEffect(() => {
		if (hasheIsLogged) {
			const isLogged = bcrypt.compareSync('true', hasheIsLogged);
			// if user not logged in, redirect to login page
			if (isLogged) {
				navigate('/dashboard');
			}
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