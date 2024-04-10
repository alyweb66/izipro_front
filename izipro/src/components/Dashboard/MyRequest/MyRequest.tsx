import { useEffect, useState } from 'react';
import { userDataStore } from '../../../store/UserData';
import { useMutation, useQuery } from '@apollo/client';
import { GET_USER_REQUESTS } from '../../GraphQL/RequestQueries';
import { Request } from '../../../Type/Request';
import './MyRequest.scss';
import { DELETE_REQUEST_MUTATION } from '../../GraphQL/RequestMutation';


function MyRequest() {
	//state
	const [requests, setRequests] = useState<Request[]>([]);

	// store
	const id = userDataStore((state) => state.id);
	console.log(id);
	

	//mutation
	const [ deleteRequest, {error: deleteRequestError} ] = useMutation(DELETE_REQUEST_MUTATION);

	// Query to get the user requests
	const { error: getUserRequestsError, data: getUserRequestsData } = useQuery(GET_USER_REQUESTS, {
		variables: { requestsId: id },
		fetchPolicy: 'network-only'
	});
	

	// useEffect to update the requests
	useEffect(() => {
		
		if (getUserRequestsData) {
			setRequests(getUserRequestsData.user.requests);

		}


	}, [getUserRequestsData]);

	if (getUserRequestsError) {
		throw new Error('Error while fetching user requests');
	}
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
				<div> 
					{requests.map((request, index) => (
						<div key={index}>
							{/* Add a key prop */}
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