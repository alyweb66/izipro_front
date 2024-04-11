import { Key, useEffect, useState } from 'react';
import { userDataStore } from '../../../store/UserData';
import './clientRequest.scss';
import { useQueryRequestByJob } from '../../Hook/Query';
import { RequestProps } from '../../../Type/Request';

function ClientRequest () {
	
	// State
	const [error, setError] = useState<string | null>(null);
	const [clientRequests, setClientRequests] = useState<RequestProps[] | null>(null);
	//store
	const id = userDataStore((state) => state.id);
	const jobs = userDataStore((state) => state.jobs);

	
	const offset = 0;
	const limit = 10;
	// get requests by job
	const getRequestsByJob = useQueryRequestByJob(jobs, offset, limit);

	
	useEffect(() => {
		if (getRequestsByJob) {
			setClientRequests(getRequestsByJob.requestsByJob);
		}
	}, [getRequestsByJob]);



	return (
		<div className="my_request-container">
			{!clientRequests && <p>Vous n&apos;avez pas de demande</p>}
			{clientRequests && (
				<div> 
					{clientRequests.map((request, index: Key | null | undefined) => (
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
							<button type='button' onClick={(event) => {handleDeleteRequest(event, requestsByJob.id, requestsByJob.media.map(image => image.name));}}>Supprimer la demande</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default ClientRequest;