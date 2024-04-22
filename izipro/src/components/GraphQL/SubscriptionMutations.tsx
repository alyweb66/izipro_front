import { gql } from '@apollo/client';

export const SUBSCRIPTION_MUTATION = gql`
    mutation Subscription($input: SubscriptionInput!) {
        createSubscription(input: $input) {
            id
            user_id
            subscriber
            subscriber_id
        }
    }
`;