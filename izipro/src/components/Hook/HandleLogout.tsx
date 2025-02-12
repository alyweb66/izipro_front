import { useMutation } from '@apollo/client';
import { LOGOUT_USER_MUTATION } from '../GraphQL/UserMutations';
import { useNavigate } from 'react-router';
import {
  cookieConsents,
  isLoggedOutStore,
  userConversation,
  userDataStore,
} from '../../store/UserData';
import {
  clientRequestStore,
  myRequestStore,
  requestConversationStore,
  requestDataStore,
} from '../../store/Request';
import {
  messageConvIdMyConvStore,
  messageConvIdMyreqStore,
  messageDataStore,
  myMessageDataStore,
} from '../../store/message';
import { subscriptionDataStore } from '../../store/subscription';
import {
  notViewedConversation,
  notViewedRequest,
  notViewedRequestRef,
  requestConversationIds,
} from '../../store/Viewed';
import { userNotificationStore } from '../../store/Notification';
import { AltchaStore } from '../../store/Altcha';
import { useShallow } from 'zustand/shallow';


const useHandleLogout = () => {
  let navigate = useNavigate();
  //const resetUserData = userDataStore((state) => state.resetUserData);
  const [logout, { error: logoutError }] = useMutation(LOGOUT_USER_MUTATION);

  // Store
  const resetUserData = userDataStore(useShallow((state) => state.resetUserData));
  const resetRequest = requestDataStore(useShallow((state) => state.resetRequest));
  const resetMessage = messageDataStore(useShallow((state) => state.resetMessage));
  const resetMyMessage = myMessageDataStore(useShallow((state) => state.resetMessage));
  const resetRequestConversation = requestConversationStore(
    useShallow((state) => state.resetRequestConversation)
  );
  const resetMyrequest = myRequestStore(useShallow((state) => state.resetMyRequest));
  const resetSubscription = subscriptionDataStore(
    useShallow((state) => state.resetSubscription)
  );
  const resetClientRequest = clientRequestStore(
    useShallow((state) => state.resetClientRequest)
  );
  const resetUsers = userConversation(useShallow((state) => state.resetUsers));
  const resetCookieConsents = cookieConsents(
    useShallow((state) => state.resetCookieConsents)
  );
  const resetrequestConversationIds = requestConversationIds(
    useShallow((state) => state.resetBotViewed)
  );
  const resetNotViewedConv = notViewedConversation(
    useShallow((state) => state.resetBotViewed)
  );
  const resetNotViewedRequestRef = notViewedRequestRef(
    useShallow((state) => state.resetBotViewed)
  );
  const resetNotViewedRequest = notViewedRequest(
    useShallow((state) => state.resetBotViewed)
  );
  const resetMessageMyConvId = messageConvIdMyConvStore(
    useShallow((state) => state.resetMessageMyConvId)
  );
  const resetMessageMyReqConvId = messageConvIdMyreqStore(
    useShallow((state) => state.resetMessageMyReqConvId)
  );
  const resetNotification = userNotificationStore(
    useShallow((state) => state.resetNotification)
  );
  const resetIsLoggedOut = isLoggedOutStore((state) => state.resetIsLoggedOut);
  const setPayload = AltchaStore(useShallow((state) => state.setPayload));
  const setAltchaStatus = AltchaStore(useShallow((state) => state.setStatus));

  // Return a function that will handle the logout
  return async (userId?: number) => {
    await logout({
      variables: {
        logoutId: userId,
      },
    }).then(() => {
      // reset the user data
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
      resetNotification();
      resetIsLoggedOut();
      resetMessageMyReqConvId && resetMessageMyReqConvId();
      resetMessageMyConvId && resetMessageMyConvId();
      setPayload(null);
      setAltchaStatus(null);

      localStorage.removeItem('login');

      // clear the cookie
      if (document.cookie) {
        document.cookie =
          'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie =
          'refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie =
          'session-id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }

      //redirect to home page
      navigate('/', { replace: true });
    });

    if (logoutError) {
      throw new Error('Error while logging out');
    }
  };
};
export default useHandleLogout;
