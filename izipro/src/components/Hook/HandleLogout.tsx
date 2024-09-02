import { useMutation } from '@apollo/client';
import { LOGOUT_USER_MUTATION } from '../GraphQL/UserMutations';
import { cookieConsents, userConversation, userDataStore } from '../../store/UserData';
import { useNavigate } from 'react-router-dom';
import { clientRequestStore, myRequestStore, requestConversationStore, requestDataStore } from '../../store/Request';
import { messageDataStore, myMessageDataStore } from '../../store/message';
import { subscriptionDataStore } from '../../store/subscription';
import { notViewedConversation, notViewedRequest, notViewedRequestRef, requestConversationIds } from '../../store/Viewed';

export default function useHandleLogout() {
	const navigate = useNavigate();
	//const resetUserData = userDataStore((state) => state.resetUserData);
	const [logout, { error: logoutError }] = useMutation(LOGOUT_USER_MUTATION);

	// store
	const resetUserData = userDataStore((state) => state.resetUserData);
	const resetRequest = requestDataStore((state) => state.resetRequest);
	const resetMessage = messageDataStore((state) => state.resetMessage);
	const resetMyMessage = myMessageDataStore((state) => state.resetMessage);
	const resetRequestConversation = requestConversationStore((state) => state.resetRequestConversation);
	const resetMyrequest = myRequestStore((state) => state.resetMyRequest);
	const resetSubscription = subscriptionDataStore((state) => state.resetSubscription);
	const resetClientRequest = clientRequestStore((state) => state.resetClientRequest);
	const resetUsers = userConversation((state) => state.resetUsers);
	const resetCookieConsents = cookieConsents((state) => state.resetCookieConsents);
	const resetrequestConversationIds = requestConversationIds((state) => state.resetBotViewed);
	const resetNotViewedConv = notViewedConversation((state) => state.resetBotViewed);
	const resetNotViewedRequestRef = notViewedRequestRef ((state) => state.resetBotViewed);
	const resetNotViewedRequest = notViewedRequest((state) => state.resetBotViewed);

	// Return a function that will handle the logout
	return async (userId: number) => {
		// reset all the stores
		resetUserData();
		resetRequest();
		resetMessage();
		resetMyMessage();
		resetRequestConversation();
		resetMyrequest();
		resetSubscription();
		resetClientRequest();
		resetUsers();
		resetCookieConsents();
		resetrequestConversationIds();
		resetNotViewedConv();
		resetNotViewedRequestRef();
		resetNotViewedRequest();

		await logout({
			variables: {
				logoutId: userId
			}
		}).then(() => {
			// reset the user data
			//resetUserData();

			localStorage.removeItem('login')

			// clear the cookie
			if (document.cookie) {
				document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
				document.cookie = 'refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
			}
			//redirect to home page
			navigate('/');
		});

		if (logoutError) {
			throw new Error('Error while logging out');
		}
	};
}