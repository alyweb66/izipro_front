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
      CGU
      jobs{
        job_id
      }
      settings {
        range
      }
      deleted_at
    }
  }
`;

export const GET_COOKIE_CONSENTS = gql`
  query CookieConsents {
    user {
      cookieConsents {
        id
        user_id
        cookies_analytics
        cookies_marketing
      }
    }
  }
`;

export const RULES = gql`
query Rules {
  rules {
    id
    CGU
    cookies
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
        denomination
        image
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
          request_id
          updated_at
        }
        deleted_at
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
      first_name
      last_name
      email
      city
      image
      description
      denomination
      siret
      deleted_at
    }
  }
`;

export const GET_USER_NOT_VIEWED_REQUESTS = gql`
query NotViewedRequest {
  user {
    userHasNotViewedRequest {
      request_id
      user_id
    }
  }
}
`;

export const VAPID_PUBLIC_KEY = gql`
  query UserVapidKey {
    user {
      publicKey
    }
  }
`;

export const GET_USER_NOTIFICATION = gql`
  query Notifications {
    user {
      notification {
        id
        user_id
        email_notification
        endpoint
      }
    }
  }
`;