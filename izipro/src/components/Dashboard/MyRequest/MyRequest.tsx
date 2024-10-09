import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Apollo Client mutations
import { useMutation } from '@apollo/client';
import { DELETE_NOT_VIEWED_CONVERSATION_MUTATION } from '../../GraphQL/ConversationMutation';
import { DELETE_REQUEST_MUTATION } from '../../GraphQL/RequestMutation';
import { MESSAGE_MUTATION } from '../../GraphQL/MessageMutation';
import { SUBSCRIPTION_MUTATION } from '../../GraphQL/SubscriptionMutations';
// Custom hooks and queries
import {
	useQueryMyMessagesByConversation,
	useQueryUserRequests,
	useQueryUsersConversation,
} from '../../Hook/Query';
import { useFileHandler } from '../../Hook/useFileHandler';
// State management and stores
import {
	userDataStore,
	userConversation
} from '../../../store/UserData';
import { myRequestStore } from '../../../store/Request';
import { subscriptionDataStore, SubscriptionStore } from '../../../store/subscription';
import { notViewedConversation } from '../../../store/Viewed';
import { messageConvIdMyreqStore, myMessageDataStore } from '../../../store/message';

// Types
import { RequestProps } from '../../../Type/Request';
import { UserDataProps } from '../../../Type/User';
import { MessageProps } from '../../../Type/message';
import { SubscriptionProps } from '../../../Type/Subscription';

