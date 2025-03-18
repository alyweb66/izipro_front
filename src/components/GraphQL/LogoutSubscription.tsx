import { useSubscription } from '@apollo/client';
import { LOGOUT } from './Subscription';
import { userDataStore } from '../../store/UserData';

type LogoutSubscriptionData = {
	logout : {
	id: number
    value: boolean
    multiple: boolean
	session: string
	}
}

export const useLogoutSubscription = () => {

	// store
	const id = userDataStore((state) => state.id);

	const { data: logoutSubscription, error: errorLogoutSubscription } = useSubscription<LogoutSubscriptionData>(LOGOUT, {
		skip: id > 0 ? false : true,
		variables: {
			user_id: id
		},
	});

	if (errorLogoutSubscription) {
		throw new Error('Error while subscribing to logout', );
	}

	return { logoutSubscription };
};