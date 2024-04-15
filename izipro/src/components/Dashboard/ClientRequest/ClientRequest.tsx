import { useEffect, useState } from 'react';
import { userDataStore } from '../../../store/UserData';
import './clientRequest.scss';
import { useQueryRequestByJob } from '../../Hook/Query';
import { RequestProps } from '../../../Type/Request';
import { USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION } from '../../GraphQL/UserMutations';
import { useMutation } from '@apollo/client';
// @ts-expect-error turf is not typed
import * as turf from '@turf/turf';

function ClientRequest () {
	
	// State
	const [error, setError] = useState<string | null>(null);
	const [clientRequests, setClientRequests] = useState<RequestProps[] | null>(null);
	//store
	const id = userDataStore((state) => state.id);
	const jobs = userDataStore((state) => state.jobs);
	const lng = userDataStore((state) => state.lng);
	const lat = userDataStore((state) => state.lat);
	const settings = userDataStore((state) => state.settings);

	// mutation
	const [hideRequest, {error: hideRequestError}] = useMutation(USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION);

	
	const offset = 0;
	const limit = 10;
	// get requests by job
	const getRequestsByJob = useQueryRequestByJob(jobs, offset, limit);

	// useEffect to filter the requests by the user's location and the request's location
	useEffect(() => {
		if (getRequestsByJob) {
			
			
			setClientRequests(
				getRequestsByJob.requestsByJob.filter((request: RequestProps) => {
					// Define the two points
					const requestPoint = turf.point([request.lng, request.lat]);
					const userPoint = turf.point([lng, lat]);
					// Calculate the distance in kilometers (default)
					const distance = turf.distance(requestPoint, userPoint);
					console.log('distance', distance);
					console.log('request.range', request.range);
					
					// If the distance is greater than the request range or the user range
					return (
						(distance < request.range / 1000 || request.range === 0) &&
						(distance < settings[0].range / 1000 || settings[0].range === 0)
					);
					
				})
			);
				
		}
		//setClientRequests(getRequestsByJob.requestsByJob);
		
	}, [getRequestsByJob, settings]);
	console.log('getRequestsByJob', getRequestsByJob);
	
	console.log('clientRequests', clientRequests);
	
	// Function to hide a request
	const handleHideRequest = (event: React.MouseEvent<HTMLButtonElement>, requestId: number) => {
		event.preventDefault();
		hideRequest({
			variables: {
				input: {
					user_id: id,
					request_id: requestId
				}
			}
		}).then((response) => {

			if (response.data.createHiddenClientRequest) {
				setClientRequests((prevClientRequests) => {
					if (prevClientRequests) {
						return prevClientRequests.filter((request) => request.id !== requestId);
					}
					return null;
				});
			}
		});
		if (hideRequestError) {
			throw new Error('Error while hiding request');
		}
	};


	return (
		<div className="my_request-container">
			{!clientRequests && <p>Vous n&apos;avez pas de demande</p>}
			{clientRequests && (
				<div> 
					{clientRequests.map((request) => (
						<div key={request.id}>
							{/* Add a key prop */}
							<h1>{request.title}</h1>
							<p>{request.created_at}</p>
							<h2>{request.job}</h2>
							<p>{request.message}</p>
							<div>
								{request.media.map((media, index) => (
									<img key={index} src={media.url} alt={media.name} />
								))}
							</div>
							<button type='button' onClick={(event) => {handleHideRequest(event, request.id);}}>Delete</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default ClientRequest;