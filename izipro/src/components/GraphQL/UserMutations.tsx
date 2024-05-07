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
            lng
            lat
            siret
            denomination
            image
            description
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

export const CHANGE_PASSWORD_MUTATION = gql`
    mutation ChangePassword($changePasswordId: Int!, $input: ChangePasswordInput!) {
        changePassword(id: $changePasswordId, input: $input)
}
`;

export const USER_HAS_JOB_MUTATION = gql`
    mutation Mutation($input: UserJobInput!) {
        createUserJob(input: $input) {
            id
            user_id
            job_id
        }
    }
`;

export const DELETE_USER_HAS_JOB_MUTATION = gql`
    mutation Mutation($input: UserJobInput!) {
        deleteUserJob(input: $input) {
            id
            user_id
            job_id
        }
    }
`;

export const USER_SETTING_MUTATION = gql`
    mutation Mutation($userSettingId: Int!, $input: UserSettingsInput!) {
        userSetting(id: $userSettingId, input: $input) {
            range
        }
    }
`;

export const USER_HAS_HIDDEN_CLIENT_REQUEST_MUTATION = gql`
    mutation CreateHiddenClientRequest($input: UserHasHiddenClientRequestInput!) {
        createHiddenClientRequest(input: $input) {
            user_id
            request_id
        }
    }
`;