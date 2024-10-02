
//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
import Spinner from './Spinner';
import { userDataStore } from '../../store/UserData';
import '../../styles/rulesModal.scss';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
ReactModal.setAppElement('#root');

type DeleteItemModalProps = {
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
	const [isVisible, setIsVisible] = useState(isOpenModal);

	useEffect(() => {
		if (isOpenModal) {
			setIsVisible(true);
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		// Cleanup function to reset the overflow style
		return () => {
			document.body.style.overflow = 'unset';
		};

	}, [isOpenModal]);

	const closeModal = () => {
		setIsVisible(false);
		setTimeout(() => {
			setIsOpenModal(false);

		}, 300); // time must match the exit animation duration
	};
	return (
		<ReactModal
			className="rules-modal"
			isOpen={isOpenModal}
			contentLabel={isCookie ? 'Accepter les cookies' : 'Conditions générales d\'utilisation'}
			shouldCloseOnOverlayClick={false}
			aria-labelledby="rules-modal-title"
			aria-describedby="rules-modal-description"
			overlayClassName="rules-modal__overlay"
		>
			<AnimatePresence>
				{isVisible && (
					<motion.div
						key="rules-modal"
						className="rules-modal__container"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						transition={{ duration: 0.2, type: 'Inertia', stiffness: 50 }}
					>
						<header className="rules-modal-header">
							<h1 id="rules-modal-title" className="modal__title">
								{isCookie ? 'Accepter les cookies' : 'Conditions générales d\'utilisation'}
							</h1>
						</header>
						<section className="rules-modal-description">
							{loading ? <Spinner /> : (
								<div className="rules-modal__container__content">
									<p className="rules-modal__container__content__description" dangerouslySetInnerHTML={{ __html: content || 'Empty...' }}></p>
								</div>
							)}
						</section>
						<footer className="rules-modal__container__button">
							{isCookie ? (
								<>
									<button
										className="rules-modal__accept"
										onClick={() => {
											closeModal();
											handleAccept(undefined, true);
										}}
										aria-label="Tout accepter"
									>
										Tout accepter
									</button>
									<button
										className="rules-modal__cancel"
										onClick={() => {
											closeModal();
											handleAccept(undefined, false);
										}}
										aria-label="Nécessaire seulement"
									>
										Nécessaire seulement
									</button>
									{localStorage.getItem('cookieConsents') && (
										<button
											className="rules-modal__close"
											onClick={() => {
												closeModal();
											}}
											aria-label="Fermer"
										>
											Fermer
										</button>
									)}
								</>
							) : (
								<>
									{id && !CGU ? (
										<>
											<button
												className="rules-modal__accept"
												onClick={() => {
													closeModal();
													handleAccept();
												}}
												aria-label="Accepter"
											>
												Accepter
											</button>
											<button
												className="rules-modal__cancel"
												onClick={() => {
													closeModal();
													if (handleLogout) handleLogout(id);
												}}
												aria-label="Refuser"
											>
												Refuser
											</button>
										</>
									) : (
										<button
											className="rules-modal__close"
											onClick={() => {
												closeModal();
											}}
											aria-label="Fermer"
										>
											Fermer
										</button>
									)}
								</>
							)}
						</footer>
					</motion.div>
				)}
			</AnimatePresence>
		</ReactModal>
	);

};