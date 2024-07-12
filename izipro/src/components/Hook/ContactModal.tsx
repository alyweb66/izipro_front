// Bibliothèques et composants externes
//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
import Spinner from './Spinner';

// Hooks React
import { useState } from 'react';

// Apollo Client
import { useMutation } from '@apollo/client';
import { CONTACT_MUTATION } from '../GraphQL/MessageMutation';

// Bibliothèques externes
import DOMPurify from 'dompurify';
import validator from 'validator';


// style
import '../../styles/contactModal.scss';
import TextareaAutosize from 'react-textarea-autosize';

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
	const [contactEmail, { loading: contactEmailLoading, error: contactEmailError }] = useMutation(CONTACT_MUTATION);
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
			setErrorMessage('Veuillez remplir tous les champs (nom et prénom et/ou société, email, message)');
			setTimeout(() => {
				setErrorMessage('');
			}, 5000);
		}
	};

	return (
		<ReactModal
			className="contact-modal"
			isOpen={isOpenModal}
			contentLabel="Delete Account"
			shouldCloseOnOverlayClick={false}
			aria-label="supprimer mon compte"
		>
			<div className="contact-modal__container">
				{contactEmailLoading && <Spinner />}
				<div className="contact-modal__container__content">
					<h1 className="contact-modal__container__content__title">CONTACT</h1>
					<p className="contact-modal__container__content__subtitle">Veuillez remplire votre nom et prénom ou votre société</p>
					<label className="contact-modal__container__content__label">
						Nom:
						<input
							className="contact-modal__container__content__label__input"
							type="text"
							name="last_name"
							value={last_name || ''}
							placeholder={'Nom' || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLastName(event.target.value)}
							aria-label="Nom"
							maxLength={50}
						/>
					</label>
					<label className="contact-modal__container__content__label">
						Prénom:
						<input
							className="contact-modal__container__content__label__input"
							type="text"
							name="first_name"
							value={first_name || ''}
							placeholder={'Prénom' || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFirstName(event.target.value)}
							aria-label="Prénom"
							maxLength={50}
						/>
					</label>
					<p className="contact-modal__container__content__subtitle">Ou</p>
					<label className="contact-modal__container__content__label">
						Société:
						<input
							className="contact-modal__container__content__label__input"
							type="text"
							name="enterprise"
							value={enterprise || ''}
							placeholder={'Société' || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEnterprise(event.target.value)}
							aria-label="Société"
							maxLength={50}
						/>
					</label>
					<label className="contact-modal__container__content__label email">
						Email:
						<input
							className="contact-modal__container__content__label__input "
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
					<label className="contact-modal__container__content__label textarea">
						Message:
						<TextareaAutosize
							className="contact-modal__container__content__label__input textarea"
							name="description"
							id="description"
							placeholder="Exprimez-vous 1000 caractères maximum"
							value={description || ''}
							onChange={(event) => setDescription(event.target.value)}
							aria-label="Exprimez-vous 1000 caractères maximum"
							maxLength={1000}
							required
						>
						</TextareaAutosize>
						<p>{description?.length}/1000</p>
					</label>
					{errorMessage && <p className="contact-modal__container__error">{errorMessage}</p>}
					{confirmationMessage && <p className="contact-modal__container__confirmation">{confirmationMessage}</p>}
				</div>

				<div className="contact-modal__container__button">
					<button
						className="contact-modal__close"
						onClick={() => {
							setConfirmationMessage('');
							setIsOpenModal(false);
						}}
					>
						Fermer
					</button>
					<button
						className="contact-modal__accept"
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