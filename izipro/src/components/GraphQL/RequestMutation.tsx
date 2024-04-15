import { gql } from '@apollo/client';

export const REQUEST_MUTATION = gql`
    mutation CreateRequest($input: CreateRequestInput!) {
        createRequest(input: $input) {
            id
            urgent
            title
            message
            lng
            lat
            user_id
            job_id
        }
    }
`;

export const DELETE_REQUEST_MUTATION = gql`
    mutation Mutation($input: DeleteRequestInput!) {
        deleteRequest(input: $input)
    }
`;