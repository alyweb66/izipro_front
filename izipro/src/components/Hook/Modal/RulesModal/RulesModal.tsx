import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Spinner from '../../Components/Spinner/Spinner';
import { userDataStore } from '../../../../store/UserData';
import './rulesModal.scss';
import Backdrop from '@mui/material/Backdrop';
import { useShallow } from 'zustand/shallow';

type DeleteItemModalProps = {
  loading?: boolean;
  isLegalNotices?: boolean;
  setIsLegalNotices?: (value: boolean) => void;
  content: string;
  isOpenModal: boolean;
  setIsOpenModal: (value: boolean) => void;
  handleAccept: (localConsents?: string, acceptAll?: boolean | null) => void;
  handleLogout?: (userId: number) => void;
};

export const RulesModal: React.FC<DeleteItemModalProps> = ({
  loading,
  isLegalNotices,
  setIsLegalNotices,
  content,
  isOpenModal,
  setIsOpenModal,
  handleAccept,
  handleLogout,
}) => {
  const [id, CGU] = userDataStore(useShallow((state) => [state.id, state.CGU]));

  const closeModal = () => {
    setIsOpenModal(false);
    setTimeout(() => {
      setIsLegalNotices && setIsLegalNotices(false);
    }, 200);
  };
  return (
    <Modal
      className="rules-modal"
      open={isOpenModal}
      onClose={closeModal}
      aria-labelledby="rules-modal-title"
      aria-describedby="rules-modal-description"
      container={document.body}
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
            {isLegalNotices ? (
              <>
                <h1 id="rules-modal-title" className="modal__title">
                  Mentions légales
                </h1>
              </>
            ) : (
              <>
                <h1 id="rules-modal-title" className="modal__title">
                  Conditions générales d'utilisation
                </h1>
              </>
            )}
          </header>
          <section className="rules-modal-description">
            {loading ? (
              <Spinner />
            ) : isLegalNotices ? (
              <div className="rules-modal__container__content">
                <div className="rules-modal__container__content__description">
                  <h2 className="rules-subtitle">Éditeur du Site</h2>
                  <p className="rules-description">
                    {' '}
                    NOM : [Votre Nom ou Nom de l'Entreprise]
                    <br />
                    ADRESSE : [Votre Adresse]
                    <br />
                    EMAIL : <a href="mailto:[Votre Email]">[Votre Email]</a>
                    <br /> TEL : [Votre Numéro de Téléphone]{' '}
                  </p>
                  <h2 className="rules-subtitle">Hébergeur du Site</h2>
                  <p className="rules-description">
                    {' '}
                    NOM : Hostinger International Ltd.
                    <br />
                    ADRESSE : 61 Lordou Vironos Street, 6023 Larnaca, Chypre
                    <br />
                    TEL : +370 5 204 1905
                  </p>
      
                </div>
              </div>
            ) : (
              <div className="rules-modal__container__content">
                <div
                  className="rules-modal__container__content__description"
                  dangerouslySetInnerHTML={{
                    __html: content || 'Empty...',
                  }}
                ></div>
              </div>
            )}
          </section>
          <footer className="rules-modal__container__button">
            {isLegalNotices ? (
              <>
                <button
                  className="rules-modal__close"
                  onClick={() => {
                    closeModal();
                  }}
                  aria-label="Fermer"
                >
                  Fermer
                </button>
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
