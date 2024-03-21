import { gql } from '@apollo/client';

export const GET_JOB_CATEGORY = gql`
    query Categories {
        categories {
            id
            name
        }
   } 
`;	

export const GET_JOBS_BY_CATEGORY = gql`
    query Jobs($categoryId: Int!) {
    category(id: $categoryId) {
        jobs {
        id
        name
        description
        }
    }
}
`;