/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import './MyConversation.scss';
import { requestDataStore, requestConversationStore, clientRequestStore } from '../../../store/Request';
import { RequestProps } from '../../../Type/Request';
import { CONVERSATION_MUTATION, MESSAGE_MUTATION } from '../../GraphQL/ConversationMutation';
import { useMutation, useSubscription } from '@apollo/client';
import { userDataStore } from '../../../store/UserData';
import { useQueryMessagesByConversation, useQueryUserConversations } from '../../Hook/Query';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useFileHandler } from '../../Hook/useFileHandler';
import { messageDataStore } from '../../../store/message';
import { MessageProps, MessageStoreProps } from '../../../Type/message';
import { MESSAGE_SUBSCRIPTION } from '../../GraphQL/Subscription';
import { SubscriptionStore, subscriptionDataStore } from '../../../store/subscription';
import { SubscriptionProps } from '../../../Type/Subscription';
import { SUBSCRIPTION_MUTATION } from '../../GraphQL/SubscriptionMutations';
import { USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION } from '../../GraphQL/UserMutations';
import RequestItem from '../../Hook/RequestHook';
import pdfLogo from '/logo/pdf-icon.svg';
import { useModal, ImageModal } from '../../Hook/ImageModal';
import { FaCamera } from 'react-icons/fa';
import { MdAttachFile, MdKeyboardArrowLeft, MdSend } from 'react-icons/md';
import TextareaAutosize from 'react-textarea-autosize';
import logoProfile from '/logo/logo profile.jpeg';
import Spinner from '../../Hook/Spinner';
import { DeleteItemModal } from '../../Hook/DeleteItemModal';


type useQueryUserConversationsProps = {
	loading: boolean;
	data: { user: { requestsConversations: RequestProps[] } };
	refetch: () => void;
	fetchMore: (options: { variables: { offset: number } }) => void;
};


