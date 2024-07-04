
//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
import Spinner from './Spinner';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CONTACT_MUTATION } from '../GraphQL/MessageMutation';
import DOMPurify from 'dompurify';
import validator from 'validator';

ReactModal.setAppElement('#root');

interface DeleteItemModalProps {
	isOpenModal: boolean;
	setIsOpenModal: (value: boolean) => void;
}

export const ContactModal: React.FC<DeleteItemModalProps> = ({
	isOpenModal,
	setIsOpenModal,

}) => {

	// Mutation 
	const [contactEmail, {loading: contactEmailLoading, error: contactEmailError}] = useMutation(CONTACT_MUTATION);
	//state
	const [description, setDescription] = useState<string>('');
	const [first_name, setFirstName] = useState<string>('');
	const [last_name, setLastName] = useState<string>('');
	const [enterprise, setEnterprise] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [confirmationMessage, setConfirmationMessage] = useState<string>('');

	const handleAccept = (description: string, email: string, first_name?: string, last_name?: string, enterprise?: string) => {
		if ((first_name && last_name || enterprise) && description && email) {

			if (!validator.isEmail(email)) {
				setErrorMessage('Email invalide');
				setTimeout(() => {
					setErrorMessage('');
				}, 5000);
				return;
			}
            
			contactEmail({
				variables: {
					input: {
						...(first_name ? { first_name: DOMPurify.sanitize(first_name) } : {}),
						...(last_name ? { last_name: DOMPurify.sanitize(last_name) } : {}),
						...(enterprise ? { enterprise: DOMPurify.sanitize(enterprise) } : {}),
						email: DOMPurify.sanitize(email),
						description: DOMPurify.sanitize(description)
					}
				}
			}).then(() => {
				setDescription('');
				setFirstName('');
				setLastName('');
				setEnterprise('');
				setEmail('');
				setConfirmationMessage('Message envoyé');
			});

			if (contactEmailError) {
				throw new Error('Error sending message');
			}
		} else {
			setErrorMessage('Veuillez remplir tous les champs');
			setTimeout(() => {
				setErrorMessage('');
			}, 5000);
		}
	};

	return (
		<ReactModal
			className="modal"
			isOpen={isOpenModal}
			contentLabel="Delete Account"
			shouldCloseOnOverlayClick={false}
			aria-label="supprimer mon compte"
		>
			<div className="modal__container">
				{contactEmailLoading && <Spinner/>}
				<h1 className="modal__container__title">CONTACT</h1>
				<p>Veuillez remplire votre nom et prénom ou votre société</p>
				<label className="modal__container__label">
								Nom:
					<input
						className="modal__container__label input"
						type="text"
						name="last_name"
						value={last_name || ''}
						placeholder={'Nom' || ''}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLastName(event.target.value)}
						aria-label="Nom"
						maxLength={50}
					/>
				</label>
				<label className="modal__container__label">
								Prénom:
					<input
						className="modal__container__label input"
						type="text"
						name="first_name"
						value={first_name || ''}
						placeholder={'Prénom' || ''}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFirstName(event.target.value)}
						aria-label="Prénom"
						maxLength={50}
					/>
				</label>
				<p>Ou</p>
				<label className="modal__container__label">
								Société:
					<input
						className="modal__container__label input"
						type="text"
						name="enterprise"
						value={enterprise || ''}
						placeholder={'Société' || ''}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEnterprise(event.target.value)}
						aria-label="Société"
						maxLength={50}
					/>
				</label>
				<label className="modal__container__label">
								Email:
					<input
						className="modal__container__label input"
						type="text"
						name="email"
						value={email || ''}
						placeholder={'Email' || ''}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
						aria-label="email"
						maxLength={50}
						required
					/>
				</label>
				<label className="modal__container__label">
								Message:
					<textarea
						className="modal__container__label textarea"
						name="description"
						id="description"
						placeholder="Exprimez-vous 1000 caractères maximum"
						value={description || ''}
						onChange={(event) => setDescription(event.target.value)}
						aria-label="Exprimez-vous 1000 caractères maximum"
						maxLength={1000}
						required
					>
					</textarea>
					<p>{description?.length}/1000</p>
				</label>
				{errorMessage && <p className="modal__error">{errorMessage}</p>}
				{confirmationMessage && <p className="modal__confirmation">{confirmationMessage}</p>}
				<div className="modal__container__button">
					<button
						className="modal__delete"
						onClick={() => {
							setConfirmationMessage('');
							setIsOpenModal(false);
						}}
					>
							Fermer
					</button>
					<button
						className="modal__accept"
						onClick={() => {
							handleAccept(description, email, first_name, last_name, enterprise);
						}}
					>
							Envoyer
					</button>
				</div>
			</div>
		</ReactModal>
	);
};