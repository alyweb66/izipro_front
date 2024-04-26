import { useEffect, useRef, useState } from 'react';
import { userConversation, userDataStore } from '../../../store/UserData';
import { useMutation } from '@apollo/client';
import { RequestProps } from '../../../Type/Request';
import './MyRequest.scss';
import { DELETE_REQUEST_MUTATION } from '../../GraphQL/RequestMutation';
import { useQueryMyMessagesByConversation, useQueryUserRequests, useQueryUsersConversation } from '../../Hook/Query';
import InfiniteScroll from 'react-infinite-scroll-component';
import { myRequestStore } from '../../../store/Request';
import { UserDataProps } from '../../../Type/User';
import { myMessageDataStore } from '../../../store/message';
import { MessageStoreProps } from '../../../Type/message';

function MyRequest() {

	//state
	//const [requests, setRequests] = useState<RequestProps[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState<RequestProps | null>(null);
	const [userIds, setUserIds] = useState<number[]>([]);
	const [conversationId, setConversationId] = useState<number>(0);

	// Create a state for the scroll position
	const offsetRef = useRef(0);
	const limit = 2;
	
	// store
	const id = userDataStore((state) => state.id);
	const [myRequestsStore, setMyRequestsStore] = myRequestStore((state) => [state.requests, state.setMyRequestStore]);
	const [userConv, setUserConv] = userConversation((state) => [state.users, state.setUsers]);
	const [messageStore, setMessageStore] = myMessageDataStore((state) => [state.messages, state.setMessageStore]);

	//useRef
	const userOffsetRef = useRef(0);

	//mutation
	const [ deleteRequest, {error: deleteRequestError} ] = useMutation(DELETE_REQUEST_MUTATION);
	
	// Query to get the user requests
	const {getUserRequestsData, fetchMore} = useQueryUserRequests(id, 0, limit);
	const {usersConversationData } = useQueryUsersConversation( userIds ,0 , limit);
	console.log('conversationIdbeforequery', conversationId);
	
	const { subscribeToMore, messageData } = useQueryMyMessagesByConversation(conversationId, 0, 10);

	console.log('myRequest', myRequestsStore);
	
	// useEffect to update the requests state
	useEffect(() => {
		if (getUserRequestsData) {
			// If offset is 0, it's the first query, so just replace the queries
			if (offsetRef.current === 0) {
				setMyRequestsStore(getUserRequestsData.user.requests);
			} 
		}
	}, [getUserRequestsData]);
	
	useEffect(() => {
		if (messageData) {
			console.log('messageData', messageData.messages);
			setMessageStore(messageData.messages);
		}
	}, [messageData]);

	// useEffect to update the user conversation state
	useEffect(() => {
		if (usersConversationData) {
			console.log('usersConversationData', usersConversationData);
			
			// If offset is 0, it's the first query, so just replace the queries
			if (userOffsetRef.current === 0) {
				setUserConv(usersConversationData.users);
			} 
		}


	}, [usersConversationData]);

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

	const handleConversation = (event: React.MouseEvent<HTMLDivElement>, request: RequestProps) => {
		event.preventDefault();
		console.log('request', request);
		
		const ids = request?.conversation.map(conversation => {
			return conversation.user_1 !== id ? conversation.user_1 : conversation.user_2;
		});

		setUserIds(ids || []); // Provide a default value of an empty array
		console.log(ids);
	};
	console.log('userIds', userIds);
	console.log('userConv', userConv);

	const handleMessageConversation = (event: React.MouseEvent<HTMLDivElement>, userId: number) => {
		event.preventDefault();
		console.log('selectedRequest', selectedRequest);
		console.log('id', id);
		
		console.log('userId', userId);
		const conversationId = selectedRequest?.conversation.find(conversation => 
			(conversation.user_1 === id || conversation.user_2 === id) && 
			(conversation.user_1 === userId || conversation.user_2 === userId)
		);
		console.log('conversationId', conversationId);
		
		setConversationId(conversationId?.id || 0);

	};


	return (
		<div className="my_request-container">
			<div className="request-list">
				{!myRequestsStore[0] && <p>Vous n&apos;avez pas de demande</p>}
				{getUserRequestsData && (
					<div > 
						<InfiniteScroll
							dataLength={myRequestsStore.length}
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
							{myRequestsStore.map((request) => (
								<div key={request.id} onClick={(event) => [handleConversation(event, request), setSelectedRequest(request)]}>
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
									<button type='button' onClick={(event) => {handleDeleteRequest(event, request.id, request.media.map(image => image.name));}}>Supprimer la demande</button>
								</div>
							))}
						</InfiniteScroll>
				
					</div>
				)}
			</div>
			<div className="answer-list">
				{userConv?.length === 0 && <p>Vous n&apos;avez pas de conversation</p>}
				{userConv && userConv?.map((user: UserDataProps ) => (
					<div key={user.id} onClick={(event) => {handleMessageConversation(event, user.id);}}>
						<h1>user</h1>
						<p>{user.denomination}</p>
						<p>{user.city}</p>
					</div>
				))}

			</div>
			<div className="message-list">
				<h2>Messages for {selectedRequest?.title}</h2>
				{Array.isArray(messageStore) &&
							messageStore
								.filter((message) => message.conversation_id === selectedRequest?.conversation[0].id)
								.map((message: MessageStoreProps, index) => (
									<div className={`${message.user_id}`} key={index}>{message.content}</div>
								))
				}

			</div>
		</div>
	);
}

export default MyRequest;