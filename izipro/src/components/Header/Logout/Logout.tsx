import { userDataStore, userIsLoggedStore } from '../../../store/UserData';
import { useMutation } from '@apollo/client';
import { LOGOUT_USER_MUTATION } from '../../GraphQL/UserMutations';
import { useNavigate } from 'react-router-dom';
import './Logout.scss';



function Logout() {
	const navigate = useNavigate();

	//store
	const  id = userDataStore((state) => state.id);
	const resetUserData = userDataStore((state) => state.resetUserData);
	const setIsLogged = userIsLoggedStore((state) => state.setIsLogged);

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
		// set isLogged to false
		setIsLogged(false);
		// clear the cookie
		if (document.cookie) {
			document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
			document.cookie = 'refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		}
		//redirect to home page
		navigate('/');


		if (error) {
			console.log(error);
		} 
        
	};
	return (
		<div className="logout-container" >
			<button
				className="logout-button"
				onClick={handleLogout}
			>Se déconnecter
			</button>
		</div>
	);
}

export default Logout;

