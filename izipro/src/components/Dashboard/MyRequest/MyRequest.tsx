import { useEffect, useRef, useState } from 'react';
import { userConversation, userDataStore } from '../../../store/UserData';
import { useMutation, useSubscription } from '@apollo/client';
import { RequestProps} from '../../../Type/Request';
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
import { MESSAGE_SUBSCRIPTION } from '../../GraphQL/Subscription';
import { SUBSCRIPTION_MUTATION } from '../../GraphQL/SubscriptionMutations';
import { FaTrashAlt,FaCamera } from 'react-icons/fa';
import { MdSend, MdAttachFile } from 'react-icons/md';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import pdfLogo from '/logo/pdf-icon.svg';
import logoProfile from '/logo/logo profile.jpeg';
import { useModal, ImageModal } from '../../Hook/ImageModal';
import TextareaAutosize from 'react-textarea-autosize';
//import { useQueryConversation } from '../../Hook/Query';
import { DeleteItemModal } from '../../Hook/DeleteItemModal';
//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
ReactModal.setAppElement('#root');

type ExpandedState = {
	[key: number]: boolean;
};

function MyRequest() {

	// ImageModal Hook
	const { modalIsOpen, openModal, closeModal, selectedImage, nextImage, previousImage } = useModal();
	
	//state
	//const [requests, setRequests] = useState<RequestProps[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState<RequestProps | null>(null);
	const [userIds, setUserIds] = useState<number[]>([]);
	const [conversationIdState, setConversationIdState] = useState<number>(0);
	const [messageValue, setMessageValue] = useState('');
	const [requestByDate, setRequestByDate] = useState<RequestProps[] | null>(null);
	const [newUserId, setNewUserId] = useState<number[]>([]);
	const [userConvState, setUserConvState] = useState<UserDataProps[]>([]);
	const [selectedUser, setSelectedUser] = useState<UserDataProps | null>(null);
	const [userDescription, setUserDescription] = useState<boolean>(false);
	const [isListOpen, setIsListOpen] = useState<boolean>(true);
	const [isAnswerOpen, setIsAnswerOpen] = useState<boolean>(false);
	const [isMessageOpen, setIsMessageOpen] = useState<boolean>(false);
	const [isMessageExpanded, setIsMessageExpanded] = useState({});
	const [deleteItemModalIsOpen, setDeleteItemModalIsOpen] = useState(false);
	const [modalArgs, setModalArgs] = useState<{ event: React.MouseEvent, requestId: number } | null>(null);

	

	// Create a state for the scroll position
	const offsetRef = useRef(0);
	const limit = 2;
	
	// store
	const id = userDataStore((state) => state.id);
	const [myRequestsStore, setMyRequestsStore] = myRequestStore((state) => [state.requests, state.setMyRequestStore]);
	const [userConvStore, setUserConvStore] = userConversation((state) => [state.users, state.setUsers]);
	const [messageStore] = myMessageDataStore((state) => [state.messages, state.setMessageStore]);
	const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);

	//useRef
	//const updateSubscriptionRef = useRef<SubscriptionProps[]>([]);
	//const userOffsetRef = useRef(0);
	//const conversationIdRef = useRef(0);
	const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
	const idRef = useRef<number>(0);

	// file upload
	const { urlFile, setUrlFile, file, setFile, handleFileChange } = useFileHandler();

	//mutation
	const [ deleteRequest, {error: deleteRequestError} ] = useMutation(DELETE_REQUEST_MUTATION);
	const [ message, { error: createMessageError }] = useMutation(MESSAGE_MUTATION);
	const [ subscriptionMutation, { error: subscriptionError } ] = useMutation(SUBSCRIPTION_MUTATION);
	
	// Query to get the user requests
	const { getUserRequestsData, fetchMore } = useQueryUserRequests(id, 0, limit);
	const { usersConversationData } = useQueryUsersConversation( newUserId.length !== 0 ? newUserId : userIds ,0 , limit);
	const { messageData } = useQueryMyMessagesByConversation(conversationIdState, 0, 20);

	// get the subscription
	const request = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'request');
	const conversation = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'conversation');
	
	// Subscription to get new message
	const { data: messageSubscription, error: errorSubscription } = useSubscription(MESSAGE_SUBSCRIPTION, {
		variables: {
			conversation_ids: conversation?.subscriber_id,
			request_ids: request?.subscriber_id,
			is_request: true
		}
	});
	if (errorSubscription) {
		throw new Error('Error while subscribing to message');
	}

	//useEffect to set request and user in starting
	useEffect(() => {
		if (requestByDate && !selectedRequest && (requestByDate?.length ?? 0) > 0) {
			setSelectedRequest(requestByDate[0]);
			handleConversation(requestByDate[0]);
			setTimeout(() => {
				document.getElementById('first-user')?.click();
			}, 200);
		}
	}, [requestByDate]);

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
				//setMyRequestsStore(getUserRequestsData.user.requests);
			} 
		}
	}, [getUserRequestsData]);
	
	// useEffect to sort the requests by date
	useEffect(() => {
		if (myRequestsStore) {
			const sortedRequests = [...myRequestsStore].sort((a, b) => {
				// Check if a.conversation or b.conversation is empty
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
				if(updatedRequestIds && updatedRequestIds.length > 0) {
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
	}, [userConvStore, selectedRequest]);

	// useEffect to update the message store
	useEffect(() => {
		if (messageData) {
		
			const messages: MessageProps[] = messageData.messages;
			// Add the new messages to the store
			myMessageDataStore.setState(prevState => {
				if (prevState.messages.length > 0) {
					
					
					const newMessages = messages.filter(
						(newMessage) => !prevState.messages.find((existingMessage) => existingMessage.id === newMessage.id)
					);
		
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

	// useEffect to subscribe to new message requests
	useEffect(() => {

		/* if (subscribeToMore) {
			const request = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'request');
			const conversation = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'conversation');
			
			
			

			if (request?.subscriber_id || conversation?.subscriber_id) {
				console.log('Subscribing with:', {
					conversation_ids: conversation?.subscriber_id,
					request_ids: request?.subscriber_id
				});
				
				subscribeToMore({
					document: MESSAGE_SUBSCRIPTION,
					variables: {
						conversation_ids: conversation?.subscriber_id,
						request_ids: request?.subscriber_id,
						is_request: true
					}, */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		//updateQuery: (prev: MessageProps, { subscriptionData }: { subscriptionData: any }) => {

		//if (!subscriptionData.data) return prev;
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
					} else if (request.id === messageAdded[0].request_id  && request.conversation?.some(
						conversation => conversation.id !== messageAdded[0].conversation_id)) {
						
										
						const conversation = [
							...request.conversation,
							{
								id: messageAdded[0].conversation_id,
								user_1: messageAdded[0].user_id,
								user_2: id,
								updated_at: newDate
							}
						];
						return { ...request, conversation };

					} else {
					// if the request hasn't a conversation
						if (request.id === messageAdded[0].request_id  && !request.conversation) {
							
										
							const conversation = [
								{
									id: messageAdded[0].conversation_id,
									user_1: messageAdded[0].user_id,
									user_2: id,
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
			
						
			// send id to the mutation to find user
			setNewUserId([]);
			if (messageAdded[0].user_id !== id && !userConvStore.some(user => user.id === messageAdded[0].user_id)) {

				setNewUserId([messageAdded[0].user_id]);
			}
						
		}			
		//},
					
		//});
		//}
		//}
	}, [messageSubscription]);

	// useEffect to scroll to the end of the messages
	useEffect(() => {
		setTimeout(() => {
			endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
		}, 200);
	}, [messageStore]);

	console.log('myRequestsStore', myRequestsStore);

	// Function to delete a request
	const handleDeleteRequest = (event: React.MouseEvent<Element, MouseEvent>, requestId: number) => {
		event.preventDefault();

		deleteRequest({
			variables: 
				{ input: 
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

			const idStore = userConvStore.map(user => user.id);

			// Filter out the user ids that are already in the userConvStore
			const newIds = ids.filter(id => !idStore.includes(id));
			

			if (newIds.length > 0) {
				setUserIds(newIds || []); // Provide a default value of an empty array
			} 
		}
	};

	// Function find conversation id for message
	const handleMessageConversation = (event: React.MouseEvent<HTMLDivElement>, userId: number) => {
		event.preventDefault();

		// find the conversation id for the message
		const conversationId = selectedRequest?.conversation?.find(conversation => 
			(conversation.user_1 === id || conversation.user_2 === id) && 
			(conversation.user_1 === userId || conversation.user_2 === userId)
		);

		setConversationIdState(conversationId?.id || 0);


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
	function addRequest() {
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

			setLoading(false);
		});
	}

	return (
		<div className="my-request">
			<div className={`my-request__list ${isListOpen ? 'open' : ''}`}>
				{!requestByDate && <p>Vous n&apos;avez pas de demande</p>}
				{requestByDate && (
					<div className="my-request__list__detail" > 
						<InfiniteScroll
							dataLength={myRequestsStore?.length}
							next={ () => {
								console.log('couocu');
							
								addRequest();
								
							}}
							hasMore={true}
							loader={<h4>Loading...</h4>}
						>
							{requestByDate.map((request) => (
								<div
									className={`my-request__list__detail__item ${request.urgent} ${selectedRequest === request ? 'selected' : ''} ` }
									key={request.id} 
									onClick={(event) => [
										handleConversation(request, event), 
										setSelectedRequest(request), 
										setIsListOpen(!isListOpen), 
										setIsAnswerOpen(!isAnswerOpen)
									]}
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
										<p className="my-request__list__detail__item__header name" >
											<span className="my-request__list__detail__item__header name-span">
												Nom:</span>&nbsp;{request.first_name} {request.last_name}
										</p>
									</div>
									<h1 className="my-request__list__detail__item title" >{request.title}</h1>
									<p 
										//@ts-expect-error con't resolve this type
										className={`my-request__list__detail__item message ${isMessageExpanded && isMessageExpanded[request?.id] ? 'expanded' : ''}`}
										onClick={(event) => {
											//to open the message when the user clicks on it just for the selected request 
											idRef.current = request?.id  ?? 0; // check if request or requestByDate is not undefined
					
											if (idRef.current !== undefined && setIsMessageExpanded) {
												setIsMessageExpanded((prevState: ExpandedState)  => ({
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
															onClick={(event) => {event.stopPropagation();}} >
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
											console.log('requestId', request.id);
											
											setModalArgs({ event, requestId: request.id }),
											//handleDeleteRequest(event, request.id), 
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
						</InfiniteScroll>
				
					</div>
				)}
			</div>
			<div className={`my-request__answer-list ${isAnswerOpen ? 'open' : ''}`}>
				<InfiniteScroll
					dataLength={myRequestsStore?.length}
					next={ () => {
						
					}}
					hasMore={true}
					loader={<h4>Loading...</h4>}
				>
					<MdKeyboardArrowLeft 
						className="my-request__answer-list return" 
						onClick={() => [setSelectedRequest(null), setIsListOpen(!isMessageOpen), setIsAnswerOpen(!isAnswerOpen)]}
					/>
					{userConvState?.length === 0 && <p className="my-request__answer-list no-conv">Vous n&apos;avez pas de conversation</p>}
					{userConvState && userConvState?.map((user: UserDataProps, index ) => (
						<div
							id={index === 0 ? 'first-user' : undefined}
							className={`my-request__answer-list__user ${selectedUser === user ? 'selected-user' : ''}`} 
							key={user.id} 
							onClick={(event) => {handleMessageConversation(event, user.id), setSelectedUser(user), setIsMessageOpen(!isMessageOpen), setIsAnswerOpen(!isAnswerOpen);}}>
							<div className="my-request__answer-list__user__header">
								<img className="my-request__answer-list__user__header img" src={user.image ? user.image : logoProfile} alt="" />
								{/* <img className="my-request__answer-list__user__header img" src={user.image} alt="" /> */}
								{/* <p className="my-request__answer-list__user__header name">{user.first_name}{user.last_name}</p> */}
								{user.denomination ? (
									<p className="my-request__answer-list__user__header denomination">{user.denomination}</p>
								) : (
									<p className="my-request__answer-list__user__header name">{user.first_name} {user.last_name}</p>
								) }
							</div>
							{/* <p className="my-request__answer-list__user city">{user.city}</p> */}
						</div>
					))}
				</InfiniteScroll>
			</div>
			<div className={`my-request__message-list ${isMessageOpen ? 'open' : ''}`}>
				<div className="my-request__message-list__user">
					{selectedUser &&  (
						<div
							className="my-request__message-list__user__header"  
							onClick={() => setUserDescription(!userDescription)}
						>
							<div 
								className="my-request__message-list__user__header__detail"
							>
								<MdKeyboardArrowLeft 
									className="my-request__message-list__user__header__detail return" 
									onClick={() => [setSelectedUser(null), setIsMessageOpen(!isMessageOpen), setIsAnswerOpen(!isAnswerOpen)]}
								/>								
								<img className="my-request__message-list__user__header__detail img" src={selectedUser.image ? selectedUser.image : logoProfile} alt="" />
								{/* <img className="my-request__answer-list__user__header img" src={user.image} alt="" /> */}
								{/* <p className="my-request__answer-list__user__header name">{user.first_name}{user.last_name}</p> */}
								{selectedUser.denomination ? (
									<p className="my-request__message-list__user__header__detail denomination">{selectedUser.denomination}</p>
								) : (
									<p className="my-request__message-list__user__header__detail name">{selectedUser.first_name} {selectedUser.last_name}</p>
								)}
							</div>
							{/* <p className="my-request__answer-list__user city">{user.city}</p> */}
							{userDescription && <div>
								<p className="my-request__message-list__user__header description">{selectedUser.description ? selectedUser.description : 'Pas de déscription'}</p> 
							</div>
							}
						</div>
					)}

				</div>
				{/* <h2 className="my-request__message-list__title">Messages for {selectedRequest?.title}</h2> */}
				<div className="my-request__message-list__message">
					<InfiniteScroll
						className="infinite-scroll"
						dataLength={messageStore?.length}
						next={ () => {
							
						}}
						hasMore={true}
						loader={<h4>Loading...</h4>}
					>
						{Array.isArray(messageStore) &&
								messageStore
									.filter((message) => message.conversation_id === conversationIdState)
									.map((message, index, array) => (
										<div className={`my-request__message-list__message__detail ${message.user_id === id ? 'me' : ''}`} key={message.id}>
											{index === array.length - 1 ? <div ref={endOfMessagesRef} /> : null}
											<div className={`content ${message.user_id === id ? 'me' : ''}`}>
												{message.media[0].url &&  (
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
																				onClick={(event) => {event.stopPropagation();}} >
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
					</InfiniteScroll>
				</div>
				
				<form className="my-request__message-list__form" onSubmit={(event) => {
					event.preventDefault();
					if (selectedUser) {
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
							onClick={() =>document.getElementById('send-file')?.click()}
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







