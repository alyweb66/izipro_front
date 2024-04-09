import { gql } from '@apollo/client';

export const GET_USER_DATA = gql`
  query Query {
    user {
      id
      first_name
      last_name
      email
      address
      postal_code
      city
      siret
      denomination
      role
      jobs{
        job_id
      }
      settings {
        range
      }
    }
  }
`;

