import { useEffect, useRef, useState } from 'react';
import { userDataStore } from '../../../store/UserData';
import { useMutation } from '@apollo/client';
import { RequestProps } from '../../../Type/Request';
import './MyRequest.scss';
import { DELETE_REQUEST_MUTATION } from '../../GraphQL/RequestMutation';
import { useQueryUserRequests } from '../../Hook/Query';


function MyRequest() {
	//state
	const [requests, setRequests] = useState<RequestProps[]>([]);
	const [offset, setOffset] = useState(0);
	const [loading, setLoading] = useState(false);
	const scrollPosition = useRef(0);
	const limit = 4;

	// store
	const id = userDataStore((state) => state.id);

	//mutation
	const [ deleteRequest, {error: deleteRequestError} ] = useMutation(DELETE_REQUEST_MUTATION);

	// Query to get the user requests
	const {getUserRequestsData, fetchMore} = useQueryUserRequests(id, offset, limit);
	console.log('getUserRequestsData', getUserRequestsData);

	useEffect(() => {
		// Restore scroll position
		window.scrollTo(0, scrollPosition.current);
	}, [requests]);

	// useEffect to update the requests state
	useEffect(() => {
		if (getUserRequestsData) {
			// Save scroll position
			scrollPosition.current = window.scrollY;
			// If offset is 0, it's the first query, so just replace the queries
			if (offset === 0) {
				setRequests(getUserRequestsData.user.requests);
			} else {
			
				setRequests(prevRequests => [...prevRequests, ...getUserRequestsData.user.requests]);
			}
			
		}

	}, [getUserRequestsData]);

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
	
	// Function to handle scroll event
	const handleScroll = () => {
		if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
		// Reached the bottom of the page
			if (!loading) {
				setLoading(true);
				fetchMore({
					variables: {
						offset: requests.length // Next offset
					},
					updateQuery: (prev, { fetchMoreResult }) => {
						if (!fetchMoreResult) return prev;
						setOffset(prevOffset => prevOffset + fetchMoreResult.user.requests.length); // Update offset
						setLoading(false);
					}
				});
			}
		}
	};
	// useEffect to add event listener to handle scroll event
	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, [loading]);

  
	return (
		<div className="my_request-container">
			{!requests[0] && <p>Vous n&apos;avez pas de demande</p>}
			{getUserRequestsData && (
				<div> 
					{requests.map((request, index) => (
						<div key={index}>
							<h1>{request.title}</h1>
							<p>{request.created_at}</p>
							<h2>{request.job}</h2>
							<p>{request.message}</p>
							<div>
								{request.media.map((image, index) => (
									<img key={index} src={image.url} alt={image.name} />
								))}
							</div>
							<button type='button' onClick={(event) => {handleDeleteRequest(event, request.id, request.media.map(image => image.name));}}>Supprimer la demande</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default MyRequest;