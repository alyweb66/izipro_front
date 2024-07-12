
//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
import Spinner from './Spinner';
import { userDataStore } from '../../store/UserData';
import '../../styles/rulesModal.scss';
ReactModal.setAppElement('#root');

interface DeleteItemModalProps {
	loading?: boolean;
	isCookie?: boolean;
	content: string;
	isOpenModal: boolean;
	setIsOpenModal: (value: boolean) => void;
	handleAccept: (localConsents?: string, acceptAll?: boolean | null) => void;
	handleLogout?: (userId: number) => void;
}

export const RulesModal: React.FC<DeleteItemModalProps> = ({
	loading,
	isCookie,
	content,
	isOpenModal,
	setIsOpenModal,
	handleAccept,
	handleLogout,
}) => {
	const [id, CGU] = userDataStore((state) => [state.id, state.CGU]);

	return (
		<ReactModal
			className="rules-modal"
			isOpen={isOpenModal}
			contentLabel="Delete Account"
			shouldCloseOnOverlayClick={false}
			aria-label={isCookie ? 'Accepter les cookies' : 'Conditions générales d utilisation'}
		>
			<div className="rules-modal__container">
				{/* <h1 className="modal__title">CGU</h1> */}
				{loading ? <Spinner/> :
					<div className="rules-modal__container__content">
						<p className="rules-modal__container__content__description" dangerouslySetInnerHTML={{ __html: content }}></p>
					</div>
				}
				{isCookie ? (
					<div className="rules-modal__container__button">
						<button
							className="rules-modal__accept"
							onClick={() => {
								handleAccept(undefined, true);
							}}
						>
							Tout accepter
						</button>
						<button
							className="rules-modal__cancel"
							onClick={() => {
								handleAccept(undefined, false);
							}}
						>
							Nécessaire seulement
						</button>
						{localStorage.getItem('cookieConsents') && 
						<button
							className="rules-modal__close"
							onClick={() => {
								setIsOpenModal(false);
							}}
						>
								Fermer
						</button>
						}
						
					</div>
				) : (
					<div className="rules-modal__container__button">
						{id && !CGU ? (
							<>
								<button
									className="rules-modal__accept"
									onClick={() => {
										handleAccept();
									}}
								>
									Accepter
								</button>
								<button
									className="rules-modal__cancel"
									onClick={() => {
										setIsOpenModal(false);
										if (handleLogout) handleLogout(id);
									}}
								>
									Refuser
								</button>
							</>
						) : (
							<button
								className="rules-modal__close"
								onClick={() => {
									setIsOpenModal(false);
								}}
							>
								Fermer
							</button>
						)}
					</div>
				)}
			</div>
		</ReactModal>
	);
};