// React
import React, { useEffect, useRef, useState } from 'react';

// Apollo Client mutations
import { useMutation } from '@apollo/client';
import { USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION } from '../../GraphQL/UserMutations';
import { SUBSCRIPTION_MUTATION } from '../../GraphQL/SubscriptionMutations';
import { DELETE_NOT_VIEWED_REQUEST_MUTATION } from '../../GraphQL/NotViewedRequestMutation';

// Custom hooks and queries
import { useQueryRequestByJob } from '../../Hook/Query';

// State management
import { userDataStore } from '../../../store/UserData';
import { requestDataStore, clientRequestStore } from '../../../store/Request';
import { subscriptionDataStore } from '../../../store/subscription';
import { notViewedRequest } from '../../../store/Viewed';

// Types and assets
import { RequestProps } from '../../../Type/Request';
import { SubscriptionProps } from '../../../Type/Subscription';
import pdfLogo from '/logo/logo-pdf.jpg';

// Components and utilities
import './clientRequest.scss';
import Spinner from '../../Hook/Spinner';
import { useModal, ImageModal } from '../../Hook/ImageModal';
import { FaTrashAlt } from 'react-icons/fa';
import { DeleteItemModal } from '../../Hook/DeleteItemModal';
import { motion, AnimatePresence } from 'framer-motion';


type ExpandedState = {
	[key: number]: boolean;
};

type clientRequestProps = {
	loading?: boolean;
	offsetRef: React.MutableRefObject<number>;
	isHasMore: boolean;
	setIsHasMore: (value: boolean) => void;
	onDetailsClick: () => void;
	RangeFilter: (requests: RequestProps[], fromSubscribeToMore?: boolean) => void;
};

function ClientRequest({ onDetailsClick, RangeFilter, setIsHasMore, isHasMore, offsetRef, loading }: clientRequestProps) {

	// ImageModal Hook
	const { modalIsOpen, openModal, closeModal, selectedImage, nextImage, previousImage } = useModal();

	// State
	const [isMessageExpanded, setIsMessageExpanded] = useState({});
	const [hasManyImages, setHasManyImages] = useState(false);
	const [deleteItemModalIsOpen, setDeleteItemModalIsOpen] = useState(false);
	const [modalArgs, setModalArgs] = useState<{requestId: number, requestTitle: string } | null>(null);
	/* 	const [isLoading, setIsLoading] = useState(false); */
	// Create a ref for the scroll position
	//const offsetRef = useRef(0);
	const idRef = useRef<number>(0);

	const limit = 5;

	//store
	const [
		id,
		jobs,
		address,
		city,
		first_name,
		last_name,
		postal_code] = userDataStore((state) => [
		state.id,
		state.jobs,
		state.address, 
		state.city, 
		state.first_name, 
		state.last_name, 
		state.postal_code]);
	const setRequest = requestDataStore((state) => state.setRequest);
	const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);
	const [clientRequestsStore, setClientRequestsStore] = clientRequestStore((state) => [state.requests, state.setClientRequestStore]);
	const [notViewedRequestStore] = notViewedRequest((state) => [state.notViewed]);


	// mutation
	const [hideRequest, { loading: hiddenLoading, error: hideRequestError }] = useMutation(USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION);
	const [subscriptionMutation, { loading: subscribeLoading, error: subscriptionError }] = useMutation(SUBSCRIPTION_MUTATION);
	const [deleteNotViewedRequest, { error: deleteNotViewedRequestError }] = useMutation(DELETE_NOT_VIEWED_REQUEST_MUTATION);

	// get requests by job
	const { loading: requestJobLoading, fetchMore } = useQueryRequestByJob(jobs, 0, limit, clientRequestStore.length > 0);

	// add jobs to setSubscriptionJob if there are not already in, or have the same id
	useEffect(() => {

		// If there are subscriptions, check if the jobs are in the subscription
		if (subscriptionStore.some(subscription => subscription.subscriber === 'jobRequest') && id > 0) {

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

	// useEffect to see if the request is viewed
	useEffect(() => {
		// Create an IntersectionObserver

		const observer = new IntersectionObserver((entries) => {

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

						notViewedRequest.setState(prevState => ({ notViewed: prevState.notViewed.filter(value => !requestIdsInView.includes(value)) }));
						//setNotViewedRequestStore(notViewedRequestStore.filter(value => !requestIdsInView.includes(value)));
					}
					//notViewedRequest.setState({ notViewed: notViewedRequestStore.filter(value => !requestIdsInView.includes(value)) });

					// remove not viewed request from the database
					if (requestIdsInView.length > 0) {

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

	// Function to hide a request
	function handleHideRequest(requestId?: number) {

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

			}
		});
		if (hideRequestError) {
			throw new Error('Error while hiding request');
		}
	};

	// Function to load more requests 
	function addRequest() {

		fetchMore({
			variables: {
				offset: offsetRef.current, // Next offset
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		}).then(fetchMoreResult => {
			const data = fetchMoreResult.data.requestsByJob;

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

	return (
		<div className="client-request">
			<div id="scrollableClientRequest" className="client-request__list">
				{(requestJobLoading || subscribeLoading || loading) && <Spinner />}
				{(!address && !city && !postal_code && !first_name && !last_name) &&
					(<p className="request no-req">Veuillez renseigner les champs &quot;Mes informations&quot; et &quot;Vos métiers&quot; pour consulter les demandes</p>)}
				{/* {!clientRequestsStore?.length && <p className="client-request__list no-req">Vous n&apos;avez pas de demande</p>} */}
				{(address && city && postal_code && first_name && last_name) && (
					<div className="client-request__list__detail">
						<AnimatePresence>
							{clientRequestsStore.map((request) => (
								<motion.div
									className={`client-request__list__detail__item ${request.urgent} ${notViewedRequestStore.some(id => id === request.id) ? 'not-viewed' : ''} `}
									data-request-id={request?.id}
									key={request.id}
									onClick={(event) => {
										setRequest(request),
										onDetailsClick(),
										event.stopPropagation();
									}}
									layout
									style={{ overflow: 'scroll' }}
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
									transition={{duration: 0.2, type: 'Inertia', stiffness: 50 }}

								>
									{hiddenLoading && modalArgs?.requestId === request.id && <Spinner />}
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
															onClick={(event) => {
																setHasManyImages(false),
																openModal(imageUrls, index),
																imageUrls.length > 1 && setHasManyImages(true);

																	event.stopPropagation();
															}}
															alt={media.name}
															onError={(event) => {
																event.currentTarget.src = '/logo/no-picture.jpg';
															  }}
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
											setModalArgs({requestId: request.id, requestTitle: request.title});
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
								</motion.div>
							))}
						</AnimatePresence>
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
				hasManyImages={hasManyImages}
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
				handleDeleteItem={handleHideRequest}
			/>
		</div>
	);
}

export default ClientRequest;