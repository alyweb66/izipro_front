import React, { useEffect, useRef, useState } from 'react';
import { userDataStore } from '../../../store/UserData';
import { requestDataStore, clientRequestStore } from '../../../store/Request';
import { subscriptionDataStore } from '../../../store/subscription';
import './clientRequest.scss';
import { useQueryRequestByJob } from '../../Hook/Query';
import { RequestProps } from '../../../Type/Request';
import { USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION } from '../../GraphQL/UserMutations';
import { useMutation} from '@apollo/client';
import InfiniteScroll from 'react-infinite-scroll-component';
// @ts-expect-error turf is not typed
import * as turf from '@turf/turf';
import { REQUEST_SUBSCRIPTION } from '../../GraphQL/Subscription';
import { SUBSCRIPTION_MUTATION } from '../../GraphQL/SubscriptionMutations';
import { SubscriptionProps } from '../../../Type/Subscription';
import pdfLogo from '/logo/pdf-icon.svg';
import { useModal, ImageModal } from '../../Hook/ImageModal';
import { FaTrashAlt } from 'react-icons/fa';
import Spinner from '../../Hook/Spinner';


type ExpandedState = {
	[key: number]: boolean;
};

function ClientRequest ({onDetailsClick}: {onDetailsClick: () => void}) {

	// ImageModal Hook
	const { modalIsOpen, openModal, closeModal, selectedImage, nextImage, previousImage } = useModal();
	
	// State
	const [isMessageExpanded, setIsMessageExpanded] = useState({});

	// Create a ref for the scroll position
	const offsetRef = useRef(0);
	const idRef = useRef<number>(0);

	//store
	const id = userDataStore((state) => state.id);
	const jobs = userDataStore((state) => state.jobs);
	const lng = userDataStore((state) => state.lng);
	const lat = userDataStore((state) => state.lat);
	const settings = userDataStore((state) => state.settings);
	const setRequest = requestDataStore((state) => state.setRequest);
	const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);
	const [clientRequestsStore, setClientRequestsStore] = clientRequestStore((state) => [state.requests, state.setClientRequestStore]);

	// mutation
	const [hideRequest, {loading: hiddenLoading, error: hideRequestError}] = useMutation(USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION);
	const [subscriptionMutation, {loading: subscribeLoading, error: subscriptionError}] = useMutation(SUBSCRIPTION_MUTATION);

	// get requests by job
	const {loading: requestJobLoading, getRequestsByJob, subscribeToMore, fetchMore} = useQueryRequestByJob(jobs, 0, 10);
	console.log('clientRequestsStore', clientRequestsStore);

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
					(distance < settings[0].range / 1000 || settings[0].range === 0)  &&
					// Check if the user is already in conversation with the request
					(request.conversation === null || request.conversation === undefined || 
						!request.conversation.some(conversation => 
							(conversation.user_1 !== null && conversation.user_2 !== null) && 
							(conversation.user_1 === id || conversation.user_2 === id)
						)
					)
				);
			});

			// Check if the request is already in the list
			const newRequests = filteredRequests.filter(request => 
				!clientRequestsStore?.some(prevRequest => prevRequest.id === request.id)
			);
			if (newRequests) {
				setClientRequestsStore([...newRequests, ...(clientRequestsStore || [])]);
			}
			offsetRef.current = offsetRef.current + filteredRequests.length;

		} else {
			// If the function is called from the query, we need to add the new requests to the bottom of the list
			requests.filter((request: RequestProps) => {
				// Define the two points
				const requestPoint = turf.point([request.lng, request.lat]);
				const userPoint = turf.point([lng, lat]);
				// Calculate the distance in kilometers (default)
				const distance = turf.distance(requestPoint, userPoint);

				return (
					(distance < request.range / 1000 || request.range === 0) &&
						(distance < settings[0].range / 1000 || settings[0].range === 0) &&
						// Check if the user is already in conversation with the request
						(request.conversation === null || request.conversation === undefined || 
							!request.conversation.some(conversation => 
								(conversation.user_1 !== null && conversation.user_2 !== null) && 
						(conversation.user_1 === id || conversation.user_2 === id)
							)
						)
				);
			});

			if (requests) {
				setClientRequestsStore([ ...requests, ...(clientRequestsStore || []),]);
			}
			
		}
	}

	// Function to load more requests with infinite scroll
	function addRequest() {
		fetchMore({
			variables: {
				offset: offsetRef.current, // Next offset
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		}).then(fetchMoreResult => {
			const data = fetchMoreResult.data.requestsByJob; // Access the 'data' property

			//get all request who are not in the store
			const newRequests = data.filter((request: RequestProps) => clientRequestsStore?.every(prevRequest => prevRequest.id !== request.id));
			console.log('newRequests', newRequests);
			
			if (newRequests.length > 0) {
				RangeFilter(newRequests); // Access the 'requestsByJob' property
				offsetRef.current = offsetRef.current + data.length;

			}
		});
		
	}

	// add jobs to setSubscriptionJob if there are not already in, or have the same id
	useEffect(() => {
		
		// If there are subscriptions, check if the jobs are in the subscription
		if (subscriptionStore.some(subscription => subscription.subscriber === 'jobRequest')) {
			
			subscriptionStore.forEach((subscription) => {
				if (subscription.subscriber === 'jobRequest' && Array.isArray(subscription.subscriber_id)) {
					const jobIds = jobs.map((job) => job.job_id);
					const subscriptionIds = new Set(subscription.subscriber_id);

					// Check if all jobs are in the subscription
					const allJobsInSubscription = jobIds.every((id) => subscriptionIds.has(id));
					// Check if all subscriptions are in the jobs
					const allSubscriptionsInJobs = subscription.subscriber_id.every((id) => jobIds.includes(id));

					// If not, add the new jobs array to the subscription
					if (!allJobsInSubscription || !allSubscriptionsInJobs) {
						subscriptionMutation({
							variables: {
								input: {
									user_id: id,
									subscriber: 'jobRequest',
									subscriber_id: jobIds
								}
							}
						}).then((response) => {
							// eslint-disable-next-line @typescript-eslint/no-unused-vars
							const { created_at, updated_at, ...subscriptionWithoutTimestamps } = response.data.createSubscription;
							// replace the old subscription with the new one
							const newSubscriptionStore = subscriptionStore.map((subscription: SubscriptionProps) => 
								subscription.subscriber === 'jobRequest' ? subscriptionWithoutTimestamps : subscription
							);
							if (newSubscriptionStore) {
								setSubscriptionStore(newSubscriptionStore);
							}
						});

						if (subscriptionError) {
							throw new Error('Error while subscribing to jobs');
						}
					}
				}
			});
		}
		// If there are no subscriptions, add the new jobs array to the subscription
		if (jobs.length > 0 && !subscriptionStore.some(subscription => subscription.subscriber === 'jobRequest')) {
			const jobIds = jobs.map((job) => job.job_id);
			subscriptionMutation({
				variables: {
					input: {
						user_id: id,
						subscriber: 'jobRequest',
						subscriber_id: jobIds
					}
				}
			}).then((response) => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { created_at, updated_at, ...subscriptionWithoutTimestamps } = response.data.createSubscription;
				if (subscriptionWithoutTimestamps) {
					setSubscriptionStore([subscriptionWithoutTimestamps]);
				}
			});

			if (subscriptionError) {
				throw new Error('Error while subscribing to jobs');
			}
		}

	}, [jobs]);
	
	// useEffect to filter the requests by the user's location and the request's location
	useEffect(() => {
		if (getRequestsByJob) {
			const requestByJob = getRequestsByJob.requestsByJob;
			
			//get all request who are not in the store
			const newRequests = requestByJob.filter((request: RequestProps) => clientRequestsStore?.every(prevRequest => prevRequest.id !== request.id));
			
			// Filter the requests
			if (newRequests.length > 0) {
				RangeFilter(requestByJob);
				offsetRef.current = offsetRef.current + requestByJob?.length;
			}
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

				setClientRequestsStore(clientRequestsStore.filter(request => request.id !== requestId));
				
			/* 	clientRequestStore((prevClientRequests: RequestProps[]) => {
					if (prevClientRequests) {
						return prevClientRequests.filter((request) => request.id !== requestId);
					}
					return null;
				}); */
			}
		});
		if (hideRequestError) {
			throw new Error('Error while hiding request');
		}
	};
	
	return (
		<div className="client-request">
			<div className="client-request__list">
				{(requestJobLoading || hiddenLoading || subscribeLoading) &&  <Spinner/>}
				{!clientRequestsStore?.length && <p className="client-request__list no-req">Vous n&apos;avez pas de demande</p>}
				{clientRequestsStore && (
					<div className="client-request__list__detail"> 
						<InfiniteScroll
							dataLength={clientRequestsStore.length}
							next={ () => {
								addRequest();
							}}
							hasMore={true}
							loader={<h4>Loading...</h4>}
						>
							{clientRequestsStore.map((request) => (
								<div
									className={`client-request__list__detail__item ${request.urgent}`}
									key={request.id} 
									onClick={(event) => {
										setRequest(request),
										onDetailsClick(),
										event.stopPropagation();
									}}
								
								>
									{request.urgent && <p className="client-request__list__detail__item urgent">URGENT</p>}
									<div className="client-request__list__detail__item__header">
										<p className="client-request__list__detail__item__header date" >
											<span className="client-request__list__detail__item__header date-span">
										Date:</span>&nbsp;{new Date(Number(request.created_at)).toLocaleString()}
										</p>
										<p className="client-request__list__detail__item__header city" >
											<span className="client-request__list__detail__item__header city-span">
										Ville:</span>&nbsp;{request.city}
										</p>
										<h2 className="client-request__list__detail__item__header job" >
											<span className="client-request__list__detail__item__header job-span">
										Métier:</span>&nbsp;{request.job}
										</h2>
										<p className="client-request__list__detail__item__header name" >
											<span className="client-request__list__detail__item__header name-span">
										Nom:</span>&nbsp;{request.first_name} {request.last_name}
										</p>
									</div>
									<h1 className="client-request__list__detail__item title" >{request.title}</h1>
									<p 
										//@ts-expect-error con't resolve this type
										className={`client-request__list__detail__item message ${isMessageExpanded && isMessageExpanded[request?.id] ? 'expanded' : ''}`}
										onClick={(event: React.MouseEvent) => {
											//to open the message when the user clicks on it just for the selected request 
											idRef.current = request?.id  ?? 0; // check if request or requestByDate is not undefined
											console.log('id', idRef.current);
					
											if (idRef.current !== undefined && setIsMessageExpanded) {
												setIsMessageExpanded((prevState: ExpandedState)  => ({
													...prevState,
													[idRef.current as number]: !prevState[idRef.current]
												}));
											}
											
											event.stopPropagation();
										}}  
									>
										{request.message}
									</p>
									<div className="client-request__list__detail__item__picture">
						
										{(() => {
											const imageUrls = request.media?.map(media => media.url) || [];
											return request.media?.map((media, index) => (
												media ? (
													media.name.endsWith('.pdf') ? (
														<a 
															href={media.url} 
															key={media.id} 
															download={media.name} 
															target="_blank" 
															rel="noopener noreferrer" 
															onClick={(event) => {event.stopPropagation();}} >
															<img 
																className="client-request__list__detail__item__picture img" 
																//key={media.id} 
																src={pdfLogo} 
																alt={media.name} 
															/>
														</a>
													) : (
														<img 
															className="client-request__list__detail__item__picture img" 
															key={media.id} 
															src={media.url} 
															onClick={(event: React.MouseEvent) => {
																openModal(imageUrls, index),
																event.stopPropagation();}}
															alt={media.name} 
														/>
													)
												) : null
											));
										})()}
						
									</div>
								
									<button
										id={`delete-request-${request.id}`}
										className="client-request__list__detail__item__delete" 
										type='button' 
										onClick={(event) => {
											handleHideRequest(event, request.id),
											event.stopPropagation();
										}}>
									</button>
									<FaTrashAlt 
										className="client-request__list__detail__item__delete-FaTrashAlt" 
										onClick={(event) => {
											document.getElementById(`delete-request-${request.id}`)?.click(),
											event.stopPropagation();
										}}
									/>
								</div>
							))}
						</InfiniteScroll>
						<button onClick={addRequest}>
						fetchmore
						</button>
					</div>
				)}
			</div>

			<ImageModal 
				modalIsOpen={modalIsOpen} 
				closeModal={closeModal} 
				selectedImage={selectedImage} 
				nextImage={nextImage}
				previousImage={previousImage}
			/>
		</div>
	);
}

export default ClientRequest;