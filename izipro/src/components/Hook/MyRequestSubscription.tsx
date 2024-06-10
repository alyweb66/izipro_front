import { useSubscription } from '@apollo/client';
import { SubscriptionProps } from '../../Type/Subscription';
import { subscriptionDataStore } from '../../store/subscription';
import { MESSAGE_SUBSCRIPTION } from '../GraphQL/Subscription';
import { MessageProps } from '../../Type/message';


export const useMyRequestMessageSubscriptions = () => {
	// store
	const [subscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);

	// get the subscription
	const request = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'request');
	const conversation = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'conversation');

	// Subscription to get new message
	const { data: messageSubscription, error: errorSubscription } = useSubscription<{messageAdded: MessageProps[]}>(MESSAGE_SUBSCRIPTION, {
		variables: {
			conversation_ids: conversation?.subscriber_id,
			request_ids: request?.subscriber_id,
			is_request: true
		}
	});

	if (errorSubscription) {
		throw new Error('Error while subscribing to message');
	}

	return { messageSubscription };
};

