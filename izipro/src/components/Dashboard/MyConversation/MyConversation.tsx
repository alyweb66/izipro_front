import { useEffect, useRef, useState } from 'react';
import './MyConversation.scss';
import { requestDataStore } from '../../../store/Request';
import { RequestProps } from '../../../Type/Request';
import { CONVERSATION_MUTATION } from '../../GraphQL/ConversationMutation';
import { useMutation } from '@apollo/client';
import { userDataStore } from '../../../store/UserData';
import { useQueryUserConversations } from '../../Hook/Query';
import InfiniteScroll from 'react-infinite-scroll-component';

type useQueryUserConversationsProps = {
	loading: boolean;
	data: {user:{requestsConversations:RequestProps[]}};
	refetch: () => void;
	fetchMore: (options: {variables: {offset: number}}) => void;
};

function MyConversation() {

	//state
	const [messageValue, setMessageValue] = useState('');
	const [messages, setMessages] = useState<string[]>([]);
	const [requestConversation, setRequestConversation] = useState<RequestProps[] | null>(null);
	const offsetRef = useRef(0);
	console.log('requestConversation', requestConversation);

	//store
	const id = userDataStore((state) => state.id);
	const request = requestDataStore((state) => state.request);
	const resetRequest = requestDataStore((state) => state.resetRequest);
	console.log('request', request);

	//mutation
	const [conversation, {error: createConversationError}] = useMutation(CONVERSATION_MUTATION);

	//query
	const {loading, data, fetchMore} = useQueryUserConversations(0, 3) as unknown as useQueryUserConversationsProps;

	// useEffect to update the data to the requests state
	useEffect(() => {
		if (data && data.user) {
			console.log('data', data);
			
			const requestsConversations = data.user.requestsConversations;
			setRequestConversation(requestsConversations); // Fix: Pass an array as the argument
			offsetRef.current = requestsConversations.length;
		}
	}, [data]);

	// useEffect to update the request selection to the state
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

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		
		if (request.id > 0) {
			console.log('coucou');

			conversation({
				variables: {
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
								? { ...item, conversation: [{
									id: conversation.id, 
									user_1: conversation.user_1,
									user_2: conversation.user_2 }] } 
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
		
	};

	// Function to load more requests with infinite scroll
	function addRequest() {
		fetchMore({
			variables: {
				offset: offsetRef.current // Next offset

			},
			updateQuery: (prevRequests: RequestProps, { fetchMoreResult }) => {
				console.log('fetchMoreResult', fetchMoreResult);
				const request = fetchMoreResult.user.requestsConversations;
				
				if (!fetchMoreResult) return prevRequests;
				if (request) {
					setRequestConversation(prevRequests => [...(prevRequests || []), ...request]);
				}
				offsetRef.current = offsetRef.current + request.length;
			},
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
						<div className="request-details" key={request.id} >
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
			
		
			<div className="my-message">Mes messages
				{messages && 
                messages.map((message, index) => (<div className="message" key={index}>{message}</div>))}
				<form onSubmit={handleSubmit}>
					<input
						type="text"
						value={messageValue}
						onChange={(e) => setMessageValue(e.target.value)}
						placeholder="Type your message here"
					/>
					<button type="submit">Send</button>
				</form>
			</div>
			
		
		</div>
	);
}

export default MyConversation;