import { gql } from '@apollo/client';


export const MESSAGE_MUTATION = gql`
    mutation Message($id: Int!, $input: NewMessageInput!) {
      createMessage(id: $id, input: $input) 
  
}
`;
/* export const VIEWED_MESSAGE_MUTATION = gql`
    mutation ViewedMessage($input: UpdateViewedMessage!) {
    updateViewedMessage(input: $input)
    }
`; */