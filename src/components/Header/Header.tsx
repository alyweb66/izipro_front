import Logout from './Logout/Logout';
import './Header.scss';
import { useLocation } from 'react-router';
import { useEffect, useState } from 'react';


function Header() {
	// State
	const [isLogged, setIsLogged] = useState(false);
	const [withGradient, setWithGradient] = useState(false);

	const location = useLocation();


	// Check if user is logged in
	useEffect(() => {
		// condition if user not logged in
		
			const getItem = localStorage.getItem('login');
			//const decodeData = atob(getItem || '');
			let decodeData;
			try {
				decodeData = JSON.parse(atob(getItem || ''));
		
			} catch (error) {
				decodeData = atob(getItem || '');
			}
		
			let isLoggedValue;
			if (decodeData && typeof decodeData === 'object' && ('value' in decodeData) && (decodeData.value === 'true' || decodeData.value === 'session')) {
				isLoggedValue = true
			} else {
				isLoggedValue = false;
			}
	
			if (location.pathname === '/dashboard') {
				setWithGradient(true);

				if (isLoggedValue) {
					setIsLogged(true);
				} else {
					setIsLogged(false);
				}	
			} else {
				setWithGradient(false);
				setIsLogged(false);
			}
	}, [location.pathname]);

	return (
		<header className={`header ${withGradient ? 'with-gradient' : ''}`}  id="header">
			<div className="header__container">
				<img
					className='header__container image'
					src="/logos/logo-izipro-250x250.png"
					alt="izipro logo"
					role="button"
					aria-label="Recharger la page"
					onClick={() => window.location.reload()}
				/>
				<h1 className="header__container title">izipro</h1>
			</div>
			{isLogged && <Logout />}
		</header>
	);
}

export default Header;





