import { gql } from '@apollo/client';


export const MESSAGE_MUTATION = gql`
    mutation Message($id: Int!, $input: NewMessageInput!) {
      createMessage(id: $id, input: $input) 
  
}
`;

export const CONTACT_MUTATION = gql`
  mutation ContactEmail($input: ContactInput!) {
    contactEmail(input: $input)
  }
`;