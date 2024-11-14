
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';

import '../../styles/deleteItemModal.scss';

type ModalArgs = {
  //event: React.MouseEvent;
  requestId: number;
  requestTitle: string;
};

type DeleteItemModalProps = {
  isMultipleLogout?: boolean;
  isSessionExpired?: boolean;
  isDeleteUser?: boolean;
  modalArgs?: ModalArgs | null;
  setModalArgs?: (args: ModalArgs | null) => void;
  setDeleteItemModalIsOpen: (isOpen: boolean) => void;
  deleteItemModalIsOpen: boolean;
  handleDeleteItem: (requestId?: number) => void;
};

export const DeleteItemModal: React.FC<DeleteItemModalProps> = ({
  isMultipleLogout,
  isSessionExpired,
  isDeleteUser,
  modalArgs,
  setModalArgs,
  setDeleteItemModalIsOpen,
  deleteItemModalIsOpen,
  handleDeleteItem,
}) => {

  const closeModal = () => {
    setDeleteItemModalIsOpen(false);
    setModalArgs && setModalArgs(null);
  };

  return (
    <Modal
      className="delete-item-modal"
      open={deleteItemModalIsOpen}
      onClose={closeModal}
      aria-labelledby="delete-item-modal-title"
      aria-describedby="delete-item-modal-description"
    >
      <Fade in={deleteItemModalIsOpen} timeout={300}>
        <div key="modal" className="delete-item-modal__container">
          <header>
            {isMultipleLogout || isSessionExpired ? (
              <h1 className="delete-item-modal__container__title">
                VOTRE SESSION A EXPIRÉ
              </h1>
            ) : (
              <h1 className="delete-item-modal__container__title">
                ATTENTION!!
              </h1>
            )}
          </header>
          <section>
            {isDeleteUser && (
              <p className="delete-item-modal__container__description">
                Vous allez supprimer votre compte definitevement, êtes vous sur?
              </p>
            )}
            {isMultipleLogout && (
              <p className="delete-item-modal__container__description">
                Connexion à 2 comptes impossible sur le même navigateur. Vous
                serez redirigé vers l&apos;accueil pour vous reconnecter.
              </p>
            )}
            {isSessionExpired && (
              <p className="delete-item-modal__container__description">
                Un problème est survenu, par mesure de sécurité vous allez être
                redirigés vers l&apos;accueil pour vous identifier
              </p>
            )}
            {!isDeleteUser && (isMultipleLogout || !isSessionExpired) && (
              <p className="delete-item-modal__container__description">
                Vous allez supprimer la demande{' '}
                <span className="modal-args">{modalArgs?.requestTitle}</span> ,
                êtes vous sur?
              </p>
            )}
          </section>
          <footer>
            {isMultipleLogout || isSessionExpired ? (
              <div className="delete-item-modal__container__container__button">
                <button
                  className="delete-item-modal__container__container__button__cancel"
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    handleDeleteItem();
                    closeModal();
                  }}
                  aria-label="Confirmer la suppression"
                >
                  Ok
                </button>
              </div>
            ) : (
              <div className="delete-item-modal__container__container__button">
                <button
                  className="delete-item-modal__container__container__button__delete"
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    if (modalArgs?.requestId) {
                      handleDeleteItem(modalArgs.requestId);
                      closeModal();
                    }
                    if (isDeleteUser) {
                      handleDeleteItem();
                      closeModal();
                    }
                  }}
                  aria-label="Supprimer la demande"
                >
                  Supprimer
                </button>
                <button
                  className="delete-item-modal__container__container__button__cancel"
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    //setDeleteItemModalIsOpen(!deleteItemModalIsOpen);
                    setModalArgs && setModalArgs(null);
                    closeModal();
                  }}
                  aria-label="Annuler la suppression"
                >
                  Annuler
                </button>
              </div>
            )}
          </footer>
        </div>
      </Fade>
    </Modal>
  );
};
