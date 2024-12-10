/* eslint-disable @typescript-eslint/ban-types */
import { FaTrashAlt } from 'react-icons/fa';
import pdfLogo from '/logos/logo-pdf-name.webp';
import { RequestProps } from '../../../../Type/Request';
import React, { useEffect, useState } from 'react';
import noPicture from '/logos/no-picture.webp';
import { AnimatePresence, motion } from 'framer-motion';
import { formatMessageDate } from '../../FormatDate';
import './requestHook.scss';
import Spinner from '../Spinner/Spinner';
//import { Badge } from './Badge';
import Stack from '@mui/material/Stack';
import Badge, { BadgeProps } from '@mui/material/Badge';
import { styled } from '@mui/material/styles';
import { Grow } from '@mui/material';
import { BiConversation } from 'react-icons/bi';

const RequestItem = ({
  //index,
  requestByDate,
  notViewedStore,
  isMyrequest,
  isClientRequest,
  isMyConversation,
  handleConversation,
  setIsAnswerOpen,
  selectedRequestRef,
  setIsMessageOpen,
  request,
  setRequest,
  showAllContent,
  setClientRequest,
  handleNavigate,
  hiddenLoading,
  deleteRequestLoading,
  modalArgs,
  removeRequestStore,
  selectedRequest,
  setSelectedRequest,
  setDeleteItemModalIsOpen,
  setIsListOpen,
  setModalArgs,
  openModal,
  setHasManyImages,
}: {
  index?: number;
  requestByDate: RequestProps;
  isMyrequest?: boolean;
  isClientRequest?: boolean;
  isMyConversation?: boolean;
  handleConversation?: Function;
  setIsAnswerOpen?: Function;
  deleteRequestLoading?: boolean;
  selectedRequestRef?: React.MutableRefObject<RequestProps | null>;
  notViewedStore?: number[];
  setIsMessageOpen?: Function;
  request?: RequestProps;
  setRequest?: Function;
  showAllContent?: boolean;
  setClientRequest?: Function;
  handleNavigate?: Function;
  hiddenLoading?: boolean;
  modalArgs?: { requestId: number; requestTitle: string } | null;
  removeRequestStore?: Function;
  selectedRequest?: RequestProps;
  setSelectedRequest?: Function;
  setDeleteItemModalIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMessageExpanded?: Object;
  setIsListOpen?: Function;
  setModalArgs: React.Dispatch<
    React.SetStateAction<{ requestId: number; requestTitle: string } | null>
  >;
  openModal?: Function;
  setHasManyImages: Function;
}) => {
  const StyledBadge = styled(Badge)<BadgeProps>(() => ({
    '& .MuiBadge-badge': {
      fontSize: '0.9rem',
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      minWidth: '24px',
    },
  }));

  // Etat pour contrôler l'affichage global
  useEffect(() => {
    setIndividualVisibility({});
  }, [showAllContent]);

  // Etat pour chaque item, permettant d'afficher/masquer indépendamment
  const [individualVisibility, setIndividualVisibility] = useState<{
    [key: number]: boolean;
  }>({});

  // Fonction pour basculer la visibilité individuelle d'un item spécifique
  const toggleIndividualVisibility = (id: number) => {
    setIndividualVisibility((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? !showAllContent : !prev[id],
    }));
  };
  // Extract file name from media name for pdf
  function extractFileName(mediaName: string): string {
    const lastUnderscoreIndex = mediaName.lastIndexOf('_');
    if (lastUnderscoreIndex === -1) {
      return mediaName;
    }

    return mediaName.substring(0, lastUnderscoreIndex);
  }

  return (
    <motion.li
      //id={index === 0 ? 'first-user' : undefined}
      className={`item
			${requestByDate?.urgent} 
			${'' /* request ? 'new' : '' */} 
			${isMyConversation && (selectedRequest?.id === requestByDate?.id && window.innerWidth > 800 ? 'selected' : '')}
			${isMyrequest && (selectedRequest?.id === requestByDate?.id ? 'selected' : '')}
			${(isMyConversation || isMyrequest) && requestByDate?.conversation?.some((conv) => notViewedStore?.some((id) => id === conv.id)) ? 'not-viewed' : ''}
			${isClientRequest && notViewedStore?.some((id) => id === requestByDate.id) ? 'not-viewed' : ''}
			${isMyConversation && (requestByDate?.deleted_at && !requestByDate?.conversation?.some((conv) => notViewedStore?.some((id) => id === conv.id)) ? 'deleted' : '')}
			`}
      data-request-id={isClientRequest && requestByDate?.id}
      key={requestByDate?.id}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        toggleIndividualVisibility(requestByDate.id);
      }}
      layout
      style={{ overflow: 'scroll' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.1, type: 'tween' }}
      role="listitem"
      aria-labelledby={`item-title-${requestByDate?.id}`}
    >
      {isMyrequest && (
        <Grow in={true} timeout={200}>
          <Stack>
            <StyledBadge
              className="notification-badge"
              badgeContent={requestByDate?.conversation?.length}
              color="info"
            ></StyledBadge>
          </Stack>
        </Grow>
      )}
      {isClientRequest &&
        hiddenLoading &&
        modalArgs?.requestId === requestByDate.id && <Spinner />}
      {isMyrequest && deleteRequestLoading && <Spinner />}
      {isMyConversation && requestByDate?.deleted_at && (
        <p className="item__deleted">
          {(individualVisibility[requestByDate.id] ?? showAllContent)
            ? "SUPPRIMÉ PAR L'UTILISATEUR"
            : 'SUPPRIMÉ'}
        </p>
      )}
      {requestByDate?.urgent && <p className="item urgent">URGENT</p>}
      <AnimatePresence>
        {(individualVisibility[requestByDate.id] ?? showAllContent) && (
          <motion.div
            className="item__header"
            layout
            style={{ overflow: 'hidden' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.1, type: 'tween' }}
          >
            <p className="item__header date">
              <span className="item__header date-span">Date:</span>&nbsp;
              {formatMessageDate(requestByDate?.created_at)}
            </p>
            <p className="item__header city">
              <span className="item__header city-span">Ville:</span>&nbsp;
              {requestByDate?.city}
            </p>
            <h2 className="item__header job">
              <span className="item__header job-span">Métier:</span>&nbsp;
              {requestByDate?.job}
            </h2>
            {requestByDate?.denomination ? (
              <p className="item__header name">
                <span className="item__header name-span">Entreprise:</span>
                &nbsp;{requestByDate?.denomination}
              </p>
            ) : (
              <p className="item__header name">
                <span className="item__header name-span">Nom:</span>&nbsp;
                {requestByDate?.first_name} {requestByDate?.last_name}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <h1 className="item title">{requestByDate?.title}</h1>
      <AnimatePresence>
        {(individualVisibility[requestByDate.id] ?? showAllContent) && (
          <motion.p
            className="item message"
            layout
            style={{ overflow: 'hidden' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.1, type: 'tween' }}
          >
            {requestByDate?.message}
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(individualVisibility[requestByDate.id] ?? showAllContent) && (
          <motion.div
            className={`item__picture ${isMyConversation && (requestByDate?.deleted_at ? 'deleted' : '')}`}
            layout
            style={{ overflow: 'hidden' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.1, type: 'tween' }}
          >
            {(() => {
              const imageUrls =
                requestByDate?.media?.map((media) => media.url) || [];
              return requestByDate?.media?.map((media, index) =>
                media ? (
                  media.name.endsWith('.pdf') ? (
                    <a
                      className="item__picture__a-pdf"
                      href={media.url}
                      key={media.id}
                      download={media.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                      aria-label={`Télécharger ${media.name}`}
                    >
                      <img
                        className="item__picture__a-pdf img"
                        src={pdfLogo}
                        alt={media.name}
                      />
                      <p className="pdf-name">{extractFileName(media.name)}</p>
                    </a>
                  ) : (
                    <img
                      className="item__picture img"
                      key={media.id}
                      src={media.url}
                      loading="lazy"
                      onClick={(event) => {
                        setHasManyImages && setHasManyImages(false),
                          openModal && openModal(imageUrls, index),
                          imageUrls.length > 1 && setHasManyImages(true);

                        event.stopPropagation();
                      }}
                      onError={(event) => {
                        event.currentTarget.src = noPicture;
                      }}
                      alt={`Image associée à la demande ${requestByDate.title}`}
                    />
                  )
                ) : null
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="item__action">
        <button
          id={`delete-request-${requestByDate?.id ?? ''}`}
          className="item__delete"
          type="button"
          aria-label={`Supprimer la demande ${requestByDate.title}`}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            if (request?.id && isMyConversation) {
              removeRequestStore && removeRequestStore(requestByDate.id);
            } else {
              setDeleteItemModalIsOpen(true);
              if (requestByDate) {
                event.stopPropagation();
                setModalArgs({
                  requestId: requestByDate.id,
                  requestTitle: requestByDate.title,
                });
              }
            }
          }}
        ></button>
        <FaTrashAlt
          className="item__delete-FaTrashAlt"
          aria-label="Supprimer la demande"
          onClick={(event) => {
            document
              .getElementById(`delete-request-${requestByDate?.id}`)
              ?.click(),
              event.stopPropagation();
          }}
        />
        <BiConversation
          className="item__message"
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            if (isClientRequest && isClientRequest) {
              setRequest && setRequest(requestByDate),
                setClientRequest && setClientRequest(requestByDate);
              handleNavigate && handleNavigate();
            }

            if (isMyrequest && isMyrequest) {
              handleConversation && handleConversation(requestByDate, event);
              setSelectedRequest && setSelectedRequest(requestByDate);

              if (window.innerWidth < 1000) {
                setIsListOpen && setIsListOpen(false);
                setTimeout(() => {
                  setIsAnswerOpen && setIsAnswerOpen(true);
                  setIsMessageOpen && setIsMessageOpen(false);
                }, 200);
              }

              if (!selectedRequest) {
                if (selectedRequestRef && requestByDate) {
                  selectedRequestRef.current = requestByDate;
                }
              }
            }

            if (isMyConversation && isMyConversation) {
              if (requestByDate && setSelectedRequest) {
                setSelectedRequest && setSelectedRequest(requestByDate);
              }
              if (window.innerWidth < 780) {
                //itemList();
                setIsListOpen && setIsListOpen(false);
                setTimeout(() => {
                  setIsMessageOpen && setIsMessageOpen(true);
                }, 200);
              }
            }
          }}
        />
      </div>
    </motion.li>
  );
};
export default RequestItem;
