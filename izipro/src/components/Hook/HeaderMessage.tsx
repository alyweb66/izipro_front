import { MdKeyboardArrowDown, MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { UserDataProps } from "../../Type/User";
import logoProfile from "/logos/logo-profile.webp";
import noPicture from "/logos/no-picture.webp";
import '../../styles/HeaderMessage.scss'
import { RequestProps } from "../../Type/Request";
import { requestDataStore } from "../../store/Request";

type HeaderMessageProps = {
    setUserDescription?: (value: boolean) => void;
    userDescription?: boolean;
    selectedItem?: UserDataProps | RequestProps | null;
    setSelectedItem?: React.Dispatch<React.SetStateAction<UserDataProps | null>> | React.Dispatch<React.SetStateAction<RequestProps | null>>;
    isMyRequest?: boolean;
    setRequestTitle?: (value: boolean) => void;
    requestTitle?: boolean;
    isMyConversation?: boolean;
    setIsEndViewed?: (value: boolean) => void;
    setIsListOpen: (value: boolean) => void;
    setIsAnswerOpen?: (value: boolean) => void;
    setIsMessageOpen: (value: boolean) => void;
    handleNavigate?: (value?: boolean) => void;
    setConversationIdState?: (value: number) => void;

}
export const HeaderMessage = ({
    setUserDescription,
    userDescription,
    selectedItem,
    isMyRequest,
    isMyConversation,
    setIsAnswerOpen,
    setRequestTitle,
    requestTitle,
    setIsEndViewed,
    setIsListOpen,
    setIsMessageOpen,
    setSelectedItem,
    handleNavigate,
    setConversationIdState
}: HeaderMessageProps) => {
    const [request, resetRequest] = requestDataStore((state) => [state.request, state.resetRequest]);

    return (
        <div className="header-message__user" aria-label="Détails de l'utilisateur" >
            <div
                className="header-message__user__header"
                onClick={(event) => {
                    event.stopPropagation();
                    if (isMyRequest) {
                        setUserDescription && setUserDescription(!userDescription);
                    }

                    if (isMyConversation) {
                        setRequestTitle && setRequestTitle(!requestTitle);
                    }
                }}
            >
                <div
                    className="header-message__user__header__detail"
                >
                    <MdKeyboardArrowLeft
                        className="header-message__user__header__detail return"
                        onClick={(event) => {
                            event.stopPropagation();

                            if (isMyRequest && window.innerWidth < 1000) {
                                setConversationIdState && setConversationIdState(0);
                                setIsEndViewed && setIsEndViewed(false);
                                setIsMessageOpen(false);
                                setTimeout(() => {
                                    setIsListOpen(false);
                                    setIsAnswerOpen && setIsAnswerOpen(true);
                                }, 200);
                            }

                            setSelectedItem && setSelectedItem(null);

                            if (isMyConversation && window.innerWidth < 780) {
                                if (request?.id > 0) {
                                    resetRequest();
                                    handleNavigate && handleNavigate(true);
                                }

                                setIsEndViewed && setIsEndViewed(false);
                                setIsMessageOpen(false);
                                setTimeout(() => {
                                    setIsListOpen(true);
                                }, 200);
                            }
                        }}
                        aria-label="Retour à la liste"
                    />
                    <img
                        className="header-message__user__header__detail img"
                        src={selectedItem?.image ? selectedItem.image : logoProfile}
                        onError={(event) => {
                            event.currentTarget.src = noPicture;
                        }}
                        alt={selectedItem?.denomination ? selectedItem.denomination : `${selectedItem?.first_name} ${selectedItem?.last_name}`} />
                    {selectedItem?.denomination ? (
                        <p className="header-message__user__header__detail denomination">{selectedItem?.denomination}</p>
                    ) : (
                        <p className="header-message__user__header__detail name">{selectedItem?.first_name} {selectedItem?.last_name}</p>
                    )}
                    {selectedItem && 'email' in selectedItem && selectedItem?.deleted_at && <p className="header-message__user__header__detail deleted" aria-label="Utilisateur supprimé">Utilisateur supprimé</p>}

                    {selectedItem && selectedItem?.id > 0 && <span className="header-message__user__header__detail deploy-arrow">{(isMyRequest ? userDescription : requestTitle) ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}</span>}

                </div>

                {(isMyRequest ? userDescription : requestTitle) &&
                    <div className="header-message__user__header__info">
                        {selectedItem?.denomination ? (

                            <div className="header-message__user__header__info__identity">
                                <p className="header-message__user__header__info__identity denomination">{selectedItem?.denomination}</p>
                                {('siret' in selectedItem) && <p className="header-message__user__header__info__identity siret">SIRET : {selectedItem && selectedItem?.siret}</p>}
                            </div>
                        ) : (
                            <div className="header-message__user__header__info__identity">
                                <p className="header-message__user__header__info__identity denomination">{selectedItem?.first_name} {selectedItem?.last_name}</p>

                            </div>
                        )}

                        {isMyRequest ? (
                            <div className="header-message__user__header__info__identity">
                                <p className="header-message__user__header__info__identity description" aria-label="Description de l'utilisateur">
                                    {selectedItem && 'description' in selectedItem && selectedItem.description ? selectedItem.description : 'Pas de description'}
                                </p>
                            </div>
                        ) : (
                            <div className="header-message__user__header__info__identity">
                                <p className="header-message__user__header__info__identity description">{selectedItem && 'title' in selectedItem && selectedItem?.title}</p>
                            </div>
                        )}
                    </div>
                }
            </div>

        </div>
    )
}