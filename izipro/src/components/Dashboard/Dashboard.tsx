import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Account from './Account/Account';
import Request from './Request/Request';
import MyRequest from './MyRequest/MyRequest';
import MyConversation from './MyConversation/MyConversation';
import ClientRequest from './ClientRequest/ClientRequest';
import { userConversation, userDataStore } from '../../store/UserData';
import {
	useQueryGetRequestById,
	useQueryNotViewedConversations,
	useQueryNotViewedRequests,
	useQueryRequestByJob,
	useQueryUserConversationIds,
	useQueryUserConversations,
	useQueryUserData,
	useQueryUserRequests,
	useQueryUserSubscriptions
} from '../Hook/Query';
import './Dashboard.scss';
import { subscriptionDataStore } from '../../store/subscription';
import { useMutation } from '@apollo/client';
import Footer from '../Footer/Footer';

import Spinner from '../Hook/Spinner';
import { useMyRequestMessageSubscriptions } from '../Hook/MyRequestSubscription';
import { useClientRequestSubscriptions } from '../Hook/ClientRequestSubscription';
import { useMyConversationSubscriptions } from '../Hook/MyConversationSubscription';
import { notViewedRequest, notViewedConversation, requestConversationIds } from '../../store/Viewed';
import { ClientRequestBadge } from '../Hook/Badge';

import { RequestProps } from '../../Type/Request';
// @ts-expect-error turf is not typed
import * as turf from '@turf/turf';

import { clientRequestStore, myRequestStore, requestConversationStore } from '../../store/Request';
import { MessageProps } from '../../Type/message';
import { messageDataStore, myMessageDataStore } from '../../store/message';
import { DELETE_NOT_VIEWED_CONVERSATION_MUTATION } from '../GraphQL/ConversationMutation';
import { useLogoutSubscription } from '../Hook/LogoutSubscription';
import { ExpiredSessionModal } from '../Hook/ExpiredSession';
//import { RulesModal } from '../Hook/RulesModal';
import useHandleLogout from '../Hook/HandleLogout';

type useQueryUserConversationsProps = {
	loading: boolean;
	data: { user: { requestsConversations: RequestProps[] } };
	refetch: () => void;
	fetchMore: (options: { variables: { offset: number } }) => void;
};

