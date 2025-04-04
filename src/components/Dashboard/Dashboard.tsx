import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation } from '@apollo/client';

// Modules without types
import * as turf from '@turf/turf';
import { ErrorBoundary } from 'react-error-boundary';
import { UAParser } from 'ua-parser-js';

// components
import Logout from '../Header/Logout/Logout';
import Footer from '../Footer/Footer';
import Spinner from '../Hook/Components/Spinner/Spinner';
import Intro from '../Hook/Components/Intro/Intro';
import { DeleteItemModal } from '../Hook/Modal/DeleteItem/DeleteItemModal';
// Hook personal
import {
  useQueryGetRequestById,
  useQueryNotViewedConversations,
  useQueryNotViewedRequests,
  useQueryRequestByJob,
  useQueryUserConversationIds,
  useQueryUserConversations,
  useQueryUserData,
  useQueryUserRequests,
  useQueryUserSubscriptions,
} from '../Hook/Query';
import { useMyRequestMessageSubscriptions } from '../GraphQL/MyRequestSubscription';
import { useClientRequestSubscriptions } from '../GraphQL/ClientRequestSubscription';
import { useMyConversationSubscriptions } from '../GraphQL/MyConversationSubscription';
import { useLogoutSubscription } from '../GraphQL/LogoutSubscription';
import OffLine from '../Hook/Components/Offline/OffLine';

// Mutation
import { DELETE_NOT_VIEWED_CONVERSATION_MUTATION } from '../GraphQL/ConversationMutation';

// Types
import { RequestProps } from '../../Type/Request';
import { MessageProps } from '../../Type/message';

// Store
import {
  isLoggedOutStore,
  userConversation,
  userDataStore,
} from '../../store/UserData';
import { subscriptionDataStore } from '../../store/subscription';
import {
  notViewedRequest,
  notViewedConversation,
  requestConversationIds,
} from '../../store/Viewed';
import {
  clientRequestStore,
  myRequestStore,
  requestConversationStore,
  requestDataStore,
} from '../../store/Request';
import { messageDataStore, myMessageDataStore } from '../../store/message';
import { useShallow } from 'zustand/shallow';

// Style
import './Dashboard.scss';
import Stack from '@mui/material/Stack';
import Badge, { BadgeProps } from '@mui/material/Badge';
import { styled } from '@mui/material/styles';
import { Grow } from '@mui/material';

const Request = lazy(() => import('./Request/Request'));
const MyRequest = lazy(() => import('./MyRequest/MyRequest'));
const MyConversation = lazy(() => import('./MyConversation/MyConversation'));
const Account = lazy(() => import('./Account/Account'));
const ClientRequest = lazy(() => import('./ClientRequest/ClientRequest'));

type useQueryUserConversationsProps = {
  loading: boolean;
  data: { user: { requestsConversations: RequestProps[] } };
  refetch: () => void;
  fetchMore: (options: { variables: { offset: number } }) => void;
};

