import { useSubscription } from '@apollo/client';
import { REQUEST_SUBSCRIPTION } from './Subscription';
import { userDataStore } from '../../store/UserData';
import { RequestProps } from '../../Type/Request';
import { useShallow } from 'zustand/shallow';

export const useClientRequestSubscriptions = (skip: boolean) => {
	// store
	const jobs = userDataStore(useShallow((state) => state.jobs));
	const id = userDataStore(useShallow((state) => state.id));

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
