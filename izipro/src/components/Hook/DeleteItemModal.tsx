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
    modalArgs: ModalArgs | null;
    setModalArgs: (args: ModalArgs | null) => void;
    setDeleteItemModalIsOpen: (isOpen: boolean) => void;
    deleteItemModalIsOpen: boolean;
    handleDeleteRequest: (requestId: number) => void;
}

export const DeleteItemModal: React.FC<DeleteItemModalProps> = ({
	modalArgs, 
	setModalArgs, 
	setDeleteItemModalIsOpen, 
	deleteItemModalIsOpen, 
	handleDeleteRequest
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
			setModalArgs(null);
		}, 300); // La durée doit correspondre à celle de l'animation de sortie
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
						animate={{opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						transition={{duration: 0.2, type: 'Inertia', stiffness: 50 }}
					>
						<h1 className="delete-item-modal__container__title">ATTENTION!!</h1>
						<p className="delete-item-modal__container__description">Vous allez supprimer la demande <span className="modal-args">{modalArgs?.requestTitle}</span> , êtes vous sur?</p>
						<div className="delete-item-modal__container__container__button">
							<button 
								className="delete-item-modal__container__container__button__delete" 
								onClick={(event) => {
									event.stopPropagation();
									event.preventDefault();
									if (modalArgs?.requestId) {
										handleDeleteRequest( modalArgs.requestId);
										//setDeleteItemModalIsOpen(!deleteItemModalIsOpen);
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
									setModalArgs(null);
									closeModal();
								}}
							>
            Annuler
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</ReactModal>
	);
};