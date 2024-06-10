import { gql } from '@apollo/client';

export const REQUEST_MUTATION = gql`
    mutation CreateRequest($input: CreateRequestInput!) {
        createRequest(input: $input) {
            id
            urgent
            title
            message
            first_name
            last_name
            lng
            lat
            city
            range
            user_id
            job_id
            job 
            media {
                id
                url
                name
            }
            created_at
            conversation {
            id
            user_1
            user_2
            updated_at
            }
            deleted_at   
        }
    }
`;

export const DELETE_REQUEST_MUTATION = gql`
    mutation DeleteRequest($input: DeleteRequestInput!) {
        deleteRequest(input: $input)
    }
`;