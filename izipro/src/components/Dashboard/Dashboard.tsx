import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Account from './Account/Account';
import Request from './Request/Request';
import MyRequest from './MyRequest/MyRequest';
import MyConversation from './MyConversation/MyConversation';
import ClientRequest from './ClientRequest/ClientRequest';
import { userConversation, userDataStore } from '../../store/UserData';
import { useQueryUserData, useQueryUserSubscriptions } from '../Hook/Query';
import './Dashboard.scss';
import { subscriptionDataStore } from '../../store/subscription';
import { LOGOUT_USER_MUTATION } from '../GraphQL/UserMutations';
import { useMutation } from '@apollo/client';
import Footer from '../Footer/Footer';

import Spinner from '../Hook/Spinner';
import { useMyRequestMessageSubscriptions } from '../Hook/MyRequestSubscription';
import { useClientRequestSubscriptions } from '../Hook/ClientRequestSubscription';
import { useMyConversationSubscriptions } from '../Hook/MyConversationSubscription';
import { viewedClientMessageStore, viewedClientRequestStore, viewedMyRequestMessageStore } from '../../store/Viewed';
import { ClientRequestBadge } from '../Hook/Badge';

import { RequestProps } from '../../Type/Request';
// @ts-expect-error turf is not typed
import * as turf from '@turf/turf';

import { clientRequestStore, myRequestStore, requestConversationStore } from '../../store/Request';
import { MessageProps } from '../../Type/message';
import { messageDataStore, myMessageDataStore } from '../../store/message';