function MyConversation() {

	// ImageModal Hook
	const { modalIsOpen, openModal, closeModal, selectedImage, nextImage, previousImage } = useModal();

	//state
	const [messageValue, setMessageValue] = useState('');
	//const [messages, setMessages] = useState<string[]>([]);
	//const [requestConversation, setRequestConversation] = useState<RequestProps[] | null>(null);
	const [selectedRequest, setSelectedRequest] = useState<RequestProps | null>(null);
	const [conversationIdState, setConversationIdState] = useState<number>(0);
	const [requestByDate, setRequestByDate] = useState<RequestProps[] | null>(null);
	const [isListOpen, setIsListOpen] = useState(true);
	const [isMessageExpanded, setIsMessageExpanded] = useState({});
	const [isMessageOpen, setIsMessageOpen] = useState(false);
	const [requestTitle, setRequestTitle] = useState(true);
	const [isHasMore, setIsHasMore] = useState(true);
	const [modalArgs, setModalArgs] = useState<{ event: React.MouseEvent, requestId: number } | null>(null);
	const [deleteItemModalIsOpen, setDeleteItemModalIsOpen] = useState(false);


	//useRef
	const offsetRef = useRef(0);
	const conversationIdRef = useRef(0);
	const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

	//store
	const id = userDataStore((state) => state.id);
	const [request] = requestDataStore((state) => [state.request, state.setRequest]);
	const resetRequest = requestDataStore((state) => state.resetRequest);
	const [requestsConversationStore, setRequestsConversationStore] = requestConversationStore((state) => [state.requests, state.setRequestConversation]);
	const [messageStore] = messageDataStore((state) => [state.messages, state.setMessageStore]);
	const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);
	const role = userDataStore((state) => state.role);
	const [clientRequestsStore, setClientRequestsStore] = clientRequestStore((state) => [state.requests, state.setClientRequestStore]);

	//mutation
	const [conversation, { loading: convMutLoading, error: createConversationError }] = useMutation(CONVERSATION_MUTATION);
	const [message, { loading: messageMutLoading, error: createMessageError }] = useMutation(MESSAGE_MUTATION);
	const [subscriptionMutation, { error: subscriptionError }] = useMutation(SUBSCRIPTION_MUTATION);
	const [hideRequest, { loading: hideRequestLoading, error: hideRequestError }] = useMutation(USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION);

	//query
	const { loading: convLoading, data: requestConv, fetchMore } = useQueryUserConversations(0, 4) as unknown as useQueryUserConversationsProps;
	const { loading: messageLoading, messageData } = useQueryMessagesByConversation(conversationIdState, 0, 100);

	// file upload
	const { file,urlFile, setUrlFile, setFile, handleFileChange } = useFileHandler();

	// Message subscription
	const Subscription = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'clientConversation');
	const { data: messageSubscription, error: errorSubscription } = useSubscription(MESSAGE_SUBSCRIPTION, {
		variables: {
			conversation_ids: Subscription?.subscriber_id,
			request_ids: [],
			is_request: false
		},
	});
	if (errorSubscription) {
		throw new Error('Error while subscribing to message');
	}

	//useEffect to set request in starting
	useEffect(() => {
		if (requestByDate && selectedRequest?.id === 0 && (requestByDate?.length ?? 0) > 0) {
			setSelectedRequest(requestByDate[0]);
			setTimeout(() => {
				document.getElementById('first-user')?.click();
			}, 200);
		}
	}, [requestByDate]);

	// useEffect to set the new selected request
	useEffect(() => {
		if (request) {
			setSelectedRequest(request);
		}
	}, []);

	// useEffect to update the message store
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
		}
	}, [messageData]);

	// useEffect to update the conversation id
	useEffect(() => {
		if (selectedRequest) {
			const conversationId = selectedRequest.conversation?.find(conversation => (
				conversation.user_1 === id || conversation.user_2 === id
			));
			setConversationIdState(conversationId?.id ?? 0);

		}
	}, [selectedRequest]);

	// useEffect to update the request to the requests store
	useEffect(() => {
		if (requestConv && requestConv.user) {

			const requestsConversations: RequestProps[] = requestConv.user.requestsConversations;

			//get all request who are not in the store
			const newRequests = requestsConversations.filter((request: RequestProps) => requestsConversationStore?.every(prevRequest => prevRequest.id !== request.id));

			// add the new request to the requestsConversationStore
			if (newRequests.length > 0) {
				requestConversationStore.setState(prevState => ({ ...prevState, requests: [...requestsConversationStore, ...newRequests] }));
			}

			offsetRef.current = requestsConversations?.length;
		} else {
			setIsHasMore(false);
		}
	}, [requestConv]);

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
		if (messageSubscription?.messageAdded) {
			const messageAdded: MessageProps[] = messageSubscription.messageAdded;
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

	}, [messageSubscription]);

	// cleane the request store if the component is unmounted
	useEffect(() => {
		return () => {
			// remove request.id in requestsConversationStore

			const removedRequest = requestConversationStore.getState().requests?.filter((requestConv: RequestProps) => request.id !== requestConv.id);
			requestConversationStore.setState({ requests: removedRequest });
			setRequestsConversationStore(removedRequest);
			resetRequest();
		};
	}, []);

	// useEffect to scroll to the end of the messages
	useEffect(() => {
		setTimeout(() => {
			endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
		}, 200);
	}, [messageStore]);


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
			console.log('coucou fetchmore');
			
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
				if (request.length === 0 || []) {
					setIsHasMore(false);
				}

				offsetRef.current = offsetRef.current + request.length;
			
			});
		}
	}

	// Function to hide a client request
	const handleHideRequest = (event: React.MouseEvent<Element, MouseEvent>, requestId: number) => {
		event.preventDefault();

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
		// Remove file from file list
		const newFiles = [...file];
		newFiles.splice(index, 1);
		setFile(newFiles);
		// Remove file from urlFile list
		const newUrlFileList = [...urlFile];
		newUrlFileList.splice(index, 1);
		setUrlFile(newUrlFileList);
	};

	return (
		<div className="my-conversation">
			{(convLoading || hideRequestLoading) && <Spinner/>}
			<div id="scrollableList" className={`my-conversation__list ${isListOpen ? 'open' : ''}`}>
				{/* {!requestByDate && <p>Vous n&apos;avez pas de demande</p>} */}
				{requestByDate && (
					<div className="my-conversation__list__detail" >
						<InfiniteScroll
							dataLength={requestsConversationStore?.length}
							next={addRequest}
							hasMore={isHasMore}
							loader={<p className="my-conversation__list no-req">Chargement...</p>}
							scrollableTarget="scrollableList"
							endMessage={
								clientRequestsStore.length >0 ? <p className="my-conversation__list no-req">Fin des résultats</p>
									:
									<p className="my-conversation__list no-req">Vous n&apos;avez pas de conversation</p>}
	
						>
							{request && request.id > 0 &&
								<RequestItem
									request={request}
									/* isMessageOpen={isMessageOpen} */
									setIsMessageOpen={setIsMessageOpen}
									resetRequest={resetRequest}
									/* isListOpen={isListOpen} */
									selectedRequest={selectedRequest!} // Add '!' to assert that selectedRequest is not null
									setSelectedRequest={setSelectedRequest}
									setDeleteItemModalIsOpen={setDeleteItemModalIsOpen}
									isMessageExpanded={isMessageExpanded}
									setIsMessageExpanded={setIsMessageExpanded}
									setIsListOpen={setIsListOpen}
									setModalArgs={setModalArgs}
									openModal={openModal}
								/>
							}
							{requestByDate.map((requestByDate, index) => (
								<RequestItem key={requestByDate.id}
									index={index}
									requestByDate={requestByDate}
									/* isMessageOpen={isMessageOpen} */
									setIsMessageOpen={setIsMessageOpen}
									/* isListOpen={isListOpen} */
									selectedRequest={selectedRequest!} // Add '!' to assert that selectedRequest is not null
									setSelectedRequest={setSelectedRequest}
									setDeleteItemModalIsOpen={setDeleteItemModalIsOpen}
									isMessageExpanded={isMessageExpanded}
									setIsMessageExpanded={setIsMessageExpanded}
									setIsListOpen={setIsListOpen}
									setModalArgs={setModalArgs}
									openModal={openModal}
								/>
							))}
						</InfiniteScroll>

					</div>
				)}
			</div>

			<div className={`my-conversation__message-list ${isMessageOpen ? 'open' : ''} ${(messageLoading || messageMutLoading || convMutLoading) ? 'loading' : ''}`}>
				{(messageLoading || messageMutLoading || convMutLoading) && <Spinner/>}
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
										setIsMessageOpen(false), 
										setIsListOpen(true),
										event.stopPropagation();
									}}
								/>
								<img 
									className="my-conversation__message-list__user__header__detail img" 
									src={selectedRequest.image ? selectedRequest.image : logoProfile} 
									alt="" />
								<p className="my-conversation__message-list__user__header__detail name">{selectedRequest.first_name} {selectedRequest.last_name}</p>

							</div>
							{requestTitle && <div>
								<p className="my-conversation__message-list__user__header__detail title">{selectedRequest.title}</p>
							</div>}
						</div>
					)}

				</div>
				{/* <h2 className="my-request__message-list__title">Messages for {selectedRequest?.title}</h2> */}
				<div id="scrollableMessageList" className="my-conversation__message-list__message">
					<InfiniteScroll
						className="infinite-scroll"
						dataLength={messageStore?.length}
						next={() => {}}
						hasMore={true}
						loader={<h4></h4>}
						scrollableTarget="scrollableMessageList"
						
					>
						{Array.isArray(messageStore) &&
							messageStore
								.filter((message) => message.conversation_id === conversationIdState)
								.map((message, index, array) => (
									<div className={`my-conversation__message-list__message__detail ${message.user_id === id ? 'me' : ''}`} key={message.id}>
										{index === array.length - 1 ? <div ref={endOfMessagesRef} /> : null}
										<div className={`content ${message.user_id === id ? 'me' : ''}`}>
											{message.media[0].url && (
												<div className="my-conversation__message-list__message__detail__image-container">
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
																				className={`my-conversation__message-list__message__detail__image-pdf ${message.media.length === 1 ? 'single' : 'multiple'}`}
																				//key={media.id} 
																				src={pdfLogo}
																				alt={media.name}
																			/>
																		</a>
																	) : (
																		
																		<img
																			className={`my-conversation__message-list__message__detail__image ${message.media.length === 1 ? 'single' : 'multiple'}`}
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
											{message.content && <div className="my-conversation__message-list__message__detail__texte">{message.content}</div>}
										</div>
										<div className="my-conversation__message-list__message__detail__date">{new Date(Number(message.created_at)).toLocaleString()}</div>
									</div>
								))

						}
					</InfiniteScroll>
				</div>

				<form className="my-conversation__message-list__form" onSubmit={(event) => {
					event.preventDefault();
					if (selectedRequest?.id && !selectedRequest.deleted_at) {
						handleMessageSubmit(event, selectedRequest.id);
					}
				}}>
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
								>
									X
								</div>
							</div>
						))}
					</div>}
					<label className="my-conversation__message-list__form__label">
						<MdAttachFile
							className="my-conversation__message-list__form__label__attach"
							onClick={() => document.getElementById('send-file')?.click()}
						/>
						<FaCamera
							className="my-conversation__message-list__form__label__camera"
							onClick={() => document.getElementById('file-camera')?.click()}
						/>
						<TextareaAutosize
							//key={messageValue || 'empty'}
							className="my-conversation__message-list__form__label__input"
							value={messageValue}
							onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setMessageValue(event.target.value)}
							placeholder="Tapez votre message ici..."
							maxLength={500}
							minRows={1}
						/>
						<MdSend
							className="my-conversation__message-list__form__label__send"
							onClick={() => document.getElementById('send-message')?.click()}
						/>
					</label>
					<input
						id="send-file"
						className="my-conversation__message-list__form__input"
						type="file"
						accept="image/*,.pdf"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFileChange(event)}
						multiple={true}
					/>
					<input
						id="file-camera"
						className="my-conversation__message-list__form__input medi"
						type="file"
						accept="image/*"
						capture="environment"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFileChange(event)}
					/>
					<button
						id="send-message"
						className="my-conversation__message-list__form__button"
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
				handleDeleteRequest={handleHideRequest}
			/>
		</div>
	);
}

export default MyConversation;