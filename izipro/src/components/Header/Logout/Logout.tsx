import { userDataStore } from '../../../store/UserData';
import useHandleLogout from '../../Hook/HandleLogout';
import { MdLogout } from 'react-icons/md';
import './Logout.scss';

function Logout() {

	const  id = userDataStore((state) => state.id);
	const handleLogout = useHandleLogout();

	
	return (
		<div className="logout" >
			<MdLogout 
				className="logout__icon"
				onClick={() => (document.querySelector('.logout__button') as HTMLButtonElement)?.click()}
				aria-label='Déconnexion'
			/>
			<button
				className="logout__button"
				onClick={() => handleLogout(id)}
				aria-label='Déconnexion'
			>Déconnexion
			</button>
		</div>
	);
}

export default Logout;