function Dashboard() {
	const navigate = useNavigate();
	const handleLogout = useHandleLogout();

	// State
	const [isOpen, setIsOpen] = useState(false);
	const [selectedTab, setSelectedTab] = useState('');
	const [newUserId, setNewUserId] = useState<number[]>([]);
	const [viewedMessageState, setViewedMessageState] = useState<number[]>([]);
	const [viewedMyConversationState, setViewedMyConversationState] = useState<number[]>([]);
	const [hasQueryRun, setHasQueryRun] = useState<boolean>(false);
	const [hasQueryConversationRun, setHasQueryConversationRun] = useState<boolean>(false);
	const [requestByIdState, setRequestByIdState] = useState<number>(0);
	const [isExpiredSession, setIsExpiredSession] = useState<boolean>(false);

	//state for myRequest
	const [selectedRequest, setSelectedRequest] = useState<RequestProps | null>(null);
	const [conversationIdState, setConversationIdState] = useState<number>(0);
	const [isMyRequestHasMore, setIsMyRequestHasMore] = useState<boolean>(true);

	//state for myConversation
	const [myConversationIdState, setMyConversationIdState] = useState<number>(0);
	const [isMyConversationHasMore, setIsMyConversationHasMore] = useState<boolean>(true);
	const [isForMyConversation, setIsForMyConversation] = useState<boolean>(false);

	//state for clientRequest
	const [isCLientRequestHasMore, setIsClientRequestHasMore] = useState<boolean>(true);

	//store
	const [id, role, lng, lat, settings, jobs, setAll] = userDataStore((state) => [state.id, state.role, state.lng, state.lat, state.settings, state.jobs, state.setAll]);
	const setSubscription = subscriptionDataStore((state) => state.setSubscription);
	const [notViewedConversationStore, setNotViewedConversationStore] = notViewedConversation((state) => [state.notViewed, state.setNotViewedStore]);
	const [requestConversationIdStore, setRequestConversationsIdStore] = requestConversationIds((state) => [state.notViewed, state.setNotViewedStore]);

	// Limit
	const myRequestLimit = 5;
	const clientRequestLimit = 5;
	const myconversationLimit = 5;

	// MyRequest store
	const [userConvStore] = userConversation((state) => [state.users, state.setUsers]);
	myMessageDataStore((state) => [state.messages, state.setMessageStore]);
	const [requestStore] = myRequestStore((state) => [state.requests, state.setMyRequestStore]);
	myMessageDataStore((state) => [state.messages, state.setMessageStore]);

	//MyConversation store
	const [clientRequestsStore, setClientRequestsStore] = clientRequestStore((state) => [state.requests, state.setClientRequestStore]);
	const [requestsConversationStore] = requestConversationStore((state) => [state.requests, state.setRequestConversation]);
	messageDataStore((state) => [state.messages, state.setMessageStore]);

	//ClientRequest store
	const [notViewedRequestStore, setNotViewedRequestStore] = notViewedRequest((state) => [state.notViewed, state.setNotViewedStore]);

	//useRef
	const clientRequestOffset = useRef<number>(0);
	const myConversationOffsetRef = useRef<number>(0);

	// Query 
	const { loading: userDataLoading, getUserData } = useQueryUserData();
	//const { loading: getCookieConsentsLoading, cookieData} = useQueryCookieConsents(isGetCookieConsents);
	const getUserSubscription = useQueryUserSubscriptions();
	const notViewedRequestQuery = useQueryNotViewedRequests();
	const { loading: notViewedConversationLoading, notViewedConversationQuery } = useQueryNotViewedConversations();
	//const { loading: rulesLoading, rulesData } = useQueryRules(isGetRules);
	// this query is only ids of all conversation used to compare with the notViewedConversationStore to get the number of not viewed conversation
	const { loading: myConversationIdsLoading, myConversationIds } = useQueryUserConversationIds(requestConversationIdStore.length > 0);

	// Query for MyRequest
	const { getUserRequestsData } = useQueryUserRequests(id, 0, myRequestLimit, requestStore.length > 0);
	const { loading: requestByIdLoading, requestById } = useQueryGetRequestById(requestByIdState);
	console.log('id', id);

	//Query for ClientRequest
	const { getRequestsByJob } = useQueryRequestByJob(jobs, 0, clientRequestLimit, clientRequestsStore.length > 0);

	//Query for MyConversation
	const { data: requestMyConversation } = useQueryUserConversations(0, myconversationLimit, requestsConversationStore.length > 0) as unknown as useQueryUserConversationsProps;

	//mutation
	const [deleteNotViewedConversation, { error: deleteNotViewedConversationError }] = useMutation(DELETE_NOT_VIEWED_CONVERSATION_MUTATION);


	// Subscription
	const { messageSubscription } = useMyRequestMessageSubscriptions();
	const { clientRequestSubscription } = useClientRequestSubscriptions();
	const { clientMessageSubscription } = useMyConversationSubscriptions();
	const { logoutSubscription } = useLogoutSubscription();

	// condition if user not logged in
	let isLogged;
	const getItem = localStorage.getItem('chekayl');

	const decodeData = atob(getItem || '');

	if (decodeData === 'session') {
		isLogged = { value: true };
	} else {
		isLogged = JSON.parse(decodeData || '{}');
	}

	// function to check if user is logged in
	useEffect(() => {
		// clear local storage and session storage when user leaves the page if local storage is set to session
		const handleBeforeUnload = () => {
			if (decodeData === 'session') {
				// clear local storage,session storage and cookie
				handleLogout(id);
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);

		// check if user is logged in
		if (isLogged !== null && Object.keys(isLogged).length !== 0) {
			if (new Date().getTime() > isLogged.expiry) {
				// The data has expired
				localStorage.clear();

				if (window.location.pathname !== '/') {
					navigate('/');
				}
			}
		} else {

			if (window.location.pathname !== '/') {
				navigate('/');
			}

		}

	}, []);

	// set the new request from requestById to myRequestStore 
	useEffect(() => {

		if (requestById) {
			if (!isForMyConversation) {
				const request = requestById?.user.request;
				if (requestStore.some(requestStore => requestStore.id !== request.id)) {

					// add request to the store
					myRequestStore.setState(prevRequests => {
						return { ...prevRequests, requests: [request, ...prevRequests.requests] };
					});

					//add conversation id to the requestConversationsIdStore
					const conversationIds = request.conversation?.map((conversation: RequestProps) => conversation.id);
					// check if conversation are not already in the store
					if (conversationIds.some((id: number) => !requestConversationIdStore?.includes(id))) {
						setRequestConversationsIdStore([...conversationIds, ...(requestConversationIdStore || [])]);
					}
					setRequestByIdState(0);
				}
			} else {
				const request = requestById?.user.request;
				if (requestsConversationStore.some(requestStore => requestStore.id !== request.id)) {

					// add request to the store
					requestConversationStore.setState(prevRequests => {
						return { ...prevRequests, requests: [request, ...prevRequests.requests] };
					});

					/* //add conversation id to the requestConversationsIdStore
					const conversationIds = request.conversation?.map((conversation: RequestProps) => conversation.id);
					// check if conversation are not already in the store
					if (conversationIds.some((id: number) => !requestConversationIdStore?.includes(id))) {
						setRequestConversationsIdStore([...conversationIds, ...(requestConversationIdStore || [])]);
					} */

					setRequestByIdState(0);
					setIsForMyConversation(false);
				}

			}
		}
	}, [requestById]);

	// set the conversationIdS to the store for compare with notViewedConversationStore
	useEffect(() => {
		if (myConversationIds && myConversationIds.user) {
			setRequestConversationsIdStore(myConversationIds.user?.conversationRequestIds);
		}
	}, [myConversationIds]);

	// set the notViewedRequestStore
	useEffect(() => {
		if (notViewedRequestQuery && !hasQueryRun) {

			const viewedRequestResult = notViewedRequestQuery?.viewedData?.user.userHasNotViewedRequest;

			if (viewedRequestResult) {
				const viewedRequestArray = viewedRequestResult.map((request: { request_id: number }) => request.request_id);

				if (notViewedRequestQuery && viewedRequestArray.some((id: number) => !notViewedRequestStore.includes(id))) {
					// get the request id that are not in the store
					const newId = viewedRequestArray.filter((id: number) => !notViewedRequestStore.includes(id));

					setNotViewedRequestStore(newId);
					//setNotViewedRequestRefStore(viewedRequestArray);
					//notViewedRequestRef.current = viewedRequestArray;
					setHasQueryRun(true);
				}
			}
		}

	}, [notViewedRequestQuery]);

	// set the notViewedConversationStore
	useEffect(() => {

		if (notViewedConversationQuery && !hasQueryConversationRun) {

			const viewedConversationResult = notViewedConversationQuery?.user.userHasNotViewedConversation;

			if (viewedConversationResult) {
				const viewedConversationArray = viewedConversationResult.map((conversation: { conversation_id: number }) => conversation.conversation_id);

				if (notViewedConversationQuery && viewedConversationArray.some((id: number) => !notViewedConversationStore.includes(id))) {
					// get the conversation id that are not in the store
					const newId = viewedConversationArray.filter((id: number) => !notViewedRequestStore.includes(id));

					setNotViewedConversationStore(newId);
					setHasQueryConversationRun(true);
				}
			}
		}
	}, [notViewedConversationQuery]);

	// set user subscription to the store
	useEffect(() => {
		if (getUserSubscription) {

			setSubscription(getUserSubscription?.user.subscription);
		}
	}, [getUserSubscription]);

	// set the default tab based on the user role
	useEffect(() => {
		if (role) {
			if (role === 'pro') {
				setSelectedTab('My conversations');
			} else {
				setSelectedTab('My requests');
			}

		}

	}, [role]);

	// set the request to clientRequestStore at starting
	useEffect(() => {

		if (getRequestsByJob) {
			const requestByJob = getRequestsByJob.requestsByJob;

			//get all request who are not in the store
			const newRequests = requestByJob?.filter((request: RequestProps) => clientRequestsStore?.every(prevRequest => prevRequest.id !== request.id));

			// Filter the requests
			if (newRequests && newRequests.length > 0) {

				clientRequestOffset.current = clientRequestOffset.current + requestByJob?.length;
				RangeFilter(requestByJob);
			}
		}

		// If there are no more requests, stop the fetchmore
		if (getRequestsByJob?.requestsByJob?.length < clientRequestLimit) {
			setIsClientRequestHasMore(false);
		}
	}, [getRequestsByJob, settings]);

	// set the request to myrequestStore at starting
	useEffect(() => {

		if (getUserRequestsData && getUserRequestsData.user.requests) {

			// If offset is 0, it's the first query, so just replace the queries
			if (requestStore.length === 0) {
				// check if requests are already in the store
				const requestsIds = requestStore.map(request => request.id);
				const newRequests = getUserRequestsData.user.requests?.filter((request: RequestProps) => !requestsIds.includes(request.id));
				if (newRequests.length > 0) {
					myRequestStore.setState(prevRequests => {
						return { ...prevRequests, requests: [...prevRequests.requests, ...newRequests] };
					});
				}
			}
		}

		if (getUserRequestsData?.user.requests?.length < myRequestLimit) {
			setIsMyRequestHasMore(false);
		}
	}, [getUserRequestsData]);

	// set the request to myConversationStore at starting
	useEffect(() => {
		if (requestMyConversation && requestMyConversation.user) {

			const requestsConversations: RequestProps[] = requestMyConversation.user.requestsConversations;

			if (!requestsConversations) {
				setIsMyConversationHasMore(false);
			}
			//get all request who are not in the store
			const newRequests = requestsConversations.filter((request: RequestProps) => requestsConversationStore?.every(prevRequest => prevRequest.id !== request.id));

			// add the new request to the requestsConversationStore
			if (newRequests.length > 0) {
				requestConversationStore.setState(prevState => ({ ...prevState, requests: [...requestsConversationStore, ...newRequests] }));
			}

			myConversationOffsetRef.current = requestsConversations?.length;
		}

		if (requestMyConversation?.user.requestsConversations.length < myconversationLimit) {
			setIsMyConversationHasMore(false);
		}
	}, [requestMyConversation]);

	// useEffect to check if user is logged out by serveur
	useEffect(() => {
		if (logoutSubscription && logoutSubscription.logout.value === true) {
			setIsExpiredSession(true);
		}
	}, [logoutSubscription]);

	// set user data to the store
	useEffect(() => {
		if (getUserData) {

			setAll(getUserData?.user);
		}
	}, [getUserData]);

	// useEffect subscribe to new client message in MyConversation
	useEffect(() => {

		if (clientMessageSubscription?.messageAdded) {
			const messageAdded: MessageProps[] = clientMessageSubscription.messageAdded;
			const date = new Date(Number(messageAdded[0].created_at));
			const newDate = date.toISOString();

			// add the new message to the message store
			messageDataStore.setState(prevState => {
				const newMessages = messageAdded.filter(
					(newMessage: MessageProps) => !prevState.messages.find((existingMessage) => existingMessage.id === newMessage.id)
				);

				return {
					...prevState,
					messages: [...prevState.messages, ...newMessages]
				};

			});

			//fetch request if the request is not in the store
			if (messageAdded[0].request_id
				&& !requestsConversationStore.some(request => request.id === messageAdded[0].request_id)
				&& messageAdded[0].user_id !== id) {

				setRequestByIdState(messageAdded[0].request_id);
				setIsForMyConversation(true);

				// add the conversation_id to the notViewedConversationStore
				if (!notViewedConversationStore.includes(messageAdded[0].conversation_id) && messageAdded[0].user_id !== id) {
					setNotViewedConversationStore([messageAdded[0].conversation_id, ...(notViewedConversationStore || [])]);
				}

			} else {
				// add updated_at to the request.conversation
				if (myConversationIdState !== messageAdded[0].conversation_id) {
					requestConversationStore.setState(prevState => {
						const updatedRequest = prevState.requests.map((request: RequestProps) => {
							const updatedConversation = request.conversation?.map((conversation) => {
								if (conversation.id === messageAdded[0].conversation_id) {
									return { ...conversation, updated_at: newDate };
								}
								return conversation;
							});

							return { ...request, conversation: updatedConversation };
						});
						return { requests: updatedRequest };
					});
				}

				// check if the selected conversation is the same as the messageAdded and update the conversation
				if (myConversationIdState === messageAdded[0].conversation_id && messageAdded[0].user_id !== id) {
					deleteNotViewedConversation({
						variables: {
							input: {
								conversation_id: [messageAdded[0].conversation_id],
								user_id: id
							}
						}
					}).then(() => {

						setNotViewedConversationStore(notViewedConversationStore.filter(id => id !== messageAdded[0].conversation_id));

					});
					if (deleteNotViewedConversationError) {
						throw new Error('Error while updating conversation');
					}
				} else {
					// add the conversation_id to the notViewedConversationStore
					if (!notViewedConversationStore.includes(messageAdded[0].conversation_id) && messageAdded[0].user_id !== id) {
						setNotViewedConversationStore([messageAdded[0].conversation_id, ...(notViewedConversationStore || [])]);
					}
				}

			}

		}

	}, [clientMessageSubscription]);

	// useEffect subscribe to new client Clientrequest
	useEffect(() => {

		if (clientRequestSubscription) {
			if (clientRequestSubscription) {
				const requestAdded = clientRequestSubscription.requestAdded[0];

				if (clientRequestsStore?.some(prevRequest => prevRequest.id !== requestAdded.id)) {
					RangeFilter([requestAdded], true);

				}
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
			if (messageAdded[0].request_id && !requestStore.some(request => request.id === messageAdded[0].request_id)) {
				setRequestByIdState(messageAdded[0].request_id);
			}

			// add the new message to the message store
			myMessageDataStore.setState(prevState => {
				const newMessages = messageAdded.filter(
					(newMessage: MessageProps) => !prevState.messages.find((existingMessage) => existingMessage.id === newMessage.id)
				);

				return {
					...prevState,
					messages: [...prevState.messages, ...newMessages]
				};

			});

			// add the conversation to the request
			if (!requestByIdLoading) {
				myRequestStore.setState(prevState => {
					const updatedRequest = prevState.requests.map((request: RequestProps) => {
						// if the conversation id is in the request
						if (request.conversation && request.conversation.some((conversation) => conversation.id === messageAdded[0].conversation_id)) {

							const updatedConversation = request.conversation.map((conversation) => {
								if (conversation.id === messageAdded[0].conversation_id) {
									return { ...conversation, updated_at: newDate };
								}
								return conversation;
							});
							return { ...request, conversation: updatedConversation };

							// if there is a conversation in the request but the conversation id is not in the request
						} else if (request.id === messageAdded[0].request_id && request.conversation?.some(
							conversation => conversation.id !== messageAdded[0].conversation_id)) {

							const conversation = [
								...request.conversation,
								{
									id: messageAdded[0].conversation_id,
									user_1: messageAdded[0].user_id,
									user_2: id,
									request_id: messageAdded[0].request_id,
									updated_at: newDate,
								}
							];
							return { ...request, conversation };

						} else {
							// if the request hasn't a conversation
							if (request.id === messageAdded[0].request_id && !request.conversation) {


								const conversation = [
									{
										id: messageAdded[0].conversation_id,
										user_1: messageAdded[0].user_id,
										user_2: id,
										request_id: messageAdded[0].request_id,
										updated_at: newDate,
									}
								];

								return { ...request, conversation };

							}
						}
						return request;

					});
					return { ...prevState, requests: updatedRequest };
				});
			}

			// add the conversation if not exist in requestConversationsIdStore
			if (!requestConversationIdStore.includes(messageAdded[0].conversation_id)) {
				setRequestConversationsIdStore([messageAdded[0].conversation_id, ...(requestConversationIdStore || [])]);
			}

			// check if the selectedRequest is the same as the messageAdded and update the conversation
			if (selectedRequest?.id === messageAdded[0].request_id && conversationIdState !== messageAdded[0].conversation_id) {
				setSelectedRequest((prevState: RequestProps | null) => {
					// if a conversation is already in selectedRequest
					if (prevState && prevState.conversation && prevState.conversation.some(conversation => conversation.id === messageAdded[0].conversation_id)) {
						const updatedRequest = prevState?.conversation.map(conversation => {

							if (conversation.id === messageAdded[0].conversation_id) {
								return { ...conversation, updated_at: newDate };
							}
							return conversation;
						});
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
							}
						];

						// check if user is in userConvStore
						if (!userConvStore.some(user => user.id === messageAdded[0].user_id)) {

							setNewUserId([messageAdded[0].user_id]);
						}

						return { ...prevState, conversation };

						// if the conversation id is not in the selectedRequest
					} else if (prevState && !prevState.conversation.some(conversation => conversation.id === messageAdded[0].conversation_id)) {

						const conversation = [
							...prevState.conversation,
							{
								id: messageAdded[0].conversation_id,
								user_1: messageAdded[0].user_id,
								user_2: id,
								request_id: messageAdded[0].request_id,
								updated_at: newDate,
							}
						];

						// check if user is in userConvStore
						if (!userConvStore.some(user => user.id === messageAdded[0].user_id)) {


							setNewUserId([messageAdded[0].user_id]);
						}

						return { ...prevState, conversation };

					} else {
						return null;
					}

				});
			}

			// remove the conversation from the notViewedConversationStore and database
			if (selectedRequest?.id === messageAdded[0].request_id && conversationIdState === messageAdded[0].conversation_id) {
				if (selectedRequest && selectedRequest.conversation && messageAdded[0].user_id !== id) {

					deleteNotViewedConversation({
						variables: {
							input: {
								user_id: id,
								conversation_id: [messageAdded[0].conversation_id]
							}
						}
					}).then(() => {
						// remove the conversation id from the notViewedConversationStore
						setNotViewedConversationStore(notViewedConversationStore.filter(id => id !== messageAdded[0].conversation_id));

					});

					if (deleteNotViewedConversationError) {
						throw new Error('Error updating conversation');
					}

				}

			} else {
				// add the conversation_id to the notViewedConversationStore
				if (!notViewedConversationStore.includes(messageAdded[0].conversation_id) && messageAdded[0].user_id !== id) {
					setNotViewedConversationStore([messageAdded[0].conversation_id, ...(notViewedConversationStore || [])]);
				}
			}


			// send id to the mutation to find user
			setNewUserId([]);
			if (messageAdded[0].user_id !== id && !userConvStore.some(user => user.id === messageAdded[0].user_id)) {

				setNewUserId([messageAdded[0].user_id]);
			}

			//check if the conversation is already in the clientMessageViewedStore
			/* if (!myRequestMessageViewedStore.some(id => messageAdded[0].conversation_id === id) && messageAdded[0].viewed === false) {
				// add the conversation_id to the clientMessageViewedStore
				setMyRequestMessageViewedStore([...messageAdded.map(message => message.conversation_id), ...(myRequestMessageViewedStore || [])]);
			} */

		}

	}, [messageSubscription]);

	// useEffect to count the number of conversation that are not viewed message in MyRequest
	useEffect(() => {

		//if (notViewedConversationStore.length > 0) {

		// count the number of conversation that are not viewed message
		const unviewedConversationIds = notViewedConversationStore.filter(id => requestConversationIdStore && requestConversationIdStore.includes(id));

		if (unviewedConversationIds.length > 0) {

			setViewedMessageState(unviewedConversationIds);
		} else {
			setViewedMessageState([]);
		}

		//}

	}, [notViewedConversationStore, requestConversationIdStore]);

	// useEffect to count the number of conversation that are not viewed message in MyConversation
	useEffect(() => {

		// count the number of conversation who is not viewed
		const notViewedConversation = notViewedConversationStore.filter(id => requestConversationIdStore && !requestConversationIdStore.includes(id));

		if (notViewedConversation.length > 0) {
			setViewedMyConversationState(notViewedConversation);
		} else {
			setViewedMyConversationState([]);
		}

	}, [notViewedConversationStore, requestConversationIdStore]);

	// function to handle navigation to my conversation
	const handleMyConvesationNavigate = () => {
		setSelectedTab('My conversations');
	};

	// function to range request by request location
	function RangeFilter(requests: RequestProps[], fromSubscribeToMore = false) {
		// Define the two points for each request and filter them
		const filteredRequests = requests.filter((request: RequestProps) => {
			const requestPoint = turf.point([request.lng, request.lat]);
			const userPoint = turf.point([lng, lat]);
			const distance = turf.distance(requestPoint, userPoint);

			return (
				(distance < request.range / 1000 || request.range === 0) &&
				(distance < settings[0].range / 1000 || settings[0].range === 0) &&
				(request.conversation === null || request.conversation === undefined ||
					!request.conversation.some(conversation =>
						(conversation.user_1 !== null && conversation.user_2 !== null) &&
						(conversation.user_1 === id || conversation.user_2 === id)
					)
				)
			);
		});

		// Get all requests that are not in the store
		const newRequests = filteredRequests.filter((request: RequestProps) =>
			clientRequestsStore?.every(prevRequest => prevRequest.id !== request.id)
		);

		// Add the new requests to the appropriate place in the list
		if (newRequests && newRequests.length > 0) {
			if (fromSubscribeToMore) {

				setClientRequestsStore([...newRequests, ...(clientRequestsStore || [])]);

				// Add request.id to the viewedRequestStore
				if (notViewedRequestStore.length === 0 || notViewedRequestStore.some(id => id !== newRequests[0].id)) {
					setNotViewedRequestStore([...notViewedRequestStore, newRequests[0].id]);
				}
			} else {


				setClientRequestsStore([...(clientRequestsStore || []), ...newRequests]);

			}
		}
	}

	// burger menu
	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};

	// function to redirect to home page when session is expired by serveur
	const RedirectExpiredSession = () => {
		setIsExpiredSession(false);
		sessionStorage.clear();
		localStorage.removeItem('chekayl');
		navigate('/');
	};

	return (
		<div className='dashboard'>
			{userDataLoading
				|| notViewedConversationLoading
				|| myConversationIdsLoading

				&& <Spinner />}
			<nav className="dashboard__nav">
				<button className="dashboard__nav__burger-menu" onClick={toggleMenu}>
					<div className='burger-icon'>
						<div className="burger-icon__line"></div>
						<div className="burger-icon__middle"></div>
						<div className="burger-icon__line"></div>
					</div>
				</button>
				<ul className={`dashboard__nav__menu ${isOpen ? 'open' : ''}`}>
					<div className="dashboard__nav__menu__content">
						<li
							className={`dashboard__nav__menu__content__tab ${selectedTab === 'Request' ? 'active' : ''}`}
							onClick={() => { setSelectedTab('Request'), setIsOpen(!isOpen); }}>Demande
						</li>
					</div>
					<div className="dashboard__nav__menu__content">
						<li
							className={`dashboard__nav__menu__content__tab ${selectedTab === 'My requests' ? 'active' : ''}`}
							onClick={() => { setSelectedTab('My requests'), setIsOpen(!isOpen); }}>Mes demandes
						</li>
						{viewedMessageState.length > 0 && <ClientRequestBadge count={viewedMessageState.length} />}
					</div>
					{role === 'pro' &&
						<div className="dashboard__nav__menu__content">
							<li
								className={`dashboard__nav__menu__content__tab ${selectedTab === 'Client request' ? 'active' : ''}`}
								onClick={() => { setSelectedTab('Client request'), setIsOpen(!isOpen); }}>Client
							</li>
							{notViewedRequestStore.length > 0 && <ClientRequestBadge count={notViewedRequestStore.length} />}
						</div>
					}
					{role === 'pro' &&
						<div className="dashboard__nav__menu__content">
							<li
								className={`dashboard__nav__menu__content__tab ${selectedTab === 'My conversations' ? 'active' : ''}`}
								onClick={() => { setSelectedTab('My conversations'), setIsOpen(!isOpen); }}>Mes échanges
							</li>
							{viewedMyConversationState.length > 0 && <ClientRequestBadge count={viewedMyConversationState.length} />}
						</div>
					}
					<div className="dashboard__nav__menu__content">
						<li
							className={`dashboard__nav__menu__content__tab ${selectedTab === 'My profile' ? 'active' : ''}`}
							onClick={() => { setSelectedTab('My profile'), setIsOpen(!isOpen); }}>Mon compte
						</li>
					</div>
				</ul>
			</nav>

			<div className="dashboard__content">

				{selectedTab === 'Request' && <Request />}
				{selectedTab === 'My requests' && <MyRequest
					setIsHasMore={setIsMyRequestHasMore}
					isHasMore={isMyRequestHasMore}
					conversationIdState={conversationIdState}
					setConversationIdState={setConversationIdState}
					selectedRequest={selectedRequest}
					setSelectedRequest={setSelectedRequest}
					newUserId={newUserId}
					setNewUserId={setNewUserId}
				/>}
				{selectedTab === 'My conversations' && <MyConversation
					isHasMore={isMyConversationHasMore}
					setIsHasMore={setIsMyConversationHasMore}
					offsetRef={myConversationOffsetRef}
					conversationIdState={myConversationIdState}
					setConversationIdState={setMyConversationIdState}
					clientMessageSubscription={clientMessageSubscription}
				/>}
				{selectedTab === 'My profile' && <Account />}
				{selectedTab === 'Client request' && <ClientRequest
					offsetRef={clientRequestOffset}
					setIsHasMore={setIsClientRequestHasMore}
					isHasMore={isCLientRequestHasMore}
					onDetailsClick={handleMyConvesationNavigate}
					RangeFilter={RangeFilter}
				/>}

			</div>
			<Footer />

			<ExpiredSessionModal
				isExpiredSession={isExpiredSession}
				setIsExpiredSession={setIsExpiredSession}
				RedirectExpiredSession={RedirectExpiredSession}
			/>
		</div>


	);
}

export default Dashboard;