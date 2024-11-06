
// React hooks and components
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';

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


// Components and utilities
import './MyConversation.scss';
import { AnimatePresence, motion } from 'framer-motion';
import { UpdateMyConvMessage } from '../../Hook/UpdateMyConvMessage';
import { HeaderMessage } from '../../Hook/HeaderMessage';
import { MessageForm } from '../../Hook/MessageForm';
import { FetchButton } from '../../Hook/FetchButton';


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
	const [isSendingMessage, setIsSendingMessage] = useState(false);
	const [isMessageOpen, setIsMessageOpen] = useState(window.innerWidth > 780 ? true : false);
	const [requestTitle, setRequestTitle] = useState(false);
	const [modalArgs, setModalArgs] = useState<{ requestId: number, requestTitle: string } | null>(null);
	const [deleteItemModalIsOpen, setDeleteItemModalIsOpen] = useState(false);
	const [isSkipMessage, setIsSkipMessage] = useState(true);
	const [fetchConvIdState, setFetchConvIdState] = useState(0);
	const [hasManyImages, setHasManyImages] = useState(false);
	const [uploadFileError, setUploadFileError] = useState('');
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const [showAllContent, setShowAllContent] = useState(true);
	const [messageError, setMessageError] = useState('');


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
	const scrollList = ScrollList({});
	const { setIsEndViewed } = scrollList || {};

	// Function to send message
	function sendMessage(event: React.FormEvent<HTMLFormElement>, requestId?: number) {
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
				setIsSendingMessage(true);
				message({
					variables: {
						id: id,
						input: {
							content: messageValue,
							user_id: id,
							...(isNewConversation && { user_request_id: request.user_id }),
							request_id: isNewConversation ? requestId : selectedRequest?.id,
							...(conversationIdState && { conversation_id: conversationIdState }),
							media: sendFile
						}
					}
				}).then((response) => {
					if (response.errors && response.errors.length > 0) {
						setMessageError('Erreur lors de l\'envoi du message');
						setTimeout(() => {
							setUploadFileError('');
						}, 10000);
					}
					setMessageValue('');

					if (response.data.createMessage?.id > 0) {
						const newMessage = response.data.createMessage;
						// if the request is a new client request
						if (isNewConversation) {
							// insert value in local storage to know if the request is new to remove request when unmouting
							localStorage.setItem('newConversationCreated', 'true');
							manageMessage({ newMessage, setConversationIdState, isNewConversation: true, requestId })

						}
					} else if (response.data.createMessage?.success === false) {
						setUploadFileError('Demande supprimée, actualisez la page pour verifier');
						setTimeout(() => {
							setUploadFileError('');
						}, 10000);
					}

					// remove request from clientRequestStore
					const newRequest = clientRequestsStore.filter(clientRequest => clientRequest.id !== request.id);

					setClientRequestsStore(newRequest);
					// remove file from the file list and request
					resetRequest();
					setFile([]);
					setUrlFile([]);

					setIsSendingMessage(false);
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
				const updatedStore = requestsConversationStore.filter(request => request.id !== requestId);
				setRequestsConversationStore(updatedStore);

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

	// remove request from the store if not sending message of the selected request
	const removeRequestStore = (requestId: number) => {
		resetRequest();
		const updatedStore = requestsConversationStore.filter(request => request.id !== requestId);
		setRequestsConversationStore(updatedStore);
	}

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
			console.log('messageData', messageData);

			const messages: MessageProps[] = messageData.user.messages;

			if (messages.length === 0) {
				setIsSkipMessage(true);
				return;
			}

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
			setIsEndViewed && setIsEndViewed(false);

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
			const isNewConversation = localStorage.getItem('newConversationCreated');
			//if the request is in the requestsConversationStore and if there is a conversation with the user
			if (!isNewConversation || isNewConversation !== 'true' && request.id > 0) {
				// remove request.id in requestsConversationStore

				const removedRequest = requestConversationStore.getState().requests?.filter((requestConv: RequestProps) => request.id !== requestConv.id);
				requestConversationStore.setState({ requests: removedRequest });

			}
			//setRequestsConversationStore(removedRequest);
			resetRequest();
			setConversationIdState(0);
			if (isNewConversation) {
				localStorage.removeItem('newConversationCreated');
			}
		};
	}, []);


	return (
		<div className="my-conversation">
			{(hideRequestLoading || convLoading) && <Spinner />}
			{isListOpen && <div className="my-conversation__container">
				{requestByDate && isListOpen && requestByDate?.length > 0 && <button className="my-conversation__container__deploy"
					onClick={() => setShowAllContent(!showAllContent)}
				>
					{requestByDate && requestByDate?.length > 0 && (showAllContent ? 'Réduire les demandes' : 'Déployer les demandes')}</button>}
				<div id="scrollableList" className={`my-conversation__container__list ${isListOpen ? 'open' : ''}`}>
					{(requestByDate || request.id > 0) && (
						<ul className="my-conversation__container__list__detail" >
							<AnimatePresence>
								{isListOpen && requestByDate?.map((requestByDate) => (
									<RequestItem
										setHasManyImages={setHasManyImages}
										key={requestByDate.id}
										notViewedStore={notViewedConversationStore}
										requestByDate={requestByDate}
										showAllContent={showAllContent}
										setIsMessageOpen={setIsMessageOpen}
										request={request}
										isMyConversation={true}
										removeRequestStore={removeRequestStore}
										selectedRequest={selectedRequest!}
										setSelectedRequest={setSelectedRequest}
										setDeleteItemModalIsOpen={setDeleteItemModalIsOpen}
										//isMessageExpanded={isMessageExpanded}
										//setIsMessageExpanded={setIsMessageExpanded}
										setIsListOpen={setIsListOpen}
										setModalArgs={setModalArgs}
										openModal={openModal}
									/>
								))}
							</AnimatePresence>
						</ul>
					)}
					{(isHasMore && requestByDate && requestByDate?.length > 0) ? (
						<FetchButton
							addRequest={addRequest}
						/>
					) : (
						<p className="my-conversation__container__list no-req">Fin des résultats</p>
					)}
				</div>
			</div>}
			<AnimatePresence>
				{isMessageOpen && (
					<motion.div
						className={`my-conversation__message-list ${isMessageOpen ? 'open' : ''} ${(messageLoading || messageMutLoading) ? 'loading' : ''}`}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
						transition={{ duration: 0.1, type: 'tween' }}
					>
						{(messageLoading || messageMutLoading || isSendingMessage) && <Spinner />}
						<div className="my-conversation__message-list__user">
							{selectedRequest && (
								<HeaderMessage
									requestTitle={requestTitle}
									selectedItem={selectedRequest}
									setRequestTitle={setRequestTitle}
									isMyConversation={true}
									setIsListOpen={setIsListOpen}
									setIsMessageOpen={setIsMessageOpen}
									setIsEndViewed={setIsEndViewed}
								/>
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
						<MessageForm
							fileError={fileError || messageError}
							isMyConversation={true}
							handleFileUpload={handleFileUpload}
							handleMessageSubmit={sendMessage}
							messageValue={messageValue}
							setMessageValue={setMessageValue}
							handleRemove={handleRemove}
							urlFile={urlFile}
							uploadFileError={uploadFileError}
							messageMutationLoading={messageMutLoading}
							selectedItem={selectedRequest}
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
				handleDeleteItem={handleHideRequest}
			/>
		</div>
	);
}

export default MyConversation;
