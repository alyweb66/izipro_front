import { useEffect, useRef, useState } from 'react';
import { userDataStore } from '../../../store/UserData';
import { requestDataStore } from '../../../store/Request';
import './clientRequest.scss';
import { useQueryRequestByJob } from '../../Hook/Query';
import { RequestProps } from '../../../Type/Request';
import { USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION } from '../../GraphQL/UserMutations';
import { useMutation} from '@apollo/client';
import InfiniteScroll from 'react-infinite-scroll-component';
// @ts-expect-error turf is not typed
import * as turf from '@turf/turf';
import { REQUEST_SUBSCRIPTION } from '../../GraphQL/Subscription';

function ClientRequest ({onDetailsClick}: {onDetailsClick: () => void}) {
	
	// State
	const [clientRequests, setClientRequests] = useState<RequestProps[] | null>(null);

	// Create a ref for the scroll position
	const offsetRef = useRef(0);

	//store
	const id = userDataStore((state) => state.id);
	const jobs = userDataStore((state) => state.jobs);
	const lng = userDataStore((state) => state.lng);
	const lat = userDataStore((state) => state.lat);
	const settings = userDataStore((state) => state.settings);
	const setRequest = requestDataStore((state) => state.setRequest);

	// mutation
	const [hideRequest, {error: hideRequestError}] = useMutation(USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION);

	// Function to filter the requests by the user's location and the request's location
	function RangeFilter(requests: RequestProps[], fromSubscribeToMore = false) {
		// If the function is called from the subscription, we need to add the new request to the top of list
		if (fromSubscribeToMore) {
			const filteredRequests = requests.filter((request: RequestProps) => {
				// Define the two points
				const requestPoint = turf.point([request.lng, request.lat]);
				const userPoint = turf.point([lng, lat]);
				// Calculate the distance in kilometers (default)
				const distance = turf.distance(requestPoint, userPoint);

				return (
					// Check if the request is in the user's range
					(distance < request.range / 1000 || request.range === 0) &&
					// Check if the request is in the user's settings range
					(distance < settings[0].range / 1000 || settings[0].range === 0) &&
					// Check if the user is already in conversation with the request
					(!request.conversation[0] || (request.conversation[0].user_1 !== id && request.conversation[0].user_2 !== id))
				);
			});

			setClientRequests((prevState) => [...filteredRequests, ...(prevState || [])]);
			offsetRef.current = offsetRef.current + filteredRequests.length;

		} else {
			// If the function is called from the query, we need to add the new requests to the bottom of the list
			setClientRequests((prevState) => [
				...prevState || [],
				...requests.filter((request: RequestProps) => {
					// Define the two points
					const requestPoint = turf.point([request.lng, request.lat]);
					const userPoint = turf.point([lng, lat]);
					// Calculate the distance in kilometers (default)
					const distance = turf.distance(requestPoint, userPoint);
	
					return (
						(distance < request.range / 1000 || request.range === 0) &&
				(distance < settings[0].range / 1000 || settings[0].range === 0) &&
				// Check if the user is already in conversation with the request
				(!request.conversation[0] || (request.conversation[0].user_1 !== id && request.conversation[0].user_2 !== id))
					);
				})
			]);
		}
	}

	// get requests by job
	const {getRequestsByJob, subscribeToMore, fetchMore} = useQueryRequestByJob(jobs, 0, 3);

	// useEffect to filter the requests by the user's location and the request's location
	useEffect(() => {
		if (getRequestsByJob) {
	
			// Filter the requests
			RangeFilter(getRequestsByJob.requestsByJob);
			offsetRef.current += getRequestsByJob.requestsByJob.length;
	
		}
	}, [getRequestsByJob, settings]);

	// useEffect to subscribe to new requests
	useEffect(() => {
		
		if (subscribeToMore) {
		
			subscribeToMore({
				document: REQUEST_SUBSCRIPTION,
				variables: { ids: jobs.map(job => job.job_id).filter(id => id != null) },
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				updateQuery: (prev: RequestProps , { subscriptionData }: { subscriptionData: any }) => {
					

					if (!subscriptionData.data) return prev;
					const  requestAdded  = subscriptionData.data.requestAdded[0];
					
					RangeFilter([requestAdded], true);
					
				},
			});
		
		}
	}, [ subscribeToMore]);

	// Function to load more requests with infinite scroll
	function addRequest() {
		fetchMore({
			variables: {
				offset: offsetRef.current, // Next offset
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		}).then(fetchMoreResult => {
			const data = fetchMoreResult.data; // Access the 'data' property
			if (data) {
				RangeFilter(data.requestsByJob); // Access the 'requestsByJob' property
				offsetRef.current = offsetRef.current + data.requestsByJob.length;
			}
		});
		
	}
	
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
			{!clientRequests?.length && <p>Vous n&apos;avez pas de demande</p>}
			{clientRequests && (
				<div> 
					<InfiniteScroll
						dataLength={clientRequests.length}
						next={ () => {
							addRequest();
						}}
						hasMore={true}
						loader={<h4>Loading...</h4>}
					>
						{clientRequests.map((request) => (
							<div className="request-details" key={request.id} onClick={() => {onDetailsClick(); setRequest(request);}}>
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
								<button type='button' onClick={(event) => {handleHideRequest(event, request.id);}}>Delete</button>
							</div>
						))}
					</InfiniteScroll>
				</div>
			)}
		</div>
	);
}

export default ClientRequest;