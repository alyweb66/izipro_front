import { userDataStore } from '../../../store/UserData';
import useHandleLogout from '../../Hook/HandleLogout';
import './Logout.scss';

function Logout() {

	const  id = userDataStore((state) => state.id);
	const handleLogout = useHandleLogout();

	
	return (
		<div className="logout" >
			<button
				className="logout__button"
				onClick={() => handleLogout(id)}
			>Déconnexion
			</button>
		</div>
	);
}

export default Logout;

