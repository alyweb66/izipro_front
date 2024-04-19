import { useEffect, useRef, useState } from 'react';
import './MyConversation.scss';
import { requestDataStore } from '../../../store/Request';
import { RequestProps } from '../../../Type/Request';
import { CONVERSATION_MUTATION, MESSAGE_MUTATION } from '../../GraphQL/ConversationMutation';
import { useMutation } from '@apollo/client';
import { userDataStore } from '../../../store/UserData';
import { useQueryMessagesByConversation, useQueryUserConversations } from '../../Hook/Query';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useFileHandler } from '../../Hook/useFileHandler';
import { messageDataStore } from '../../../store/message';
import { MessageProps, MessageStoreProps } from '../../../Type/message';
import { REQUEST_SUBSCRIPTION } from '../../GraphQL/Subscription';

type useQueryUserConversationsProps = {
	loading: boolean;
	data: { user: { requestsConversations: RequestProps[] } };
	refetch: () => void;
	fetchMore: (options: { variables: { offset: number } }) => void;
};

function MyConversation() {

	//state
	const [messageValue, setMessageValue] = useState('');
	const [messages, setMessages] = useState<string[]>([]);
	const [requestConversation, setRequestConversation] = useState<RequestProps[] | null>(null);
	const [selectedRequest, setSelectedRequest] = useState<RequestProps | null>(null);

	//ref offset request
	const offsetRef = useRef(0);

	//store
	const id = userDataStore((state) => state.id);
	const request = requestDataStore((state) => state.request);
	const resetRequest = requestDataStore((state) => state.resetRequest);
	const [messageStore, setMessageStore] = messageDataStore((state) => [state.messages, state.setMessageStore]);

	//mutation
	const [conversation, { error: createConversationError }] = useMutation(CONVERSATION_MUTATION);
	const [message, { error: createMessageError }] = useMutation(MESSAGE_MUTATION);

	//query
	const { loading, data, fetchMore } = useQueryUserConversations(0, 3) as unknown as useQueryUserConversationsProps;
	const conversationId = selectedRequest?.conversation[0].id ?? 0;
	const  { subscribeToMore, messageData } = useQueryMessagesByConversation(id, conversationId, 0, 10);

	// file upload
	const { fileError, file, setFile, setUrlFile, urlFile, handleFileChange } = useFileHandler();

	// useEffect to update the message store
	useEffect(() => {
		if (messageData) {
			console.log('messageData', messageData);
			const messages: MessageProps[] = messageData.user.messages;
			console.log('messages', messages);

			messageDataStore.setState(prevState => {
				const newMessages = messages.filter(
					(newMessage) => !prevState.messages.find((existingMessage) => existingMessage.id === newMessage.id)
				);
	
				return {
					...prevState,
					messages: [...prevState.messages, ...newMessages]
				};
			});

			//setMessageStore(messageData.user.messages);
		}
	}, [messageData]);

	// useEffect to subscribe to new requests
	useEffect(() => {
		
		if (subscribeToMore) {
		
			subscribeToMore({
				document: REQUEST_SUBSCRIPTION,
				variables: { request_ids: jobs.map(job => job.job_id).filter(id => id != null) },
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				updateQuery: (prev: RequestProps , { subscriptionData }: { subscriptionData: any }) => {
					

					if (!subscriptionData.data) return prev;
					const  requestAdded  = subscriptionData.data.requestAdded[0];
					
					RangeFilter([requestAdded], true);
					
				},
			});
		
		}
	}, [ subscribeToMore]);

	// useEffect to update the data to the requests state
	useEffect(() => {
		if (data && data.user) {
			console.log('data', data);

			const requestsConversations = data.user.requestsConversations;
			setRequestConversation(requestsConversations); // Fix: Pass an array as the argument
			offsetRef.current = requestsConversations.length;
		}
	}, [data]);

	// useEffect to update the new request selection to the state
	useEffect(() => {
		if (request.id > 0 && !loading) {
			setRequestConversation(prevState => [request, ...(prevState || [])]);
		}
	}, [request, loading]);

	// cleane the request store if the component is unmounted
	useEffect(() => {
		return () => {
			resetRequest();
		};
	}, []);

	// Function to send message and create conversation
	const handleMessageSubmit = (event: React.FormEvent<HTMLFormElement>, conversationId: number) => {
		event.preventDefault();
		// create conversation 
		if (request.id > 0) {
			console.log('coucou');

			conversation({
				variables: {
					id: id,
					input: {
						user_1: id,
						user_2: request.user_id,
						request_id: request.id,
					}
				}
			}).then((response) => {
				console.log('response', response);
				if (response.data.createConversation) {
					const conversation = response.data.createConversation;
					// put the conversation data in the request
					setRequestConversation((prevState) =>
						prevState?.map(item =>
							item.id === request.id
								? {
									...item, conversation: [{
										id: conversation.id,
										user_1: conversation.user_1,
										user_2: conversation.user_2
									}]
								}
								: item
						) || null // Fix: Add a fallback value of null
					);
				}
				resetRequest();

			});

			if (createConversationError) {
				console.log('Error creating conversation', createConversationError.message);

				throw new Error('Error creating conversation',);
			}
		}
		setMessages([...(messages || []), messageValue]);

		// map file to send to graphql
		const sendFile = file.map(file => ({
			file,
		})); 
		// create message
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
			}).then((response) => {
				if (response.data.createMessage) {
					console.log('response', response);
					setMessageValue('');
				}
			});
		}
		if (createMessageError) {
			console.log('Error creating message', createMessageError.message);
			throw new Error('Error creating message');
		}
	};

	// Function to load more requests with infinite scroll
	function addRequest() {
		fetchMore({
			variables: {
				offset: offsetRef.current, // Next offset
			},
		}).then((fetchMoreResult: { data: { user: { requestsConversations: RequestProps[] } } }) => {
			console.log('fetchMoreResult', fetchMoreResult);
			const request = fetchMoreResult.data.user.requestsConversations;

			if (!fetchMoreResult.data) return;
			if (request) {
				setRequestConversation((prevRequests: RequestProps[] | null) => [...(prevRequests || []), ...request]);
			}
			offsetRef.current = offsetRef.current + request.length;
		});
	}
	return (
		<div className="my-conversation-container">
			<div className="my-client-request">Demandes clients
				<InfiniteScroll
					dataLength={requestConversation?.length || 0}
					next={() => {
						addRequest();
					}}
					hasMore={true}
					loader={<h4>Loading...</h4>}
				>
					{requestConversation?.map((request) => (
						<div className="request-details" key={request.id} onClick={() => setSelectedRequest(request)} >
							<h1>{request.title}</h1>
							<p>{request.created_at}</p>
							<p>{request.first_name}</p>
							<p>{request.last_name}</p>
							<p>{request.city}</p>
							<h2>{request.job}</h2>
							<p>{request.message}</p>
							<div>
								{request.media.map((media) => (
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
								.filter((message: MessageProps) => message.conversation_id === selectedRequest.conversation[0].id)
								.map((message: MessageProps, index) => (
									<div className="message" key={index}>{message.content}</div>
								))
						}
						<form onSubmit={(event) => handleMessageSubmit(event, selectedRequest.conversation[0].id)}>
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