function Dashboard() {
	const navigate = useNavigate();

	// State
	const [isOpen, setIsOpen] = useState(false);
	const [selectedTab, setSelectedTab] = useState('');
	//selectedRequest for myRequest
	const [selectedRequest, setSelectedRequest] = useState<RequestProps | null>(null);
	const [newUserId, setNewUserId] = useState<number[]>([]);
	const [viewedMessageState, setViewedMessageState] = useState<number[]>([]);

	//store
	const id = userDataStore((state) => state.id);
	const role = userDataStore((state) => state.role);
	const setAll = userDataStore((state) => state.setAll);
	const setSubscription = subscriptionDataStore((state) => state.setSubscription);
	const lng = userDataStore((state) => state.lng);
	const lat = userDataStore((state) => state.lat);
	const settings = userDataStore((state) => state.settings);
	const [clientRequestsStore, setClientRequestsStore] = clientRequestStore((state) => [state.requests, state.setClientRequestStore]);
	messageDataStore((state) => [state.messages, state.setMessageStore]);
	requestConversationStore((state) => [state.requests, state.setRequestConversation]);
	myMessageDataStore((state) => [state.messages, state.setMessageStore]);
	myRequestStore((state) => [state.requests, state.setMyRequestStore]);
	const [userConvStore] = userConversation((state) => [state.users, state.setUsers]);
	// MyRequest store
	const [messageStore] = myMessageDataStore((state) => [state.messages, state.setMessageStore]);

	//store viewed
	const [clientMessageViewedStore, setClientMessageViewedStore] = viewedClientMessageStore((state) => [state.viewed, state.setViewedStore]);
	const [myRequestMessageViewedStore, setMyRequestMessageViewedStore] = viewedMyRequestMessageStore((state) => [state.viewed, state.setViewedStore]);
	const [clientRequestViewedStore, setClientRequestViewedStore] = viewedClientRequestStore((state) => [state.viewed, state.setViewedStore]);

	// Query to get the user data
	const { loading: userDataLoading, getUserData } = useQueryUserData();
	const getUserSubscription = useQueryUserSubscriptions();

	//mutation
	const [logout, { error: logoutError }] = useMutation(LOGOUT_USER_MUTATION);

	// Subscription to get new message
	const { messageSubscription } = useMyRequestMessageSubscriptions();
	const { clientRequestSubscription } = useClientRequestSubscriptions();
	const { clientMessageSubscription } = useMyConversationSubscriptions();

	// condition if user not logged in
	let isLogged;
	if (localStorage.getItem('ayl') === 'session') {
		isLogged = { value: true };
	} else {
		isLogged = JSON.parse(localStorage.getItem('ayl') || '{}');
	}

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
				setSelectedTab('Client request');
			} else {
				setSelectedTab('My requests');
			}

		}
	}, [role]);

	// function to check if user is logged in
	useEffect(() => {
		// clear local storage and session storage when user leaves the page if local storage is set to session
		const handleBeforeUnload = () => {
			if (localStorage.getItem('ayl') === 'session') {
				// clear local storage,session storage and cookie
				logout({
					variables: {
						logoutId: id
					}
				}).then(() => {

					sessionStorage.clear();
					localStorage.clear();
				});

				if (logoutError) {
					throw new Error('Error while logging out');
				}
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);

		// check if user is logged in
		if (isLogged !== null && Object.keys(isLogged).length !== 0) {
			if (new Date().getTime() > isLogged.expiry) {
				// The data has expired
				localStorage.removeItem('ayl');


				if (window.location.pathname !== '/') {
					navigate('/');
				}
			}
		} else {


			if (window.location.pathname !== '/') {
				navigate('/');
			}
			// if user logged in, set the user data to the store
		}

	}, []);

	// set user data to the store
	useEffect(() => {
		if (getUserData) {


			setAll(getUserData?.user);
		}
	}, [getUserData]);

	// useEffect subscribe to new client message in MyConversation
	useEffect(() => {

		// check if the message is already in the store
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

			// add updated_at to the request.conversation
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

			//check if the conversation is already in the clientMessageViewedStore
			if (!clientMessageViewedStore.some(id => messageAdded[0].conversation_id === id)) {
				// add the conversation_id to the clientMessageViewedStore
				setClientMessageViewedStore([...messageAdded.map(message => message.conversation_id), ...(clientMessageViewedStore || [])]);
			}

			// add the conversation_id to the clientMessageViewedStore
			//setClientMessageViewedStore([...messageAdded.map(message => message.conversation_id), ...(clientMessageViewedStore || [])]);

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
								updated_at: newDate
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
									updated_at: newDate
								}
							];

							return { ...request, conversation };

						}
					}
					return request;

				});
				return { ...prevState, requests: updatedRequest };
			});

			if (selectedRequest?.id === messageAdded[0].request_id) {
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
					} else if (prevState && !prevState.conversation ) {

						const conversation = [
							{
								id: messageAdded[0].conversation_id,
								user_1: messageAdded[0].user_id,
								user_2: id,
								request_id: messageAdded[0].request_id,
								updated_at: newDate
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
								updated_at: newDate
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

	useEffect(() => {
		if (messageStore.length > 0) {
			// count the number of conversation that are not viewed message
			const unviewedConversations = new Set(
				messageStore
					.filter(message => message.viewed === false)
					.map(message => message.conversation_id)
			);

			setViewedMessageState([...unviewedConversations]);

		}

	}, [messageStore]);
	// function to handle navigation to my conversation
	const handleMyConvesationNavigate = () => {
		setSelectedTab('My conversations');
	};

	function RangeFilter(requests: RequestProps[], fromSubscribeToMore = false) {
		// If the function is called from the subscription, we need to add the new request to the top of list
		if (fromSubscribeToMore) {

			const filteredRequests = requests.filter((request: RequestProps) => {
				// Define the two points
				const requestPoint = turf.point([request.lng, request.lat]);
				const userPoint = turf.point([lng, lat]);
				// Calculate the distance in kilometers (default)
				const distance = turf.distance(requestPoint, userPoint);

				return (
					// Check if the request is in the user's range
					(distance < request.range / 1000 || request.range === 0) &&
					// Check if the request is in the user's settings range
					(distance < settings[0].range / 1000 || settings[0].range === 0) &&
					// Check if the user is already in conversation with the request
					(request.conversation === null || request.conversation === undefined ||
						!request.conversation.some(conversation =>
							(conversation.user_1 !== null && conversation.user_2 !== null) &&
							(conversation.user_1 === id || conversation.user_2 === id)
						)
					)
				);
			});

			//get all request who are not in the store
			const newRequests = filteredRequests.filter((request: RequestProps) => clientRequestsStore?.every(prevRequest => prevRequest.id !== request.id));

			// Add the new requests to the top of the list
			if (newRequests) {
				setClientRequestsStore([...newRequests, ...(clientRequestsStore || [])]);

				// add the request.id to the viewedClientRequestStore
				setClientRequestViewedStore([...newRequests.map(request => request.id), ...(clientRequestViewedStore || [])]);

			}

			//offsetRef.current = offsetRef.current + filteredRequests.length;

		} else {
			// If the function is called from the query, we need to add the new requests to the bottom of the list
			requests.filter((request: RequestProps) => {
				// Define the two points
				const requestPoint = turf.point([request.lng, request.lat]);
				const userPoint = turf.point([lng, lat]);
				// Calculate the distance in kilometers (default)
				const distance = turf.distance(requestPoint, userPoint);

				return (
					(distance < request.range / 1000 || request.range === 0) &&
					(distance < settings[0].range / 1000 || settings[0].range === 0) &&
					// Check if the user is already in conversation with the request
					(request.conversation === null || request.conversation === undefined ||
						!request.conversation.some(conversation =>
							(conversation.user_1 !== null && conversation.user_2 !== null) &&
							(conversation.user_1 === id || conversation.user_2 === id)
						)
					)
				);
			});

			//get all request who are not in the store
			const newRequests = requests.filter((request: RequestProps) => clientRequestsStore?.every(prevRequest => prevRequest.id !== request.id));

			// Add the new requests to the bottom of the list
			if (newRequests) {
				setClientRequestsStore([...newRequests, ...(clientRequestsStore || []),]);

				// add the request.id to the viewedClientRequestStore
				setClientRequestViewedStore([...newRequests.map(request => request.id), ...(clientRequestViewedStore || [])]);
			}

		}
	}

	// burger menu
	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};


	return (
		<div className='dashboard'>
			{userDataLoading && <Spinner />}
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
							{clientRequestViewedStore.length > 0 && <ClientRequestBadge count={clientRequestViewedStore.length} />}
						</div>
					}
					{role === 'pro' &&
						<div className="dashboard__nav__menu__content">
							<li
								className={`dashboard__nav__menu__content__tab ${selectedTab === 'My conversations' ? 'active' : ''}`}
								onClick={() => { setSelectedTab('My conversations'), setIsOpen(!isOpen); }}>Mes échanges
							</li>
							{clientMessageViewedStore.length > 0 && <ClientRequestBadge count={clientMessageViewedStore.length} />}
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
					messageSubscription={messageSubscription}
					selectedRequest={selectedRequest}
					setSelectedRequest={setSelectedRequest}
					newUserId={newUserId}
					setNewUserId={setNewUserId}
				/>}
				{selectedTab === 'My conversations' && <MyConversation
					clientMessageSubscription={clientMessageSubscription}
				/>}
				{selectedTab === 'My profile' && <Account />}
				{selectedTab === 'Client request' && <ClientRequest
					onDetailsClick={handleMyConvesationNavigate}
					RangeFilter={RangeFilter}
				/>}

			</div>
			<Footer />
		</div>

	);
}

export default Dashboard;