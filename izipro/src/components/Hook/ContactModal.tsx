// Bibliothèques et composants externes
//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
import Spinner from './Spinner';

// Hooks React
import React, { useEffect, useState } from 'react';

// Apollo Client
import { useMutation } from '@apollo/client';
import { CONTACT_MUTATION } from '../GraphQL/MessageMutation';

// Bibliothèques externes
import DOMPurify from 'dompurify';
import validator from 'validator';


// style
import '../../styles/contactModal.scss';
import TextareaAutosize from 'react-textarea-autosize';
import { motion, AnimatePresence } from 'framer-motion';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import { userDataStore } from '../../store/UserData';


ReactModal.setAppElement('#root');

type DeleteItemModalProps = {
	isOpenModal: boolean;
	setIsOpenModal: (value: boolean) => void;
}

export const ContactModal: React.FC<DeleteItemModalProps> = ({
	isOpenModal,
	setIsOpenModal,

}) => {

	// Mutation 
	const [contactEmail, { loading: contactEmailLoading, error: contactEmailError }] = useMutation(CONTACT_MUTATION);
	const [firstName, lastName, denomination, emailStore] = userDataStore((state) => [state.first_name, state.last_name, state.denomination, state.email]);
	//state
	const [description, setDescription] = useState<string>('');
	const [first_name, setFirstName] = useState<string>(firstName || '');
	const [last_name, setLastName] = useState<string>(lastName || '');
	const [enterprise, setEnterprise] = useState<string>(denomination || '');
	const [email, setEmail] = useState<string>(emailStore || '');
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [confirmationMessage, setConfirmationMessage] = useState<string>('');

	// Store

	const handleAccept = (event: React.FormEvent<HTMLFormElement>/* description: string, email: string, first_name?: string, last_name?: string, enterprise?: string */) => {
		event.preventDefault();
		console.log('send email');
		if ((first_name && last_name || enterprise) && description && email) {

			if (!validator.isEmail(email)) {
				setErrorMessage('Email invalide');
				return;
			}

			contactEmail({
				variables: {
					input: {
						first_name,
						last_name,
						enterprise,
						email,
						description
					}
				}
			}).then(() => {
				setDescription('');
				setFirstName('');
				setLastName('');
				setEnterprise('');
				setEmail('');
				setErrorMessage('');
				setConfirmationMessage('Message envoyé');
			});

			if (contactEmailError) {
				throw new Error('Error sending message');
			}
		} else {
			setErrorMessage('Veuillez remplir tous les champs (nom, prénom et/ou société, email, message)');

		}
	};

	const [isVisible, setIsVisible] = useState(isOpenModal);

	useEffect(() => {
		if (isOpenModal) {
			setIsVisible(true);
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}

		// Cleanup function to reset the overflow style
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpenModal]);

	const closeModal = () => {
		console.log('close modal');
		
		setConfirmationMessage('');
		setErrorMessage('');
		setIsVisible(false);
		setTimeout(() => {
			setIsOpenModal(false);

		}, 300); // time must match the exit animation duration
	};

	return (
		<ReactModal
			className="contact-modal"
			isOpen={isOpenModal}
			contentLabel="Delete Account"
			shouldCloseOnOverlayClick={false}
			aria-labelledby="contact-modal-title"
			aria-describedby="contact-modal-description"
			overlayClassName="contact-modal__overlay"
		>
			<AnimatePresence>
				{isVisible && (
					<motion.form
						className="contact-modal__container"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						transition={{ duration: 0.2, type: 'Inertia', stiffness: 50 }}
						onSubmit={(event) => handleAccept(event)}
					>
						{contactEmailLoading && <Spinner />}
						{/* <div className="contact-modal__container__content"> */}
						<header>
							<h1 id="contact-modal-title" className="contact-modal__container__content__title">CONTACT</h1>
							<p id="contact-modal-description" className="contact-modal__container__content__subtitle">Veuillez remplir votre nom et prénom ou votre société</p>
						</header>
						<section className="contact-modal__container__content__section">
							<label className="contact-modal__container__content__label">
								Nom
								<input
									className="contact-modal__container__content__label__input"
									type="text"
									name="last_name"
									value={last_name || ''}
									placeholder={'Nom'}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLastName(DOMPurify.sanitize(event.target.value))}
									aria-label="Nom"
									maxLength={50}
								/>
							</label>
							<label className="contact-modal__container__content__label">
								Prénom
								<input
									className="contact-modal__container__content__label__input"
									type="text"
									name="first_name"
									value={first_name || ''}
									placeholder={'Prénom'}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFirstName(DOMPurify.sanitize(event.target.value))}
									aria-label="Prénom"
									maxLength={50}
								/>
							</label>
							<p className="contact-modal__container__content__subtitle">Ou</p>
							<label className="contact-modal__container__content__label">
								Société
								<input
									className="contact-modal__container__content__label__input"
									type="text"
									name="enterprise"
									value={enterprise || ''}
									placeholder={'Société'}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEnterprise(DOMPurify.sanitize(event.target.value))}
									aria-label="Société"
									maxLength={50}
								/>
							</label>
							<label className="contact-modal__container__content__label email">
								Email
								<input
									className="contact-modal__container__content__label__input "
									type="text"
									name="email"
									value={email || ''}
									placeholder={'Email'}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(DOMPurify.sanitize(event.target.value))}
									aria-label="Email"
									maxLength={50}
									//required
								/>
							</label>
							<label className="contact-modal__container__content__label textarea">
								Message
								<TextareaAutosize
									className="contact-modal__container__content__label__input textarea"
									name="description"
									id="description"
									placeholder="Exprimez-vous 1000 caractères maximum"
									value={description || ''}
									onChange={(event) => setDescription(DOMPurify.sanitize(event.target.value))}
									aria-label="Exprimez-vous 1000 caractères maximum"
									maxLength={1000}
								
								>
								</TextareaAutosize>
								<p>{description?.length}/1000</p>
							</label>
						</section>
						{/* </div> */}
						<div className="message">
							<Stack sx={{ width: '100%' }} spacing={2}>
								{errorMessage && (
									<Fade in={!!errorMessage} timeout={300}>
										<Alert variant="filled" severity="error">{errorMessage}</Alert>
									</Fade>
								)}
							</Stack>
							<Stack sx={{ width: '100%' }} spacing={2}>
								{confirmationMessage && (
									<Fade in={!!confirmationMessage} timeout={300}>
										<Alert variant="filled" severity="success">{confirmationMessage}</Alert>
									</Fade>
								)}
							</Stack>

						</div>
						<footer className="contact-modal__container__button">
							<button
								className="contact-modal__close"
								type='button'
								onClick={() => {
									closeModal();
								}}
							>
								Fermer
							</button>
							<button
								className="contact-modal__accept"
								type="submit"
							>
								Envoyer
							</button>

						</footer>
					</motion.form>
				)}
			</AnimatePresence>
		</ReactModal>
	);
};