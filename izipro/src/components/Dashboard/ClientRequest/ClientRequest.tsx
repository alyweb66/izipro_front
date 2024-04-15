import { useEffect, useState } from 'react';
import { userDataStore } from '../../../store/UserData';
import './clientRequest.scss';
import { useQueryRequestByJob } from '../../Hook/Query';
import { RequestProps } from '../../../Type/Request';
import { USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION } from '../../GraphQL/UserMutations';
import { useMutation, useSubscription } from '@apollo/client';
// @ts-expect-error turf is not typed
import * as turf from '@turf/turf';
import { REQUEST_SUBSCRIPTION } from '../../GraphQL/Subscription';

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

	//subscription
	/* 	const {data} = useSubscription(REQUEST_SUBSCRIPTION, {
		variables: { ids: jobs.map(job => job.job_id).filter(id => id != null) },
	}); */

	
	const offset = 0;
	const limit = 10;
	// get requests by job
	const {getRequestsByJob, subscribeToMore} = useQueryRequestByJob(jobs, offset, limit);

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

	useEffect(() => {
		console.log(subscribeToMore);
		
		/* if (data && data.requestAdded) {
			console.log('data', data);
			
			// Handle the new request
			// For example, you can add it to your local state
			setClientRequests(prevRequests => [...prevRequests, data.requestAdded]);
		} */
		if (subscribeToMore) {
			console.log('subscribeToMore', subscribeToMore);
			
			subscribeToMore({
				document: REQUEST_SUBSCRIPTION,
				//variables: { ids: jobs.map(job => job.job_id).filter(id => id != null) },
				updateQuery: (prev, { subscriptionData }) => {
					console.log('subscriptionData', subscriptionData);

					if (!subscriptionData.data) return prev;
					const  requestAdded  = subscriptionData.data.requestAdded[0];
					
					// Define the two points
					const requestPoint = turf.point([requestAdded.lng, requestAdded.lat]);
					const userPoint = turf.point([lng, lat]);
					// Calculate the distance in kilometers (default)
					const distance = turf.distance(requestPoint, userPoint);
					console.log('distance', distance);
					console.log('request.range', requestAdded.range);

					// If the distance is greater than the request range or the user range
					if ((distance < requestAdded.range / 1000 || requestAdded.range === 0) &&
						(distance < settings[0].range / 1000 || settings[0].range === 0)) {
						// Your code here
						const newRequest = requestAdded;
						
						// Add the new request to the list of requests
						setClientRequests((prev) => {
							console.log('prev', prev);
							
							if (prev) {
								return [...prev, newRequest];
							}
							return null;
						});
						//return { ...prev, requestsByJob: [...prev.requestsByJob, newRequest] };
					}	
					
				},
			});
		
		}
	}, [ subscribeToMore]);

	/* 	useEffect(() => {
		if (subscribeToMore) {
			console.log('subscribeToMore', subscribeToMore);
			
			subscribeToMore({
				document: REQUEST_SUBSCRIPTION,
				variables: { ids: jobs.map(job => job.job_id) },
				updateQuery: (prev, { subscriptionData }) => {
					console.log('subscriptionData', subscriptionData);

					if (!subscriptionData.data) return prev;
					// Define the two points
					const requestPoint = turf.point([subscriptionData.lng, subscriptionData.lat]);
					const userPoint = turf.point([lng, lat]);
					// Calculate the distance in kilometers (default)
					const distance = turf.distance(requestPoint, userPoint);
					console.log('distance', distance);
					console.log('request.range', subscriptionData.range);

					// If the distance is greater than the request range or the user range
					if ((distance < subscriptionData.range / 1000 || subscriptionData.range === 0) &&
						(distance < settings[0].range / 1000 || settings[0].range === 0)) {
						// Your code here
						const newRequest = subscriptionData.data.requestAdded;
						
						// Add the new request to the list of requests
						return { ...prev, requestsByJob: [...prev.requestsByJob, newRequest] };
					
					}
				},
			});
		}
	}, [subscribeToMore]); */
	
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