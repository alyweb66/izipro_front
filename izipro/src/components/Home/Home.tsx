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
import { useEffect, useState } from 'react';



function Home() {
	const navigate = useNavigate();
	const [isFooter, setIsFooter] = useState(false);

/* 	// get the cookies
	const cookies = document.cookie;
	// function to get the cookie value
	function getCookieValue(name: string) {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return parts.pop()?.split(';').shift();
		return null;
	}

	// function to delete the cookie
	function deleteCookie(name: string) {
		document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname};`;
	}
	// useEffect to check if user is logged out by the server
	useEffect(() => {
		if (cookies) {
			// check if the user is logged out by the server
			const logoutCookieValue = getCookieValue('logout');
			if (logoutCookieValue === 'true') {
				localStorage.removeItem('login');
				deleteCookie('logout');
			}
		}
	}, [cookies]);
	 */
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

	}, []);


	// useEffect to check the size of the window
	useEffect(() => {

		// function to check the size of the window
		const handleResize = () => {
			if (window.innerWidth < 480) {
				setIsFooter(true);
			} else {
				setIsFooter(false);
			}
		};

		// add event listener to check the size of the window
		window.addEventListener('resize', handleResize);

		// 	call the function to check the size of the window
		handleResize();

		// remove the event listener when the component unmount
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return (
		<div className="home">
			<Login />
			<Register />
			<Presentation />
			{isFooter && <Footer />}
		</div>
	);
}

export default Home;