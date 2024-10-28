// React
import React, { useLayoutEffect, useState } from 'react';

// Apollo Client mutations
import { useMutation } from '@apollo/client';
import { USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION } from '../../GraphQL/UserMutations';
//import { SUBSCRIPTION_MUTATION } from '../../GraphQL/SubscriptionMutations';
import { DELETE_NOT_VIEWED_REQUEST_MUTATION } from '../../GraphQL/NotViewedRequestMutation';

// Custom hooks and queries
import { useQueryRequestByJob } from '../../Hook/Query';

// State management
import { userDataStore } from '../../../store/UserData';
import { requestDataStore, clientRequestStore, requestConversationStore } from '../../../store/Request';
//import { subscriptionDataStore } from '../../../store/subscription';
import { notViewedRequest } from '../../../store/Viewed';

// Types and assets
import { RequestProps } from '../../../Type/Request';
//import { SubscriptionProps } from '../../../Type/Subscription';

// Components and utilities
import './clientRequest.scss';
import Spinner from '../../Hook/Spinner';
import { useModal, ImageModal } from '../../Hook/ImageModal';
import { DeleteItemModal } from '../../Hook/DeleteItemModal';
import { AnimatePresence } from 'framer-motion';

import RequestItem from '../../Hook/RequestHook';


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
	const [modalArgs, setModalArgs] = useState<{ requestId: number, requestTitle: string } | null>(null);


	const limit = 5;

	//store
	const [
		id,
		jobs,
		address,
		city,
		first_name,
		last_name,
		role,
		denomination,
		postal_code] = userDataStore((state) => [
			state.id,
			state.jobs,
			state.address,
			state.city,
			state.first_name,
			state.last_name,
			state.role,
			state.denomination,
			state.postal_code]);
	const [setRequest] = requestDataStore((state) => [state.setRequest]);
//	const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);
	const [clientRequestsStore, setClientRequestsStore] = clientRequestStore((state) => [state.requests, state.setClientRequestStore]);
	const [notViewedRequestStore] = notViewedRequest((state) => [state.notViewed]);
	const [requestsConversationStore, setRequestsConversationStore] = requestConversationStore((state) => [state.requests, state.setRequestConversation]);


	// mutation
	const [hideRequest, { loading: hiddenLoading, error: hideRequestError }] = useMutation(USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION);
	//const [subscriptionMutation, { loading: subscribeLoading, error: subscriptionError }] = useMutation(SUBSCRIPTION_MUTATION);
	const [deleteNotViewedRequest, { error: deleteNotViewedRequestError }] = useMutation(DELETE_NOT_VIEWED_REQUEST_MUTATION);

	// get requests by job
	const { loading: requestJobLoading, fetchMore } = useQueryRequestByJob(jobs, 0, limit, clientRequestStore.length > 0);


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
			const newRequests = data?.filter((request: RequestProps) => clientRequestsStore?.every(prevRequest => prevRequest.id !== request.id));

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

	function setClientRequest(request: RequestProps) {

		setRequestsConversationStore([...requestsConversationStore, request]);

	}


	// useEffect to see if the request is viewed
	useLayoutEffect(() => {
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
					}

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

	return (
		<div className="client-request">
			<div id="scrollableClientRequest" className="client-request__list">
				{(requestJobLoading || loading) && <Spinner />}
				{(!address || !city || !postal_code || (role === 'pro' ? !denomination : (!first_name || !last_name))) ? (
					<p className="client-request no-req">Veuillez renseigner les champs &quot;Mes informations&quot; et &quot;Vos métiers&quot; pour consulter les demandes</p>
				) : (
					<ul className="client-request__list__detail">
						<AnimatePresence>
							{clientRequestsStore.map((requestByDate) => (
								<RequestItem
								setHasManyImages={setHasManyImages}
								key={requestByDate.id}
								setClientRequest={setClientRequest}
								notViewedStore={notViewedRequestStore}
								setRequest={setRequest}
								requestByDate={requestByDate}
								isClientRequest={true}
								resetRequest={setRequest}
								onDetailsClick={onDetailsClick}
								hiddenLoading={hiddenLoading}
								modalArgs={modalArgs}
								setDeleteItemModalIsOpen={setDeleteItemModalIsOpen}
								isMessageExpanded={isMessageExpanded}
								setIsMessageExpanded={setIsMessageExpanded}
								setModalArgs={setModalArgs}
								openModal={openModal}
							/>
								
							))}
						</AnimatePresence>
					</ul>
				)}
				<div className="client-request__list__fetch-button">
					{(isHasMore && clientRequestsStore.length > 0) ? (<button
						className="Btn"
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							addRequest();
						}}
						aria-label="Charger plus de demandes"
					>
						<svg className="svgIcon" viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg"><path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"></path></svg>
						<span className="icon2"></span>
						<span className="tooltip">Charger plus</span>
					</button>
					) : (
						(address || city || postal_code || (role === 'pro' ? denomination : (first_name || last_name))) && (<p className="client-request__list no-req">Fin des résultats</p>)
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