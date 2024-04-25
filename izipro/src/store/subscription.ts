import { create } from 'zustand';
import { SubscriptionProps } from '../Type/Subscription';

type SubscriptionStore = {
	subscription: SubscriptionProps[];
	setSubscription: (data: SubscriptionProps[]) => void;
}

export const subscriptionDataStore = create<SubscriptionStore>((set) => ({
	subscription: [],
	setSubscription: (data) => set({ subscription: data }),
}));

