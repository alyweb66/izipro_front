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
