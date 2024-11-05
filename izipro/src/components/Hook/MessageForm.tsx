import Stack from "@mui/material/Stack";
import { UserDataProps } from "../../Type/User";
import Fade from "@mui/material/Fade";
import Alert from "@mui/material/Alert";
import pdfLogo from '/logos/logo-pdf.webp';
import { MdAttachFile, MdSend } from "react-icons/md";
import { FaCamera } from "react-icons/fa";
import TextareaAutosize from 'react-textarea-autosize';
import '../../styles/MessageForm.scss'
import { RequestProps } from "../../Type/Request";
import DOMPurify from "dompurify";

type MessageFormProps = {
    handleMessageSubmit: (event: React.FormEvent<HTMLFormElement>, requestId?: number) => void;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemove: (index: number) => void;
    isMyRequest?: boolean;
    isMyConversation?: boolean;
    messageValue: string;
    setMessageValue: React.Dispatch<React.SetStateAction<string>>;
    selectedItem: UserDataProps | RequestProps | null;
    fileError: string;
    uploadFileError: string;
    urlFile: File[];
    messageMutationLoading: boolean;
};

export const MessageForm = ({
    handleMessageSubmit,
    handleFileUpload,
    handleRemove,
    isMyRequest,
    isMyConversation,
    messageValue,
    setMessageValue,
    selectedItem,
    fileError,
    uploadFileError,
    urlFile,
    messageMutationLoading

}: MessageFormProps) => {

    return (
        <form className="message-form" onSubmit={(event) => {
            event.preventDefault();
            if (selectedItem?.id && !selectedItem?.deleted_at) {
                if (isMyRequest) {
                    handleMessageSubmit(event);
                }
                if (isMyConversation) {
                    handleMessageSubmit(event, selectedItem?.id);
                }

            }
        }}>
            <div className="message">
                <Stack sx={{ width: '100%' }} spacing={2}>
                    {fileError && (
                        <Fade in={!!fileError} timeout={300}>
                            <Alert variant="filled" severity="error">{fileError}</Alert>
                        </Fade>
                    )}
                </Stack>
                <Stack sx={{ width: '100%' }} spacing={2}>
                    {uploadFileError && (
                        <Fade in={!!uploadFileError} timeout={300}>
                            <Alert variant="filled" severity="error">{uploadFileError}</Alert>
                        </Fade>
                    )}
                </Stack>
            </div>
            {urlFile.length > 0 && <div className="message-form__preview">
                {urlFile.map((file, index) => (
                    <div className="message-form__preview__container" key={index}>

                        <img
                            className="message-form__preview__container__image"
                            src={file.type === 'application/pdf' ? pdfLogo : file.name}
                            alt={`Preview ${index}`}
                        />
                        <div
                            className="message-form__preview__container__remove"
                            onClick={() => handleRemove(index)}
                            aria-label='Supprimer le fichier'
                        >
                            X
                        </div>
                    </div>
                ))}
            </div>}
            <label className="message-form__label">
                <MdAttachFile
                    className="message-form__label__attach"
                    onClick={(event) => {
                        event.preventDefault(),
                            event.stopPropagation(),
                            document.getElementById('send-file')?.click()
                    }}
                    aria-label='Joindre un fichier'
                />
                <FaCamera
                    className="message-form__label__camera"
                    onClick={(event) => {
                        event.preventDefault(),
                            event.stopPropagation(),
                            document.getElementById('file-camera')?.click()
                    }}
                    aria-label='Prendre une photo'

                />
                <TextareaAutosize
                    id="messageInput"
                    name="message"
                    className="message-form__label__input"
                    value={messageValue}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setMessageValue(DOMPurify.sanitize(event.target.value))}
                    placeholder="Tapez votre message ici..."
                    aria-label='Tapez votre message ici'
                    maxLength={1000}
                    readOnly={(selectedItem && selectedItem?.id > 0 ? false : true) || selectedItem && 'deleted_at' in selectedItem ? selectedItem?.deleted_at !== null : false}
                    onClick={(event: React.MouseEvent) => { event.stopPropagation(); event?.preventDefault(); }}
                />
                <MdSend
                    className="message-form__label__send"
                    onClick={(event) => { document.getElementById('send-message')?.click(), event.stopPropagation(); event?.preventDefault(); }}
                    aria-label='Envoyer le message'

                />
            </label>
            <input
                id="send-file"
                className="message-form__input"
                type="file"
                accept="image/*,.pdf"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(event)}
                multiple={true}
                disabled={(selectedItem && selectedItem?.id > 0 ? false : true) || selectedItem && 'deleted_at' in selectedItem ? selectedItem?.deleted_at !== null : false}
                aria-label="Envoyer un fichier"
            />
            <input
                id="file-camera"
                className="message-form__input medi"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(event)}
                disabled={(selectedItem && selectedItem?.id > 0 ? false : true) || selectedItem && 'deleted_at' in selectedItem ? selectedItem?.deleted_at !== null : false}
                aria-label="Prendre une photo"
            />
            <button
                id="send-message"
                className="message-form__button"
                type="submit"
                disabled={!selectedItem || selectedItem?.id <= 0 || messageMutationLoading || selectedItem && 'deleted_at' in selectedItem ? selectedItem?.deleted_at !== null : false}
                aria-label="Envoyer le message"
            >
                Send
            </button>
        </form>
    );
}