import { useEffect, useRef, useState } from 'react';
import { userConversation, userDataStore } from '../../../store/UserData';
import { useMutation } from '@apollo/client';
import { RequestProps } from '../../../Type/Request';
import './MyRequest.scss';
import { DELETE_REQUEST_MUTATION } from '../../GraphQL/RequestMutation';
import { useQueryMyMessagesByConversation, useQueryUserRequests, useQueryUsersConversation } from '../../Hook/Query';
import InfiniteScroll from 'react-infinite-scroll-component';
import { myRequestStore } from '../../../store/Request';
import { UserDataProps } from '../../../Type/User';
import { myMessageDataStore } from '../../../store/message';
import { MessageProps } from '../../../Type/message';
import { useFileHandler } from '../../Hook/useFileHandler';
import { subscriptionDataStore, SubscriptionStore } from '../../../store/subscription';
import { MESSAGE_MUTATION } from '../../GraphQL/ConversationMutation';
import { SubscriptionProps } from '../../../Type/Subscription';
//import { MESSAGE_SUBSCRIPTION } from '../../GraphQL/Subscription';
import { SUBSCRIPTION_MUTATION } from '../../GraphQL/SubscriptionMutations';
import { FaTrashAlt, FaCamera } from 'react-icons/fa';
import { MdSend, MdAttachFile } from 'react-icons/md';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import pdfLogo from '/logo/pdf-icon.svg';
import logoProfile from '/logo/logo profile.jpeg';
import { useModal, ImageModal } from '../../Hook/ImageModal';
import TextareaAutosize from 'react-textarea-autosize';
//import { useQueryConversation } from '../../Hook/Query';
import { DeleteItemModal } from '../../Hook/DeleteItemModal';
import Spinner from '../../Hook/Spinner';
//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
import { viewedMyRequestMessageStore } from '../../../store/Viewed';
import { VIEWED_MESSAGE_MUTATION } from '../../GraphQL/MessageMutation';
ReactModal.setAppElement('#root');


type ExpandedState = {
	[key: number]: boolean;
};


type MyRequestProps = {
	messageSubscription: { messageAdded: MessageProps[] } | undefined;
	selectedRequest: RequestProps | null;
	setSelectedRequest: (request: RequestProps | null) => void;
	newUserId: number[];
	setNewUserId: (id: number[]) => void;
};

