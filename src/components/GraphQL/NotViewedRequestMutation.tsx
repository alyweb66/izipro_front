import { gql } from '@apollo/client';

export const NOT_VIEWED_REQUEST_MUTATION = gql`
    mutation NotViewedRequest($input: UserHasNotViewedRequestInput!) {
        userHasNotViewedRequest(input: $input)
    }
`;

export const DELETE_NOT_VIEWED_REQUEST_MUTATION = gql`
    mutation Mutation($input: UserHasNotViewedRequestInput!) {
        deleteNotViewedRequest(input: $input)
    }
`;