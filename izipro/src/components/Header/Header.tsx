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
		const getItem = localStorage.getItem('login');
		const decodeData = atob(getItem || '');
		let isLoggedValue;
		if (decodeData === 'session') {

			isLoggedValue = {value: 'true'};
		} else {

			isLoggedValue = JSON.parse(decodeData || '{}');
		}

		if (location.pathname === '/dashboard' && isLoggedValue) {
			const newIsLogged = isLoggedValue.value === 'true' ? true : false;
			
			setIsLogged(newIsLogged );
		} else {
			setIsLogged(false);
		}
	}, [location.pathname]);

	return (
		<header className="header" id="header">
			<div className="header__container">
				<img 
				className='header__container image' 
				src="/izipro-logo.svg" 
				alt="Izipro logo"
				onClick={() => window.location.reload()} 
				/>
				<h1 className="header__container title">POP</h1>
			</div>
			{isLogged && <Logout />}
		</header>
	);
}

export default Header;





   