import Logout from './Logout/Logout';
import './Header.scss';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
// @ts-expect-error bcrypt is not typed
import bcrypt from 'bcryptjs';

function Header() {
	// State
	const [isLogged, setIsLogged] = useState(false);

	const location = useLocation();
	// condition if user not logged in
	const hasheIsLogged = localStorage.getItem('ayl') || sessionStorage.getItem('ayl');
	useEffect(() => {
		if (location.pathname === '/dashboard' && hasheIsLogged) {
			const isLogged = bcrypt.compareSync('true', hasheIsLogged);
			setIsLogged(isLogged);
		} else {
			setIsLogged(false);
		}
	}, [location.pathname, hasheIsLogged]);


	return (
		<header className="menu" id="header">
			<img className='menu-image' src="/izipro-logo.svg" alt="Izipro logo" />
			<h1 className="menu-title">Izipro</h1>
			{isLogged && <Logout />}
		</header>
	);
}

export default Header;





   