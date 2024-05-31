//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
ReactModal.setAppElement('#root');

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
			className="modal"
			isOpen={deleteItemModalIsOpen}
			contentLabel="Delete Account"
			shouldCloseOnOverlayClick={false}
			aria-label="supprimer mon compte"
		>
			<div className="modal__container">
				<h1 className="modal__title">ATTENTION!!</h1>
				<p className="modal__description">Vous allez supprimer cette demande, êtes vous sur?</p>
				<div className="modal__container__button">
					<button 
						className="modal__delete" 
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
						className="modal__cancel" 
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