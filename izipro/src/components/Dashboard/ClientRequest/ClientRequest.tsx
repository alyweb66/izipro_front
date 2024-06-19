import React, { useEffect, useRef, useState } from 'react';
import { userDataStore } from '../../../store/UserData';
import { requestDataStore, clientRequestStore } from '../../../store/Request';
import { subscriptionDataStore } from '../../../store/subscription';
import './clientRequest.scss';
import { useQueryRequestByJob } from '../../Hook/Query';
import { RequestProps } from '../../../Type/Request';
import { USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION } from '../../GraphQL/UserMutations';
import { useMutation } from '@apollo/client';
import { SUBSCRIPTION_MUTATION } from '../../GraphQL/SubscriptionMutations';
import { SubscriptionProps } from '../../../Type/Subscription';
import pdfLogo from '/logo/pdf-icon.svg';
import { useModal, ImageModal } from '../../Hook/ImageModal';
import { FaTrashAlt } from 'react-icons/fa';
import Spinner from '../../Hook/Spinner';
import { DeleteItemModal } from '../../Hook/DeleteItemModal';
import { notViewedRequest } from '../../../store/Viewed';
import { DELETE_NOT_VIEWED_REQUEST_MUTATION } from '../../GraphQL/NotViewedRequestMutation';




type ExpandedState = {
	[key: number]: boolean;
};

type clientRequestProps = {
	offsetRef: React.MutableRefObject<number>;
	isHasMore: boolean;
	setIsHasMore: (value: boolean) => void;
	onDetailsClick: () => void;
	//clientRequestSubscription?: { requestAdded: RequestProps[] };
	RangeFilter: (requests: RequestProps[], fromSubscribeToMore?: boolean) => void;
};

