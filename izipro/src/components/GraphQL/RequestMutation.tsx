import { gql } from '@apollo/client';

export const REQUEST_MUTATION = gql`
    mutation CreateRequest($input: CreateRequestInput!) {
        createRequest(input: $input) {
            id
            urgent
            title
            message
            localization
            user_id
            job_id
        }
    }
`;