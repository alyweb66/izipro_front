
// React hooks and components
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

// Apollo Client mutations
import { useMutation } from '@apollo/client';
import {
	CONVERSATION_MUTATION,
	DELETE_NOT_VIEWED_CONVERSATION_MUTATION,
} from '../../GraphQL/ConversationMutation'; // Assuming these mutations are from ConversationMutation
import { SUBSCRIPTION_MUTATION } from '../../GraphQL/SubscriptionMutations'; // Vérifiez le chemin correct
import { USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION } from '../../GraphQL/UserMutations';
import { MESSAGE_MUTATION } from '../../GraphQL/MessageMutation';

// Custom hooks and queries
import {
	useQueryMessagesByConversation,
	useQueryUserConversations,

} from '../../Hook/Query';
import { useFileHandler } from '../../Hook/useFileHandler';

// State management and stores
import {
	requestDataStore,
	requestConversationStore,
	clientRequestStore
} from '../../../store/Request';
import { userDataStore } from '../../../store/UserData';
import { messageConvIdMyConvStore, messageDataStore } from '../../../store/message';
import { SubscriptionStore, subscriptionDataStore } from '../../../store/subscription';
import { notViewedConversation } from '../../../store/Viewed';

// Types and assets
import { RequestProps } from '../../../Type/Request';
import { MessageProps, MessageStoreProps } from '../../../Type/message';

import { SubscriptionProps } from '../../../Type/Subscription';
import pdfLogo from '/logo-pdf.webp';
import logoProfile from '/logo-profile.webp';

// Components and utilities
import './MyConversation.scss';
import RequestItem from '../../Hook/RequestHook'; // Assuming RequestItem is imported correctly
import { useModal, ImageModal } from '../../Hook/ImageModal';
import { FaCamera } from 'react-icons/fa';
import { MdAttachFile, MdKeyboardArrowLeft, MdSend, MdKeyboardArrowRight, MdKeyboardArrowDown } from 'react-icons/md';
import Spinner from '../../Hook/Spinner';
import { DeleteItemModal } from '../../Hook/DeleteItemModal';
import { AnimatePresence, motion } from 'framer-motion';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import noPicture from '/no-picture.webp';
//import { formatMessageDate } from '../../Hook/Component';
//import { Virtuoso } from 'react-virtuoso';
import { scrollList } from '../../Hook/ScrollList';
import { MessageList } from '../../Hook/MessageList';

//import { VariableSizeList as List, ListChildComponentProps } from 'react-window';
//import { useVirtualizer } from '@tanstack/react-virtual';
type useQueryUserConversationsProps = {
	loading: boolean;
	data: { user: { requestsConversations: RequestProps[] } };
	refetch: () => void;
	fetchMore: (options: { variables: { offset: number } }) => void;
};

type ClientMessageProps = {
	viewedMyConversationState: number[];
	offsetRef: React.MutableRefObject<number>;
	isHasMore: boolean;
	setIsHasMore: (hasMore: boolean) => void;
	conversationIdState: number;
	setConversationIdState: (id: number) => void;
	clientMessageSubscription?: { messageAdded: MessageProps[] };
};


