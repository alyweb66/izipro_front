import { gql } from '@apollo/client';

export const VIEWED_MESSAGE_MUTATION = gql`
    mutation ViewedMessage($input: UpdateViewedMessage!) {
    updateViewedMessage(input: $input)
    }
`;