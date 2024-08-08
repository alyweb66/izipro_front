import { gql } from '@apollo/client';

export const GET_JOB_DATA = gql`
    query JobData($ids: [Int!]) {
        jobs(ids: $ids) {
            id
            name
        }
}
`;