function Dashboard() {
  let navigate = useNavigate();

  // Store at the top for id to use in the sendBeacon
  const [id, role, lng, lat, settings, jobs, setAll] = userDataStore(
    useShallow((state) => [
      state.id,
      state.role,
      state.lng,
      state.lat,
      state.settings,
      state.jobs,
      state.setAll,
    ])
  );

  // condition if user not logged in
  // decode the data
  const getItem = localStorage.getItem('login');

  let decodeData: string | { value: string };
  let isLogged: boolean;
  try {
    decodeData = JSON.parse(atob(getItem || ''));
  } catch (error) {
    decodeData = atob(getItem || '');
  }

  if (
    decodeData &&
    typeof decodeData === 'object' &&
    'value' in decodeData &&
    (decodeData.value === 'true' || decodeData.value === 'session')
  ) {
    isLogged = true;
  } else {
    isLogged = false;
  }

  // function to logout the user when the page is closed
  const handleBeforeUnload = (
    _event: BeforeUnloadEvent,
    subscriptionLogout = false
  ) => {
    //event.preventDefault();
    if (
      typeof decodeData === 'object' &&
      (decodeData.value === 'session' || subscriptionLogout) &&
      idRef.current
    ) {
      // create request to logout the user in the json format for sendbeacon
      const query = `
			mutation Logout($logoutId: Int!) {
				  logout(id: $logoutId)
			}
		  `;

      const variables = { logoutId: idRef.current };

      // format data to send for sendBeacon
      const data = JSON.stringify({
        query,
        variables,
      });

      // use sendBeacon to send the request
      const url =
        import.meta.env.MODE === 'production'
          ? import.meta.env.VITE_SERVER_URL
          : 'http://localhost:3000/';
      const headers = { 'Content-Type': 'application/json' };

      // Create a Blob object with the data
      const blob = new Blob([data], { type: headers['Content-Type'] });

      // send request to the server with sendBeacon
      navigator.sendBeacon(url, blob);
    }
  };

  // useEffect to check if user is logged in and use sendBeacon to logout the user
  useEffect(() => {
    // check if user is logged in
    if (isLogged === false) {
      // The data has expired
      localStorage.removeItem('login');

      if (window.location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    }

    // function to check if user is logged in and listener if close the page

    //window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // clean event listener
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [decodeData]);

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isFooter, setIsFooter] = useState(true);
  const [selectedTab, setSelectedTab] = useState('');
  const [newUserId, setNewUserId] = useState<number[]>([]);
  const [viewedMessageState, setViewedMessageState] = useState<number[]>([]);
  const [viewedMyConversationState, setViewedMyConversationState] = useState<
    number[]
  >([]);
  const [hasQueryRun, setHasQueryRun] = useState<boolean>(false);
  const [hasQueryConversationRun, setHasQueryConversationRun] =
    useState<boolean>(false);
  const [requestByIdState, setRequestByIdState] = useState<number>(0);
  const [isExpiredSession, setIsExpiredSession] = useState<boolean>(false);
  const [isMultipleLogout, setIsMultipleLogout] = useState<boolean>(false);
  const [isOffLine, setIsOffLine] = useState<boolean>(false);

  //*state for myRequest
  const [selectedRequest, setSelectedRequest] = useState<RequestProps | null>(
    null
  );
  const [conversationIdState, setConversationIdState] = useState<number>(0);
  const [isMyRequestHasMore, setIsMyRequestHasMore] = useState<boolean>(true);
  //const [isSkipMyRequest, setIsSkipMyRequest] = useState<boolean>(true);

  //*state for myConversation
  const [isForMyConversation, setIsForMyConversation] =
    useState<boolean>(false);
  const [isMyConversationHasMore, setIsMyConversationHasMore] =
    useState<boolean>(true);
  const [myConversationIdState, setMyConversationIdState] = useState<number>(0);

  //*state for clientRequest
  const [isCLientRequestHasMore, setIsClientRequestHasMore] =
    useState<boolean>(true);

  //store
  const isLoggedOut = isLoggedOutStore(
    useShallow((state) => state.isLoggedOut)
  );
  const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore(
    useShallow((state) => [state.subscription, state.setSubscription])
  );
  const [notViewedConversationStore, setNotViewedConversationStore] =
    notViewedConversation(
      useShallow((state) => [state.notViewed, state.setNotViewedStore])
    );
  const [requestConversationIdStore, setRequestConversationsIdStore] =
    requestConversationIds(
      useShallow((state) => [state.notViewed, state.setNotViewedStore])
    );
  const [isServiceWorker, setIsServiceWorker] = useState(false);

  // Limit
  const myRequestLimit = 5;
  const clientRequestLimit = 5;
  const myconversationLimit = 5;

  //* MyRequest store
  const [userConvStore] = userConversation(
    useShallow((state) => [state.users, state.setUsers])
  );
  myMessageDataStore(
    useShallow((state) => [state.messages, state.setMessageStore])
  );
  const [requestStore] = myRequestStore(
    useShallow((state) => [state.requests, state.setMyRequestStore])
  );
  myMessageDataStore(
    useShallow((state) => [state.messages, state.setMessageStore])
  );

  //* MyConversation store
  const [clientRequestsStore, setClientRequestsStore] = clientRequestStore(
    useShallow((state) => [state.requests, state.setClientRequestStore])
  );
  const [requestsConversationStore] = requestConversationStore(
    useShallow((state) => [state.requests, state.setRequestConversation])
  );
  messageDataStore(
    useShallow((state) => [state.messages, state.setMessageStore])
  );

  //* ClientRequest store
  const [notViewedRequestStore, setNotViewedRequestStore] = notViewedRequest(
    useShallow((state) => [state.notViewed, state.setNotViewedStore])
  );
  const [resetRequest] = requestDataStore(
    useShallow((state) => [state.resetRequest])
  );

  //useRef
  const clientRequestOffset = useRef<number>(0);
  const myConversationOffsetRef = useRef<number>(0);
  const isSkipGetUserDataRef = useRef<boolean>(false);
  const isSkipSubscriptionRef = useRef<boolean>(false);
  const isSkipMyRequestRef = useRef<boolean>(false);
  const isSkipMyConversationRef = useRef<boolean>(false);
  const isSkipClientRequestRef = useRef<boolean>(false);
  const isSkipNotViewedConvRef = useRef<boolean>(false);
  const isSkipUserConversationIdsRef = useRef<boolean>(false);
  const idRef = useRef<number>(id);
  const menuRef = useRef<HTMLUListElement>(null);

  // to keep id for the sendBeacon when the user leaves the page
  useEffect(() => {
    if (id) {
      idRef.current = id;
    }
  }, [id]);

  // Query
  const { loading: userDataLoading, getUserData } = useQueryUserData(
    isSkipGetUserDataRef.current
  );
  const getUserSubscription = useQueryUserSubscriptions(
    isSkipSubscriptionRef.current || id === 0
  );
  const notViewedRequestQuery = useQueryNotViewedRequests(
    role !== 'pro' || notViewedRequestStore.length > 0
  );
  const { loading: notViewedConversationLoading, notViewedConversationQuery } =
    useQueryNotViewedConversations(isSkipNotViewedConvRef.current);
  // this query is only ids of all conversation used to compare with the notViewedConversationStore to get the number of not viewed conversation
  const { loading: myConversationIdsLoading, myConversationIds } =
    useQueryUserConversationIds(
      isSkipUserConversationIdsRef.current ||
        requestConversationIdStore.length > 0
    );

  //* Query for MyRequest
  const { getUserRequestsData } = useQueryUserRequests(
    id,
    0,
    myRequestLimit,
    isSkipMyRequestRef.current || id === 0 || requestStore.length > 0
  );
  const { loading: requestByIdLoading, requestById } =
    useQueryGetRequestById(requestByIdState);

  //*Query for ClientRequest
  const { loading: getRequestByJobLoading, getRequestsByJob } =
    useQueryRequestByJob(
      jobs,
      0,
      clientRequestLimit,
      isSkipClientRequestRef.current ||
        jobs.length === 0 ||
        role !== 'pro' ||
        clientRequestsStore.length > 0
    );

  //*Query for MyConversation
  const { loading: requestMyConversationLoading, data: requestMyConversation } =
    useQueryUserConversations(
      0,
      myconversationLimit,
      role === 'pro'
        ? isSkipMyConversationRef.current ||
            requestsConversationStore.length > 0
        : true
    ) as unknown as useQueryUserConversationsProps;

  //mutation
  const [
    deleteNotViewedConversation,
    { error: deleteNotViewedConversationError },
  ] = useMutation(DELETE_NOT_VIEWED_CONVERSATION_MUTATION);

  // Subscription
  const { logoutSubscription } = useLogoutSubscription();
  const { messageSubscription } = useMyRequestMessageSubscriptions();
  const { clientRequestSubscription } = useClientRequestSubscriptions(
    role !== 'pro'
  );
  const { clientMessageSubscription } = useMyConversationSubscriptions(
    role !== 'pro'
  );

  // style for the badge
  const StyledBadge = styled(Badge)<BadgeProps>(() => ({
    '& .MuiBadge-badge': {
      color: 'white',
      backgroundColor: '#ff0000',
    },
  }));

  // For indacating the tab under the burger menu
  const tabLabels: { [key: string]: string } = {
    Request: 'DEMANDE',
    'My requests': 'MES DEMANDES',
    'Client request': 'CLIENTS',
    'My conversations': 'MES CONTACTS',
    'My profile': 'MON COMPTE',
  };

  // function to handle navigation to my conversation
  const handleNavigate = (isClientConv = false) => {
    if (isClientConv) {
      setSelectedTab('Client request');
    } else {
      setSelectedTab('My conversations');
    }
  };

  // function to range request by request location
  function RangeFilter(requests: RequestProps[], fromSubscribeToMore = false) {
    // Define the two points for each request and filter them
    const filteredRequests = requests.filter((request: RequestProps) => {
      const requestPoint = turf.point([request.lng, request.lat]);
      const userPoint = turf.point([lng ?? 0, lat ?? 0]);
      const distance = turf.distance(requestPoint, userPoint);

      return (
        (distance < request.range / 1000 || request.range === 0) &&
        (distance < settings[0].range / 1000 || settings[0].range === 0) &&
        (request.conversation === null ||
          request.conversation === undefined ||
          !request.conversation.some(
            (conversation) =>
              conversation.user_1 !== null &&
              conversation.user_2 !== null &&
              (conversation.user_1 === id || conversation.user_2 === id)
          ))
      );
    });

    // Get all requests that are not in the store
    const newRequests = filteredRequests.filter((request: RequestProps) =>
      clientRequestsStore?.every((prevRequest) => prevRequest.id !== request.id)
    );

    // Add the new requests to the appropriate place in the list
    if (newRequests && newRequests.length > 0) {
      if (fromSubscribeToMore) {
        setClientRequestsStore([
          ...newRequests,
          ...(clientRequestsStore || []),
        ]);

        // Add request.id to the viewedRequestStore
        if (
          notViewedRequestStore.length === 0 ||
          notViewedRequestStore.some((id) => id !== newRequests[0].id)
        ) {
          setNotViewedRequestStore([
            ...notViewedRequestStore,
            newRequests[0].id,
          ]);
        }
      } else {
        setClientRequestsStore([
          ...(clientRequestsStore || []),
          ...newRequests,
        ]);
      }
    }
  }

  // burger menu
  const toggleMenu = () => {
    // only if screen is less than 480px
    if (window.innerWidth < 480) {
      setIsOpen(!isOpen);
    }
  };

  // function to redirect to home page when session is expired by serveur
  const RedirectExpiredSession = () => {
    handleBeforeUnload(new Event('beforeunload') as BeforeUnloadEvent, true);
    sessionStorage.clear();
    localStorage.removeItem('login');
    navigate('/', { replace: true });
  };

  // Error boundary
  const ErrorFallback = () => {
    return (
      <div className="ErrorFallback">
        <p>Impossible de charger l'élément</p>
      </div>
    );
  };
  // Detect click outside the menu to close it
  useEffect(() => {
    if (window.innerWidth < 480) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        // Ajouter une classe globale
        document.body.classList.add('menu-open');
      } else {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.classList.remove('menu-open');
      }

      // Cleanup
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.classList.remove('menu-open');
      };
    }
  }, [isOpen]);

  // useEffect to check the size of the window
  useEffect(() => {
    // function to check the size of the window
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setIsFooter(false);
      } else {
        setIsFooter(true);
      }
    };

    // add event listener to check the size of the window
    window.addEventListener('resize', handleResize);

    // 	call the function to check the size of the window
    handleResize();

    // remove the event listener when the component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // set the new request from requestById to myConversation
  useEffect(() => {
    if (requestById) {
      if (!isForMyConversation) {
        const request = requestById?.user.request;
        if (
          requestStore.some((requestStore) => requestStore.id !== request.id)
        ) {
          // add request to the store
          myRequestStore.setState((prevRequests) => {
            return {
              ...prevRequests,
              requests: [request, ...prevRequests.requests],
            };
          });

          //add conversation id to the requestConversationsIdStore
          const conversationIds = request.conversation?.map(
            (conversation: RequestProps) => conversation.id
          );
          // check if conversation are not already in the store
          if (
            conversationIds.some(
              (id: number) => !requestConversationIdStore?.includes(id)
            )
          ) {
            setRequestConversationsIdStore([
              ...conversationIds,
              ...(requestConversationIdStore || []),
            ]);
          }
          setRequestByIdState(0);
        }
      } else {
        const request = requestById?.user.request;
        if (
          requestsConversationStore.some(
            (requestStore) => requestStore.id !== request.id
          )
        ) {
          // add request to the store
          requestConversationStore.setState((prevRequests) => {
            return {
              ...prevRequests,
              requests: [request, ...prevRequests.requests],
            };
          });

          setRequestByIdState(0);
          setIsForMyConversation(false);
        }
      }
    }
  }, [requestById]);

  // set the conversationIdS to the store for compare with notViewedConversationStore
  useEffect(() => {
    if (myConversationIds && myConversationIds.user) {
      setRequestConversationsIdStore(
        myConversationIds.user?.conversationRequestIds
      );
      isSkipUserConversationIdsRef.current = true;
    }
  }, [myConversationIds]);

  // set the notViewedRequestStore
  useEffect(() => {
    if (notViewedRequestQuery && !hasQueryRun) {
      const viewedRequestResult =
        notViewedRequestQuery?.viewedData?.user.userHasNotViewedRequest;

      if (viewedRequestResult) {
        const viewedRequestArray = viewedRequestResult.map(
          (request: { request_id: number }) => request.request_id
        );

        if (
          notViewedRequestQuery &&
          viewedRequestArray.some(
            (id: number) => !notViewedRequestStore.includes(id)
          )
        ) {
          // get the request id that are not in the store
          const newId = viewedRequestArray.filter(
            (id: number) => !notViewedRequestStore.includes(id)
          );
          setNotViewedRequestStore(newId);
          setHasQueryRun(true);
        }
      }
    }
  }, [notViewedRequestQuery]);

  // set the notViewedConversationStore
  useEffect(() => {
    if (notViewedConversationQuery && !hasQueryConversationRun) {
      const viewedConversationResult =
        notViewedConversationQuery?.user.userHasNotViewedConversation;

      if (viewedConversationResult) {
        const viewedConversationArray = viewedConversationResult.map(
          (conversation: { conversation_id: number }) =>
            conversation.conversation_id
        );

        if (
          notViewedConversationQuery &&
          viewedConversationArray.some(
            (id: number) => !notViewedConversationStore.includes(id)
          )
        ) {
          // get the conversation id that are not in the store
          const newId = viewedConversationArray.filter(
            (id: number) => !notViewedRequestStore.includes(id)
          );

          setNotViewedConversationStore(newId);
          setHasQueryConversationRun(true);
          isSkipNotViewedConvRef.current = true;
        }
      }
    }
  }, [notViewedConversationQuery]);

  // set user subscription to the store
  useEffect(() => {
    if (getUserSubscription) {
      setSubscriptionStore(getUserSubscription?.user.subscription);
      isSkipSubscriptionRef.current = true;
    }
  }, [getUserSubscription]);

  // set the default tab based on the user role
  useEffect(() => {
    if (role) {
      if (role === 'pro') {
        setSelectedTab('My conversations');
      } else {
        setSelectedTab('My requests');
        isSkipMyRequestRef.current = false;
      }
    }
  }, [role]);

  // set the request to clientRequestStore at starting
  useEffect(() => {
    if (getRequestsByJob) {
      const requestByJob = getRequestsByJob.requestsByJob;

      //get all request who are not in the store
      const newRequests = requestByJob?.filter((request: RequestProps) =>
        clientRequestsStore?.every(
          (prevRequest) => prevRequest.id !== request.id
        )
      );

      // Filter the requests
      isSkipClientRequestRef.current = true;
      if (newRequests && newRequests.length > 0) {
        isSkipClientRequestRef.current = true;
        clientRequestOffset.current =
          clientRequestOffset.current + requestByJob?.length;
        RangeFilter(requestByJob);
      }

      if (getRequestsByJob?.requestsByJob?.length === clientRequestLimit) {
        setIsClientRequestHasMore(true);
      } else {
        setIsClientRequestHasMore(false);
      }
    }

    // If there are no more requests, stop the fetchmore
    if (
      !getRequestsByJob &&
      getRequestsByJob?.requestsByJob?.length < clientRequestLimit &&
      isSkipClientRequestRef.current === false
    ) {
      setIsClientRequestHasMore(false);
    }
  }, [getRequestsByJob, settings]);

  // set the request to myrequestStore at starting
  useEffect(() => {
    if (getUserRequestsData && getUserRequestsData.user.requests) {
      // If offset is 0, it's the first query, so just replace the queries
      if (requestStore.length === 0) {
        // check if requests are already in the store
        const requestsIds = requestStore.map((request) => request.id);
        const newRequests = getUserRequestsData.user.requests?.filter(
          (request: RequestProps) => !requestsIds.includes(request.id)
        );
        isSkipMyRequestRef.current = true;
        if (newRequests.length > 0) {
          myRequestStore.setState((prevRequests) => {
            return {
              ...prevRequests,
              requests: [...prevRequests.requests, ...newRequests],
            };
          });
        }

        if (getUserRequestsData?.user.requests?.length === myRequestLimit) {
          setIsMyRequestHasMore(true);
        } else {
          setIsMyRequestHasMore(false);
        }
      }
    }

    if (
      (!getUserRequestsData ||
        getUserRequestsData?.user.requests?.length < myRequestLimit) &&
      id !== 0 &&
      isSkipMyRequestRef.current === false
    ) {
      setIsMyRequestHasMore(false);
      isSkipMyRequestRef.current = true;
    }
  }, [getUserRequestsData]);

  // set the request to myConversationStore at starting
  useEffect(() => {
    if (requestMyConversation && requestMyConversation.user) {
      const requestsConversations: RequestProps[] =
        requestMyConversation.user.requestsConversations;

      if (!requestsConversations) {
        setIsMyConversationHasMore(false);
      }
      //get all request who are not in the store
      const newRequests = requestsConversations.filter(
        (request: RequestProps) =>
          requestsConversationStore?.every(
            (prevRequest) => prevRequest.id !== request.id
          )
      );

      // add the new request to the requestsConversationStore
      if (newRequests.length > 0) {
        requestConversationStore.setState((prevState) => ({
          ...prevState,
          requests: [...requestsConversationStore, ...newRequests],
        }));
      }

      myConversationOffsetRef.current = requestsConversations?.length;
      isSkipMyConversationRef.current = true;

      if (
        requestMyConversation.user.requestsConversations.length ===
        myconversationLimit
      ) {
        setIsMyConversationHasMore(true);
      } else {
        setIsMyConversationHasMore(false);
      }
    }

    if (
      requestMyConversation &&
      requestMyConversation.user &&
      requestMyConversation.user.requestsConversations.length <
        myconversationLimit &&
      isSkipMyConversationRef.current === false
    ) {
      setIsMyConversationHasMore(false);
    }
  }, [requestMyConversation]);

  // useEffect to check if user is logged out by serveur
  useEffect(() => {
    // logout from main.tsx
    if (isLoggedOut) {
      setIsExpiredSession(true);
    }

    // get the session id from the cookie
    const sessionCookie = document.cookie
      .split(';')
      .find((cookie) => cookie.includes('session-id'));
    const sessionId = sessionCookie?.split('=')[1].trim();

    // check if the user is logged out by the server
    if (logoutSubscription && logoutSubscription.logout?.value === true) {
      if (
        logoutSubscription.logout.multiple &&
        sessionId &&
        sessionId === logoutSubscription.logout.session
      ) {
        setIsMultipleLogout(true);
        setIsExpiredSession(true);
      } else if (sessionId && sessionId === logoutSubscription.logout.session) {
        setIsExpiredSession(true);
      }
    }
  }, [logoutSubscription, isLoggedOut]);

  // set user data to the store
  useEffect(() => {
    if (getUserData) {
      setAll(getUserData?.user);
      isSkipGetUserDataRef.current = true;
    }
  }, [getUserData]);

  // useEffect subscribe to new client message in MyConversation
  useEffect(() => {
    if (clientMessageSubscription?.messageAdded) {
      const messageAdded: MessageProps[] =
        clientMessageSubscription.messageAdded;
      const date = new Date(Number(messageAdded[0].created_at));
      const newDate = date.toISOString();

      // add the new message to the message store
      messageDataStore.setState((prevState) => {
        const newMessages = messageAdded.filter(
          (newMessage: MessageProps) =>
            !prevState.messages.find(
              (existingMessage) => existingMessage.id === newMessage.id
            )
        );

        return {
          ...prevState,
          messages: [...prevState.messages, ...newMessages],
        };
      });

      //fetch request if the request is not in the store
      if (
        messageAdded[0].request_id &&
        !requestsConversationStore.some(
          (request) => request.id === messageAdded[0].request_id
        ) &&
        messageAdded[0].user_id !== id
      ) {
        setRequestByIdState(messageAdded[0].request_id);
        setIsForMyConversation(true);

        // add the conversation_id to the notViewedConversationStore
        if (
          !notViewedConversationStore.includes(
            messageAdded[0].conversation_id
          ) &&
          messageAdded[0].user_id !== id
        ) {
          setNotViewedConversationStore([
            messageAdded[0].conversation_id,
            ...(notViewedConversationStore || []),
          ]);
        }
      } else {
        // add updated_at to the request.conversation
        if (myConversationIdState !== messageAdded[0].conversation_id) {
          requestConversationStore.setState((prevState) => {
            const updatedRequest = prevState.requests.map(
              (request: RequestProps) => {
                const updatedConversation = request.conversation?.map(
                  (conversation) => {
                    if (conversation.id === messageAdded[0].conversation_id) {
                      return { ...conversation, updated_at: newDate };
                    }
                    return conversation;
                  }
                );

                return { ...request, conversation: updatedConversation };
              }
            );
            return { requests: updatedRequest };
          });
        }

        // check if the selected conversation is the same as the messageAdded and update the conversation
        if (
          myConversationIdState === messageAdded[0].conversation_id &&
          messageAdded[0].user_id !== id
        ) {
          deleteNotViewedConversation({
            variables: {
              input: {
                conversation_id: [messageAdded[0].conversation_id],
                user_id: id,
              },
            },
          }).then(() => {
            setNotViewedConversationStore(
              notViewedConversationStore.filter(
                (id) => id !== messageAdded[0].conversation_id
              )
            );
          });
          if (deleteNotViewedConversationError) {
            throw new Error('Error while updating conversation');
          }
        } else {
          // add the conversation_id to the notViewedConversationStore
          if (
            !notViewedConversationStore.includes(
              messageAdded[0].conversation_id
            ) &&
            messageAdded[0].user_id !== id
          ) {
            setNotViewedConversationStore([
              messageAdded[0].conversation_id,
              ...(notViewedConversationStore || []),
            ]);
          }
        }
      }
    }
  }, [clientMessageSubscription]);

  // useEffect subscribe to new client Clientrequest
  useEffect(() => {
    if (clientRequestSubscription && clientRequestSubscription.requestAdded) {
      const requestAdded = clientRequestSubscription?.requestAdded[0];

      if (
        clientRequestsStore.length === 0 ||
        clientRequestsStore.some(
          (prevRequest) => prevRequest.id !== requestAdded.id
        )
      ) {
        RangeFilter([requestAdded], true);
      }
    }
  }, [clientRequestSubscription]);

  // useEffect subscribe to new message requests in myRequest
  useEffect(() => {
    // check if the message is already in the store
    if (messageSubscription?.messageAdded) {
      const messageAdded: MessageProps[] = messageSubscription.messageAdded;
      const date = new Date(Number(messageAdded[0].created_at));
      const newDate = date.toISOString();

      //fetch request if the request is not in the store
      if (
        messageAdded[0].request_id &&
        !requestStore.some(
          (request) => request.id === messageAdded[0].request_id
        )
      ) {
        setRequestByIdState(messageAdded[0].request_id);
      }

      // add the new message to the message store
      myMessageDataStore.setState((prevState) => {
        const newMessages = messageAdded.filter(
          (newMessage: MessageProps) =>
            !prevState.messages.find(
              (existingMessage) => existingMessage.id === newMessage.id
            )
        );

        return {
          ...prevState,
          messages: [...prevState.messages, ...newMessages],
        };
      });

      // add the conversation to the request
      if (!requestByIdLoading) {
        myRequestStore.setState((prevState) => {
          const updatedRequest = prevState.requests.map(
            (request: RequestProps) => {
              // if the conversation id is in the request
              if (
                request.conversation &&
                request.conversation.some(
                  (conversation) =>
                    conversation.id === messageAdded[0].conversation_id
                )
              ) {
                const updatedConversation = request.conversation.map(
                  (conversation) => {
                    if (conversation.id === messageAdded[0].conversation_id) {
                      return { ...conversation, updated_at: newDate };
                    }
                    return conversation;
                  }
                );
                return { ...request, conversation: updatedConversation };

                // if there is a conversation in the request but the conversation id is not in the request
              } else if (
                request.id === messageAdded[0].request_id &&
                request.conversation?.some(
                  (conversation) =>
                    conversation.id !== messageAdded[0].conversation_id
                )
              ) {
                const conversation = [
                  ...request.conversation,
                  {
                    id: messageAdded[0].conversation_id,
                    user_1: messageAdded[0].user_id,
                    user_2: id,
                    request_id: messageAdded[0].request_id,
                    updated_at: newDate,
                  },
                ];
                return { ...request, conversation };
              } else {
                // if the request hasn't a conversation
                if (
                  request.id === messageAdded[0].request_id &&
                  !request.conversation
                ) {
                  const conversation = [
                    {
                      id: messageAdded[0].conversation_id,
                      user_1: messageAdded[0].user_id,
                      user_2: id,
                      request_id: messageAdded[0].request_id,
                      updated_at: newDate,
                    },
                  ];

                  return { ...request, conversation };
                }
              }
              return request;
            }
          );
          return { ...prevState, requests: updatedRequest };
        });
      }

      // check if the conversation subscriber is already in the subscriptionStore
      const isExistingSubscription = subscriptionStore.some(
        (subscription) => subscription.subscriber === 'conversation'
      );

      // Get all the conversation ids
      const conversationIds =
        subscriptionStore
          .filter((subscription) => subscription.subscriber === 'conversation')
          .flatMap((subscription) => subscription.subscriber_id) || [];

      // add the conversation_id to the subscriptionStore
      if (
        !conversationIds.includes(messageAdded[0].conversation_id) &&
        !isExistingSubscription
      ) {
        setSubscriptionStore([
          ...subscriptionStore,
          {
            user_id: id,
            subscriber: 'conversation',
            subscriber_id: [messageAdded[0].conversation_id],
            created_at: new Date().toISOString(),
          },
        ]);
      } else if (
        !conversationIds.includes(messageAdded[0].conversation_id) &&
        isExistingSubscription
      ) {
        setSubscriptionStore(
          subscriptionStore.map((subscription) => {
            if (subscription.subscriber === 'conversation') {
              return {
                ...subscription,
                subscriber_id: [
                  ...subscription.subscriber_id,
                  messageAdded[0].conversation_id,
                ],
              };
            }
            return subscription;
          })
        );
      }

      // add the conversation if not exist in requestConversationsIdStore
      if (
        !requestConversationIdStore.includes(messageAdded[0].conversation_id)
      ) {
        setRequestConversationsIdStore([
          messageAdded[0].conversation_id,
          ...(requestConversationIdStore || []),
        ]);
      }

      // check if the selectedRequest is the same as the messageAdded and update the conversation
      if (selectedRequest?.id === messageAdded[0].request_id) {
        setSelectedRequest((prevState: RequestProps | null) => {
          // if a conversation is already in selectedRequest
          if (
            prevState &&
            prevState.conversation &&
            prevState.conversation.some(
              (conversation) =>
                conversation.id === messageAdded[0].conversation_id
            )
          ) {
            const updatedRequest = prevState?.conversation.map(
              (conversation) => {
                if (conversation.id === messageAdded[0].conversation_id) {
                  return { ...conversation, updated_at: newDate };
                }
                return conversation;
              }
            );
            return { ...prevState, conversation: updatedRequest };

            // if no conversation in the selectedRequest
          } else if (prevState && !prevState.conversation) {
            const conversation = [
              {
                id: messageAdded[0].conversation_id,
                user_1: messageAdded[0].user_id,
                user_2: id,
                request_id: messageAdded[0].request_id,
                updated_at: newDate,
              },
            ];

            // check if user is in userConvStore
            if (
              !userConvStore.some((user) => user.id === messageAdded[0].user_id)
            ) {
              setNewUserId([messageAdded[0].user_id]);
            }

            return { ...prevState, conversation };

            // if the conversation id is not in the selectedRequest
          } else if (
            prevState &&
            !prevState.conversation.some(
              (conversation) =>
                conversation.id === messageAdded[0].conversation_id
            )
          ) {
            const conversation = [
              ...prevState.conversation,
              {
                id: messageAdded[0].conversation_id,
                user_1: messageAdded[0].user_id,
                user_2: id,
                request_id: messageAdded[0].request_id,
                updated_at: newDate,
              },
            ];

            // check if user is in userConvStore
            if (
              !userConvStore.some((user) => user.id === messageAdded[0].user_id)
            ) {
              setNewUserId([messageAdded[0].user_id]);
            }

            return { ...prevState, conversation };
          } else {
            return null;
          }
        });
      }

      // remove the conversation from the notViewedConversationStore and database if the conversation is selected
      if (
        selectedRequest?.id === messageAdded[0].request_id &&
        conversationIdState === messageAdded[0].conversation_id
      ) {
        if (
          selectedRequest &&
          selectedRequest.conversation &&
          messageAdded[0].user_id !== id
        ) {
          deleteNotViewedConversation({
            variables: {
              input: {
                user_id: id,
                conversation_id: [messageAdded[0].conversation_id],
              },
            },
          }).then(() => {
            // remove the conversation id from the notViewedConversationStore
            setNotViewedConversationStore(
              notViewedConversationStore.filter(
                (id) => id !== messageAdded[0].conversation_id
              )
            );
          });

          if (deleteNotViewedConversationError) {
            throw new Error('Error updating conversation');
          }
        }
      } else {
        // add the conversation_id to the notViewedConversationStore
        if (
          !notViewedConversationStore.includes(
            messageAdded[0].conversation_id
          ) &&
          messageAdded[0].user_id !== id
        ) {
          setNotViewedConversationStore([
            messageAdded[0].conversation_id,
            ...(notViewedConversationStore || []),
          ]);
        }
      }

      // send id to the mutation to find user
      setNewUserId([]);
      if (
        messageAdded[0].user_id !== id &&
        !userConvStore.some((user) => user.id === messageAdded[0].user_id)
      ) {
        setNewUserId([messageAdded[0].user_id]);
      }
    }
  }, [messageSubscription]);

  // useEffect to count the number of conversation that are not viewed message in MyRequest
  useEffect(() => {
    // count the number of conversation that are not viewed message
    const unviewedConversationIds = notViewedConversationStore.filter(
      (id) =>
        requestConversationIdStore && requestConversationIdStore.includes(id)
    );

    if (unviewedConversationIds.length > 0) {
      setViewedMessageState(unviewedConversationIds);
    } else {
      setViewedMessageState([]);
    }
  }, [notViewedConversationStore, requestConversationIdStore]);

  // useEffect to count the number of conversation that are not viewed message in MyConversation
  useEffect(() => {
    // count the number of conversation who is not viewed
    const notViewedConversation = notViewedConversationStore.filter(
      (id) =>
        requestConversationIdStore && !requestConversationIdStore.includes(id)
    );

    if (notViewedConversation.length > 0) {
      setViewedMyConversationState(notViewedConversation);
    } else {
      setViewedMyConversationState([]);
    }
  }, [notViewedConversationStore, requestConversationIdStore]);

  // Check internet connection status to display a message
  useEffect(() => {
    let offlineTimeout: NodeJS.Timeout | null = null;

    const handleOffline = () => {
      offlineTimeout = setTimeout(() => {
        setIsOffLine(true);
      }, 2000); // 2 secondes
    };

    const handleOnline = () => {
      if (offlineTimeout) {
        clearTimeout(offlineTimeout);
        offlineTimeout = null;
      }
      setIsOffLine(false);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Clean listeners
    return () => {
      if (offlineTimeout) {
        clearTimeout(offlineTimeout);
      }
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  //* Notification push
  // Function to update the selected tab in the service worker
  function updateSelectedTab(selectedTab: string) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_SELECTED_TAB',
        tab: selectedTab,
      });
    }
  }

  // Call this function whenever the selected tab changes
  useEffect(() => {
    if (selectedTab) {
      updateSelectedTab(selectedTab);

      // Send an event to Google Analytics
      if (window.gtag) {
        window.gtag('event', 'tab_click', {
          event_category: 'Dashboard',
          event_label: selectedTab,
        });
      }
    }
  }, [selectedTab]);

  // Function to update the selected conversation ID in the service worker
  function updateSelectedConversationId(conversationId: number) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_SELECTED_CONVERSATION',
        conversationId: conversationId,
      });
    }
  }

  // Call this function whenever the selected conversation changes
  useEffect(() => {
    if (selectedTab === 'My requests') {
      updateSelectedConversationId(conversationIdState);
    } else if (selectedTab === 'My conversations') {
      updateSelectedConversationId(myConversationIdState);
    } else {
      updateSelectedConversationId(0);
    }
  }, [conversationIdState, myConversationIdState]);
  //* End notification push

  // check if a serviceworker is registered
  useEffect(() => {
    const checkServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) {
        setIsServiceWorker(false);
        return;
      }

      try {
        // 1. Vérifier les inscriptions existantes
        const registrations = await navigator.serviceWorker.getRegistrations();

        // 2. Vérifier si au moins un SW contrôle la page
        const isActive = registrations.some(
          (reg) => reg.active && reg.active.state === 'activated'
        );

        // 3. Vérifier via le controller
        const hasController = !!navigator.serviceWorker.controller;

        setIsServiceWorker(isActive || hasController);
      } catch (error) {
        // console.error('Erreur de vérification:', error);
        setIsServiceWorker(false);
      }
    };

    checkServiceWorker();
  }, []);

  if (isServiceWorker) {
    // get the visibility of the page and send it to the service worker
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        navigator.serviceWorker.ready.then((registration) => {
          if (registration.active) {
            registration.active.postMessage({ action: 'page-hidden' });
          }
        });
      } else {
        navigator.serviceWorker.ready.then((registration) => {
          if (registration.active) {
            registration.active.postMessage({ action: 'page-visible' });
          }
          // Detect type of browser

          const parser = new UAParser();
          const result = parser.getResult();
          const nameBrowser: string =
            result.browser.name || 'un navigateur non supporté';
          //if the browser is safari, reload the page
          if (nameBrowser === 'Safari' || nameBrowser === 'Mobile Safari') {
            window.location.reload();
          }
        });
      }
    });
  }

  return (
    <>
      <div className="dashboard">
        {userDataLoading ||
          notViewedConversationLoading ||
          myConversationIdsLoading ||
          (requestMyConversationLoading && <Spinner />)}
        <nav className="__nav" aria-label="Navigation principale">
          <div className="__burger">
            <div className="__container">
              <img
                className="__logo"
                src="/logos/logo-izipro-250x250.png"
                alt="izipro logo"
                role="button"
                aria-label="Recharger la page"
                onClick={() => window.location.reload()}
              />
              <button
                title="Menu"
                aria-label="Ouvrir le menu"
                type="button"
                className="__menu"
                onClick={toggleMenu}
              >
                <div className="burger-icon">
                  <div className="burger-icon__line"></div>
                  <div
                    className={`burger-icon__middle ${
                      notViewedRequestStore.length > 0 ||
                      viewedMessageState.length > 0 ||
                      viewedMyConversationState.length > 0
                        ? 'notification'
                        : ''
                    }`}
                  ></div>
                  <div className="burger-icon__line"></div>
                </div>
              </button>
              {isLogged && <Logout />}
            </div>
            <span className="dashboard__nav__burgerSelected">
              {tabLabels[selectedTab] || ''}
            </span>
          </div>
          <ul
            ref={menuRef}
            className={`dashboard__nav__menu ${isOpen ? 'open' : ''}`}
          >
            <li
              className={`dashboard__nav__menu__content__tab ${selectedTab === 'Request' ? 'active' : ''}`}
              onClick={() => {
                setSelectedTab('Request');
                setIsOpen(!isOpen);
                resetRequest();
              }}
              aria-label="Ouvrir les demandes"
            >
              DEMANDE
              <div className="indicator"></div>
            </li>
            <li
              className={`dashboard__nav__menu__content__tab ${selectedTab === 'My requests' ? 'active' : ''}`}
              onClick={() => {
                setSelectedTab('My requests');
                setIsOpen(!isOpen);
                isSkipMyRequestRef.current = false;
                resetRequest();
              }}
              aria-label="Ouvrir mes demandes"
            >
              <div className="tab-content">
                <span>MES DEMANDES</span>
                {(viewedMessageState.length > 0 || window.innerWidth > 480) && (
                  <div
                    className={`badge-container ${viewedMessageState.length > 0 ? 'visible' : ''}`}
                  >
                    {viewedMessageState.length > 0 && (
                      <Grow in={true} timeout={200}>
                        <Stack
                          aria-label={`Vous avez${viewedMessageState.length} notifications`}
                        >
                          <StyledBadge
                            className="notification-badge"
                            badgeContent={viewedMessageState.length}
                          ></StyledBadge>
                        </Stack>
                      </Grow>
                    )}
                  </div>
                )}
              </div>
              <div className="indicator"></div>
            </li>
            {role === 'pro' && (
              <li
                className={`dashboard__nav__menu__content__tab ${selectedTab === 'Client request' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedTab('Client request');
                  setIsOpen(!isOpen);
                  resetRequest();
                }}
                aria-label="Ouvrir les demandes clients"
              >
                <div className="tab-content">
                  <span>CLIENTS</span>
                  {(notViewedRequestStore.length > 0 ||
                    window.innerWidth > 480) && (
                    <div
                      className={`badge-container ${notViewedRequestStore.length > 0 ? 'visible' : ''}`}
                    >
                      {notViewedRequestStore.length > 0 && (
                        <Grow in={true} timeout={200}>
                          <Stack
                            aria-label={`Vous avez${notViewedRequestStore.length} notifications`}
                          >
                            <StyledBadge
                              className="notification-badge"
                              badgeContent={notViewedRequestStore.length}
                            ></StyledBadge>
                          </Stack>
                        </Grow>
                      )}
                    </div>
                  )}
                </div>
                {/* {notViewedRequestStore.length > 0 && <ClientRequestBadge count={notViewedRequestStore.length} />} */}
                <div className="indicator"></div>
              </li>
            )}
            {role === 'pro' && (
              <li
                className={`dashboard__nav__menu__content__tab ${selectedTab === 'My conversations' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedTab('My conversations');
                  setIsOpen(!isOpen);
                }}
                aria-label="Ouvrir mes conversations"
              >
                <div className="tab-content">
                  <span>MES CONTACTS</span>
                  {(viewedMyConversationState.length > 0 ||
                    window.innerWidth > 480) && (
                    <div
                      className={`badge-container ${viewedMyConversationState.length > 0 ? 'visible' : ''}`}
                    >
                      {viewedMyConversationState.length > 0 && (
                        <Grow in={true} timeout={200}>
                          <Stack
                            aria-label={`Vous avez${viewedMyConversationState.length} notifications`}
                          >
                            <StyledBadge
                              className="notification-badge"
                              badgeContent={viewedMyConversationState.length}
                            ></StyledBadge>
                          </Stack>
                        </Grow>
                      )}
                    </div>
                  )}
                </div>
                <div className="indicator"></div>
              </li>
            )}
            <li
              className={`dashboard__nav__menu__content__tab ${selectedTab === 'My profile' ? 'active' : ''}`}
              onClick={() => {
                setSelectedTab('My profile');
                setIsOpen(!isOpen);
                resetRequest();
              }}
              aria-label="Ouvrir mon compte"
            >
              MON COMPTE
              <div className="indicator"></div>
            </li>
            {!isFooter && <Footer />}
          </ul>
        </nav>
        <div className="dashboard__content">
          <Suspense fallback={<Spinner />}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              {selectedTab === 'Request' && (
                <>{isOffLine ? <OffLine /> : <Request />}</>
              )}
            </ErrorBoundary>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              {selectedTab === 'My requests' &&
                (role === 'pro' ? (
                  requestStore.length > 0 ? (
                    <MyRequest
                      setIsHasMore={setIsMyRequestHasMore}
                      isHasMore={isMyRequestHasMore}
                      conversationIdState={conversationIdState}
                      setConversationIdState={setConversationIdState}
                      selectedRequest={selectedRequest}
                      setSelectedRequest={setSelectedRequest}
                      newUserId={newUserId}
                      setNewUserId={setNewUserId}
                    />
                  ) : (
                    <p className="no-req"> Pas de demandes </p>
                  )
                ) : lng && lat ? (
                  <MyRequest
                    setIsHasMore={setIsMyRequestHasMore}
                    isHasMore={isMyRequestHasMore}
                    conversationIdState={conversationIdState}
                    setConversationIdState={setConversationIdState}
                    selectedRequest={selectedRequest}
                    setSelectedRequest={setSelectedRequest}
                    newUserId={newUserId}
                    setNewUserId={setNewUserId}
                  />
                ) : (
                  <Intro />
                ))}
            </ErrorBoundary>
            {selectedTab === 'My conversations' &&
              (lng && lat ? (
                <MyConversation
                  viewedMyConversationState={viewedMyConversationState}
                  isHasMore={isMyConversationHasMore}
                  setIsHasMore={setIsMyConversationHasMore}
                  offsetRef={myConversationOffsetRef}
                  handleNavigate={handleNavigate}
                  conversationIdState={myConversationIdState}
                  setConversationIdState={setMyConversationIdState}
                  clientMessageSubscription={clientMessageSubscription}
                />
              ) : (
                <Intro />
              ))}
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              {selectedTab === 'My profile' && (
                <>{isOffLine ? <OffLine /> : <Account />}</>
              )}
            </ErrorBoundary>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              {selectedTab === 'Client request' && (
                <>
                  {isOffLine ? (
                    <OffLine />
                  ) : (
                    <ClientRequest
                      loading={getRequestByJobLoading}
                      offsetRef={clientRequestOffset}
                      setIsHasMore={setIsClientRequestHasMore}
                      isHasMore={isCLientRequestHasMore}
                      handleNavigate={handleNavigate}
                      RangeFilter={RangeFilter}
                    />
                  )}
                </>
              )}
            </ErrorBoundary>
          </Suspense>
        </div>

        <DeleteItemModal
          isMultipleLogout={isMultipleLogout}
          isSessionExpired={isMultipleLogout ? false : true}
          setDeleteItemModalIsOpen={setIsExpiredSession}
          deleteItemModalIsOpen={isMultipleLogout || isExpiredSession}
          handleDeleteItem={RedirectExpiredSession}
        />
      </div>
    </>
  );
}

export default Dashboard;
