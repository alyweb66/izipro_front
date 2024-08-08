import { gql } from '@apollo/client';

export const CREATE_NOTIFICATION_PUSH_MUTATION = gql`
    mutation Notification($input: NotificationInput!) {
        createNotification(input: $input)
    }
`;

export const DELETE_NOTIFICATION_PUSH_MUTATION = gql`
    mutation DeleteNotification($input: NotificationDeleteInput!) {
        deleteNotification(input: $input)
    }
`;

export const UPDATE_NOTIFICATION_MUTATION = gql`
    mutation UpdateNotification($input: NotificationInput!) {
        updateNotification(input: $input)
    }
`;