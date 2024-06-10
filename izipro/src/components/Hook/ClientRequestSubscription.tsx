import { useSubscription } from '@apollo/client';
import { REQUEST_SUBSCRIPTION } from '../GraphQL/Subscription';
import { userDataStore } from '../../store/UserData';
import { RequestProps } from '../../Type/Request';


export const useClientRequestSubscriptions = () => {
	// store
	const jobs = userDataStore((state) => state.jobs);

	// Subscription to get new message
	const { data: clientRequestSubscription, error: errorClientRequestSubscription } = useSubscription<{requestAdded: RequestProps[]}>(REQUEST_SUBSCRIPTION, {
		variables: {
			ids: jobs.map(job => job.job_id).filter(id => id != null),
		}
	});
    
	if (errorClientRequestSubscription) {
		throw new Error('Error while subscribing to clientRequest');
	}

	return { clientRequestSubscription };
};
