//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
ReactModal.setAppElement('#root');

import '../../styles/deleteItemModal.scss';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ModalArgs {
	//event: React.MouseEvent;
	requestId: number;
	requestTitle: string;
}

interface DeleteItemModalProps {
	isSessionExpired?: boolean;
	isDeleteUser?: boolean;
	modalArgs?: ModalArgs | null;
	setModalArgs?: (args: ModalArgs | null) => void;
	setDeleteItemModalIsOpen: (isOpen: boolean) => void;
	deleteItemModalIsOpen: boolean;
	handleDeleteItem: (requestId?: number) => void;
}

export const DeleteItemModal: React.FC<DeleteItemModalProps> = ({
	isSessionExpired,
	isDeleteUser,
	modalArgs,
	setModalArgs,
	setDeleteItemModalIsOpen,
	deleteItemModalIsOpen,
	handleDeleteItem
}) => {

	const [isVisible, setIsVisible] = useState(deleteItemModalIsOpen);

	useEffect(() => {
		if (deleteItemModalIsOpen) {
			setIsVisible(true);
		}
	}, [deleteItemModalIsOpen]);

	const closeModal = () => {
		setIsVisible(false);
		setTimeout(() => {
			setDeleteItemModalIsOpen(false);
			setModalArgs && setModalArgs(null);
		}, 200); // time must be equal to the exit transition duration
	};

	return (
		<ReactModal
			className="delete-item-modal"
			isOpen={deleteItemModalIsOpen}
			contentLabel="Delete Account"
			shouldCloseOnOverlayClick={false}
			aria-label="supprimer mon compte"
		>
			<AnimatePresence>
				{isVisible && (
					<motion.div
						key="modal"
						className="delete-item-modal__container"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						transition={{ duration: 0.2, type: 'Inertia', stiffness: 50 }}
					>
						{isSessionExpired ? (
							<h1 className="delete-item-modal__container__title">VOTRE SESSION A EXPIRÉ</h1>
						) : (
							<h1 className="delete-item-modal__container__title">ATTENTION!!</h1>
						)}
						{isDeleteUser &&
							<p className="delete-item-modal__container__description">Vous allez supprimer votre compte definitevement, êtes vous sur?</p>
						}
						{isSessionExpired &&
							<p className="delete-item-modal__container__description">Par mesure de sécurité, vous allez être redirigés vers l&apos;accueil pour vous identifier</p>
						}
						{!isDeleteUser && !isSessionExpired &&
							<p className="delete-item-modal__container__description">Vous allez supprimer la demande <span className="modal-args">{modalArgs?.requestTitle}</span> , êtes vous sur?</p>
						}
						{isSessionExpired ? (
							<div className="delete-item-modal__container__container__button">
							<button
								className="delete-item-modal__container__container__button__cancel"
								onClick={(event) => {
									event.stopPropagation();
									event.preventDefault();
									//setDeleteItemModalIsOpen(!deleteItemModalIsOpen);
									handleDeleteItem();
									closeModal();
								}}
							>
								Ok
							</button>
						</div>	
						) : (
							<div className="delete-item-modal__container__container__button">
								<button
									className="delete-item-modal__container__container__button__delete"
									onClick={(event) => {
										event.stopPropagation();
										event.preventDefault();
										if (modalArgs?.requestId) {
											handleDeleteItem(modalArgs.requestId);
											closeModal();
										}
									}}
								>
									Supprimer
								</button>
								<button
									className="delete-item-modal__container__container__button__cancel"
									onClick={(event) => {
										event.stopPropagation();
										event.preventDefault();
										//setDeleteItemModalIsOpen(!deleteItemModalIsOpen);
										setModalArgs && setModalArgs(null);
										closeModal();
									}}
								>
									Annuler
								</button>
							</div>
							
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</ReactModal >
	);
};