function ClientRequest({ onDetailsClick, RangeFilter, setIsHasMore, isHasMore, offsetRef}: clientRequestProps) {

	// ImageModal Hook
	const { modalIsOpen, openModal, closeModal, selectedImage, nextImage, previousImage } = useModal();

	// State
	const [isMessageExpanded, setIsMessageExpanded] = useState({});
	//const [isHasMore, setIsHasMore] = useState(true);
	const [deleteItemModalIsOpen, setDeleteItemModalIsOpen] = useState(false);
	const [modalArgs, setModalArgs] = useState<{ event: React.MouseEvent, requestId: number } | null>(null);
	/* 	const [isLoading, setIsLoading] = useState(false); */
	// Create a ref for the scroll position
	//const offsetRef = useRef(0);
	const idRef = useRef<number>(0);

	const limit = 5;

	//store
	const id = userDataStore((state) => state.id);
	const jobs = userDataStore((state) => state.jobs);
	const address = userDataStore((state) => state.address);
	const city = userDataStore((state) => state.city);
	const first_name = userDataStore((state) => state.first_name);
	const last_name = userDataStore((state) => state.last_name);
	const postal_code = userDataStore((state) => state.postal_code);
	//const settings = userDataStore((state) => state.settings);
	const setRequest = requestDataStore((state) => state.setRequest);
	const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);
	const [clientRequestsStore, setClientRequestsStore] = clientRequestStore((state) => [state.requests, state.setClientRequestStore]);
	const [notViewedRequestStore] = notViewedRequest((state) => [state.notViewed]);
	//const [notViewedRequestRefStore, setNotViewedRequestRefStore] = notViewedRequestRef((state) => [state.notViewed, state.setNotViewedStore]);

	// mutation
	const [hideRequest, { loading: hiddenLoading, error: hideRequestError }] = useMutation(USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION);
	const [subscriptionMutation, { loading: subscribeLoading, error: subscriptionError }] = useMutation(SUBSCRIPTION_MUTATION);
	const [deleteNotViewedRequest, {error: deleteNotViewedRequestError}] = useMutation(DELETE_NOT_VIEWED_REQUEST_MUTATION);

	// get requests by job
	const { loading: requestJobLoading,  fetchMore } = useQueryRequestByJob(jobs, 0, limit, clientRequestStore.length > 0);

	/* // Function to filter the requests by the user's location and the request's location
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
					(request.conversation === null || request.conversation === undefined ||
						!request.conversation.some(conversation =>
							(conversation.user_1 !== null && conversation.user_2 !== null) &&
							(conversation.user_1 === id || conversation.user_2 === id)
						)
					)
				);
			});

			//get all request who are not in the store
			const newRequests = filteredRequests.filter((request: RequestProps) => clientRequestsStore?.every(prevRequest => prevRequest.id !== request.id));

			// Add the new requests to the top of the list
			if (newRequests) {
				setClientRequestsStore([...newRequests, ...(clientRequestsStore || [])]);

				// add the request.id to the viewedClientRequestStore
				setClientRequestViewedStore([...newRequests.map(request => request.id), ...(clientRequestViewedStore || [])]);

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

			//get all request who are not in the store
			const newRequests = requests.filter((request: RequestProps) => clientRequestsStore?.every(prevRequest => prevRequest.id !== request.id));

			// Add the new requests to the bottom of the list
			if (newRequests) {
				setClientRequestsStore([...newRequests, ...(clientRequestsStore || []),]);

				// add the request.id to the viewedClientRequestStore
				setClientRequestViewedStore([...newRequests.map(request => request.id), ...(clientRequestViewedStore || [])]);
			}

		}
	} */


	// Function to load more requests 
	function addRequest() {
		console.log('offsetRef', offsetRef.current);
		console.log('addRequest');
		
		fetchMore({
			variables: {
				offset: offsetRef.current, // Next offset
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		}).then(fetchMoreResult => {
			const data = fetchMoreResult.data.requestsByJob;
			console.log('clientRequestsStore', clientRequestsStore);
			
			console.log('data', data);

			//get all request who are not in the store
			const newRequests = data.filter((request: RequestProps) => clientRequestsStore?.every(prevRequest => prevRequest.id !== request.id));

			if (newRequests.length > 0) {
				RangeFilter(newRequests);
				offsetRef.current = offsetRef.current + data.length;

			}

			// If there are no more requests, stop fetchmore
			if (fetchMoreResult.data.requestsByJob.length < limit) {
				setIsHasMore(false);
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

	/* // useEffect to filter the requests by the user's location and the request's location
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

		// If there are no more requests, stop the infinite scroll
		if (getRequestsByJob?.requestsByJob.length < limit) {
			setIsHasMore(false);
		}

	}, [getRequestsByJob, settings]);
 */

	// Function to hide a request
	const handleHideRequest = (event: React.MouseEvent<Element, MouseEvent>, requestId: number) => {
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

	// useEffect to see if the request is viewed
	useEffect(() => {
		// Create an IntersectionObserver
		
		const observer = new IntersectionObserver((entries) => {
			console.log('coucou');
			const requestIdsInView = entries
				.filter(entry => entry.isIntersecting)
				.map(entry => {
					const requestIdString = entry.target.getAttribute('data-request-id');
					return requestIdString !== null ? parseInt(requestIdString) : null;
				})
				.filter(requestId => requestId !== null && notViewedRequestStore.includes(requestId));

			if (requestIdsInView.length > 0) {
				// check if the id is in the notViewedRequestStore
				const isAnyIdInViewInStore = requestIdsInView.some(id => notViewedRequestStore.includes(id as number));

				setTimeout(() => {
				// remove all requestIdsInView from the viewedClientRequestStore at once
					if (isAnyIdInViewInStore) {
						console.log('addNotViewedRequest', isAnyIdInViewInStore);
						
						notViewedRequest.setState(prevState => ({ notViewed: prevState.notViewed.filter(value => !requestIdsInView.includes(value)) }));
					//setNotViewedRequestStore(notViewedRequestStore.filter(value => !requestIdsInView.includes(value)));
					}
					//notViewedRequest.setState({ notViewed: notViewedRequestStore.filter(value => !requestIdsInView.includes(value)) });

					// remove not viewed request from the database
					if (requestIdsInView.length > 0) {
						console.log('deleteNotViewedRequest');
						console.log('notViewedRequestStore ', notViewedRequestStore);
					
						deleteNotViewedRequest({
							variables: {
								input: {
									user_id: id,
									request_id: requestIdsInView
								}
							}
						});
	
						if (deleteNotViewedRequestError) {
							throw new Error('Error while deleting viewed Clientrequests');
						}
					}
				}, 3000);
				

	
				/* if(addNotViewedRequest.length > 0) {
					notViewedClientRequest({
						variables: {
							input: {
								user_id: id,
								request_id: addNotViewedRequest
							}
						}
					});
	
					if (notViewedClientRequestError) {
						throw new Error('Error while updating viewed Clientrequests');
					}
				} */
	


			}
		});


		// Observe all elements with a data-request-id attribute
		const elements = document.querySelectorAll('[data-request-id]');
		elements.forEach(element => observer.observe(element));

		// Function to handle visibility change
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				elements.forEach(element => observer.observe(element));
			} else {
				elements.forEach(element => observer.unobserve(element));
			}
		};
	
		// Listen for visibility change events
		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Clean up
		return () => {
			elements.forEach(element => observer.unobserve(element));
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};

	});


	return (
		<div className="client-request">
			<div id="scrollableClientRequest" className="client-request__list">
				{(requestJobLoading || hiddenLoading || subscribeLoading) && <Spinner />}
				{(!address && !city && !postal_code && !first_name && !last_name) &&
					(<p className="request no-req">Veuillez renseigner les champs &quot;Mes informations&quot; et &quot;Vos métiers&quot; pour consulter les demandes</p>)}
				{/* {!clientRequestsStore?.length && <p className="client-request__list no-req">Vous n&apos;avez pas de demande</p>} */}
				{(address && city && postal_code && first_name && last_name) && (
					<div className="client-request__list__detail">
						{clientRequestsStore.map((request) => (
							<div
								className={`client-request__list__detail__item ${request.urgent} ${notViewedRequestStore.some(id => id === request.id) ? 'not-viewed' : ''} `}
								data-request-id={request?.id}
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
									{request.denomination ? (
										<p className="client-request__list__detail__item__header name" >
											<span className="client-request__list__detail__item__header name-span">
												Entreprise:</span>&nbsp;{request.denomination}
										</p>
									) : (
										<p className="client-request__list__detail__item__header name" >
											<span className="client-request__list__detail__item__header name-span">
												Nom:</span>&nbsp;{request.first_name} {request.last_name}
										</p>
									)}
								</div>
								<h1 className="client-request__list__detail__item title" >{request.title}</h1>
								<p
									//@ts-expect-error con't resolve this type
									className={`client-request__list__detail__item message ${isMessageExpanded && isMessageExpanded[request?.id] ? 'expanded' : ''}`}
									onClick={(event: React.MouseEvent) => {
										//to open the message when the user clicks on it just for the selected request 
										idRef.current = request?.id ?? 0; // check if request or requestByDate is not undefined
										console.log('id', idRef.current);

										if (idRef.current !== undefined && setIsMessageExpanded) {
											setIsMessageExpanded((prevState: ExpandedState) => ({
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
														onClick={(event) => { event.stopPropagation(); }} >
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
															event.stopPropagation();
														}}
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
										setDeleteItemModalIsOpen(true);
										setModalArgs({ event, requestId: request.id });
										event.stopPropagation();
									}}>
								</button>
								<FaTrashAlt
									className="client-request__list__detail__item__delete-FaTrashAlt"
									onClick={(event) => {
										console.log('delete-request', request.id);

										document.getElementById(`delete-request-${request.id}`)?.click(),
										event.stopPropagation();
									}}
								/>
							</div>
						))}
					</div>
				)}
				<div className="client-request__list__fetch-button">
					{isHasMore ? (<button
						className="Btn"
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							addRequest();
						}
						}>
						<svg className="svgIcon" viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg"><path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"></path></svg>
						<span className="icon2"></span>
						<span className="tooltip">Charger plus</span>
					</button>
					) : (
						<p className="client-request__list no-req">Fin des résultats</p>
					)}
				</div>
			</div>

			<ImageModal
				modalIsOpen={modalIsOpen}
				closeModal={closeModal}
				selectedImage={selectedImage}
				nextImage={nextImage}
				previousImage={previousImage}
			/>
			<DeleteItemModal
				modalArgs={modalArgs}
				setModalArgs={setModalArgs}
				setDeleteItemModalIsOpen={setDeleteItemModalIsOpen}
				deleteItemModalIsOpen={deleteItemModalIsOpen}
				handleDeleteRequest={handleHideRequest}
			/>
		</div>
	);
}

export default ClientRequest;