// Components and utilities
import './MyRequest.scss';
import pdfLogo from '/logo-pdf.webp';
import logoProfile from '/logo-profile.webp';
import { useModal, ImageModal } from '../../Hook/ImageModal';
import { FaTrashAlt, FaCamera } from 'react-icons/fa';
import { MdSend, MdAttachFile, MdKeyboardArrowLeft, MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md';
//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
import TextareaAutosize from 'react-textarea-autosize';
import Spinner from '../../Hook/Spinner';
import { DeleteItemModal } from '../../Hook/DeleteItemModal';
import { motion, AnimatePresence } from 'framer-motion';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import noPicture from '/no-picture.webp';
import { formatMessageDate } from '../../Hook/Component';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';


// Configuration for React Modal
ReactModal.setAppElement('#root');

type ExpandedState = {
	[key: number]: boolean;
};


type MyRequestProps = {
	setIsHasMore: (hasMore: boolean) => void;
	isHasMore: boolean;
	conversationIdState: number;
	setConversationIdState: (id: number) => void;
	selectedRequest: RequestProps | null;
	setSelectedRequest: (request: RequestProps | null) => void;
	newUserId: number[];
	setNewUserId: (id: number[]) => void;
};

function MyRequest({ selectedRequest, setSelectedRequest, newUserId, setNewUserId, conversationIdState, setConversationIdState, setIsHasMore, isHasMore }: MyRequestProps) {

	// ImageModal Hook
	const { modalIsOpen, openModal, closeModal, selectedImage, nextImage, previousImage } = useModal();

	//state
	const [userIds, setUserIds] = useState<number[]>([]);
	const [messageValue, setMessageValue] = useState('');
	const [requestByDate, setRequestByDate] = useState<RequestProps[] | null>(null);
	const [userConvState, setUserConvState] = useState<UserDataProps[]>([]);
	const [selectedUser, setSelectedUser] = useState<UserDataProps | null>(null);
	const [userDescription, setUserDescription] = useState<boolean>(false);
	const [isListOpen, setIsListOpen] = useState<boolean>(true);
	const [isAnswerOpen, setIsAnswerOpen] = useState<boolean>(window.innerWidth > 1000 ? true : false);
	const [isMessageOpen, setIsMessageOpen] = useState<boolean>(window.innerWidth > 1000 ? true : false);
	const [isMessageExpanded, setIsMessageExpanded] = useState({});
	const [deleteItemModalIsOpen, setDeleteItemModalIsOpen] = useState(false);
	const [modalArgs, setModalArgs] = useState<{ requestId: number, requestTitle: string } | null>(null);
	const [isUserMessageOpen, setIsUserMessageOpen] = useState(false);
	const [isSkipRequest] = useState<boolean>(true);
	const [isSkipMessage, setIsSkipMessage] = useState<boolean>(true);
	const [fetchConvIdState, setFetchConvIdState] = useState<number>(0);
	const [hasManyImages, setHasManyImages] = useState(false);
	const [uploadFileError, setUploadFileError] = useState('');
	const [isFetchingMore, setIsFetchingMore] = useState(false);
	//const [isHandleClick, setIsHandleClick] = useState<boolean>(false);

	// Create a state for the scroll position
	const offsetRef = useRef(0);

	// store
	const id = userDataStore((state) => state.id);
	const [myRequestsStore, setMyRequestsStore] = myRequestStore((state) => [state.requests, state.setMyRequestStore]);
	const [userConvStore, setUserConvStore] = userConversation((state) => [state.users, state.setUsers]);
	const [messageStore] = myMessageDataStore((state) => [state.messages, state.setMessageStore]);
	const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);
	const [notViewedConversationStore, setNotViewedConversationStore] = notViewedConversation((state) => [state.notViewed, state.setNotViewedStore]);
	const [isMessageConvIdFetched, setIsMessageConvIdFetched] = messageConvIdMyreqStore((state) => [state.convId, state.setConvId]);

	//useRef
	//const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
	const idRef = useRef<number>(0);
	const selectedRequestRef = useRef<RequestProps | null>(null);

	const limit = 5;

	// file upload
	const { urlFile, setUrlFile, fileError, file, setFile, handleFileChange } = useFileHandler();

	//mutation
	const [deleteRequest, { loading: deleteRequestLoading, error: deleteRequestError }] = useMutation(DELETE_REQUEST_MUTATION);
	const [message, { loading: messageMutationLoading, error: createMessageError }] = useMutation(MESSAGE_MUTATION);
	const [subscriptionMutation, { error: subscriptionError }] = useMutation(SUBSCRIPTION_MUTATION);
	const [deleteNotViewedConversation, { error: deleteNotViewedConversationError }] = useMutation(DELETE_NOT_VIEWED_CONVERSATION_MUTATION);

	// Query to get the user requests
	const { loading: requestLoading, fetchMore } = useQueryUserRequests(id, 0, limit, isSkipRequest);
	const { loading: conversationLoading, usersConversationData } = useQueryUsersConversation(newUserId.length !== 0 ? newUserId : userIds, 0, 0);
	const { loading: messageLoading, messageData } = useQueryMyMessagesByConversation(fetchConvIdState, 0, 100, isSkipMessage);


	// Function to delete a request
	const handleDeleteRequest = (requestId?: number) => {

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
			// Get the conversation ids of the request
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

				// replace the old subscription with the new one
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

						// replace the old subscription with the new one
						subscriptionDataStore.setState((prevState: SubscriptionStore) => ({
							...prevState,
							subscription: prevState.subscription.map((subscription: SubscriptionProps) =>
								subscription.subscriber === 'conversation' ? subscriptionWithoutTimestamps : subscription
							)
						}));

						// delete from message store all message with this conversation viewedIds
						myMessageDataStore.setState(prevState => {
							const newMessages = prevState.messages.filter(
								(message: MessageProps) => !conversationIds.includes(message.conversation_id)
							);
							return {
								...prevState,
								messages: [...newMessages]
							};
						});

						// remove the conversation id from the notViewedConversationStore and database
						deleteNotViewedConversation({
							variables: {
								input: {
									user_id: id,
									conversation_id: conversationIds
								}
							}
						}).then(() => {
							// remove the conversation id from the notViewedConversationStore
							setNotViewedConversationStore(notViewedConversationStore.filter(id => !conversationIds.includes(id)));
						});

						if (deleteNotViewedConversationError) {
							throw new Error('Error updating conversation');
						}

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

	// Function to handle the users viewedIds for the conversation
	const handleConversation = (request: RequestProps, event?: React.MouseEvent<HTMLDivElement>) => {
		event?.preventDefault();

		if (!request.conversation) {

			setUserConvState([]);

		} else {
			// Get the user viewedIds from the conversation
			const viewedIds = request?.conversation?.map(conversation => {
				return conversation.user_1 !== id ? conversation.user_1 : conversation.user_2;
			});

			// Filter out the user viewedIds that are already in the userConvStore
			const idStore = userConvStore.map(user => user.id);
			const newIds = viewedIds.filter(id => !idStore.includes(id));

			if (newIds.length > 0) {
				setUserIds(newIds || []); // Provide a default value of an empty array
			}
		}
	};

	// Function to handle the user message and update the conversation viewed status
	const handleMessageConversation = (userId: number, event?: React.MouseEvent<HTMLDivElement>) => {
		event?.preventDefault();

		// find the conversation id for the message
		const conversation = selectedRequest?.conversation?.find(conversation =>
			(conversation.user_1 === id || conversation.user_2 === id) &&
			(conversation.user_1 === userId || conversation.user_2 === userId)
		);

		const conversationId = conversation?.id;
		setConversationIdState(conversationId || 0);

		// get only conversation id who are not in the store
		/* let conversationIdNotStore;
		if (messageStore.length > 0) {
			conversationIdNotStore = !messageStore.some(message => message.conversation_id === conversationId);
		} else {
			conversationIdNotStore = true;
		} */

		if (conversationId !== conversationIdState && !isMessageConvIdFetched.some(convId => convId === conversationId)) {

			setFetchConvIdState(conversationId ?? 0);
			setIsSkipMessage(false);
		}

		// remove the conversation id from the notViewedConversationStore and database
		if (conversationId && notViewedConversationStore?.some(id => id === conversationId)) {

			deleteNotViewedConversation({
				variables: {
					input: {
						user_id: id,
						conversation_id: [conversationId]
					}
				}
			}).then(() => {
				// remove the conversation id from the notViewedConversationStore
				setNotViewedConversationStore(notViewedConversationStore.filter(id => id !== conversationId));

			});

			if (deleteNotViewedConversationError) {
				throw new Error('Error updating conversation');
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
		setUploadFileError('');
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
		if (fetchMore && !isFetchingMore) {
			setIsFetchingMore(true);
			fetchMore({
				variables: {
					offset: myRequestsStore.length // Next offset
				},
			}).then((fetchMoreResult: { data: { user: { requests: RequestProps[] } } }) => {


				// remove request who is already in the store
				const requestsIdsStore = myRequestsStore.map(request => request.id);

				const newRequests = fetchMoreResult.data.user.requests.filter((request: RequestProps) => !requestsIdsStore.includes(request.id));


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
				setIsFetchingMore(false);
			});

		}
	};

	// Function to handle file upload
	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		event.preventDefault();
		setUploadFileError('');

		// Check if the number of files is less than 3
		const remainingSlots = 4 - urlFile.length;

		if ((event.target.files?.length ?? 0) > 4) {
			setUploadFileError('Nombre de fichiers maximum atteint (maximum 4 fichiers)');
		}

		if (event.target.files) {

			if (remainingSlots > 0) {
				const filesToUpload = Array.from(event.target.files).slice(0, remainingSlots);
				handleFileChange(undefined, undefined, filesToUpload as File[]);

				if (filesToUpload.length > 4) {
					setUploadFileError('Nombre de fichiers maximum atteint (maximum 4 fichiers)');
				}
			}
			if (remainingSlots <= 0) {
				setUploadFileError('Nombre de fichiers maximum atteint (maximum 4 fichiers)');
			}
		}
	};

	// useEffect to check the size of the window and update the page visibility 
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	useLayoutEffect(() => {
		const handleResize = () => {

			if (window.innerWidth !== windowWidth) {
				setWindowWidth(window.innerWidth);

				if (window.innerWidth < 1000) {
					if (isUserMessageOpen) {
						setIsMessageOpen(true);
						setIsAnswerOpen(false);
						setIsListOpen(false);
					} else if (!isUserMessageOpen) {
						setIsMessageOpen(false);
						setIsAnswerOpen(false);
						setIsListOpen(true);
					} else {
						if (isAnswerOpen) {
							setIsMessageOpen(false);
							setIsAnswerOpen(true);
							setIsListOpen(false);
						}
						if (isListOpen) {
							setIsMessageOpen(false);
							setIsAnswerOpen(false);
							setIsListOpen(true);
						}
					}

				} else {

					setIsMessageOpen(true);
					setIsAnswerOpen(true);
					setIsListOpen(true);


				}
			}
		};

		// add event listener to check the size of the window
		window.addEventListener('resize', handleResize);

		// 	call the function to check the size of the window
		handleResize();

		// remove the event listener when the component unmount
		return () => window.removeEventListener('resize', handleResize);
	}, [windowWidth/* isMessageOpen, isAnswerOpen, isListOpen */]);

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
				.map(request => request.id); // map to an array of viewedIds

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


		}

		// if selected
		if (!selectedRequest || selectedRequest.id !== selectedRequestRef.current?.id) {
			setSelectedUser(null);
			setConversationIdState(0);
			if (!selectedRequest) {
				setUserConvState([]);
			}
			selectedRequestRef.current = selectedRequest;
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
			setIsMessageConvIdFetched([...isMessageConvIdFetched, conversationIdState]);
			setIsSkipMessage(true);

		}
	}, [messageData]);

	// useEffect to update the user conversation state
	useEffect(() => {
		if (usersConversationData) {
			// If offset is 0, it's the first query, so just replace the queries
			if (userConvStore.length === 0) {

				setUserConvStore(usersConversationData.users);

				// if same users viewedIds in the store don't add them
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

	//  set selected request at null when the component is unmounted
	useEffect(() => {
		return () => {
			setSelectedRequest(null);
			setConversationIdState(0);
		};
	}, []);

	// useEffect to update the visibility of the message if a user is selected
	useLayoutEffect(() => {
		if (selectedUser && selectedUser?.id > 0) {
			setIsUserMessageOpen(true);
		} else {
			setIsUserMessageOpen(false);

		}
	}, [selectedUser]);


	// Filtrer les messages pour correspondre à la conversation en cours
	const filteredMessages = Array.isArray(messageStore) && isUserMessageOpen
		? messageStore
			.filter((message) => message.conversation_id === conversationIdState)
			.sort((a, b) => new Date(Number(a.created_at)).getTime() - new Date(Number(b.created_at)).getTime())
		: [];

	const [isScrolling, setIsScrolling] = useState(false);
	const virtuosoRef = useRef<VirtuosoHandle | null>(null);
	const scrollerRef = useRef(null);
	// Gestion de l'événement de scroll pour détecter le défilement
	// Gestion de l'événement de scroll pour détecter le défilement
	const scrollerRefCallback = (ref) => {
		if (ref) {
		  scrollerRef.current = ref;
	
		  // Ajouter l'événement de scroll uniquement lorsque le conteneur de défilement est défini
		  const onScroll = () => {
			setIsScrolling(true);
			clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => {
			  setIsScrolling(false);
			}, 150);
		  };
	
		  let scrollTimeout: ReturnType<typeof setTimeout>;
		  ref.addEventListener('scroll', onScroll);
	
		  // Nettoyage des écouteurs d'événements
		  return () => {
			ref.removeEventListener('scroll', onScroll);
		  };
		}
	  };
	return (
		<div className="my-request">
			<div
				id="scrollableRequest"
				className={`my-request__list ${isListOpen ? 'open' : ''} ${requestLoading ? 'loading' : ''}`}
				aria-label="Liste des demandes"
			>
				{requestLoading && <Spinner />}
				{!requestByDate ? <p className="my-request__list no-req">Vous n&apos;avez pas de demande</p> : (
					<div className="my-request__list__detail" >
						<AnimatePresence>
							{isListOpen && requestByDate.map((request, index) => (
								<motion.div
									id={index === 0 ? 'first-request' : undefined}
									className={`my-request__list__detail__item 
									${request.urgent}
									${selectedRequest?.id === request?.id ? 'selected' : ''} 
									${request.conversation?.some(conv => notViewedConversationStore?.some(id => id === conv.id)) ? 'not-viewed' : ''} `}

									key={request.id}
									onClick={(event) => {
										handleConversation(request, event);
										setSelectedRequest(request);

										if (window.innerWidth < 1000) {
											setIsListOpen(false);
											setTimeout(() => {
												setIsAnswerOpen(true);
												setIsMessageOpen(false);
											}, 200);
										}

										if (!selectedRequest) {
											selectedRequestRef.current = request;
										}
									}}
									aria-label={`Détails de la demande ${request.title}`}
									layout
									style={{ overflow: 'scroll' }}
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
									transition={{ duration: 0.1, type: 'tween' }}
								>
									{deleteRequestLoading && modalArgs?.requestId === request.id && <Spinner />}
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
															onClick={(event) => { event.stopPropagation(); }}
															aria-label={`PDF associé à la demande ${request.title}`}
														>
															{ }
															<img
																className="my-request__list__detail__item__picture img"
																src={pdfLogo}
																alt={`PDF associé à la demande ${request.title}`}

															/>
														</a>
													) : (
														<img
															className="my-request__list__detail__item__picture img"
															key={media.id}
															src={media.url}
															loading="lazy"
															onClick={(event) => {
																setHasManyImages(false),
																	openModal(imageUrls, index),
																	imageUrls.length > 1 && setHasManyImages(true);

																event.stopPropagation();
															}}
															onError={(event) => {
																event.currentTarget.src = noPicture;
															}}
															alt={`Image associée à la demande ${request.title}`}
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
										aria-label={`Supprimer la demande ${request.title}`}
										onClick={(event) => {
											event.preventDefault();
											setDeleteItemModalIsOpen(true);
											setModalArgs({ requestId: request.id, requestTitle: request.title }),
												event.stopPropagation();
										}}
									>
									</button>
									<FaTrashAlt
										className="my-request__list__detail__item__delete-FaTrashAlt"
										onClick={(event) => {
											document.getElementById(`delete-request-${request.id}`)?.click(),
												event.stopPropagation();
										}}
									/>
								</motion.div>
							))}

						</AnimatePresence>
					</div>
				)}

				<div className="my-request__list__fetch-button">
					{(isHasMore && requestByDate && requestByDate?.length > 0) ? (<button
						className="Btn"
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							if (!isFetchingMore) {
								addRequest();
							}
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

			<AnimatePresence>
				{isAnswerOpen && (
					<motion.div /* id="scrollableAnswer" */
						className={`my-request__answer-list ${isAnswerOpen ? 'open' : ''} ${conversationLoading ? 'loading' : ''}`}
						aria-label="Liste des réponses"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
						transition={{ duration: 0.1, type: 'tween' }}
					>
						{conversationLoading && <Spinner />}
						<div className="my-request__answer-list__header">
							<MdKeyboardArrowLeft
								className="my-request__answer-list__header return"
								onClick={() => {
									if (window.innerWidth < 1000) {

										setIsAnswerOpen(false);
										setTimeout(() => {
											setIsListOpen(true);
											setIsMessageOpen(false);
										}, 200);

									}

									setSelectedRequest(null);
								}}
								aria-label="Retour à la liste des demandes"
							/>
							{selectedRequest && <h2 className="my-request__answer-list__header title">{selectedRequest?.title}</h2>}
						</div>

						{userConvState?.length === 0 ? (<p className="my-request__answer-list no-conv">
							Vous n&apos;avez pas de conversation
						</p>
						) : (
							<div className="my-request__answer-list__container">
								<AnimatePresence>
									{isAnswerOpen && userConvState && userConvState?.map((user: UserDataProps, index) => (
										<motion.div
											id={index === 0 ? 'first-user' : undefined}
											className={`my-request__answer-list__user 
							${selectedUser?.id === user.id ? 'selected-user' : ''} 
							${user.deleted_at ? 'deleted' : ''}
							${(selectedRequest?.conversation
													.some(conv => notViewedConversationStore?.some(id => id === conv.id)
														&& conv.user_1 === user.id || conv.user_2 === user.id)) ? 'not-viewed' : ''}`

											}
											key={user.id}
											onClick={(event) => {
												setSelectedUser(user);
												handleMessageConversation(user.id, event);
												if (window.innerWidth < 1000) {
													//setIsHandleClick(true);
													setIsAnswerOpen(false);
													setTimeout(() => {
														setIsMessageOpen(true);
														setIsListOpen(false);
													}, 200);
												}

											}}
											aria-label={`Détails de ${user.first_name} ${user.last_name}`}
											layout
											style={{ overflow: 'scroll' }}
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.1, type: 'tween' } }}
											transition={{ duration: 0.1, type: 'tween' }}
										>

											<div className="my-request__answer-list__user__header">
												<img
													className="my-request__answer-list__user__header img"
													src={user.image ? user.image : logoProfile}
													onError={(event) => {
														event.currentTarget.src = noPicture;
													}}
													alt={`Image de profil de ${user.first_name} ${user.last_name}`} />
												{/* <img className="my-request__answer-list__user__header img" src={user.image} alt="" /> */}
												{/* <p className="my-request__answer-list__user__header name">{user.first_name}{user.last_name}</p> */}
												{user.denomination ? (
													<p className="my-request__answer-list__user__header denomination">{user.denomination}</p>
												) : (
													<p className="my-request__answer-list__user__header name">{user.first_name} {user.last_name}</p>
												)}
												{user.deleted_at && <p className="my-request__answer-list__user__header deleted" aria-label="Utilisateur supprimé">
													Utilisateur supprimé</p>}
											</div>
										</motion.div>
									))}
								</AnimatePresence>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
			<AnimatePresence>
				{isMessageOpen && (
					<motion.div
						className={`my-request__message-list ${isMessageOpen ? 'open' : ''} ${(messageLoading || messageMutationLoading) ? 'loading' : ''}`}
						aria-label='Liste des messages'
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
						transition={{ duration: 0.1, type: 'tween' }}
					>
						{(messageLoading || messageMutationLoading) && <Spinner />}
						<div className="my-request__message-list__user" aria-label="Détails de l'utilisateur" >
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
											if (window.innerWidth < 1000) {

												setIsMessageOpen(false);
												setTimeout(() => {
													setIsListOpen(false);
													setIsAnswerOpen(true);
												}, 200);
											}

											setSelectedUser(null);
											event.stopPropagation();
										}}
										aria-label="Retour à la liste des utilisateurs"
									/>
									<img
										className="my-request__message-list__user__header__detail img"
										src={selectedUser?.image ? selectedUser.image : logoProfile}
										onError={(event) => {
											event.currentTarget.src = noPicture;
										}}
										alt={selectedUser?.denomination ? selectedUser.denomination : `${selectedUser?.first_name} ${selectedUser?.last_name}`} />
									{selectedUser?.denomination ? (
										<p className="my-request__message-list__user__header__detail denomination">{selectedUser?.denomination}</p>
									) : (
										<p className="my-request__message-list__user__header__detail name">{selectedUser?.first_name} {selectedUser?.last_name}</p>
									)}
									{selectedUser?.deleted_at && <p className="my-request__message-list__user__header__detail deleted" aria-label="Utilisateur supprimé">Utilisateur supprimé</p>}
									{selectedUser && selectedUser?.id > 0 && <span className="my-request__message-list__user__header__detail deploy-arrow">{userDescription ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}</span>}
								</div>

								{userDescription && <div>
									{selectedUser?.denomination ? (
										<p className="my-request__message-list__user__header__detail denomination deployed">{selectedUser?.denomination}</p>
									) : (
										<p className="my-request__message-list__user__header__detail name description">{selectedUser?.first_name} {selectedUser?.last_name}</p>
									)}
									<p className="my-request__message-list__user__header description" aria-label="Description de l'utilisateur">
										{selectedUser?.description ? selectedUser.description : 'Pas de description'}
									</p>
								</div>
								}
							</div>

						</div>
						<div className="my-request__container" >
							<div className="my-request__background" >
								<div
									className="my-request__message-list__message"
									aria-label="Message de la conversation"
								>
									<Virtuoso
										ref={virtuosoRef}
										//scrollerRef={scrollerRefCallback}
										key={conversationIdState}
										style={{ height: '100%', scrollbarWidth: 'none' }}
										data={filteredMessages}
										context={{isScrolling}}
									//	isScrolling={setIsScrolling}
										totalCount={filteredMessages.length}
										components={{ Footer: () => <div style={{ height: '0.5rem' }} /> }}
										initialTopMostItemIndex={filteredMessages.length - 1}
										itemContent={(index, message) => {
											return (
												<div
													className={`my-request__message-list__message__detail ${message.user_id === id ? 'me' : ''}`}
													key={index}
													aria-label={`Message de ${message.user_id === id ? 'vous' : 'l\'autre utilisateur'}`}
												>
													<motion.div
														className={`content ${message.user_id === id ? 'me' : ''}`}
														initial={{ opacity: 0, scale: 0.9 }}
														animate={{ opacity: 1, scale: 1 }}
														exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
														transition={{ duration: 0.3, type: 'tween' }}
													>
														{/* Affichage des médias */}
														{message.media[0]?.url && (
															<div className="my-request__message-list__message__detail__image-container">
																<div className={`map ${message.content ? 'message' : ''}`}>
																	{message.media?.map((media, index) => (
																		media ? (
																			media.name.endsWith('.pdf') ? (
																				<a
																					className="a-pdf"
																					href={media.url}
																					key={media.id}
																					download={media.name}
																					target="_blank"
																					rel="noopener noreferrer"
																					onClick={(event) => event.stopPropagation()}
																				>
																					<img
																						className={`my-request__message-list__message__detail__image-pdf ${message.media.length === 1 ? 'single' : 'multiple'}`}
																						src={pdfLogo}
																						alt={media.name}
																					/>
																				</a>
																			) : (
																				<img
																					className={`my-request__message-list__message__detail__image ${message.media.length === 1 ? 'single' : 'multiple'}`}
																					key={media.id}
																					src={!isScrolling ? media.url : logoProfile}
																					loading="lazy"
																					onClick={(event) => {
																						const imageUrls = message.media?.map((m) => m.url) || [];
																						setHasManyImages(false),
																							openModal(imageUrls, index);
																						imageUrls.length > 1 && setHasManyImages(true);
																						event.stopPropagation();
																					}}
																					alt={media.name}
																					onError={(event) => { event.currentTarget.src = noPicture; }}
																				/>
																			)
																		) : null
																	))}
																</div>
															</div>
														)}
														{message.content && (
															<div className="my-request__message-list__message__detail__texte">{message.content}</div>
														)}
													</motion.div>

													{/* Date de message */}
													<motion.time
														className="my-request__message-list__message__detail__date"
														initial={{ opacity: 0, scale: 0.9 }}
														animate={{ opacity: 1, scale: 1 }}
														exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
														transition={{ duration: 0.3, type: 'tween' }}
														dateTime={new Date(Number(message.created_at)).toISOString()}
													>
														{formatMessageDate(message.created_at)}
													</motion.time>
												</div>
											)
										}}
										followOutput={(isAtBottom) => isAtBottom} // scroll to the end of the messages if new messages are added
									/>
									{/* <div ref={endOfMessagesRef} aria-label="Dernier message visible"  /> */}
								</div>
							</div>
						</div>

						<form className="my-request__message-list__form" onSubmit={(event) => {
							event.preventDefault();
							if (selectedUser?.id && !selectedUser?.deleted_at) {
								handleMessageSubmit(event);
							}

						}}>
							<div className="message">
								<Stack sx={{ width: '100%' }} spacing={2}>
									{fileError && (
										<Fade in={!!fileError} timeout={300}>
											<Alert variant="filled" severity="error">{fileError}</Alert>
										</Fade>
									)}
								</Stack>
								<Stack sx={{ width: '100%' }} spacing={2}>
									{uploadFileError && (
										<Fade in={!!uploadFileError} timeout={300}>
											<Alert variant="filled" severity="error">{uploadFileError}</Alert>
										</Fade>
									)}
								</Stack>
							</div>
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
											aria-label='Supprimer le fichier'
										>
											X
										</div>
									</div>
								))}
							</div>}
							<label className="my-request__message-list__form__label">
								<MdAttachFile
									className="my-request__message-list__form__label__attach"
									onClick={(event) => {
										event.preventDefault(),
											event.stopPropagation(),
											document.getElementById('send-file')?.click()
									}}
									aria-label='Joindre un fichier'
								/>
								<FaCamera
									className="my-request__message-list__form__label__camera"
									onClick={(event) => {
										event.preventDefault(),
											event.stopPropagation(),
											document.getElementById('file-camera')?.click()
									}}
									aria-label='Prendre une photo'

								/>
								<TextareaAutosize
									id="messageInput"
									name="message"
									className="my-request__message-list__form__label__input"
									value={messageValue}
									onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setMessageValue(event.target.value)}
									placeholder="Tapez votre message ici..."
									aria-label='Tapez votre message'
									maxLength={1000}
									readOnly={selectedUser && selectedUser?.id > 0 ? false : true}
									onClick={(event: React.MouseEvent) => { event.stopPropagation(); event?.preventDefault(); }}
								/>
								<MdSend
									className="my-request__message-list__form__label__send"
									onClick={(event) => { document.getElementById('send-message')?.click(), event.stopPropagation(); event?.preventDefault(); }}
									aria-label='Envoyer le message'

								/>
							</label>
							<input
								id="send-file"
								className="my-request__message-list__form__input"
								type="file"
								accept="image/*,.pdf"
								onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(event)}
								multiple={true}
								disabled={selectedUser && selectedUser?.id > 0 ? false : true}
								aria-label="Envoyer un fichier"
							/>
							<input
								id="file-camera"
								className="my-request__message-list__form__input medi"
								type="file"
								accept="image/*"
								capture="environment"
								onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(event)}
								disabled={selectedUser && selectedUser?.id > 0 ? false : true}
								aria-label="Prendre une photo"
							/>
							<button
								id="send-message"
								className="my-request__message-list__form__button"
								type="submit"
								disabled={selectedUser && selectedUser?.id > 0 ? false : true}
								aria-label="Envoyer le message"
							>
								Send
							</button>
						</form>

					</motion.div>
				)}
			</AnimatePresence>

			<ImageModal
				hasManyImages={hasManyImages}
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
				handleDeleteItem={handleDeleteRequest}
			/>

		</div>


	);
}

export default MyRequest;





