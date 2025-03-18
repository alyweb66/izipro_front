import { gql } from '@apollo/client';

export const CREATE_NOTIFICATION_PUSH_MUTATION = gql`
    mutation Notification($input: NotificationPushInput!) {
        createNotificationPush(input: $input)
    }
`;

export const DELETE_NOTIFICATION_PUSH_MUTATION = gql`
    mutation DeleteNotification($input: NotificationPushDeleteInput!) {
        deleteNotificationPush(input: $input)
    }
`;

export const UPDATE_NOTIFICATION_MUTATION = gql`
    mutation UpdateNotification($input: NotificationInput!) {
        updateNotification(input: $input)
    }
`;