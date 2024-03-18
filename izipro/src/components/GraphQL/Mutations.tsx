import { gql } from '@apollo/client';

export const REGISTER_USER_MUTATION = gql`
    mutation Mutation($input: CreateUserInput!) {
        createUser(input: $input) {
            id
            email
        }
    }
`;

export const REGISTER_PRO_USER_MUTATION = gql`
    mutation Mutation($input: CreateProUserInput!) {
        createProUser(input: $input) {
            id
            email
        }
    }
`;

export const LOGIN_USER_MUTATION = gql`
    mutation Login($input: loginInput!) {
        login(input: $input)
    }
`;

export const LOGOUT_USER_MUTATION = gql`
    mutation Mutation($logoutId: Int!) {
  logout(id: $logoutId)
    }
`;

export const UPDATE_USER_MUTATION = gql`
    mutation Mutation($input: UpdateUserInput!) {
        updateUser(input: $input) {
            id
            first_name
            last_name
            email
            address
            postal_code
            city
            siret
            denomination
    }
}
`;