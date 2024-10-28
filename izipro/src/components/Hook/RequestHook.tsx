/* eslint-disable @typescript-eslint/ban-types */
import { FaTrashAlt } from 'react-icons/fa';
import pdfLogo from '/logo-pdf.webp';
import { RequestProps } from '../../Type/Request';
import React, { useRef } from 'react';
import noPicture from '/no-picture.webp';
import { motion } from 'framer-motion';
import { formatMessageDate } from './Component';
import '../../styles/requestHook.scss';
import Spinner from './Spinner';
//import { Badge } from './Badge';
import Stack from '@mui/material/Stack';
import Badge, { BadgeProps } from '@mui/material/Badge';
import { styled } from '@mui/material/styles';
import { Grow } from '@mui/material';

type ExpandedState = {
	[key: number]: boolean;
};

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
	setClientRequest,
	onDetailsClick,
	hiddenLoading,
	modalArgs,
	resetRequest,
	selectedRequest,
	setSelectedRequest,
	setDeleteItemModalIsOpen,
	isMessageExpanded,
	setIsMessageExpanded,
	setIsListOpen,
	setModalArgs,
	openModal,
	setHasManyImages
}: {
	index?: number,
	requestByDate: RequestProps,
	isMyrequest?: boolean,
	isClientRequest?: boolean,
	isMyConversation?: boolean,
	handleConversation?: Function,
	setIsAnswerOpen?: Function,
	selectedRequestRef?: React.MutableRefObject<RequestProps | null>,
	notViewedStore?: number[],
	setIsMessageOpen?: Function,
	request?: RequestProps,
	setRequest?: Function,
	setClientRequest?: Function,
	onDetailsClick?: Function,
	hiddenLoading?: boolean,
	modalArgs?: { requestId: number, requestTitle: string } | null,
	resetRequest?: Function,
	selectedRequest?: RequestProps,
	setSelectedRequest?: Function,
	setDeleteItemModalIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
	isMessageExpanded?: Object,
	setIsMessageExpanded?: Function,
	setIsListOpen?: Function,
	setModalArgs: React.Dispatch<React.SetStateAction<{ requestId: number, requestTitle: string } | null>>,
	openModal?: Function
	setHasManyImages: Function
}) => {
	const idRef = useRef<number>(0);
	console.log('notViewedStore', notViewedStore);

	const StyledBadge = styled(Badge)<BadgeProps>(() => ({
		'& .MuiBadge-badge': {
			fontSize: '0.9rem',
			borderRadius: '50%',
			width: '24px',
			height: '24px',
			minWidth: '24px',
		},
	}));


	return (
		<motion.li
			//id={index === 0 ? 'first-user' : undefined}
			className={`item
			${requestByDate?.urgent} 
			${''/* request ? 'new' : '' */} 
			${isMyConversation && (selectedRequest?.id === requestByDate?.id && window.innerWidth > 800 ? 'selected' : '')}
			${isMyrequest && (selectedRequest?.id === requestByDate?.id ? 'selected' : '')}
			${isMyConversation && (requestByDate?.deleted_at ? 'deleted' : '')}
			${(isMyConversation || isMyrequest) && (requestByDate?.conversation?.some(conv => notViewedStore?.some(id => id === conv.id))) ? 'not-viewed' : ''}
			${isClientRequest && (notViewedStore?.some(id => id === requestByDate.id)) ? 'not-viewed' : ''}
			` }
			data-request-id={isClientRequest && requestByDate?.id}
			key={requestByDate?.id?.toString()}
			onClick={(event) => {

				if (isClientRequest && isClientRequest) {
					setRequest && setRequest(requestByDate),
						setClientRequest && setClientRequest(requestByDate),
						onDetailsClick && onDetailsClick(),
						event.stopPropagation();
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
			layout
			style={{ overflow: 'scroll' }}
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ duration: 0.1, type: 'tween' }}
			role="listitem"
			aria-labelledby={`item-title-${requestByDate?.id}`}
		>
			{isMyrequest && (
				<Grow in={true} timeout={200}>
					<Stack >
						<StyledBadge className="notification-badge" badgeContent={requestByDate?.conversation?.length} color="info" >
						</StyledBadge>
					</Stack>
				</Grow>
			)}
			{isClientRequest && ((hiddenLoading && modalArgs?.requestId === requestByDate.id) && <Spinner />)}
			{isMyConversation && (requestByDate?.deleted_at && <p className="item__deleted">SUPPRIMÉ PAR L&apos;UTILISATEUR</p>)}
			{requestByDate?.urgent && <p className="item urgent">URGENT</p>}
			<div className="item__header">
				<p className="item__header date" >
					<span className="item__header date-span">
						Date:</span>&nbsp;{formatMessageDate(requestByDate?.created_at)}
				</p>
				<p className="item__header city" >
					<span className="item__header city-span">
						Ville:</span>&nbsp;{requestByDate?.city}
				</p>
				<h2 className="item__header job" >
					<span className="item__header job-span">
						Métier:</span>&nbsp;{requestByDate?.job}
				</h2>
				{requestByDate?.denomination ? (
					<p className="item__header name" >
						<span className="item__header name-span">
							Entreprise:</span>&nbsp;{requestByDate?.denomination}
					</p>
				) : (
					<p className="item__header name" >
						<span className="item__header name-span">
							Nom:</span>&nbsp;{requestByDate?.first_name} {requestByDate?.last_name}
					</p>
				)}

			</div>
			<h1 className="item title" >{requestByDate?.title}</h1>
			<p
				//@ts-expect-error no type here
				className={`item message ${isMessageExpanded && isMessageExpanded[idRef.current] ? 'expanded' : ''}`}
				onClick={(event) => {
					//to open the message when the user clicks on it just for the selected request 
					idRef.current = (request?.id ?? requestByDate?.id) ?? 0; // check if request or requestByDate is not undefined

					if (idRef.current !== undefined && setIsMessageExpanded) {
						setIsMessageExpanded((prevState: ExpandedState) => ({
							...prevState,
							[idRef.current as number]: !prevState[idRef.current as number]
						}));
					}
					event.stopPropagation();
				}}
			>
				{requestByDate?.message}
			</p>
			<div className={`item__picture ${isMyConversation && (requestByDate?.deleted_at ? 'deleted' : '')}`}>

				{(() => {
					const imageUrls = requestByDate?.media?.map(media => media.url) || [];
					return requestByDate?.media?.map((media, index) => (
						media ? (
							media.name.endsWith('.pdf') ? (
								<a
									href={media.url}
									key={media.id}
									download={media.name}
									target="_blank"
									rel="noopener noreferrer"
									onClick={(event) => { event.stopPropagation(); }}
									aria-label={`Télécharger ${media.name}`}
								>
									<img
										className="item__picture img"
										src={pdfLogo}
										alt={media.name}
									/>
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
					));
				})()}

			</div>
			<button
				id={`delete-request-${requestByDate?.id ?? ''}`}
				className="item__delete"
				type='button'
				aria-label={`Supprimer la demande ${requestByDate.title}`}
				onClick={(event) => {
					event.stopPropagation();
					event.preventDefault();
					if (request?.id && isMyConversation) {
						resetRequest && resetRequest();
					} else {
						setDeleteItemModalIsOpen(true);

						if (requestByDate) {
							event.stopPropagation();
							setModalArgs({ requestId: requestByDate.id, requestTitle: requestByDate.title });
						}
					}

				}}>
			</button>
			<FaTrashAlt
				className="item__delete-FaTrashAlt"
				aria-label="Supprimer la demande"
				onClick={(event) => {
					document.getElementById(`delete-request-${requestByDate?.id}`)?.click(),
						event.stopPropagation();
				}}
			/>
		</motion.li>

	);
};
export default RequestItem;