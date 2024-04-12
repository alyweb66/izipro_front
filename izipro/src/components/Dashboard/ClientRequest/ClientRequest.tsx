import { Key, useEffect, useState } from 'react';
import { userDataStore } from '../../../store/UserData';
import './clientRequest.scss';
import { useQueryRequestByJob } from '../../Hook/Query';
import { RequestProps } from '../../../Type/Request';
import { USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION } from '../../GraphQL/UserMutations';
import { useMutation } from '@apollo/client';

function ClientRequest () {
	
	// State
	const [error, setError] = useState<string | null>(null);
	const [clientRequests, setClientRequests] = useState<RequestProps[] | null>(null);
	//store
	const id = userDataStore((state) => state.id);
	const jobs = userDataStore((state) => state.jobs);

	// mutation
	const [hideRequest, {error: hideRequestError}] = useMutation(USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION);

	
	const offset = 0;
	const limit = 10;
	// get requests by job
	const getRequestsByJob = useQueryRequestByJob(jobs, offset, limit);

	
	useEffect(() => {
		if (getRequestsByJob) {
			setClientRequests(getRequestsByJob.requestsByJob);
		}
	}, [getRequestsByJob]);

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
			console.log('response', response.data);

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