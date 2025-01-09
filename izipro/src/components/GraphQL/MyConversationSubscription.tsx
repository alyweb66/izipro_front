import { useSubscription } from '@apollo/client';
import { MESSAGE_SUBSCRIPTION } from './Subscription';
import { SubscriptionProps } from '../../Type/Subscription';
import { subscriptionDataStore } from '../../store/subscription';
import { MessageProps } from '../../Type/message';
import { useShallow } from 'zustand/shallow';

export const useMyConversationSubscriptions = (skip: boolean) => {
//store
	const [subscriptionStore] = subscriptionDataStore(useShallow((state) => [state.subscription, state.setSubscription]));

	// Message subscription
	const Subscription = subscriptionStore.find((subscription: SubscriptionProps) => subscription.subscriber === 'clientConversation');

	const { data: clientMessageSubscription, error: errorSubscription } = useSubscription<{messageAdded: MessageProps[]}>(MESSAGE_SUBSCRIPTION, {
		variables: {
			conversation_ids: Subscription?.subscriber_id,
			request_ids: [],
			is_request: false
		},
		skip
	});
	if (errorSubscription) {
		throw new Error('Error while subscribing to message');
	}

	return { clientMessageSubscription };

};