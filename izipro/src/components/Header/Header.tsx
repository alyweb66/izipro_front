import Logout from './Logout/Logout';
import './Header.scss';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';


function Header() {
	// State
	const [isLogged, setIsLogged] = useState(false);

	const location = useLocation();


	// Check if user is logged in
	useEffect(() => {
		// condition if user not logged in
		let isLoggedValue;
		if (localStorage.getItem('ayl') === 'session') {

			isLoggedValue = {value: 'true'};
		} else {

			isLoggedValue = JSON.parse(localStorage.getItem('ayl') || '{}');
		}

		if (location.pathname === '/dashboard' && isLoggedValue) {
			const newIsLogged = isLoggedValue.value === 'true' ? true : false;
			console.log('newIsLogged', newIsLogged);
			
			setIsLogged(newIsLogged );
		} else {
			setIsLogged(false);
		}
	}, [location.pathname]);


	return (
		<header className="menu" id="header">
			<img className='menu-image' src="/izipro-logo.svg" alt="Izipro logo" />
			<h1 className="menu-title">Izipro</h1>
			{isLogged && <Logout />}
		</header>
	);
}

export default Header;





   