function MyConversation({ viewedMyConversationState, clientMessageSubscription, conversationIdState, setConversationIdState, isHasMore, setIsHasMore, offsetRef }: ClientMessageProps) {

	// ImageModal Hook
	const { modalIsOpen, openModal, closeModal, selectedImage, nextImage, previousImage } = useModal();
	const [request] = requestDataStore((state) => [state.request, state.setRequest]);
	//state
	const [messageValue, setMessageValue] = useState('');
	const [selectedRequest, setSelectedRequest] = useState<RequestProps | null>(null);
	const [requestByDate, setRequestByDate] = useState<RequestProps[] | null>(null);
	const [isListOpen, setIsListOpen] = useState(true);
	const [isMessageExpanded, setIsMessageExpanded] = useState({});
	const [isMessageOpen, setIsMessageOpen] = useState(window.innerWidth > 780 ? true : false);
	const [requestTitle, setRequestTitle] = useState(false);
	const [modalArgs, setModalArgs] = useState<{ requestId: number, requestTitle: string } | null>(null);
	const [deleteItemModalIsOpen, setDeleteItemModalIsOpen] = useState(false);
	const [isSkipMessage, setIsSkipMessage] = useState(true);
	const [fetchConvIdState, setFetchConvIdState] = useState(0);
	const [hasManyImages, setHasManyImages] = useState(false);
	const [uploadFileError, setUploadFileError] = useState('');

	const limit = 4;

	//useRef
	const conversationIdRef = useRef(0);
	//const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

	//store
	const id = userDataStore((state) => state.id);

	const resetRequest = requestDataStore((state) => state.resetRequest);
	const [requestsConversationStore, setRequestsConversationStore] = requestConversationStore((state) => [state.requests, state.setRequestConversation]);
	const [messageStore] = messageDataStore((state) => [state.messages, state.setMessageStore]);
	const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);
	const role = userDataStore((state) => state.role);
	const [clientRequestsStore, setClientRequestsStore] = clientRequestStore((state) => [state.requests, state.setClientRequestStore]);
	const [notViewedConversationStore, setNotViewedConversationStore] = notViewedConversation((state) => [state.notViewed, state.setNotViewedStore]);
	const [isMessageConvIdFetched, setIsMessageConvIdFetched] = messageConvIdMyConvStore((state) => [state.convId, state.setConvId]);

	//mutation
	const [conversation, { loading: convMutLoading, error: createConversationError }] = useMutation(CONVERSATION_MUTATION);
	const [message, { loading: messageMutLoading, error: createMessageError }] = useMutation(MESSAGE_MUTATION);
	const [subscriptionMutation, { error: subscriptionError }] = useMutation(SUBSCRIPTION_MUTATION);
	const [hideRequest, { loading: hideRequestLoading, error: hideRequestError }] = useMutation(USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION);
	const [deleteNotViewedConversation, { error: deleteNotViewedConversationError }] = useMutation(DELETE_NOT_VIEWED_CONVERSATION_MUTATION);

	//query
	const { loading: convLoading, fetchMore } = useQueryUserConversations(0, limit, true) as unknown as useQueryUserConversationsProps;
	const { loading: messageLoading, messageData } = useQueryMessagesByConversation(fetchConvIdState, 0, 100, isSkipMessage);

	// file upload
	const { fileError, file, urlFile, setUrlFile, setFile, setFileError, handleFileChange } = useFileHandler();

	// Filtrer les messages pour correspondre à la conversation en cours
	const filteredMessages = useMemo(() => {
		return Array.isArray(messageStore)
			? messageStore
				.filter((message) => message.conversation_id === conversationIdState)
				.sort((a, b) => new Date(Number(a.created_at)).getTime() - new Date(Number(b.created_at)).getTime())
			: [];
	}, [messageStore, conversationIdState]);

	// Scroll to the last message
	const { setIsEndViewed } = scrollList({});

	// Function to send message
	function sendMessage(updatedRequest?: RequestProps, newClientRequest = false) {
		// find conversation id where request is equal to the request id if newclientRequest is false
		let conversationId;
		if (!newClientRequest) {
			conversationId = conversationIdState;  // requestsConversationStore?.find((request) => request.id === requestId)?.conversation[0].id;
		} else if (newClientRequest) {
			conversationId = conversationIdRef.current;
		}

		// map file to send to graphql
		const sendFile = file.map(file => ({
			file,
		}));
		// create message
		// if the message is not empty or the file is not empty
		if (conversationId ?? 0 > 0) {

			if (messageValue.trim() !== '' || sendFile.length > 0) {

				message({
					variables: {
						id: id,
						input: {
							content: messageValue,
							user_id: id,
							conversation_id: conversationId,
							media: sendFile
						}
					}
				}).then(() => {

					setMessageValue('');
					conversationIdRef.current = 0;
					// if the request is a new client request, add the request to the requestsConversationStore
					if (newClientRequest) {
						if (!updatedRequest) return;

						const addNewRequestConversation = [updatedRequest, ...requestsConversationStore];
						requestConversationStore.setState({ requests: addNewRequestConversation });
						//setRequestsConversationStore(addNewRequestConversation);
					}

					// remove request from clientRequestStore
					setClientRequestsStore(clientRequestsStore.filter(clientRequest => clientRequest.id !== request.id));
					// remove file from the file list and request
					resetRequest();
					setFile([]);
					setUrlFile([]);
				});
			}
		}
		if (createMessageError) {
			throw new Error('Error creating message');
		}
	}

	// Function to send message and create conversation
	const handleMessageSubmit = (event: React.FormEvent<HTMLFormElement>, requestId: number) => {
		event.preventDefault();

		if (fileError) {
			setFile([]);
			setUrlFile([]);
			setFileError('');
		}

		// create conversation 
		if (request.id === requestId && role === 'pro') {

			conversation({
				variables: {
					id: id,
					input: {
						user_1: id,
						user_2: request.user_id,
						request_id: requestId,
					}
				}

			}).then((response) => {
				let updateRequest: RequestProps;
				if (response.data.createConversation) {

					const conversation: RequestProps['conversation'] = [response.data.createConversation];
					conversationIdRef.current = conversation[0].id;

					// put the conversation data in the request
					updateRequest = { ...request, conversation: conversation };

					requestDataStore.setState((prevState) => ({
						...prevState,
						request: updateRequest
					})),
						//setRequest(updateRequest);
						setSelectedRequest(updateRequest);

				}

				// update the subscription store
				// replace the old subscription with the new one
				if (!subscriptionStore.some(subscription => subscription.subscriber === 'clientConversation')) {

					subscriptionMutation({
						variables: {
							input: {
								user_id: id,
								subscriber: 'clientConversation',
								subscriber_id: [conversationIdRef.current]
							}
						}

					}).then((response) => {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { created_at, updated_at, ...subscriptionWithoutTimestamps } = response.data.createSubscription;
						// replace the old subscription with the new one
						const messageRequestSubscription = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'clientConversation');
						// If there are no subscriptions, add the new conversation id in the array of subscription.subscriber_id
						if (!messageRequestSubscription) {


							const currentSubscriptions = subscriptionDataStore.getState().subscription;
							const newSubscriptions = [...currentSubscriptions, subscriptionWithoutTimestamps];
							subscriptionDataStore.getState().setSubscription(newSubscriptions);

						} else {
							// replace the old subscription with the new one
							subscriptionStore.map((subscription: SubscriptionProps) =>
								subscription.subscriber === 'clientConversation' ? subscriptionWithoutTimestamps : subscription
							);
						}

						const newClientRequest = true;
						sendMessage(updateRequest, newClientRequest);
					});

					if (subscriptionError) {
						throw new Error('Error while subscribing to conversation');
					}
				} else if (subscriptionStore.some(subscription => subscription.subscriber === 'clientConversation')) {

					// recover the old subscription and add the new conversation id in the array of subscription.subscriber_id
					let newSubscriptionIds;
					const conversation = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'clientConversation');
					if (conversation && Array.isArray(conversation.subscriber_id)) {
						newSubscriptionIds = [...conversation.subscriber_id, conversationIdRef.current];
					}

					subscriptionMutation({
						variables: {
							input: {
								user_id: id,
								subscriber: 'clientConversation',
								subscriber_id: newSubscriptionIds
							}
						}

					}).then((response) => {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { created_at, updated_at, ...subscriptionWithoutTimestamps } = response.data.createSubscription;
						// replace the old subscription with the new one
						const addSubscriptionStore = subscriptionStore.map((subscription: SubscriptionProps) =>
							subscription.subscriber === 'clientConversation' ? subscriptionWithoutTimestamps : subscription
						);

						if (addSubscriptionStore) {
							setSubscriptionStore(addSubscriptionStore);
						}

						const newClientRequest = true;
						sendMessage(updateRequest, newClientRequest);
					});
				}


			});

			if (createConversationError) {
				throw new Error('Error creating conversation',);
			}
		}

		sendMessage();
	};

	// Function to load more requests with infinite scroll
	function addRequest() {
		if (fetchMore) {

			fetchMore({
				variables: {
					offset: offsetRef.current, // Next offset
				},
				// @ts-expect-error no promess here
			}).then((fetchMoreResult: { data: { user: { requestsConversations: RequestProps[] } } }) => {

				const request = fetchMoreResult.data.user.requestsConversations;

				//get all request who are not in the store
				const newRequests = request.filter((request: RequestProps) => requestsConversationStore?.every(prevRequest => prevRequest.id !== request.id));

				if (!fetchMoreResult.data) return;
				// add the new request to the requestsConversationStore
				if (newRequests) {
					const addRequest = [...(requestsConversationStore || []), ...newRequests];
					setRequestsConversationStore(addRequest);
				}

				// if there is no more request to fetch
				if (request.length < limit) {
					setIsHasMore(false);
				}

				offsetRef.current = offsetRef.current + request.length;

			});
		}
	}

	// Function to hide a client request
	const handleHideRequest = (requestId?: number) => {
		//event.preventDefault();

		hideRequest({
			variables: {
				input: {
					user_id: id,
					request_id: requestId
				}
			}
		}).then((response) => {

			// find conversation id from request to remove it from the subscription
			const requestConversation = requestsConversationStore.find(request => request.id === requestId);
			const conversationId = requestConversation?.conversation.find(conversation => conversation.user_1 === id || conversation.user_2 === id)?.id;

			if (response.data.createHiddenClientRequest) {
				setRequestsConversationStore(requestsConversationStore.filter(request => request.id !== requestId));
			}

			// remove subscription for this conversation
			const subscription = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'clientConversation');
			const newSubscriptionIds = Array.isArray(subscription?.subscriber_id) ? subscription.subscriber_id.filter((id: number) => id !== conversationId) : [];

			subscriptionMutation({
				variables: {
					input: {
						user_id: id,
						subscriber: 'clientConversation',
						subscriber_id: newSubscriptionIds
					}
				}
			}).then((response) => {
				if (response.data.createSubscription) {
					// update the subscription store
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { created_at, updated_at, ...subscriptionWithoutTimestamps } = response.data.createSubscription;

					subscriptionDataStore.setState((prevState: SubscriptionStore) => ({
						...prevState,
						subscription: prevState.subscription.map((subscription: SubscriptionProps) =>
							subscription.subscriber === 'clientConversation' ? subscriptionWithoutTimestamps : subscription
						)
					}));

					messageDataStore.setState((prevState) => ({
						...prevState,
						messages: prevState.messages.filter((message: MessageStoreProps) => message.conversation_id !== conversationId)
					}));

				}

				// delete the conversation from the notViewedConversationStore and database
				deleteNotViewedConversation({
					variables: {
						input: {
							user_id: id,
							conversation_id: conversationId
						}
					}
				}).then(() => {
					// remove the conversation id from the notViewedConversationStore
					setNotViewedConversationStore(notViewedConversationStore.filter(id => id !== conversationId));
				});

				if (deleteNotViewedConversationError) {
					throw new Error('Error updating conversation');
				}
			});

			if (subscriptionError) {
				throw new Error('Error while updating conversation subscription');
			}

		});
		if (hideRequestError) {
			throw new Error('Error while hiding request');
		}
	};

	// remove file
	const handleRemove = (index: number) => {
		setUploadFileError('');
		const newFiles = [...file];
		newFiles.splice(index, 1);
		setFile(newFiles);

		const newUrlFileList = [...urlFile];
		newUrlFileList.splice(index, 1);
		setUrlFile(newUrlFileList);
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

	// Function to remove viewed conversation
	const handleViewedMessage = (convId: number) => {

		if (selectedRequest && notViewedConversationStore?.some(id => id === convId)) {

			deleteNotViewedConversation({
				variables: {
					input: {
						user_id: id,
						conversation_id: [convId]
					}
				}
			}).then(() => {

				// remove the conversation id from the notViewedConversationStore
				setNotViewedConversationStore(notViewedConversationStore.filter(id => id !== convId));

				if (deleteNotViewedConversationError) {
					throw new Error('Error updating conversation');
				}
			});
		}

	};

	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	// useEffect to check the size of the window
	useLayoutEffect(() => {
		const handleResize = () => {
			if (window.innerWidth !== windowWidth) {
				setWindowWidth(window.innerWidth);

				if (window.innerWidth < 780) {
					if (selectedRequest && selectedRequest.id > 0) {
						setIsListOpen(false);
						setIsMessageOpen(true);

					} else {

						setIsMessageOpen(false);
						setIsListOpen(true);
					}

				} else {
					setIsMessageOpen(true);
					setIsListOpen(true);
				}
			}
			/* endOfMessagesRef.current?.scrollIntoView(); */
		};

		// add event listener to check the size of the window
		window.addEventListener('resize', handleResize);

		// 	call the function to check the size of the window
		handleResize();

		// remove the event listener when the component unmount
		return () => window.removeEventListener('resize', handleResize);
	}, [windowWidth]);

	// useEffect to set the new selected request
	useEffect(() => {
		if (request.id > 0 && window.innerWidth < 780) {
			setSelectedRequest(request);
			setIsListOpen(false);
			setIsMessageOpen(true);
		} else if (request && window.innerWidth > 780) {
			setSelectedRequest(request);
		}
	}, []);

	// useEffect to update the message store from database
	useEffect(() => {
		if (messageData) {

			const messages: MessageProps[] = messageData.user.messages;

			messageDataStore.setState(prevState => {
				const newMessages = messages.filter(
					(newMessage) => !prevState.messages.find((existingMessage) => existingMessage.id === newMessage.id)
				);

				return {
					...prevState,
					messages: [...prevState.messages, ...newMessages]
				};
			});
			setIsMessageConvIdFetched([...isMessageConvIdFetched, conversationIdState]);
			setIsSkipMessage(true);
		}
	}, [messageData]);

	// useEffect to update the conversation id
	useEffect(() => {
		if (selectedRequest && selectedRequest.id > 0) {
			const conversationId = selectedRequest.conversation?.find(conversation => (
				conversation.user_1 === id || conversation.user_2 === id
			));
			setConversationIdState(conversationId?.id ?? 0);

			// if the conversation id is not in the store and if the conv has not already been fetched  , fetch the message
			if (conversationId?.id !== 0 && !isMessageConvIdFetched.some(convId => convId === conversationId?.id)) {

				setFetchConvIdState(conversationId?.id ?? 0);
				setIsSkipMessage(false);
			}

			// to remove the request from the clientRequestStore
			if (viewedMyConversationState.length > 0) {
				const convId = selectedRequest?.conversation?.find(conv => conv.user_1 === id || conv.user_2 === id)?.id;
				if (convId) {
					handleViewedMessage(convId);
				}
			}
			setIsEndViewed(false);
		}

	}, [selectedRequest]);

	// useEffect to sort the requests by date
	useEffect(() => {
		if (requestsConversationStore) {

			const sortedRequests = [...requestsConversationStore].sort((a, b) => {

				if (!a.conversation?.length) return 1;
				if (!b.conversation?.length) return -1;

				const dateA = a.conversation.some(c => c.updated_at)
					? Math.max(...a.conversation.map(c => new Date(c.updated_at).getTime()))
					: 0;

				const dateB = b.conversation.some(c => c.updated_at)
					? Math.max(...b.conversation.map(c => new Date(c.updated_at).getTime()))
					: 0;

				// For ascending order, swap dateA and dateB for descending order
				return dateB - dateA;
			});

			setRequestByDate(sortedRequests);

		}
	}, [requestsConversationStore]);

	// useEffect to subscribe to new message requests
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

		}

	}, [clientMessageSubscription]);

	// clean the request store if the component is unmounted
	useEffect(() => {
		return () => {
			//if the request is in the requestsConversationStore and if there is a conversation with the user
			if (requestsConversationStore.some(requestConv => requestConv.id === request.id && !requestConv.conversation?.some(conversation => conversation.user_1 === id || conversation.user_2 === id))) {
				// remove request.id in requestsConversationStore
				const removedRequest = requestConversationStore.getState().requests?.filter((requestConv: RequestProps) => request.id !== requestConv.id);
				requestConversationStore.setState({ requests: removedRequest });
			}
			//setRequestsConversationStore(removedRequest);
			resetRequest();
			setConversationIdState(0);
		};
	}, []);





	return (
		<div className="my-conversation">
			{(hideRequestLoading || convLoading) && <Spinner />}
			<div id="scrollableList" className={`my-conversation__list ${isListOpen ? 'open' : ''}`}>
				{requestByDate && (
					<div className="my-conversation__list__detail" >
						<AnimatePresence>
							{isListOpen && request && request.id > 0 &&
								<RequestItem
									setHasManyImages={setHasManyImages}
									request={request}
									notViewedConversationStore={notViewedConversationStore}
									setIsMessageOpen={setIsMessageOpen}
									resetRequest={resetRequest}
									selectedRequest={selectedRequest!}
									setSelectedRequest={setSelectedRequest}
									setDeleteItemModalIsOpen={setDeleteItemModalIsOpen}
									isMessageExpanded={isMessageExpanded}
									setIsMessageExpanded={setIsMessageExpanded}
									setIsListOpen={setIsListOpen}
									setModalArgs={setModalArgs}
									openModal={openModal}
								/>
							}
						</AnimatePresence>
						<AnimatePresence>
							{isListOpen && requestByDate.map((requestByDate, index) => (
								<RequestItem
									setHasManyImages={setHasManyImages}
									key={requestByDate.id}
									index={index}
									notViewedConversationStore={notViewedConversationStore}
									requestByDate={requestByDate}
									setIsMessageOpen={setIsMessageOpen}
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

					</div>
				)}
				<div className="my-conversation__list__fetch-button">
					{(isHasMore && requestByDate && requestByDate?.length > 0) ? (<button
						className="Btn"
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							addRequest();
						}}
						aria-label="Charger plus de conversations">

						<svg className="svgIcon" viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg"><path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"></path></svg>
						<span className="icon2"></span>
						<span className="tooltip">Charger plus</span>
					</button>
					) : (
						<p className="my-conversation__list no-req">Fin des résultats</p>
					)}
				</div>

			</div>
			<AnimatePresence>
				{isMessageOpen && (
					<motion.div
						className={`my-conversation__message-list ${isMessageOpen ? 'open' : ''} ${(messageLoading || messageMutLoading || convMutLoading) ? 'loading' : ''}`}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
						transition={{ duration: 0.1, type: 'tween' }}
					>
						{(messageLoading || messageMutLoading || convMutLoading) && <Spinner />}
						<div className="my-conversation__message-list__user">
							{selectedRequest && (
								<div
									className="my-conversation__message-list__user__header"
									onClick={(event) => {
										setRequestTitle(!requestTitle);
										event.stopPropagation();
									}}
								>
									<div
										className="my-conversation__message-list__user__header__detail"
									>
										<MdKeyboardArrowLeft
											className="my-conversation__message-list__user__header__detail return"
											onClick={(event) => {
												event.stopPropagation();
												if (window.innerWidth < 780) {
													setIsEndViewed(false);
													setIsMessageOpen(false);
													setTimeout(() => {
														setIsListOpen(true);
													}, 200);
												}
											}}
											aria-label="Retour à la liste des conversations"
										/>
										<img
											className="my-conversation__message-list__user__header__detail img"
											src={selectedRequest.image ? selectedRequest.image : logoProfile}
											onError={(event) => {
												event.currentTarget.src = noPicture;
											}}
											alt="" />
										{selectedRequest.denomination ? (
											<p className="my-conversation__message-list__user__header__detail name" >
												<span className="my-conversation__message-list__user__header__detail name-span">
												</span>&nbsp;{selectedRequest.denomination}
											</p>
										) : (
											<p className="my-conversation__message-list__user__header__detail name" >
												<span className="my-conversation__message-list__user__header__detail name-span">
												</span>&nbsp;{selectedRequest.first_name} {selectedRequest.last_name}
											</p>
										)}

										{selectedRequest.id > 0 && <span className="my-conversation__message-list__user__header__detail deploy-arrow">{requestTitle ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}</span>}
									</div>
									{requestTitle && <div className="my-conversation__message-list__user__header__request">
										{selectedRequest.denomination ? (
											<p className="my-conversation__message-list__user__header__detail name deployed" >
												<span className="my-conversation__message-list__user__header__detail name-span">
												</span>&nbsp;{selectedRequest.denomination}
											</p>
										) : (
											<p className="my-conversation__message-list__user__header__detail name" >
												<span className="my-conversation__message-list__user__header__detail name-span">
												</span>&nbsp;{selectedRequest.first_name} {selectedRequest.last_name}
											</p>
										)}
										<p className="my-conversation__message-list__user__header__request title">{selectedRequest.title}</p>
									</div>}
								</div>
							)}

						</div>
						<MessageList 
							conversationIdState={conversationIdState}
							id={id}
							filteredMessages={filteredMessages}
							isMessageOpen={isMessageOpen}
							openModal={openModal}
							setHasManyImages={setHasManyImages}
						/>

						<form className="my-conversation__message-list__form" onSubmit={(event) => {
							event.preventDefault();
							if (selectedRequest?.id && !selectedRequest.deleted_at) {

								handleMessageSubmit(event, selectedRequest.id);
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
							{urlFile.length > 0 && <div className="my-conversation__message-list__form__preview">
								{urlFile.map((file, index) => (
									<div className="my-conversation__message-list__form__preview__container" key={index}>

										<img
											className="my-conversation__message-list__form__preview__container__image"
											src={file.type === 'application/pdf' ? pdfLogo : file.name}
											alt={`Preview ${index}`}
										/>
										<div
											className="my-conversation__message-list__form__preview__container__remove"
											onClick={() => handleRemove(index)}
											aria-label="Supprimer le fichier"
										>
											X
										</div>
									</div>
								))}
							</div>}
							<label className="my-conversation__message-list__form__label">
								<MdAttachFile
									className="my-conversation__message-list__form__label__attach"
									onClick={(event) => {
										event.stopPropagation(),
											event.preventDefault(),
											document.getElementById('send-file')?.click()
									}}
									aria-label="Joindre un fichier"
								/>
								<FaCamera
									className="my-conversation__message-list__form__label__camera"
									onClick={(event) => {
										event.preventDefault(),
											event.stopPropagation(),
											document.getElementById('file-camera')?.click()
									}}
									aria-label="Prendre une photo"
								/>
								<TextareaAutosize
									id="message-input"
									name="message"
									className="my-conversation__message-list__form__label__input"
									value={messageValue}
									onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setMessageValue(event.target.value)}
									placeholder="Tapez votre message ici..."
									maxLength={1000}
									minRows={1}
									readOnly={selectedRequest && selectedRequest?.id > 0 ? false : true}
									aria-label="Tapez votre message ici"
								/>
								<MdSend
									className="my-conversation__message-list__form__label__send"
									onClick={(event) => { document.getElementById('send-message')?.click(), event.stopPropagation(); event?.preventDefault(); }}
									aria-label="Envoyer le message"
								/>
							</label>
							<input
								id="send-file"
								className="my-conversation__message-list__form__input"
								type="file"
								accept="image/*,.pdf"
								onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(event)}
								multiple={true}
								disabled={selectedRequest && selectedRequest?.id > 0 ? false : true}
								aria-label="Joindre un fichier"
							/>
							<input
								id="file-camera"
								className="my-conversation__message-list__form__input medi"
								type="file"
								accept="image/*"
								capture="environment"
								onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(event)}
								disabled={selectedRequest && selectedRequest?.id > 0 ? false : true}
								aria-label="Prendre une photo"
							/>
							<button
								id="send-message"
								className="my-conversation__message-list__form__button"
								type="submit"
								disabled={selectedRequest && selectedRequest?.id > 0 ? false : true}
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
				handleDeleteItem={handleHideRequest}
			/>
		</div>
	);
}

export default MyConversation;
