
//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
import Spinner from './Spinner';
import { userDataStore } from '../../store/UserData';
//import Spinner from './Spinner';
ReactModal.setAppElement('#root');

/* interface ModalArgs {
	event: React.MouseEvent;
	requestId: number;
} */

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
	console.log('id in modal', id);
	
	return (
		<ReactModal
			className="modal"
			isOpen={isOpenModal}
			contentLabel="Delete Account"
			shouldCloseOnOverlayClick={false}
			aria-label="supprimer mon compte"
		>
			<div className="modal__container">
				{/* <h1 className="modal__title">CGU</h1> */}
				{loading ? <Spinner/> :
					<p className="modal__description" dangerouslySetInnerHTML={{ __html: content }}></p>
				}
				{isCookie ? (
					<div className="modal__container__button">
						<button
							className="modal__delete"
							onClick={() => {
								handleAccept(undefined, true);
							}}
						>
							Tout accepter
						</button>
						<button
							className="modal__cancel"
							onClick={() => {
								handleAccept(undefined, false);
							}}
						>
							Nécessaire seulement
						</button>
						{localStorage.getItem('cookieConsents') && 
						<button
							className="modal__cancel"
							onClick={() => {
								setIsOpenModal(false);
							}}
						>
								Fermer
						</button>
						}
						
					</div>
				) : (
					<div className="modal__container__button">
						{id && !CGU ? (
							<>
								<button
									className="modal__delete"
									onClick={() => {
										handleAccept();
									}}
								>
									Accepter
								</button>
								<button
									className="modal__cancel"
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
								className="modal__cancel"
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