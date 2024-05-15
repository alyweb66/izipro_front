import { gql } from '@apollo/client';

export const GET_USER_DATA = gql`
  query UserData {
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
      image
      description
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
          updated_at
        }
        deleted_at
      }
    }
  }
`;

export const GET_MESSAGES_BY_CONVERSATION = gql`
  query User($messagesId: Int!, $conversationId: Int!, $offset: Int!, $limit: Int!) {
      user {
        messages(id: $messagesId, conversationId: $conversationId, offset: $offset, limit: $limit) {
          id
          content
          user_id
          conversation_id
          request_id
          created_at
          media {
            id
            url
            name
          }
        }
      }
}
`;

export const GET_USER_SUBSCRIPTION = gql`
  query Subscription {
    user {
      subscription {
        id
        user_id
        subscriber
        subscriber_id
      }
    }
  }
`;

export const GET_USERS_CONVERSATION = gql`
  query UserConversation($ids: [Int!], $offset: Int, $limit: Int) {
    users(ids: $ids, offset: $offset, limit: $limit) {
      id
      city
      image
      description
      denomination
    }
  }
`;

export const GET_MY_MESSAGES_BY_CONVERSATION = gql`
  query MessageByConversation($conversationId: Int!, $offset: Int, $limit: Int) {
    messages(conversationId: $conversationId, offset: $offset, limit: $limit) {
          id
          content
          user_id
          conversation_id
          request_id
          created_at
          media {
            id
            url
            name
          }
    }
  }
`;
