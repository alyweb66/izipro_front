import { useLocation } from 'react-router-dom';
import { CONFIRM_EMAIL_MUTATION } from '../GraphQL/UserMutations';
import { useMutation } from '@apollo/client';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmEmailStore } from '../../store/LoginRegister';

function ConfirmEmail() {
	const navigate = useNavigate();
	const location = useLocation();
	const token = new URLSearchParams(location.search).get('token');
	//store
	const setIsEmailConfirmed = confirmEmailStore((state) => state.setIsEmailConfirmed);
	// Mutation
	const [confirmRegisterEmail, {error: confirmMailError}] = useMutation(CONFIRM_EMAIL_MUTATION);

	// send token to confirm email
	useEffect(() =>{
		confirmRegisterEmail({
			variables:{
				input:{
					token: token
				}
			}
		}).then(() => {
			setIsEmailConfirmed(true);
			navigate('/');
		});

		if (confirmMailError){
			throw new Error('Bad request');
		}

	});



	return (
		<div>
			<h1>Confirm Email</h1>
		</div>
	);
}

export default ConfirmEmail;