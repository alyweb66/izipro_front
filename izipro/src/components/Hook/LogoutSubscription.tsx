import { useSubscription } from '@apollo/client';
import { LOGOUT } from '../GraphQL/Subscription';
import { userDataStore } from '../../store/UserData';

export const useLogoutSubscription = () => {

	// store
	const id = userDataStore((state) => state.id);

	const { data: logoutSubscription, error: errorLogoutSubscription } = useSubscription(LOGOUT, {
		variables: {
			user_id: id
		}
	});

	if (errorLogoutSubscription) {
        console.log('Error while subscribing to logout', errorLogoutSubscription);
		throw new Error('Error while subscribing to logout', );
	}

	return { logoutSubscription };
};