import { gql } from '@apollo/client';

export const REGISTER_USER_MUTATION = gql`
    mutation Register($input: CreateUserInput!) {
        createUser(input: $input) {
            id
            email
        }
    }
`;

export const DELETE_ACCOUNT_MUTATION = gql`
    mutation DeleteAccount($id: Int!) {
        deleteUser(id: $id)
    }
`;

export const REGISTER_PRO_USER_MUTATION = gql`
    mutation ProRegister($input: CreateProUserInput!) {
        createProUser(input: $input) {
            ... on User {
                id
                email
            }

            ... on ExistingSiret {
                error
            }
        }
    }
`;

export const LOGIN_USER_MUTATION = gql`
    mutation Login($input: loginInput!) {
        login(input: $input)
    }
`;

export const LOGOUT_USER_MUTATION = gql`
    mutation Logout($logoutId: Int!) {
  logout(id: $logoutId)
    }
`;

export const UPDATE_USER_MUTATION = gql`
    mutation UpdateUser($updateUserId: Int!, $input: UpdateUserInput!) {
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
            CGU
    }
}
`;

export const COOKIE_CONSENTS_MUTATION = gql`
    mutation CookieConsents($input: CookieConsentInput!, $createCookieConsentsId: Int!) {
    createCookieConsents(input: $input, id: $createCookieConsentsId) {
        id
        user_id
        cookies_analytics
        cookies_marketing
        cookies_necessary
    }
    }
`;

export const UPDATE_COOKIE_CONSENTS_MUTATION = gql`
    mutation UpdateCookieConsents($input: CookieConsentInput!, $createCookieConsentsId: Int!) {
    updateCookieConsents(input: $input, id: $createCookieConsentsId) {
        id
        user_id
        cookies_analytics
        cookies_marketing
        cookies_necessary
    }
    }
`;

export const CONFIRM_EMAIL_MUTATION = gql`
    mutation ConfirmRegisterEmail($input: ConfirmRegisterEmailInput!) {
        confirmRegisterEmail(input: $input)
    }
`;

export const FORGOT_PASSWORD_MUTATION = gql`
    mutation ForgotPassword($input: ForgotPasswordInput!) {
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
    mutation UserHasJob($input: UserJobInput!) {
        createUserJob(input: $input) {
            id
            user_id
            job_id
        }
    }
`;

export const DELETE_USER_HAS_JOB_MUTATION = gql`
    mutation DeleteUserHasJob($input: UserJobInput!) {
        deleteUserJob(input: $input) {
            id
            user_id
            job_id
        }
    }
`;

export const USER_SETTING_MUTATION = gql`
    mutation UserSetting($userSettingId: Int!, $input: UserSettingsInput!) {
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

export const DELETE_PROFILE_PICTURE_MUTATION = gql`
    mutation DeleteProfilPicture($id: Int!) {
        deleteProfilePicture(id: $id)
    }
`;



