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
      lng
      lat
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

export const GET_USER_REQUEST_BY_CONVERSATIONS = gql`
  query RequestsConversations($offset: Int!, $limit: Int!) {
    user {
      requestsConversations(offset: $offset, limit: $limit) {
        id
        urgent
        title
        message
        city
        lng
        lat
        range
        user_id
        job_id
        first_name
        last_name
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
        }
      }
    }
  }
`;
