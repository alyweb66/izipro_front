
// React hooks and components
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

// Apollo Client mutations
import { useMutation } from '@apollo/client';
import {
	DELETE_NOT_VIEWED_CONVERSATION_MUTATION,
} from '../../GraphQL/ConversationMutation'; // Assuming these mutations are from ConversationMutation
import { USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION } from '../../GraphQL/UserMutations';
import { MESSAGE_MUTATION } from '../../GraphQL/MessageMutation';

// Custom hooks and queries
import {
	useQueryMessagesByConversation,
	useQueryUserConversations,

} from '../../Hook/Query';
import { useFileHandler } from '../../Hook/useFileHandler';
import { ScrollList } from '../../Hook/ScrollList';
import { MessageList } from '../../Hook/MessageList';
import Spinner from '../../Hook/Spinner';
import RequestItem from '../../Hook/RequestHook';
import { useModal, ImageModal } from '../../Hook/ImageModal';
import { DeleteItemModal } from '../../Hook/DeleteItemModal';

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

import { FaCamera } from 'react-icons/fa';
import { MdAttachFile, MdKeyboardArrowLeft, MdSend, MdKeyboardArrowRight, MdKeyboardArrowDown } from 'react-icons/md';

import { AnimatePresence, motion } from 'framer-motion';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import noPicture from '/no-picture.webp';

import { UpdateMyConvMessage } from '../../Hook/UpdateMyConvMessage';


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
	const { manageMessage } = UpdateMyConvMessage();

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
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	// limit of requests to fetch
	const limit = 4;

	//store
	const id = userDataStore((state) => state.id);
	const resetRequest = requestDataStore((state) => state.resetRequest);
	const [requestsConversationStore, setRequestsConversationStore] = requestConversationStore((state) => [state.requests, state.setRequestConversation]);
	const [messageStore] = messageDataStore((state) => [state.messages, state.setMessageStore]);
	const [subscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);
	const [clientRequestsStore, setClientRequestsStore] = clientRequestStore((state) => [state.requests, state.setClientRequestStore]);
	const [notViewedConversationStore, setNotViewedConversationStore] = notViewedConversation((state) => [state.notViewed, state.setNotViewedStore]);
	const [isMessageConvIdFetched, setIsMessageConvIdFetched] = messageConvIdMyConvStore((state) => [state.convId, state.setConvId]);

	//mutation
	const [message, { loading: messageMutLoading, error: createMessageError }] = useMutation(MESSAGE_MUTATION);
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
	const { setIsEndViewed } = ScrollList({});

	// Function to send message
	function sendMessage(event: React.FormEvent<HTMLFormElement>, requestId: number) {
		event.preventDefault();

		if (fileError) {
			setFile([]);
			setUrlFile([]);
			setFileError('');
		}

		const isNewConversation = requestId === request.id

		// map file to send to graphql
		const sendFile = file.map(file => ({
			file,
		}));
		// create message
		// if the message is not empty or the file is not empty
		if (isNewConversation || conversationIdState > 0) {

			if (messageValue.trim() !== '' || sendFile.length > 0) {

				message({
					variables: {
						id: id,
						input: {
							content: messageValue,
							user_id: id,
							...(isNewConversation && { user_request_id: request.user_id }),
							...(isNewConversation && { request_id: requestId }),
							...(conversationIdState && { conversation_id: conversationIdState }),
							media: sendFile
						}
					}
				}).then((response) => {

					setMessageValue('');

					if (!response.data.createMessage?.success) {
						const newMessage = response.data.createMessage;
						// if the request is a new client request
						if (isNewConversation) {
							manageMessage({ newMessage, setConversationIdState, isNewConversation: true, requestId })

						}
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

	// Function to load more requests with fetchMore
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
					request_id: requestId,
					isWithConversation: true
				}
			}
		}).then((response) => {

			// find conversation id from request to remove it from the subscription
			const requestConversation = requestsConversationStore.find(request => request.id === requestId);
			const conversationId = requestConversation?.conversation.find(conversation => conversation.user_1 === id || conversation.user_2 === id)?.id;

			if (response.data.createHiddenClientRequest) {
				// remove the request from the clientRequestStore
				setRequestsConversationStore(requestsConversationStore.filter(request => request.id !== requestId));


				// remove subscription for this conversation
				const subscription = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'clientConversation');
				const newSubscriptionIds = Array.isArray(subscription?.subscriber_id) ? subscription.subscriber_id.filter((id: number) => id !== conversationId) : [];


				// update the subscription store
				subscriptionDataStore.setState((prevState: SubscriptionStore): Partial<SubscriptionStore> => ({
					...prevState,
					subscription: prevState.subscription.map(subscription =>
						subscription.subscriber === 'clientConversation' ? { ...subscription, subscriber_id: newSubscriptionIds } : subscription
					)
				}));

				// remove the conversation id from the message store
				messageDataStore.setState((prevState) => ({
					...prevState,
					messages: prevState.messages.filter((message: MessageStoreProps) => message.conversation_id !== conversationId)
				}));


				// remove the conversation id from the notViewedConversationStore
				setNotViewedConversationStore(notViewedConversationStore.filter(id => id !== conversationId));
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

			// to remove the viewed request from the notViewedConversationStore and database
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

		if (requestsConversationStore.length > 0) {

			const sortedRequests = [...requestsConversationStore].sort((a, b) => {
				if (a.id === request.id) return -1;
				if (b.id === request.id) return 1;

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

		} else {
			setRequestByDate(null);
		}
	}, [requestsConversationStore]);

	// useEffect to subscribe to new message requests
	useEffect(() => {
		// manage new message
		if (clientMessageSubscription?.messageAdded) {
			const messageAdded: MessageProps[] = clientMessageSubscription.messageAdded;

			manageMessage({ newMessage: messageAdded[0], isNewConversation: false });
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

console.log('subscriptions my conv', subscriptionStore);

	return (
		<div className="my-conversation">
			{(hideRequestLoading || convLoading) && <Spinner />}
			<div id="scrollableList" className={`my-conversation__list ${isListOpen ? 'open' : ''}`}>

				{(requestByDate || request.id > 0) && (
					<ul className="my-conversation__list__detail" >
						{/* <AnimatePresence >
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
						</AnimatePresence> */}
						<AnimatePresence>
							{isListOpen && requestByDate?.map((requestByDate, index) => (
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

					</ul>
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
						className={`my-conversation__message-list ${isMessageOpen ? 'open' : ''} ${(messageLoading || messageMutLoading) ? 'loading' : ''}`}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
						transition={{ duration: 0.1, type: 'tween' }}
					>
						{(messageLoading || messageMutLoading) && <Spinner />}
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
								sendMessage(event, selectedRequest.id);
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
								name="send-file"
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
								name="file-camera"
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
								disabled={!selectedRequest || selectedRequest?.id <= 0 || messageMutLoading}
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
