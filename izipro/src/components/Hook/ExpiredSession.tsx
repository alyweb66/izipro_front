//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
ReactModal.setAppElement('#root');


type DeleteItemModalProps = {
	isExpiredSession: boolean;
	setIsExpiredSession: (value: boolean) => void;
    RedirectExpiredSession: () => void;
}

export const ExpiredSessionModal: React.FC<DeleteItemModalProps> = ({ 
	isExpiredSession,
	setIsExpiredSession,
	RedirectExpiredSession
}) => {
	return (
		<ReactModal
			className="modal"
			isOpen={isExpiredSession}
			contentLabel="Delete Account"
			shouldCloseOnOverlayClick={false}
			aria-label="supprimer mon compte"
		>
			<div className="modal__container">
				<h1 className="modal__title">VOTRE SESSION A EXPIRÉ</h1>
				<p className="modal__description">Par mesure de sécurité, vous allez être redirigés vers l&apos;accueil pour vous identifier</p>
				<div className="modal__container__button">
					<button 
						className="modal__delete" 
						onClick={() => {
							RedirectExpiredSession();
							setIsExpiredSession(false);
						}}
					>
						Ok
					</button>
				</div>
			</div>
		</ReactModal>
	);
};