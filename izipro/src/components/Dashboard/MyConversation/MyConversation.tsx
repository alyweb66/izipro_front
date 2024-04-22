/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import './MyConversation.scss';
import { requestDataStore, requestConversationStore } from '../../../store/Request';
import { RequestProps } from '../../../Type/Request';
import { CONVERSATION_MUTATION, MESSAGE_MUTATION } from '../../GraphQL/ConversationMutation';
import { useMutation } from '@apollo/client';
import { userDataStore } from '../../../store/UserData';
import { useQueryMessagesByConversation, useQueryUserConversations } from '../../Hook/Query';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useFileHandler } from '../../Hook/useFileHandler';
import { messageDataStore } from '../../../store/message';
import { MessageProps, MessageStoreProps } from '../../../Type/message';
import { MESSAGE_SUBSCRIPTION } from '../../GraphQL/Subscription';
import { subscriptionDataStore } from '../../../store/subscription';
import { SubscriptionProps } from '../../../Type/Subscription';
import { SUBSCRIPTION_MUTATION } from '../../GraphQL/SubscriptionMutations';

type useQueryUserConversationsProps = {
	loading: boolean;
	data: { user: { requestsConversations: RequestProps[] } };
	refetch: () => void;
	fetchMore: (options: { variables: { offset: number } }) => void;
};


