import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

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
import { ScrollList } from '../../Hook/ScrollList';
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

// Components and utilities
import './MyRequest.scss';
import logoProfile from '/logo-profile.webp';
import { useModal, ImageModal } from '../../Hook/ImageModal';
import { MdKeyboardArrowLeft } from 'react-icons/md';
//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
import Spinner from '../../Hook/Spinner';
import { DeleteItemModal } from '../../Hook/DeleteItemModal';
import { motion, AnimatePresence } from 'framer-motion';
import noPicture from '/no-picture.webp';
//import { formatMessageDate } from '../../Hook/Component';
import { MessageList } from '../../Hook/MessageList';
import RequestItem from '../../Hook/RequestHook';
import { HeaderMessage } from '../../Hook/HeaderMessage';
import { MessageForm } from '../../Hook/MessageForm';
//import { Id } from '@turf/turf';

// Configuration for React Modal
ReactModal.setAppElement('#root');


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
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	//const [isHandleClick, setIsHandleClick] = useState<boolean>(false);

	// Create a state for the scroll position
	const offsetRef = useRef(0);

	// store
	const id = userDataStore((state) => state.id);
	const [myRequestsStore, setMyRequestsStore] = myRequestStore((state) => [state.requests, state.setMyRequestStore]);
	const [userConvStore, setUserConvStore] = userConversation((state) => [state.users, state.setUsers]);
	const [messageStore] = myMessageDataStore((state) => [state.messages, state.setMessageStore]);
	const [subscriptionStore] = subscriptionDataStore((state) => [state.subscription]);
	const [notViewedConversationStore, setNotViewedConversationStore] = notViewedConversation((state) => [state.notViewed, state.setNotViewedStore]);
	const [isMessageConvIdFetched, setIsMessageConvIdFetched] = messageConvIdMyreqStore((state) => [state.convId, state.setConvId]);

	//useRef
	//const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
	//const idRef = useRef<number>(0);
	const selectedRequestRef = useRef<RequestProps | null>(null);

	const limit = 5;

	// file upload
	const { urlFile, setUrlFile, fileError, file, setFile, handleFileChange } = useFileHandler();

	//mutation
	const [deleteRequest, { loading: deleteRequestLoading, error: deleteRequestError }] = useMutation(DELETE_REQUEST_MUTATION);
	const [message, { loading: messageMutationLoading, error: createMessageError }] = useMutation(MESSAGE_MUTATION);
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

			if (response.data.deleteRequest) {
				setUserConvState([]);
				setModalArgs(null);
				setDeleteItemModalIsOpen(false);

				// Remove the request from the store
				setMyRequestsStore(myRequestsStore.filter(request => request.id !== requestId));

				// remove subscription for this request
				const subscription = subscriptionStore?.find(subscription => subscription?.subscriber === 'request');
				// remove the request id from the subscription
				const updatedSubscription = Array.isArray(subscription?.subscriber_id) ? subscription?.subscriber_id.filter(id => id !== requestId) : [];
				// update the subscription
				const newSubscription = { ...subscription, subscriber_id: updatedSubscription };

				subscriptionDataStore.setState((prevState) => ({
					...prevState,
					subscription: prevState.subscription?.map(subscription =>
						subscription?.subscriber === 'request' ? newSubscription : subscription
					)
				}) as Partial<SubscriptionStore>);


				// remove subscription for this conversation
				const conversationSubscription = subscriptionStore.find(subscription => subscription.subscriber === 'conversation');
				// get array of conversation ids of request id
				const conversationIds = myRequestsStore.find(request => request.id === requestId)?.conversation;

				// remove the conversation id from the subscription
				const updatedConversationSubscription = Array.isArray(conversationSubscription?.subscriber_id) ?
					conversationSubscription?.subscriber_id.filter(id => !conversationIds?.some(conv => conv.id === id))
					: [];
				// update the subscription
				const newConversationSubscription = { ...conversationSubscription, subscriber_id: updatedConversationSubscription };

				subscriptionDataStore.setState((prevState) => ({
					...prevState,
					subscription: prevState.subscription?.map(subscription =>
						subscription?.subscriber === 'conversation' ? newConversationSubscription : subscription
					)
				}) as Partial<SubscriptionStore>);


				// delete from message store all message with this conversation viewedIds
				myMessageDataStore.setState(prevState => {
					const newMessages = prevState.messages.filter(
						(message: MessageProps) => !conversationIds?.some(conv => conv.id === message.conversation_id)
					);
					return {
						...prevState,
						messages: [...newMessages]
					};
				});
				// remove the conversation id from the notViewedConversationStore
				setNotViewedConversationStore(notViewedConversationStore.filter(id => !conversationIds?.some(conv => conv.id === id)));

			} else {

				throw new Error('Error while deleting request');
			}
		});

		if (deleteRequestError) {
			throw new Error('Error while deleting request');
		}

	};

	// Function to handle the users viewedIds for the conversation
	const handleConversation = (request: RequestProps, event?: React.MouseEvent<HTMLElement>) => {
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


		if (conversationId !== conversationIdState && !isMessageConvIdFetched.some(convId => convId === conversationId)) {

			setFetchConvIdState(conversationId ?? 0);
			setIsSkipMessage(false);
		}

		// remove the conversation id from the notViewedConversationStore and database
		if (conversationId && notViewedConversationStore?.some(id => id === conversationId)) {

			setNotViewedConversationStore(notViewedConversationStore.filter(id => id !== conversationId));

			deleteNotViewedConversation({
				variables: {
					input: {
						user_id: id,
						conversation_id: [conversationId]
					}
				}
			})

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

	// Filtrer les messages pour correspondre à la conversation en cours
	const filteredMessages = useMemo(() => {
		if (conversationIdState > 0) {
			return Array.isArray(messageStore) && isUserMessageOpen
				? messageStore
					.filter((message) => message.conversation_id === conversationIdState)
					.sort((a, b) => new Date(Number(a.created_at)).getTime() - new Date(Number(b.created_at)).getTime())
				: [];
		}
	}, [messageStore, isUserMessageOpen, conversationIdState]);


	// get state for scrollList
	const { setIsEndViewed } = ScrollList({});

	// useEffect to check the size of the window and update the page visibility 
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

		setIsEndViewed(false);

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
	useEffect(() => {
		if (selectedUser && selectedUser?.id > 0) {
			setIsUserMessageOpen(true);
		} else {
			setIsUserMessageOpen(false);

		}
	}, [selectedUser]);

	return (
		<div className="my-request">
			<div
				id="scrollableRequest"
				className={`my-request__list ${isListOpen ? 'open' : ''} ${requestLoading ? 'loading' : ''}`}
				aria-label="Liste des demandes"
			>
				{requestLoading && <Spinner />}
				{!requestByDate ? <p className="my-request__list no-req">Vous n&apos;avez pas de demande</p> : (
					<ul className="my-request__list__detail" >
						<AnimatePresence>
							{isListOpen && requestByDate.map((requestByDate) => (
								<RequestItem
									setHasManyImages={setHasManyImages}
									key={requestByDate.id}
									notViewedStore={notViewedConversationStore}
									requestByDate={requestByDate}
									setIsMessageOpen={setIsMessageOpen}
									isMyrequest={true}
									deleteRequestLoading={deleteRequestLoading}
									handleConversation={handleConversation}
									setIsAnswerOpen={setIsAnswerOpen}
									selectedRequestRef={selectedRequestRef}
									selectedRequest={selectedRequest!}
									setSelectedRequest={setSelectedRequest}
									setDeleteItemModalIsOpen={setDeleteItemModalIsOpen}
									isMessageExpanded={isMessageExpanded}
									setIsMessageExpanded={setIsMessageExpanded}
									setIsListOpen={setIsListOpen}
									setModalArgs={setModalArgs}
									openModal={openModal}
								/>
							))}

						</AnimatePresence>
					</ul>
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
						<HeaderMessage
							selectedItem={selectedUser}
							setIsAnswerOpen={setIsAnswerOpen}
							setIsEndViewed={setIsEndViewed}
							setIsListOpen={setIsListOpen}
							isMyRequest={true}
							setIsMessageOpen={setIsMessageOpen}
							setSelectedItem={setSelectedUser}
							setUserDescription={setUserDescription}
							userDescription={userDescription}
						/>
						<MessageList
							conversationIdState={conversationIdState}
							id={id}
							filteredMessages={filteredMessages}
							isMessageOpen={isMessageOpen}
							openModal={openModal}
							setHasManyImages={setHasManyImages}
						/>

						<MessageForm
							fileError={fileError}
							isMyRequest={true}
							handleFileUpload={handleFileUpload}
							handleMessageSubmit={handleMessageSubmit}
							messageValue={messageValue}
							setMessageValue={setMessageValue}
							handleRemove={handleRemove}
							urlFile={urlFile}
							uploadFileError={uploadFileError}
							messageMutationLoading={messageMutationLoading}
							selectedItem={selectedUser}
						/>
						
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




