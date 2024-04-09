import { gql } from '@apollo/client';

export const GET_JOB_DATA = gql`
    query Query($ids: [Int!]) {
        jobs(ids: $ids) {
            id
            name
        }
}
`;