import { motion } from "framer-motion";
import { ScrollList } from "./ScrollList";
import Spinner from "./Spinner";
import pdfLogo from '/logo-pdf.webp'
import noPicture from '/no-picture.webp'
import { formatMessageDate } from "./Component";
import { MessageProps } from "../../Type/message";
import '../../styles/MessageList.scss';

type MessageListProps = {
    id: number;
    openModal: (imageUrls: string[], mediaIndex: number) => void;
    setHasManyImages: (hasMany: boolean) => void;
    filteredMessages: MessageProps[] | undefined;
    conversationIdState: number;
    isMessageOpen: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ id, openModal, setHasManyImages, filteredMessages, conversationIdState, isMessageOpen }) => {
    // Scroll to the last message
    const { endMessageListRef, imageRefs, isEndViewed } = ScrollList({ filteredMessages, conversationIdState, isListOpen: isMessageOpen });

    return (

        <div className="message__container" >
            {!isEndViewed && conversationIdState > 0 && <Spinner />}
            <div className="message__background" >
                <ul
                    className="message__message-list__message"
                    aria-label="Message de la conversation"
                >

                    {filteredMessages?.map((message) => {
                        return (
                            <li
                                className={`message__message-list__message__detail ${message.user_id === id ? 'me' : ''}`}
                                key={message.id}
                                data-key={message.id}
                                aria-label={`Message de ${message.user_id === id ? 'vous' : 'l\'autre utilisateur'}`}
                                style={{ visibility: isEndViewed ? 'visible' : 'hidden' }}
                            >
                                <motion.div
                                    className={`content ${message.user_id === id ? 'me' : ''}`}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
                                    transition={{ duration: 0.3, type: 'tween' }}
                                >
                                    {message.media[0]?.url && (
                                        <div className="message__message-list__message__detail__image-container">
                                            <div className={`map ${message.content ? 'message' : ''}`}>
                                                {message.media?.map((media, mediaIndex) => (
                                                    media ? (
                                                        media.name.endsWith('.pdf') ? (
                                                            <a
                                                                className="a-pdf"
                                                                href={media.url}
                                                                key={media.id}
                                                                download={media.name}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(event) => event.stopPropagation()}
                                                            >
                                                                <img
                                                                    className={`message__message-list__message__detail__image-pdf ${message.media.length === 1 ? 'single' : 'multiple'}`}
                                                                    src={pdfLogo}
                                                                    alt={media.name}
                                                                />
                                                            </a>
                                                        ) : (
                                                            <img
                                                                ref={(el) => imageRefs.current.push(el)}
                                                                className={`message__message-list__message__detail__image ${message.media.length === 1 ? 'single' : 'multiple'}`}
                                                                key={media.id}
                                                                src={media.thumbnail} // Display thumbnail initially
                                                                data-src={media.url} // Actual image source
                                                                onClick={(event) => {
                                                                    const imageUrls = message.media?.map((m) => m.url) || [];
                                                                    setHasManyImages(false),
                                                                        openModal(imageUrls, mediaIndex);
                                                                    imageUrls.length > 1 && setHasManyImages(true);
                                                                    event.stopPropagation();
                                                                }}

                                                                alt={media.name}
                                                                onError={(event) => { event.currentTarget.src = noPicture; }}
                                                            />
                                                        )
                                                    ) : null
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {message.content && (
                                        <div className="message__message-list__message__detail__texte">{message.content}</div>
                                    )}
                                </motion.div>
                                <time
                                    className="message__message-list__message__detail__date"
                                    dateTime={new Date(Number(message.created_at)).toISOString()}
                                >
                                    {formatMessageDate(message.created_at)}
                                </time>
                            </li>
                        )
                    })}
                    <div ref={endMessageListRef} ></div>
                </ul>
            </div>
        </div>
    );
}