import { userDataStore } from '../../../store/UserData';
import { useMutation } from '@apollo/client';
import { LOGOUT_USER_MUTATION } from '../../GraphQL/UserMutations';
import { useNavigate } from 'react-router-dom';

import './Logout.scss';

function Logout() {

	const navigate = useNavigate();

	//store
	const  id = userDataStore((state) => state.id);
	const resetUserData = userDataStore((state) => state.resetUserData);


	// mutation to logout user
	const [logout, { error }] = useMutation(LOGOUT_USER_MUTATION);
    
	const  handleLogout = () => {

		logout({
			variables: {
				logoutId: id
			}
		});

		// clear user data store
		resetUserData();
		// clear local storage and session storage
		localStorage.clear();
		sessionStorage.clear();
	
		// clear the cookie
		if (document.cookie) {
			document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
			document.cookie = 'refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		}
		//redirect to home page
		navigate('/');


		if (error) {
			throw new Error('Error while logging out');
		} 
        
	};
	return (
		<div className="logout" >
			<button
				className="logout__button"
				onClick={handleLogout}
			>Déconnexion
			</button>
		</div>
	);
}

export default Logout;

