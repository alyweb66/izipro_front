import { useSubscription } from '@apollo/client';
import { REQUEST_SUBSCRIPTION } from './Subscription';
import { userDataStore } from '../../store/UserData';
import { RequestProps } from '../../Type/Request';


export const useClientRequestSubscriptions = (skip: boolean) => {
	// store
	const jobs = userDataStore((state) => state.jobs);
	const id = userDataStore((state) => state.id);

	// Subscription to get new message
	const { data: clientRequestSubscription, error: errorClientRequestSubscription } = useSubscription<{requestAdded: RequestProps[]}>(REQUEST_SUBSCRIPTION, {
		variables: {
			job_ids: jobs.map(job => job.job_id).filter(id => id != null),
			user_id: id
		},
		skip
	});
    
	if (errorClientRequestSubscription) {
		throw new Error('Error while subscribing to clientRequest');
	}

	return { clientRequestSubscription };
};
