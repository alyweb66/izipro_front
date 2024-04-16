import { useEffect, useRef, useState } from 'react';
import { userDataStore } from '../../../store/UserData';
import { useMutation } from '@apollo/client';
import { RequestProps } from '../../../Type/Request';
import './MyRequest.scss';
import { DELETE_REQUEST_MUTATION } from '../../GraphQL/RequestMutation';
import { useQueryUserRequests } from '../../Hook/Query';
import InfiniteScroll from 'react-infinite-scroll-component';

function MyRequest() {

	//state
	const [requests, setRequests] = useState<RequestProps[]>([]);
	const [loading, setLoading] = useState(false);
	// Create a state for the scroll position
	//const [offset, setOffset] = useState(0);
	const offsetRef = useRef(0);
	const limit = 2;
	
	// store
	const id = userDataStore((state) => state.id);

	//mutation
	const [ deleteRequest, {error: deleteRequestError} ] = useMutation(DELETE_REQUEST_MUTATION);

	// Query to get the user requests
	const {getUserRequestsData, fetchMore} = useQueryUserRequests(id, 0, limit);

	
	// useEffect to update the requests state
	useEffect(() => {
		if (getUserRequestsData) {
			// If offset is 0, it's the first query, so just replace the queries
			if (offsetRef.current === 0) {
				setRequests(getUserRequestsData.user.requests);
			} 
		}
	}, [getUserRequestsData]);
	// Restore scroll position after the component has been rendered

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
				setRequests(requests.filter(request => request.id !== requestId));
			}
		});

		if (deleteRequestError) {
			throw new Error('Error while deleting request');
		}
		
	};

	return (
		<div className="my_request-container">
			{!requests[0] && <p>Vous n&apos;avez pas de demande</p>}
			{getUserRequestsData && (
				<div > 
					<InfiniteScroll
						dataLength={requests.length}
						next={ () => {
							if (!loading) {
								setLoading(true); // Save scroll position before loading more data
								fetchMore({
									variables: {
										offset: requests.length // Next offset
									},
									updateQuery: (prev, { fetchMoreResult }) => {
										if (!fetchMoreResult) return prev;
										setRequests(prevRequests => [...(prevRequests || []), ...fetchMoreResult.user.requests]);
										offsetRef.current = offsetRef.current + fetchMoreResult.user.requests.length;
										//setOffset(prevOffset => prevOffset + fetchMoreResult.user.requests.length); // Update offset
										setLoading(false);
										
									}
								});
							}
						}}
						hasMore={true}
						loader={<h4>Loading...</h4>}
					>
						{requests.map((request) => (
							<div key={request.id}>
								<h1>{request.title}</h1>
								<p>{request.created_at}</p>
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
	);
}

export default MyRequest;