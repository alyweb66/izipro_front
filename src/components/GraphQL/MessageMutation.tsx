import { gql } from '@apollo/client';


export const MESSAGE_MUTATION = gql`
    mutation Message($id: Int!, $input: NewMessageInput!) {
      createMessage(id: $id, input: $input){
      ... on Message {
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
            thumbnail
          }
      }
      ... on BooleanResult {
        success
      }
    } 
  
}
`;

export const CONTACT_MUTATION = gql`
  mutation ContactEmail($input: ContactInput!) {
    contactEmail(input: $input)
  }
`;