function MyRequest({ messageSubscription, selectedRequest, setSelectedRequest, newUserId, setNewUserId }: MyRequestProps) {

	// ImageModal Hook
	const { modalIsOpen, openModal, closeModal, selectedImage, nextImage, previousImage } = useModal();

	//state
	//const [requests, setRequests] = useState<RequestProps[]>([]);
	//const [loading, setLoading] = useState(false);
	//
	const [userIds, setUserIds] = useState<number[]>([]);
	const [conversationIdState, setConversationIdState] = useState<number>(0);
	const [messageValue, setMessageValue] = useState('');
	const [requestByDate, setRequestByDate] = useState<RequestProps[] | null>(null);
	//const [newUserId, setNewUserId] = useState<number[]>([]);
	const [userConvState, setUserConvState] = useState<UserDataProps[]>([]);
	const [selectedUser, setSelectedUser] = useState<UserDataProps | null>(null);
	const [userDescription, setUserDescription] = useState<boolean>(false);
	const [isListOpen, setIsListOpen] = useState<boolean>(true);
	const [isAnswerOpen, setIsAnswerOpen] = useState<boolean>(false);
	const [isMessageOpen, setIsMessageOpen] = useState<boolean>(false);
	const [isMessageExpanded, setIsMessageExpanded] = useState({});
	const [deleteItemModalIsOpen, setDeleteItemModalIsOpen] = useState(false);
	const [modalArgs, setModalArgs] = useState<{ event: React.MouseEvent, requestId: number } | null>(null);
	const [isHasMore, setIsHasMore] = useState(true);
	const [isUserMessageOpen, setIsUserMessageOpen] = useState(false);


	// Create a state for the scroll position
	const offsetRef = useRef(0);

	// store
	const id = userDataStore((state) => state.id);
	const [myRequestsStore, setMyRequestsStore] = myRequestStore((state) => [state.requests, state.setMyRequestStore]);
	const [userConvStore, setUserConvStore] = userConversation((state) => [state.users, state.setUsers]);
	const [messageStore] = myMessageDataStore((state) => [state.messages, state.setMessageStore]);
	const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);
	//const [myRequestMessageViewedStore, setMyRequestMessageViewedStore] = viewedMyRequestMessageStore((state) => [state.viewed, state.setViewedStore]);

	//useRef
	//const updateSubscriptionRef = useRef<SubscriptionProps[]>([]);
	//const userOffsetRef = useRef(0);
	//const conversationIdRef = useRef(0);
	const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
	const idRef = useRef<number>(0);

	const limit = 4;


	// file upload
	const { urlFile, setUrlFile, file, setFile, handleFileChange } = useFileHandler();

	//mutation
	const [deleteRequest, { error: deleteRequestError }] = useMutation(DELETE_REQUEST_MUTATION);
	const [message, { error: createMessageError }] = useMutation(MESSAGE_MUTATION);
	const [subscriptionMutation, { error: subscriptionError }] = useMutation(SUBSCRIPTION_MUTATION);
	const [viewedMessage, { error: viewedMessageError }] = useMutation(VIEWED_MESSAGE_MUTATION);

	// Query to get the user requests
	const { loading: requestLoading, getUserRequestsData, fetchMore } = useQueryUserRequests(id, 0, limit);
	const { loading: conversationLoading, usersConversationData } = useQueryUsersConversation(newUserId.length !== 0 ? newUserId : userIds, 0, 0);
	const { loading: messageLoading, messageData } = useQueryMyMessagesByConversation(conversationIdState, 0, 100);


	// useEffect to update the requests store
	useEffect(() => {
		if (getUserRequestsData && getUserRequestsData.user.requests) {
			// If offset is 0, it's the first query, so just replace the queries
			if (offsetRef.current === 0) {
				// check if requests are already in the store
				const requestsIds = myRequestsStore.map(request => request.id);
				const newRequests = getUserRequestsData.user.requests?.filter((request: RequestProps) => !requestsIds.includes(request.id));
				if (newRequests.length > 0) {
					myRequestStore.setState(prevRequests => {
						return { ...prevRequests, requests: [...prevRequests.requests, ...newRequests] };
					});
				}
			}
		}

		if (getUserRequestsData?.user.requests.length < limit) {
			setIsHasMore(false);
		}
	}, [getUserRequestsData]);

	// useEffect to sort the requests by date and update the subscription
	useEffect(() => {
		if (myRequestsStore) {
			// Sort the requests by date
			const sortedRequests = [...myRequestsStore].sort((requestA, requestB) => {
				const dateA = requestA.conversation?.length
					? Math.max(...requestA.conversation.map(conv => isNaN(Date.parse(conv.updated_at)) ? Number(conv.updated_at) : new Date(conv.updated_at).getTime()))
					: isNaN(Date.parse(requestA.created_at)) ? Number(requestA.created_at) : new Date(requestA.created_at).getTime();

				const dateB = requestB.conversation?.length
					? Math.max(...requestB.conversation.map(conv => isNaN(Date.parse(conv.updated_at)) ? Number(conv.updated_at) : new Date(conv.updated_at).getTime()))
					: isNaN(Date.parse(requestB.created_at)) ? Number(requestB.created_at) : new Date(requestB.created_at).getTime();

				// For descending order (most recent first)
				return dateB - dateA;
			});

			setRequestByDate(sortedRequests);

			// update the subscription by request and conversation
			// get conversation id in subscriptionStore
			const conversationIds = subscriptionStore
				.filter(subscription => subscription.subscriber === 'conversation')
				.flatMap(subscription => subscription.subscriber_id);

			// get request with conversation id
			const requestwithId = myRequestsStore.filter(request => request.conversation && request.conversation.some(conversation => conversation.id));
			// get conversation id of all request which are not in the subscription
			const idsNotInSubscriptionStore = requestwithId.flatMap((request: RequestProps) =>
				request.conversation
					.filter(conversation => conversation.id !== null && !conversationIds.includes(conversation.id))
					.map(conversation => conversation.id)
			);

			// check if the conversation is already in the subscription
			if (idsNotInSubscriptionStore.length ?? 0 > 0) {
				const updatedConversationIds = [...conversationIds, ...idsNotInSubscriptionStore];

				//add new conversation to subscription
				if (updatedConversationIds && updatedConversationIds.length > 0) {
					subscriptionMutation({
						variables: {
							input: {
								user_id: id,
								subscriber: 'conversation',
								subscriber_id: updatedConversationIds
							}
						}

					}).then((response) => {

						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { created_at, updated_at, ...subscriptionWithoutTimestamps } = response.data.createSubscription;
						// replace the old subscription with the new one

						// Check if the subscriber already exists in subscriptionStore
						const existingSubscription = subscriptionStore.find((subscription: SubscriptionProps) =>
							subscription.subscriber === 'conversation'
						);
						// If the subscriber doesn't exist, add it to subscriptionStore
						if (!existingSubscription) {
							setSubscriptionStore([...subscriptionStore, subscriptionWithoutTimestamps]);
						} else {
							// Replace the old subscription with the new one
							const addSubscriptionStore = subscriptionStore.map((subscription: SubscriptionProps) =>
								subscription.subscriber === 'conversation' ? subscriptionWithoutTimestamps : subscription
							);

							if (addSubscriptionStore) {
								setSubscriptionStore(addSubscriptionStore);
							}
						}
					});

					if (subscriptionError) {
						throw new Error('Error while creating subscription');
					}
				}
			}

			// get request id in the request store
			const conversationRequestIds = subscriptionStore
				.filter(subscription => subscription.subscriber === 'request')
				.flatMap(subscription => subscription.subscriber_id);

			// get request id of all request which are not in the subscription
			const idsNotInRequestSubscriptionStore = myRequestsStore
				.filter(request => !conversationRequestIds.includes(request.id))
				.map(request => request.id); // map to an array of ids

			// check if the request is already in the subscription
			if (idsNotInRequestSubscriptionStore.length ?? 0 > 0) {
				const updatedRequestIds = [...conversationRequestIds, ...idsNotInRequestSubscriptionStore];

				//add new request to subscription
				if (updatedRequestIds && updatedRequestIds.length > 0) {
					subscriptionMutation({
						variables: {
							input: {
								user_id: id,
								subscriber: 'request',
								subscriber_id: updatedRequestIds
							}
						}

					}).then((response) => {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { created_at, updated_at, ...subscriptionWithoutTimestamps } = response.data.createSubscription;
						// Check if the subscriber already exists in subscriptionStore
						const existingSubscription = subscriptionStore.find((subscription: SubscriptionProps) =>
							subscription.subscriber === 'request'
						);
						// If the subscriber doesn't exist, add it to subscriptionStore
						if (!existingSubscription) {
							setSubscriptionStore([...subscriptionStore, subscriptionWithoutTimestamps]);
						} else {
							// Replace the old subscription with the new one
							const addSubscriptionStore = subscriptionStore.map((subscription: SubscriptionProps) =>
								subscription.subscriber === 'request' ? subscriptionWithoutTimestamps : subscription
							);

							if (addSubscriptionStore) {
								setSubscriptionStore(addSubscriptionStore);
							}
						}
					});

					if (subscriptionError) {
						throw new Error('Error while creating subscription');
					}
				}
			}
		}
	}, [myRequestsStore]);
	
	// useEffect to update user conversation by date
	useEffect(() => {
		if (userConvStore && selectedRequest && selectedRequest.conversation) {

			// sort the messages by date to show the most recent user conversation
			const conversation = selectedRequest.conversation;

			const conversationByDate = conversation.slice().sort((a, b) => {

				const dateA = new Date(a.updated_at).getTime();
				const dateB = new Date(b.updated_at).getTime();
				return dateB - dateA;
			});

			// take the user id from the conversation
			const sortedUsers = conversationByDate.map(conversation => {
				const user = userConvStore.find(user => user.id === (conversation.user_1 !== id ? conversation.user_1 : conversation.user_2));
				return user;
			});

			const filteredSortedUsers = sortedUsers.filter((user): user is UserDataProps => user !== undefined);
			// Convert filteredSortedUsers to a Set to remove duplicates, then convert it back to an array
			const uniqueUsers = Array.from(new Set(filteredSortedUsers.map(user => JSON.stringify(user)))).map(user => JSON.parse(user));
			setUserConvState(uniqueUsers);

			/* const firstUserElement = document.getElementById('first-user');
			if (firstUserElement) {
				firstUserElement.click();
			} */
			setSelectedUser(null);
			setConversationIdState(0);
		}

	}, [userConvStore, selectedRequest]);

	// useEffect to update the message store
	useEffect(() => {
		if (messageData) {

			const messages: MessageProps[] = messageData.messages;
			// Add the new messages to the store

			// Filter out messages that are already in the store
			const newMessages = messages.filter(
				(newMessage) => !messageStore.find((existingMessage) => existingMessage.id === newMessage.id)
			);

			myMessageDataStore.setState(prevState => {
				if (prevState.messages.length > 0) {


					return {
						...prevState,
						messages: [...prevState.messages, ...newMessages]
					};
				} else {

					return {
						...prevState,
						messages: [...messages]
					};
				}
			});

			/* //check if the conversation is already in the clientMessageViewedStore
			if (!myRequestMessageViewedStore.some(id => newMessages.filter(message => message.conversation_id === id))) {

				//select only message with viewed is false
				const messageAdded = newMessages.filter(message => message.viewed === false);
				// add the conversation_id to the clientMessageViewedStore
				setMyRequestMessageViewedStore([...messageAdded.map(message => message.conversation_id), ...(myRequestMessageViewedStore || [])]);
			} */

		}
	}, [messageData]);

	// useEffect to update the user conversation state
	useEffect(() => {
		if (usersConversationData) {
			// If offset is 0, it's the first query, so just replace the queries
			if (userConvStore.length === 0) {


				setUserConvStore(usersConversationData.users);

				// if same users ids in the store don't add them
			} else if (usersConversationData.users.every((user1: UserDataProps) =>
				userConvStore.some(user2 => user2.id === user1.id))) {
				return;

			} else {
				// Filter out users that are already in userConvStore
				const newUsers = usersConversationData.users.filter(
					(user1: UserDataProps) => !userConvStore.some(user2 => user2.id === user1.id)
				);
				setUserConvStore([...newUsers, ...userConvStore]);
			}
		}
		setNewUserId([]);


	}, [usersConversationData]);

	// useEffect to scroll to the end of the messages
	useEffect(() => {
		setTimeout(() => {
			endOfMessagesRef.current?.scrollIntoView(/* { behavior: 'smooth' } */);
		}, 200);
	}, [messageStore]);

	//  set selected request at null when the component is unmounted
	useEffect(() => {
		return () => {
			setSelectedRequest(null);
		};
	}, []);

	// Function to delete a request
	const handleDeleteRequest = (event: React.MouseEvent<Element, MouseEvent>, requestId: number) => {
		event.preventDefault();

		deleteRequest({
			variables:
			{
				input:
				{
					id: requestId,
					user_id: id,
				}
			}

		}).then((response) => {
			// Get the conversation ids for the request
			const conversationIds = myRequestStore.getState().requests.find(request => request.id === requestId)?.conversation?.map(conversation => conversation.id);

			if (response.data.deleteRequest) {
				// Remove the request from the store
				setMyRequestsStore(myRequestsStore.filter(request => request.id !== requestId));
			}
			setUserConvState([]);
			setModalArgs(null);
			setDeleteItemModalIsOpen(false);

			// remove subscription for this request
			const subscription = subscriptionStore.find(subscription => subscription.subscriber === 'request');
			const updatedSubscription = Array.isArray(subscription?.subscriber_id) ? subscription?.subscriber_id.filter(id => id !== requestId) : [];

			subscriptionMutation({
				variables: {
					input: {
						user_id: id,
						subscriber: 'request',
						subscriber_id: updatedSubscription
					}
				}
			}).then((response) => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { created_at, updated_at, ...subscriptionWithoutTimestamps } = response.data.createSubscription;


				subscriptionDataStore.setState((prevState: SubscriptionStore) => ({
					...prevState,
					subscription: prevState.subscription.map((subscription: SubscriptionProps) =>
						subscription.subscriber === 'request' ? subscriptionWithoutTimestamps : subscription
					)
				}));

				if (conversationIds) {


					// remove subscription for this conversation
					const conversationSubscription = subscriptionStore.find(subscription => subscription.subscriber === 'conversation');
					const updatedConversationSubscription = Array.isArray(conversationSubscription?.subscriber_id) ? conversationSubscription?.subscriber_id.filter(id => !conversationIds.includes(id)) : [];

					subscriptionMutation({
						variables: {
							input: {
								user_id: id,
								subscriber: 'conversation',
								subscriber_id: updatedConversationSubscription
							}
						}
					}).then((response) => {

						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { created_at, updated_at, ...subscriptionWithoutTimestamps } = response.data.createSubscription;


						subscriptionDataStore.setState((prevState: SubscriptionStore) => ({
							...prevState,
							subscription: prevState.subscription.map((subscription: SubscriptionProps) =>
								subscription.subscriber === 'conversation' ? subscriptionWithoutTimestamps : subscription
							)
						}));

						// delete from message store all message with this conversation ids
						myMessageDataStore.setState(prevState => {
							const newMessages = prevState.messages.filter(
								(message: MessageProps) => !conversationIds.includes(message.conversation_id)
							);
							return {
								...prevState,
								messages: [...newMessages]
							};
						});

					});

					if (subscriptionError) {
						throw new Error('Error while updating conversation subscription');
					}
				}
			});
		});

		if (deleteRequestError) {
			throw new Error('Error while deleting request');
		}

	};

	// Function to handle the users ids for the conversation
	const handleConversation = (request: RequestProps, event?: React.MouseEvent<HTMLDivElement>) => {
		event?.preventDefault();

		if (!request.conversation) {

			setUserConvState([]);

		} else {
			// Get the user ids from the conversation
			const ids = request?.conversation?.map(conversation => {
				return conversation.user_1 !== id ? conversation.user_1 : conversation.user_2;
			});


			// Filter out the user ids that are already in the userConvStore
			const idStore = userConvStore.map(user => user.id);
			const newIds = ids.filter(id => !idStore.includes(id));

			if (newIds.length > 0) {
				setUserIds(newIds || []); // Provide a default value of an empty array
			}
		}
	};
	
	// Function find conversation id for message
	const handleMessageConversation = (userId: number, event?: React.MouseEvent<HTMLDivElement>) => {
		event?.preventDefault();
	

		// find the conversation id for the message
		const conversationId = selectedRequest?.conversation?.find(conversation =>
			(conversation.user_1 === id || conversation.user_2 === id) &&
			(conversation.user_1 === userId || conversation.user_2 === userId)
		);

		if (conversationId?.id !== conversationIdState) {
			setConversationIdState(conversationId?.id || 0);
		}


		// change viewed status of the message
		if (selectedRequest && selectedRequest.conversation) {

			const messageIds = messageStore.filter(message => message.conversation_id === conversationId?.id && message.viewed === false).map(message => message.id);

			if (messageIds.length > 0) {
				viewedMessage({
					variables: {
						input: {
							id: messageIds,
						}
					}
				}).then(() => {

					// update viewed message in the store
					myMessageDataStore.setState(prevState => {
						const updatedMessages = prevState.messages.map(message => {
							if (messageIds.includes(message.id)) {
								return { ...message, viewed: true };
							}
							return message;
						});
						return {
							...prevState,
							messages: [...updatedMessages]
						};
					});
				});
			}

			if (viewedMessageError) {
				throw new Error('Error while updating message');
			}
		}
	};

	// Function to send message and create conversation
	const handleMessageSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		// map file to send to graphql
		const sendFile = file.map(file => ({
			file,
		}));
		// create message
		// if the message is not empty or the file is not empty
		if (conversationIdState ?? 0 > 0) {
			if (messageValue.trim() !== '' || sendFile.length > 0) {

				message({
					variables: {
						id: id,
						input: {
							content: messageValue,
							user_id: id,
							conversation_id: conversationIdState,
							media: sendFile
						}
					}
				}).then(() => {
					setMessageValue('');
					setFile([]);
					setUrlFile([]);
					const textarea = document.querySelector('.my-request__message-list__form__label__input') as HTMLTextAreaElement;
					if (textarea) {
						textarea.style.height = 'auto';
					}
				});
			}
		}
		if (createMessageError) {
			throw new Error('Error creating message');
		}
	};

	// remove file
	const handleRemove = (index: number) => {
		// Remove file from file list
		const newFiles = [...file];
		newFiles.splice(index, 1);
		setFile(newFiles);
		// Remove file from urlFile list
		const newUrlFileList = [...urlFile];
		newUrlFileList.splice(index, 1);
		setUrlFile(newUrlFileList);
	};

	// Function to fetchmore requests
	const addRequest = () => {
		if (fetchMore) {
			fetchMore({
				variables: {
					offset: myRequestsStore.length // Next offset
				},
			}).then((fetchMoreResult: { data: { user: { requests: RequestProps[] } } }) => {
				console.log('fetchMoreResult', fetchMoreResult.data.user.requests);

				// remove request who is already in the store
				const requestsIds = myRequestsStore.map(request => request.id);
				const newRequests = fetchMoreResult.data.user.requests.filter((request: RequestProps) => !requestsIds.includes(request.id));
				console.log('newRequests', newRequests);
				if (newRequests.length > 0) {
					myRequestStore.setState(prevRequests => {
						return { ...prevRequests, requests: [...prevRequests.requests, ...newRequests] };
					});

					offsetRef.current = offsetRef.current + fetchMoreResult.data.user.requests.length;
				}

				// if there is no more request stop the infinite scroll
				if (fetchMoreResult.data.user.requests.length < limit) {
					setIsHasMore(false);
				}

			});
		}
	};

	return (
		<div className="my-request">
			<div id="scrollableRequest" className={`my-request__list ${isListOpen ? 'open' : ''} ${requestLoading ? 'loading' : ''}`}>
				{requestLoading && <Spinner />}
				{!requestByDate && <p className="my-request__list no-req">Vous n&apos;avez pas de demande</p>}
				{requestByDate && (
					<div className="my-request__list__detail" >
						{/* <InfiniteScroll
							dataLength={myRequestsStore?.length}
							next={addRequest}
							hasMore={isHasMore}
							loader={<p className="my-request__list no-req">chargement...</p>}
							scrollableTarget="scrollableRequest"
							endMessage={
								myRequestsStore.length > 0 ? <p className="my-request__list no-req">Fin des résultats</p>
									:
									<p className="my-request__list no-req">Vous n&apos;avez pas de demande</p>}
							
						> */}
						{requestByDate.map((request, index) => (
							<div
								id={index === 0 ? 'first-request' : undefined}
								className={`my-request__list__detail__item 
									${request.urgent}
									${selectedRequest?.id === request?.id ? 'selected' : ''} 
									${messageStore.some(message => message.request_id === request.id && message.viewed === false) ? 'not-viewed' : ''} `}
								key={request.id}
								onClick={(event) => {
									handleConversation(request, event),
									setSelectedRequest(request),
									setIsListOpen(false),
									setIsAnswerOpen(true),
									setIsMessageOpen(false);
								}}
							>
								{request.urgent && <p className="my-request__list__detail__item urgent">URGENT</p>}
								<div className="my-request__list__detail__item__header">
									<p className="my-request__list__detail__item__header date" >
										<span className="my-request__list__detail__item__header date-span">
											Date:</span>&nbsp;{new Date(Number(request.created_at)).toLocaleString()}
									</p>
									<p className="my-request__list__detail__item__header city" >
										<span className="my-request__list__detail__item__header city-span">
											Ville:</span>&nbsp;{request.city}
									</p>
									<h2 className="my-request__list__detail__item__header job" >
										<span className="my-request__list__detail__item__header job-span">
											Métier:</span>&nbsp;{request.job}
									</h2>
									{request.denomination ? (
										<p className="my-request__list__detail__item__header name" >
											<span className="my-request__list__detail__item__header name-span">
												Entreprise:</span>&nbsp;{request.denomination}
										</p>
									) : (
										<p className="my-request__list__detail__item__header name" >
											<span className="my-request__list__detail__item__header name-span">
												Nom:</span>&nbsp;{request.first_name} {request.last_name}
										</p>
									)}
								</div>
								<h1 className="my-request__list__detail__item title" >{request.title}</h1>
								<p
									//@ts-expect-error con't resolve this type
									className={`my-request__list__detail__item message ${isMessageExpanded && isMessageExpanded[request?.id] ? 'expanded' : ''}`}
									onClick={(event) => {
										//to open the message when the user clicks on it just for the selected request 
										idRef.current = request?.id ?? 0; // check if request or requestByDate is not undefined

										if (idRef.current !== undefined && setIsMessageExpanded) {
											setIsMessageExpanded((prevState: ExpandedState) => ({
												...prevState,
												[idRef.current as number]: !prevState[idRef.current]
											}));
										}
										event.stopPropagation();
									}}
								>
									{request.message}
								</p>
								<div className="my-request__list__detail__item__picture">

									{(() => {
										const imageUrls = request.media?.map(media => media.url) || [];
										return request.media?.map((media, index) => (
											media ? (
												media.name.endsWith('.pdf') ? (
													<a
														href={media.url}
														key={media.id}
														download={media.name}
														target="_blank"
														rel="noopener noreferrer"
														onClick={(event) => { event.stopPropagation(); }} >
														<img
															className="my-request__list__detail__item__picture img"
															//key={media.id} 
															src={pdfLogo}
															alt={media.name}
														/>
													</a>
												) : (
													<img
														className="my-request__list__detail__item__picture img"
														key={media.id}
														src={media.url}
														onClick={(event) => {
															openModal(imageUrls, index),
															event.stopPropagation();
														}}
														alt={media.name}
													/>
												)
											) : null
										));
									})()}

								</div>
								<button
									id={`delete-request-${request.id}`}
									className="my-request__list__detail__item__delete"
									type='button'
									onClick={(event) => {
										setDeleteItemModalIsOpen(true);
										setModalArgs({ event, requestId: request.id }),
										event.stopPropagation();
									}}>
								</button>
								<FaTrashAlt
									className="my-request__list__detail__item__delete-FaTrashAlt"
									onClick={(event) => {
										document.getElementById(`delete-request-${request.id}`)?.click(),
										event.stopPropagation();
									}}
								/>
							</div>
						))}
						{/* </InfiniteScroll> */}
					</div>
				)}
				<div className="my-request__list__fetch-button">
					{isHasMore ? (<button
						className="Btn"
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							addRequest();
						}
						}>
						<svg className="svgIcon" viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg"><path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"></path></svg>
						<span className="icon2"></span>
						<span className="tooltip">Charger plus</span>
					</button>
					) : (
						<p className="my-request__list no-req">Fin des résultats</p>
					)}
				</div>
			</div>
			<div id="scrollableAnswer" className={`my-request__answer-list ${isAnswerOpen ? 'open' : ''} ${conversationLoading ? 'loading' : ''}`}>
				{conversationLoading && <Spinner />}
				{/* <InfiniteScroll
					dataLength={myRequestsStore?.length}
					next={() => {}}
					hasMore={false}
					loader={<h4></h4>}
					scrollableTarget="scrollableAnswer"
				> */}
				<MdKeyboardArrowLeft
					className="my-request__answer-list return"
					onClick={() => {
						setSelectedRequest(null),
						setIsListOpen(true),
						setIsAnswerOpen(false),
						setIsMessageOpen(false);
					}}
				/>
				{selectedRequest && <h2 className="my-request__answer-list title">{selectedRequest?.title}</h2>}
				{userConvState?.length === 0 && <p className="my-request__answer-list no-conv">Vous n&apos;avez pas de conversation</p>}
				{userConvState && userConvState?.map((user: UserDataProps, index) => (
					<div
						id={index === 0 ? 'first-user' : undefined}
						className={`my-request__answer-list__user 
							${selectedUser?.id === user.id ? 'selected-user' : ''} 
							${user.deleted_at ? 'deleted' : ''}
							${messageStore.some(
						message => message.user_id === user.id 
								&& message.viewed === false && selectedRequest?.conversation.some(conv => conv.id === message.conversation_id)) ? 'not-viewed' : ''}`

						}
						key={user.id}
						onClick={(event) => {
							handleMessageConversation(user.id, event),	
							//updateViewedMessage();
							setIsUserMessageOpen(true),
							setSelectedUser(user),
							setIsMessageOpen(true),
							setIsAnswerOpen(false),
							setIsListOpen(false);
						}}>

						<div className="my-request__answer-list__user__header">
							<img className="my-request__answer-list__user__header img" src={user.image ? user.image : logoProfile} alt="" />
							{/* <img className="my-request__answer-list__user__header img" src={user.image} alt="" /> */}
							{/* <p className="my-request__answer-list__user__header name">{user.first_name}{user.last_name}</p> */}
							{user.denomination ? (
								<p className="my-request__answer-list__user__header denomination">{user.denomination}</p>
							) : (
								<p className="my-request__answer-list__user__header name">{user.first_name} {user.last_name}</p>
							)}
							{user.deleted_at && <p className="my-request__answer-list__user__header deleted">Utilisateur supprimé</p>}
						</div>
					</div>
				))}
				{/* </InfiniteScroll> */}
			</div>
			<div className={`my-request__message-list ${isMessageOpen ? 'open' : ''} ${messageLoading ? 'loading' : ''}`}>
				{messageLoading && <Spinner />}
				<div className="my-request__message-list__user">
					{/* {selectedUser && ( */}
					<div
						className="my-request__message-list__user__header"
						onClick={(event) => {
							setUserDescription(!userDescription);
							event.stopPropagation();
						}}
					>
						<div
							className="my-request__message-list__user__header__detail"
						>
							<MdKeyboardArrowLeft
								className="my-request__message-list__user__header__detail return"
								onClick={(event) => {
									setSelectedUser(null),
									setIsMessageOpen(false),
									setIsAnswerOpen(true),
									setIsUserMessageOpen(false),
									setIsListOpen(false);
									event.stopPropagation();
								}}
							/>
							<img className="my-request__message-list__user__header__detail img" src={selectedUser?.image ? selectedUser.image : logoProfile} alt="" />
							{/* <img className="my-request__answer-list__user__header img" src={user.image} alt="" /> */}
							{/* <p className="my-request__answer-list__user__header name">{user.first_name}{user.last_name}</p> */}
							{selectedUser?.denomination ? (
								<p className="my-request__message-list__user__header__detail denomination">{selectedUser?.denomination}</p>
							) : (
								<p className="my-request__message-list__user__header__detail name">{selectedUser?.first_name} {selectedUser?.last_name}</p>
							)}
							{selectedUser?.deleted_at && <p className="my-request__message-list__user__header__detail deleted">Utilisateur supprimé</p>}
						</div>
						{/* <p className="my-request__answer-list__user city">{user.city}</p> */}
						{userDescription && <div>
							<p className="my-request__message-list__user__header description">{selectedUser?.description ? selectedUser?.description : 'Pas de déscription'}</p>
						</div>
						}
					</div>
					{/* 	)} */}

				</div>
				{/* <h2 className="my-request__message-list__title">Messages for {selectedRequest?.title}</h2> */}
				<div id="scrollableMessage" className="my-request__message-list__message">
					{/* <InfiniteScroll
						className="infinite-scroll"
						dataLength={messageStore?.length}
						next={() => { }}
						hasMore={false}
						loader={<p className="my-request__list no-req"></p>}
						endMessage={<p className="my-request__list no-req"></p>}
						scrollableTarget="scrollableMessage"
					> */}
					{Array.isArray(messageStore) && isUserMessageOpen &&
						messageStore
							.filter((message) => message.conversation_id === conversationIdState)
							.map((message, index, array) => (
								<div className={`my-request__message-list__message__detail ${message.user_id === id ? 'me' : ''}`} key={message.id}>
									{index === array.length - 1 ? <div ref={endOfMessagesRef} /> : null}
									<div className={`content ${message.user_id === id ? 'me' : ''}`}>
										{message.media[0].url && (
											<div className="my-request__message-list__message__detail__image-container">
												<div className={`map ${message.content ? 'message' : ''}`}>
													{(() => {
														const imageUrls = message.media?.map(media => media.url) || [];
														return message.media?.map((media, index) => (
															media ? (
																media.name.endsWith('.pdf') ? (
																	<a
																		className="a-pdf"
																		href={media.url}
																		key={media.id}
																		download={media.name}
																		target="_blank"
																		rel="noopener noreferrer"
																		onClick={(event) => { event.stopPropagation(); }} >
																		<img
																			className={`my-request__message-list__message__detail__image-pdf ${message.media.length === 1 ? 'single' : 'multiple'}`}
																			//key={media.id} 
																			src={pdfLogo}
																			alt={media.name}
																		/>
																	</a>
																) : (
																	<img
																		className={`my-request__message-list__message__detail__image ${message.media.length === 1 ? 'single' : 'multiple'}`}
																		key={media.id}
																		src={media.url}
																		onClick={() => openModal(imageUrls, index)}
																		alt={media.name}
																	/>
																)
															) : null
														));
													})()}
												</div>
											</div>
										)}
										{message.content && <div className="my-request__message-list__message__detail__texte">{message.content}</div>}
									</div>
									<div className="my-request__message-list__message__detail__date">{new Date(Number(message.created_at)).toLocaleString()}</div>
								</div>
							))

					}
					{/* </InfiniteScroll> */}
				</div>

				<form className="my-request__message-list__form" onSubmit={(event) => {
					event.preventDefault();
					if (selectedUser?.id && !selectedUser?.deleted_at) {
						handleMessageSubmit(event);
					}

				}}>
					{urlFile.length > 0 && <div className="my-request__message-list__form__preview">
						{urlFile.map((file, index) => (
							<div className="my-request__message-list__form__preview__container" key={index}>

								<img
									className="my-request__message-list__form__preview__container__image"
									src={file.type === 'application/pdf' ? pdfLogo : file.name}
									alt={`Preview ${index}`}
								/>
								<div
									className="my-request__message-list__form__preview__container__remove"
									onClick={() => handleRemove(index)}
								>
									X
								</div>
							</div>
						))}
					</div>}
					<label className="my-request__message-list__form__label">
						<MdAttachFile
							className="my-request__message-list__form__label__attach"
							onClick={() => document.getElementById('send-file')?.click()}
						/>
						<FaCamera
							className="my-request__message-list__form__label__camera"
							onClick={() => document.getElementById('file-camera')?.click()}
						/>
						<TextareaAutosize
							//key={messageValue || 'empty'}
							className="my-request__message-list__form__label__input"
							value={messageValue}
							onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setMessageValue(event.target.value)}
							placeholder="Tapez votre message ici..."
							maxLength={500}
						/>
						<MdSend
							className="my-request__message-list__form__label__send"
							onClick={() => document.getElementById('send-message')?.click()}
						/>
					</label>
					<input
						id="send-file"
						className="my-request__message-list__form__input"
						type="file"
						accept="image/*,.pdf"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFileChange(event)}
						multiple={true}
					/>
					<input
						id="file-camera"
						className="my-request__message-list__form__input medi"
						type="file"
						accept="image/*"
						capture="environment"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFileChange(event)}
					/>
					<button
						id="send-message"
						className="my-request__message-list__form__button"
						type="submit"
					>
						Send
					</button>
				</form>

			</div>

			<ImageModal
				modalIsOpen={modalIsOpen}
				closeModal={closeModal}
				selectedImage={selectedImage}
				nextImage={nextImage}
				previousImage={previousImage}
			/>
			<DeleteItemModal
				modalArgs={modalArgs}
				setModalArgs={setModalArgs}
				setDeleteItemModalIsOpen={setDeleteItemModalIsOpen}
				deleteItemModalIsOpen={deleteItemModalIsOpen}
				handleDeleteRequest={handleDeleteRequest}
			/>
			{/* <ReactModal
				className="modal"
				isOpen={deleteItemModalIsOpen}
				contentLabel="Delete Account"
				shouldCloseOnOverlayClick={false}
				aria-label="supprimer mon compte"
			>
				<div className="modal__container">
					<h1 className="modal__title">ATTENTION!!</h1>
					<p className="modal__description">Vous allez supprimer cette demande, êtes vous sur?</p>
					<div className="modal__container__button">
						<button 
							className="modal__delete" 
							onClick={() => {
								if (modalArgs?.event && modalArgs?.requestId) {
									handleDeleteRequest(modalArgs.event, modalArgs.requestId);
								}
							}}
						>
							Supprimer
						</button>
						<button className="modal__cancel" onClick={() => {
							setDeleteItemModalIsOpen(!deleteItemModalIsOpen),
							setModalArgs(null);
						}}>Annuler</button>
					</div>
				</div>
			</ReactModal> */}
		</div>


	);
}

export default MyRequest;







