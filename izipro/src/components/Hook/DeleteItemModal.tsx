//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
ReactModal.setAppElement('#root');

import '../../styles/deleteItemModal.scss';

interface ModalArgs {
    event: React.MouseEvent;
    requestId: number;
}

interface DeleteItemModalProps {
    modalArgs: ModalArgs | null;
    setModalArgs: (args: ModalArgs | null) => void;
    setDeleteItemModalIsOpen: (isOpen: boolean) => void;
    deleteItemModalIsOpen: boolean;
    handleDeleteRequest: (event: React.MouseEvent, requestId: number) => void;
}

export const DeleteItemModal: React.FC<DeleteItemModalProps> = ({
	modalArgs, 
	setModalArgs, 
	setDeleteItemModalIsOpen, 
	deleteItemModalIsOpen, 
	handleDeleteRequest
}) => {
	return (
		<ReactModal
			className="delete-item-modal"
			isOpen={deleteItemModalIsOpen}
			contentLabel="Delete Account"
			shouldCloseOnOverlayClick={false}
			aria-label="supprimer mon compte"
		>
			<div className="delete-item-modal__container">
				<h1 className="delete-item-modal__container__title">ATTENTION!!</h1>
				<p className="delete-item-modal__container__description">Vous allez supprimer cette demande, êtes vous sur?</p>
				<div className="delete-item-modal__container__container__button">
					<button 
						className="delete-item-modal__container__container__button__delete" 
						onClick={() => {
							if (modalArgs?.event && modalArgs?.requestId) {
								handleDeleteRequest(modalArgs.event, modalArgs.requestId);
								setDeleteItemModalIsOpen(!deleteItemModalIsOpen);
							}
						}}
					>
            Supprimer
					</button>
					<button 
						className="delete-item-modal__container__container__button__cancel" 
						onClick={() => {
							setDeleteItemModalIsOpen(!deleteItemModalIsOpen);
							setModalArgs(null);
						}}
					>
            Annuler
					</button>
				</div>
			</div>
		</ReactModal>
	);
};