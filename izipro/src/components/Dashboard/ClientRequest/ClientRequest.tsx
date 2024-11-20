// React
import React, { useLayoutEffect, useState } from 'react';

// Apollo Client mutations
import { useMutation } from '@apollo/client';
import { USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION } from '../../GraphQL/UserMutations';
import { DELETE_NOT_VIEWED_REQUEST_MUTATION } from '../../GraphQL/NotViewedRequestMutation';

// Custom hooks and queries
import { useQueryRequestByJob } from '../../Hook/Query';

// State management
import { userDataStore } from '../../../store/UserData';
import { requestDataStore, clientRequestStore, requestConversationStore } from '../../../store/Request';
import { notViewedRequest } from '../../../store/Viewed';

// Types and assets
import { RequestProps } from '../../../Type/Request';

// Components and utilities
import './clientRequest.scss';
import Spinner from '../../Hook/Spinner';
import { useModal, ImageModal } from '../../Hook/ImageModal';
import { DeleteItemModal } from '../../Hook/DeleteItemModal';
import { AnimatePresence } from 'framer-motion';

import RequestItem from '../../Hook/RequestHook';
import { FetchButton } from '../../Hook/FetchButton';


type clientRequestProps = {
	loading?: boolean;
	offsetRef: React.MutableRefObject<number>;
	isHasMore: boolean;
	setIsHasMore: (value: boolean) => void;
	handleNavigate: () => void;
	RangeFilter: (requests: RequestProps[], fromSubscribeToMore?: boolean) => void;
};

function ClientRequest({ handleNavigate, RangeFilter, setIsHasMore, isHasMore, offsetRef, loading }: clientRequestProps) {

	// ImageModal Hook
	const { modalIsOpen, openModal, closeModal, selectedImage, nextImage, previousImage } = useModal();

	// State
	const [hasManyImages, setHasManyImages] = useState(false);
	const [deleteItemModalIsOpen, setDeleteItemModalIsOpen] = useState(false);
	const [modalArgs, setModalArgs] = useState<{ requestId: number, requestTitle: string } | null>(null);
	const [showAllContent, setShowAllContent] = useState(false);

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

					// reset badge
					if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
						navigator.serviceWorker.controller.postMessage({ type: 'RESET_BADGE' });
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
			<div className="client-request__container">
			{clientRequestsStore && clientRequestsStore?.length > 0 && <button className="client-request__container__deploy"
					onClick={() => setShowAllContent(!showAllContent)}
				>
					{clientRequestsStore && clientRequestsStore?.length > 0 && (showAllContent ? 'Réduire les demandes' : 'Déployer les demandes')}</button>}
				<div id="scrollableClientRequest" className="client-request__container__list">
					{(requestJobLoading || loading) && <Spinner />}
					{(!address || !city || !postal_code || (role === 'pro' ? !denomination : (!first_name || !last_name))) ? (
						<p className="client-request no-req">Veuillez renseigner les champs &quot;Mes informations&quot; et &quot;Vos métiers&quot; pour consulter les demandes</p>
					) : (
						<ul className="client-request__container__list__detail">
							<AnimatePresence>
								{clientRequestsStore.map((requestByDate) => (
									<RequestItem
										setHasManyImages={setHasManyImages}
										key={requestByDate.id}
										setClientRequest={setClientRequest}
										notViewedStore={notViewedRequestStore}
										setRequest={setRequest}
										requestByDate={requestByDate}
										showAllContent={showAllContent}
										isClientRequest={true}
										handleNavigate={handleNavigate}
										hiddenLoading={hiddenLoading}
										modalArgs={modalArgs}
										setDeleteItemModalIsOpen={setDeleteItemModalIsOpen}
										setModalArgs={setModalArgs}
										openModal={openModal}
									/>

								))}
							</AnimatePresence>
						</ul>
					)}
					{(isHasMore && clientRequestsStore && clientRequestsStore?.length > 0) ? (
						<FetchButton
							addRequest={addRequest}
						/>
					) : (
						<p className="client-request__container__list no-req">{(address && city && postal_code && (role === 'pro' ? denomination : (first_name && last_name))) ? 'Fin des résultats' : ''}</p>
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