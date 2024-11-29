import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Spinner from './Spinner';
import { userDataStore } from '../../store/UserData';
import '../../styles/rulesModal.scss';
import Backdrop from '@mui/material/Backdrop';
import { useShallow } from 'zustand/shallow';

type DeleteItemModalProps = {
  loading?: boolean;
  isCookie?: boolean;
  content: string;
  isOpenModal: boolean;
  setIsOpenModal: (value: boolean) => void;
  handleAccept: (localConsents?: string, acceptAll?: boolean | null) => void;
  handleLogout?: (userId: number) => void;
};

export const RulesModal: React.FC<DeleteItemModalProps> = ({
  loading,
  isCookie,
  content,
  isOpenModal,
  setIsOpenModal,
  handleAccept,
  handleLogout,
}) => {
  const [id, CGU] = userDataStore(useShallow((state) => [state.id, state.CGU]));

  const closeModal = () => {
    setIsOpenModal(false);
  };
  return (
    <Modal
      className="rules-modal"
      open={isOpenModal}
      onClose={closeModal}
      aria-labelledby="rules-modal-title"
      aria-describedby="rules-modal-description"
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 300,
        },
      }}
    >
      <Fade in={isOpenModal}>
        <div key="rules-modal" className="rules-modal__container">
          <header className="rules-modal-header">
            <h1 id="rules-modal-title" className="modal__title">
              {isCookie
                ? 'Accepter les cookies'
                : "Conditions générales d'utilisation"}
            </h1>
          </header>
          <section className="rules-modal-description">
            {loading ? (
              <Spinner />
            ) : (
              <div className="rules-modal__container__content">
                <p
                  className="rules-modal__container__content__description"
                  dangerouslySetInnerHTML={{
                    __html: content || 'Empty...',
                  }}
                ></p>
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
        </div>
      </Fade>
    </Modal>
  );
};
