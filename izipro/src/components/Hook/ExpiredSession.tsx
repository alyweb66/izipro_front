//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
ReactModal.setAppElement('#root');
import '../../styles/expiredSessionModal.scss';


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
			className="expired-session-modal"
			isOpen={isExpiredSession}
			contentLabel="Delete Account"
			shouldCloseOnOverlayClick={false}
			aria-label="supprimer mon compte"
		>
			<div className="expired-session-modal__container">
				<h1 className="expired-session-modal__container__title">VOTRE SESSION A EXPIRÉ</h1>
				<p className="expired-session-modal__container__description">Par mesure de sécurité, vous allez être redirigés vers l&apos;accueil pour vous identifier</p>
				<div className="expired-session-modal__container__button">
					<button 
						className="expired-session-modal__container__button__validate" 
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