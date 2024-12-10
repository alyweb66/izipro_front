import { useLocation } from 'react-router';
import { CONFIRM_EMAIL_MUTATION } from '../GraphQL/UserMutations';
import { useMutation } from '@apollo/client';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { confirmEmailStore } from '../../store/LoginRegister';
import Spinner from '../Hook/Components/Spinner/Spinner';
import { useShallow } from 'zustand/shallow';

function ConfirmEmail() {
	let navigate = useNavigate();
	const location = useLocation();
	const token = new URLSearchParams(location.search).get('token');
	
	//store
	const setIsEmailConfirmed = confirmEmailStore(useShallow((state) => state.setIsEmailConfirmed));
	// Mutation
	const [confirmRegisterEmail, {loading: confirmEmailLoading, error: confirmMailError}] = useMutation(CONFIRM_EMAIL_MUTATION);

	
	// send token to confirm email
	useEffect(() =>{
		//if no token redirect to home
		if (!token){
			navigate('/', { replace: true });
		}
		confirmRegisterEmail({
			variables:{
				input:{
					token: token
				}
			}
		}).then(() => {
			setIsEmailConfirmed(true);
			navigate('/', { replace: true });
		});

		if (confirmMailError){
			throw new Error('Bad request');
		}

	}, [confirmRegisterEmail, token, setIsEmailConfirmed, navigate, confirmMailError]);



	return (
		<div>
			{confirmEmailLoading && <Spinner />}
			{/* <h1>Confirm Email</h1> */}
		</div>
	);
}

export default ConfirmEmail;