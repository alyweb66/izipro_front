import { useEffect, useRef, useState } from 'react';
import { userConversation, userDataStore } from '../../../store/UserData';
import { useMutation } from '@apollo/client';
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
import { subscriptionDataStore } from '../../../store/subscription';
import { MESSAGE_MUTATION } from '../../GraphQL/ConversationMutation';
import { SubscriptionProps } from '../../../Type/Subscription';
import { MESSAGE_SUBSCRIPTION } from '../../GraphQL/Subscription';
import { SUBSCRIPTION_MUTATION } from '../../GraphQL/SubscriptionMutations';
//import { useQueryConversation } from '../../Hook/Query';

function MyRequest() {

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


	// Create a state for the scroll position
	const offsetRef = useRef(0);
	const limit = 10;
	
	// store
	const id = userDataStore((state) => state.id);
	const [myRequestsStore, setMyRequestsStore] = myRequestStore((state) => [state.requests, state.setMyRequestStore]);
	const [userConvStore, setUserConvStore] = userConversation((state) => [state.users, state.setUsers]);
	const [messageStore] = myMessageDataStore((state) => [state.messages, state.setMessageStore]);
	const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);

	//useRef
	//const userOffsetRef = useRef(0);
	//const conversationIdRef = useRef(0);

	// file upload
	const { file, setFile, handleFileChange } = useFileHandler();

	//mutation
	const [ deleteRequest, {error: deleteRequestError} ] = useMutation(DELETE_REQUEST_MUTATION);
	const [ message, { error: createMessageError }] = useMutation(MESSAGE_MUTATION);
	const [ subscriptionMutation, { error: subscriptionError } ] = useMutation(SUBSCRIPTION_MUTATION);
	
	// Query to get the user requests
	const { getUserRequestsData, fetchMore } = useQueryUserRequests(id, 0, limit);
	const { usersConversationData } = useQueryUsersConversation( newUserId.length !== 0 ? newUserId : userIds ,0 , limit);
	const { subscribeToMore, messageData } = useQueryMyMessagesByConversation(conversationIdState, 0, 20);
	console.log('getUserRequestsData', getUserRequestsData);
	console.log('newUserId', newUserId);

	console.log('myRequestsStore', myRequestsStore);
	console.log('userConversationData', usersConversationData);

	// useEffect to update the requests state
	useEffect(() => {
		if (getUserRequestsData) {
			// If offset is 0, it's the first query, so just replace the queries
			if (offsetRef.current === 0) {
				// check if requests are already in the store
				const requestsIds = myRequestsStore.map(request => request.id);
				const newRequests = getUserRequestsData.user.requests.filter((request: RequestProps) => !requestsIds.includes(request.id));
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
		console.log('after message');
		
		if (userConvStore && selectedRequest && selectedRequest.conversation) {
			console.log('after message in condition');
			
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
				console.log('setting userConvStore');
				
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
		console.log('userConvStore in useEffect', userConvStore);

	}, [usersConversationData]);

	// useEffect to subscribe to new message requests
	useEffect(() => {

		if (subscribeToMore) {
			const request = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'request');
			const conversation = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'conversation');

			if (request?.subscriber_id || conversation?.subscriber_id) {
				subscribeToMore({
					document: MESSAGE_SUBSCRIPTION,
					variables: {
						conversation_ids: conversation?.subscriber_id,
						request_ids: request?.subscriber_id,
						is_request: true
					},
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					updateQuery: (prev: MessageProps, { subscriptionData }: { subscriptionData: any }) => {

						if (!subscriptionData.data) return prev;
						// check if the message is already in the store
						const messageAdded: MessageProps[] = subscriptionData.data.messageAdded;
						
						
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
						console.log('myRequestStoreInSub', myRequestsStore);
						
						// add the conversation to the request
						myRequestStore.setState(prevState => {
							const updatedRequest = prevState.requests.map((request: RequestProps) => {
								// if the conversation id is in the request
								if (request.conversation && request.conversation.some((conversation) => conversation.id === messageAdded[0].conversation_id)) {
									console.log('request1', request);
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
									console.log('request2', request);
										
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
										console.log('request3', request);
										
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
									console.log('set new user');
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
									console.log('set new user');
									
									setNewUserId([messageAdded[0].user_id]);
								}

								return { ...prevState, conversation };

							} else {
								return null;
							}
							
						});
						console.log('newUserId', newUserId);
						
						// send id to the mutation to find user
						setNewUserId([]);
						if (messageAdded[0].user_id !== id && !userConvStore.some(user => user.id === messageAdded[0].user_id)) {

							setNewUserId([messageAdded[0].user_id]);
						}
						
						
					},
					
				});
				console.log('selectedRequestInSub', selectedRequest);
			}
			console.log('myRequestStoreInSub', myRequestsStore);
			
		}
	}, [subscribeToMore, subscriptionStore]);
	console.log('userConvStore', userConvStore);
	console.log('userConvState', userConvState);



	// Function to delete a request
	const handleDeleteRequest = (event: React.MouseEvent<HTMLButtonElement>, requestId: number, imageNames: string[]) => {
		event.preventDefault();
		deleteRequest({
			variables: 
				{ input: 
					{
						id: requestId,
						user_id: id,
						image_names: imageNames
					}
				}
		}).then((response) => {
			if (response.data.deleteRequest) {
				// Remove the request from the state
				setMyRequestsStore(myRequestsStore.filter(request => request.id !== requestId));
			}
		});

		if (deleteRequestError) {
			throw new Error('Error while deleting request');
		}
		
	};

	// Function to handle the users ids for the conversation
	const handleConversation = (event: React.MouseEvent<HTMLDivElement>, request: RequestProps) => {
		event.preventDefault();

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
			console.log('newIds', newIds);

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
				});
			}
		}
		if (createMessageError) {
			throw new Error('Error creating message');
		}
	};


	return (
		<div className="my_request-container">
			<div className="request-list">
				{!requestByDate && <p>Vous n&apos;avez pas de demande</p>}
				{requestByDate && (
					<div > 
						<InfiniteScroll
							dataLength={myRequestsStore?.length}
							next={ () => {
								if (!loading) {
									fetchMore({
										variables: {
											offset: myRequestsStore.length // Next offset
										},
									}).then((fetchMoreResult: { data: { user: { requests: RequestProps[] } } }) => {
										myRequestStore.setState(prevRequests => {
											return { ...prevRequests, requests: [...prevRequests.requests, ...fetchMoreResult.data.user.requests] };
										});

										offsetRef.current = offsetRef.current + fetchMoreResult.data.user.requests.length;
										setLoading(false);
									});
								}
							}}
							hasMore={true}
							loader={<h4>Loading...</h4>}
						>
							{requestByDate.map((request) => (
								<div key={request.id} onClick={(event) => [handleConversation(event, request), setSelectedRequest(request)]}>
									<h1>{request.title}</h1>
									<p>{request.created_at}</p>
									<p>{request.first_name}</p>
									<p>{request.last_name}</p>
									<p>{request.city}</p>
									<h2>{request.job}</h2>
									<p>{request.message}</p>
									<div>
								
										{request.media?.map((media) => (
											media ? (<img key={media.id} src={media.url} alt={media.name} />) : null
										))}
								
									</div>
									<button type='button' onClick={(event) => {handleDeleteRequest(event, request.id, request.media.map(image => image.name));}}>Supprimer la demande</button>
								</div>
							))}
						</InfiniteScroll>
				
					</div>
				)}
			</div>
			<div className="answer-list">
				{userConvState?.length === 0 && <p>Vous n&apos;avez pas de conversation</p>}
				{userConvState && userConvState?.map((user: UserDataProps ) => (
					<div key={user.id} onClick={(event) => {handleMessageConversation(event, user.id);}}>
						<h1>user</h1>
						<img src={user.image} alt="" />
						<p>{user.denomination}</p>
						<p>{user.city}</p>
					</div>
				))}

			</div>
			<div className="message-list">
				<h2>Messages for {selectedRequest?.title}</h2>
				{Array.isArray(messageStore) &&
							messageStore
								.filter((message) => message.conversation_id === conversationIdState)
								.map((message) => (
									<div className={`${message.user_id}`} key={message.id}>{message.content}
										<img src={`${message.media[0].url}`} alt="" />
									</div>
								))
								
				}
				<form onSubmit={(event) => handleMessageSubmit(event)}>
					<input
						type="text"
						value={messageValue}
						onChange={(e) => setMessageValue(e.target.value)}
						placeholder="Type your message here"
					/>
					<input
						type="file"
						accept="image/*,.pdf"
						onChange={handleFileChange}
					/>
					<button type="submit">Send</button>
				</form>

			</div>
		</div>
	);
}

export default MyRequest;