function MyConversation() {

	//state
	const [messageValue, setMessageValue] = useState('');
	//const [messages, setMessages] = useState<string[]>([]);
	//const [requestConversation, setRequestConversation] = useState<RequestProps[] | null>(null);
	const [selectedRequest, setSelectedRequest] = useState<RequestProps | null>(null);
	//const [conversationIdState, setConversationIdState] = useState<number>(0);

	//useRef
	const offsetRef = useRef(0);
	const conversationIdRef = useRef(0);

	//store
	const id = userDataStore((state) => state.id);
	const [request, setRequest] = requestDataStore((state) => [state.request, state.setRequest]);
	const resetRequest = requestDataStore((state) => state.resetRequest);
	const [requestsConversationStore, setRequestsConversationStore] = requestConversationStore((state) => [state.requests, state.setRequestConversation]);
	const [messageStore] = messageDataStore((state) => [state.messages, state.setMessageStore]);
	const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);
	const role = userDataStore((state) => state.role);

	//mutation
	const [conversation, { error: createConversationError }] = useMutation(CONVERSATION_MUTATION);
	const [message, { error: createMessageError }] = useMutation(MESSAGE_MUTATION);
	const [subscriptionMutation, { error: subscriptionError }] = useMutation(SUBSCRIPTION_MUTATION);

	//query
	const { data, fetchMore } = useQueryUserConversations(0, 3) as unknown as useQueryUserConversationsProps;
	const conversationId = selectedRequest?.conversation[0].id ?? 0;
	const { subscribeToMore, messageData } = useQueryMessagesByConversation(id, conversationId, 0, 10);

	// file upload
	const { fileError, file, setFile, setUrlFile, urlFile, handleFileChange } = useFileHandler();

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

	// useEffect to subscribe to new message requests
	useEffect(() => {

		if (subscribeToMore) {
			const Subscription = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'messageRequest');
		
			if (Subscription?.subscriber_id) {
				subscribeToMore({
					document: MESSAGE_SUBSCRIPTION,
					variables: {
						conversation_ids: Subscription?.subscriber_id,
					},
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					updateQuery: (prev: MessageProps, { subscriptionData }: { subscriptionData: any }) => {
			
						if (!subscriptionData.data) return prev;
						messageDataStore.setState(prevState => {
							const newMessages = subscriptionData.data.messageAdded.filter(
								(newMessage: MessageProps) => !prevState.messages.find((existingMessage) => existingMessage.id === newMessage.id)
							);

							return {
								...prevState,
								messages: [...prevState.messages, ...newMessages]
							};
						});

					},
				});
			}

		}
	}, [subscribeToMore, subscriptionStore]);


	// useEffect to update the data to the requests state
	useEffect(() => {
		if (data && data.user) {
			console.log('data', data);

			const requestsConversations: RequestProps[] = data.user.requestsConversations;
			setRequestsConversationStore(requestsConversations); // Fix: Pass an array as the argument
			offsetRef.current = requestsConversations.length;

		}
	}, [data]);

	// cleane the request store if the component is unmounted
	useEffect(() => {
		return () => {
			// remove request.id in requestsConversationStore
			requestConversationStore.setState(prevState => ({
				...prevState,
				requestsConversationStore: prevState.requests.filter(request => request.id !== request.id)
			})),
			resetRequest();
		};
	}, []);


	function sendMessage(requestId: number, newClientRequest = false) {
		// find conversation id where request is equal to the request id if newclientRequest is false
		let conversationId;
		if (!newClientRequest) {
			conversationId = requestsConversationStore?.find((request) => request.id === requestId)?.conversation[0].id;
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

						const addNewRequestConversation = [request, ...requestsConversationStore];
						setRequestsConversationStore(addNewRequestConversation);
						resetRequest();
					}

					setFile([]);
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
			
				if (response.data.createConversation) {
					const conversation: RequestProps['conversation'] = [response.data.createConversation];
					conversationIdRef.current = conversation[0].id;
					
					// put the conversation data in the request
					const updateRequest: RequestProps = { ...request, conversation: conversation };
					setRequest(updateRequest);
					setSelectedRequest(updateRequest);
				}

				// update the subscription store
				// replace the old subscription with the new one
				if (!subscriptionStore.some(subscription => subscription.subscriber === 'messageRequest')) {

					subscriptionMutation({
						variables: {
							input: {
								user_id: id,
								subscriber: 'messageRequest',
								subscriber_id: [conversationIdRef.current]
							}
						}

					}).then((response) => {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { created_at, updated_at, ...subscriptionWithoutTimestamps } = response.data.createSubscription;
						// replace the old subscription with the new one
						const messageRequestSubscription = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'messageRequest');
						// If there are no subscriptions, add the new conversation id in the array of subscription.subscriber_id
						if (!messageRequestSubscription) {
							subscriptionStore.concat(subscriptionWithoutTimestamps);
						} else {
							// replace the old subscription with the new one
							subscriptionStore.map((subscription: SubscriptionProps) =>
								subscription.subscriber === 'messageRequest' ? subscriptionWithoutTimestamps : subscription
							);
						}

						const newClientRequest = true;
						sendMessage(requestId, newClientRequest);
					});

					if (subscriptionError) {
						throw new Error('Error while subscribing to conversation');
					}
				} else if (subscriptionStore.some(subscription => subscription.subscriber === 'messageRequest')) {
	
					// recover the old subscription and add the new conversation id in the array of subscription.subscriber_id
					let newSubscriptionIds;
					const conversation = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'messageRequest');
					if (conversation && Array.isArray(conversation.subscriber_id)) {
						newSubscriptionIds = [...conversation.subscriber_id, conversationIdRef.current];
					}

					subscriptionMutation({
						variables: {
							input: {
								user_id: id,
								subscriber: 'messageRequest',
								subscriber_id: newSubscriptionIds
							}
						}

					}).then((response) => {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { created_at, updated_at, ...subscriptionWithoutTimestamps } = response.data.createSubscription;
						// replace the old subscription with the new one
						const addSubscriptionStore = subscriptionStore.map((subscription: SubscriptionProps) =>
							subscription.subscriber === 'messageRequest' ? subscriptionWithoutTimestamps : subscription
						);

						if (addSubscriptionStore) {
							setSubscriptionStore(addSubscriptionStore);
						}

						const newClientRequest = true;
						sendMessage(requestId, newClientRequest);
					});
				}
				

			});

			if (createConversationError) {
				throw new Error('Error creating conversation',);
			}
		}

		sendMessage(requestId);
	};



	// Function to load more requests with infinite scroll
	function addRequest() {
		fetchMore({
			variables: {
				offset: offsetRef.current, // Next offset
			},
		}).then((fetchMoreResult: { data: { user: { requestsConversations: RequestProps[] } } }) => {
			
			const request = fetchMoreResult.data.user.requestsConversations;

			if (!fetchMoreResult.data) return;
			if (request) {
				const addRequest = [...(requestsConversationStore || []), ...request];
				setRequestsConversationStore(addRequest);
			}
			offsetRef.current = offsetRef.current + request.length;
		});
	}


	
	
	return (
		<div className="my-conversation-container">
			<div className="my-client-request">Demandes clients
				<InfiniteScroll
					dataLength={requestsConversationStore?.length || 0}
					next={() => {
						addRequest();
					}}
					hasMore={true}
					loader={<h4>Loading...</h4>}
				>
					{request && request.id > 0 &&
						<div className="request-details" key={request.id} onClick={() => setSelectedRequest(request)} >
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
						</div>}
					{requestsConversationStore?.map((requestConversation) => (
						<div className="request-details" key={requestConversation.id} onClick={() => setSelectedRequest(requestConversation)} >
							<h1>{requestConversation.title}</h1>
							<p>{requestConversation.created_at}</p>
							<p>{requestConversation.first_name}</p>
							<p>{requestConversation.last_name}</p>
							<p>{requestConversation.city}</p>
							<h2>{requestConversation.job}</h2>
							<p>{requestConversation.message}</p>
							<div>
								{requestConversation.media?.map((media) => (
									media ? (<img key={media.id} src={media.url} alt={media.name} />) : null
								))}
							</div>
						</div>
					))}
				</InfiniteScroll>
			</div>


			<div className="my-message">
				{selectedRequest && (
					<>
						<h2>Messages for {selectedRequest.title}</h2>
						{Array.isArray(messageStore) &&
							messageStore
								.filter((message) => message.conversation_id === selectedRequest.conversation[0].id)
								.map((message: MessageStoreProps, index) => (
									<div className={`${message.user_id}`} key={index}>{message.content}</div>
								))
						}
						<form onSubmit={(event) => handleMessageSubmit(event, selectedRequest.id)}>
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
					</>
				)}
			</div>
		</div>
	);
}

export default MyConversation;