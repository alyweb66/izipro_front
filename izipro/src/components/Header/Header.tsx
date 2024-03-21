import Logout from './Logout/Logout';

import './Header.scss';
import { userIsLoggedStore } from '../../store/UserData';

function Header() {

	//const [isLogged, setIsLogged] = useState(localStorage.getItem('isLogged'));
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





   