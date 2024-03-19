import { gql } from '@apollo/client';

export const GET_JOB_CATEGORY = gql`
    query Categories {
        categories {
            id
            name
        }
   } 
`;	   