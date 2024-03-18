import Logout from './Logout/Logout';
import { userIsLoggedStore } from '../../store/UserData';

import './Header.scss';

function Header() {
	//store
	const isLogged = userIsLoggedStore((state) => state.isLogged);

	return (
		<header className="menu" id="header">
			<img className='menu-image' src="/izipro-logo.svg" alt="Izipro logo" />
			<h1 className="menu-title">Izipro</h1>
			{isLogged && <Logout />}
		</header>
	);
}

export default Header;





   