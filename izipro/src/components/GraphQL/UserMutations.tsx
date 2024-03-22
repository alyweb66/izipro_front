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
    mutation Mutation($updateUserId: Int!, $input: UpdateUserInput!) {
  updateUser(id: $updateUserId, input: $input) {
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

export const CONFIRM_EMAIL_MUTATION = gql`
    mutation ConfirmRegisterEmail($input: ConfirmRegisterEmailInput!) {
        confirmRegisterEmail(input: $input)
    }
`;

export const FORGOT_PASSWORD_MUTATION = gql`
    mutation ChangePassword($input: ForgotPasswordInput!) {
        forgotPassword(input: $input)
}
`;

export const VALIDATE_FORGOT_PASSWORD_MUTATION = gql`
    mutation ValidateForgotPassword($input: ValidateForgotPasswordInput!) {
        validateForgotPassword(input: $input)
    }
`;