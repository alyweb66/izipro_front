/* eslint-disable @typescript-eslint/ban-types */
import { FaTrashAlt } from 'react-icons/fa';
import pdfLogo from '/logo/pdf-icon.svg';
import { RequestProps } from '../../Type/Request';
import React, { useRef } from 'react';

type ExpandedState = {
	[key: number]: boolean;
};

const RequestItem = ({ 
	index,
	/* isListOpen, */
	clientMessageViewedStore,
	requestByDate,
	/* isMessageOpen, */
	setIsMessageOpen,
	request,
	resetRequest,
	selectedRequest, 
	setSelectedRequest, 
	setDeleteItemModalIsOpen,
	isMessageExpanded, 
	setIsMessageExpanded, 
	setIsListOpen, 
	setModalArgs, 
	openModal 
}: {
	index?: number,
    /* isListOpen?: boolean, */
	requestByDate?: RequestProps,
	clientMessageViewedStore: number[],
	/* isMessageOpen?: boolean, */
	setIsMessageOpen?: Function,
    request?: RequestProps,
	resetRequest?: Function, // replace YourRequestType with the actual type of your request object
    selectedRequest?: RequestProps,
    setSelectedRequest?: Function,
	setDeleteItemModalIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
    isMessageExpanded?: Object,
    setIsMessageExpanded?: Function,
    setIsListOpen?: Function,
    setModalArgs: React.Dispatch<React.SetStateAction<{ event: React.MouseEvent, requestId: number } | null>>,
    openModal?: Function
  }) => {
	const idRef = useRef<number>(0);
	return (
		<div
			id={index === 0 ? 'first-user' : undefined}
			data-request-conv-id={(request || requestByDate)?.id} 
			className={`my-conversation__list__detail__item
			${(request || requestByDate)?.urgent} 
			${request ? 'new' : ''} 
			${selectedRequest?.id === (request || requestByDate)?.id ? 'selected' : ''}
			${requestByDate?.deleted_at ? 'deleted' : ''}
			${clientMessageViewedStore.some(id => (request || requestByDate)?.conversation.some(conv => conv.id === id)) ? 'not-viewed' : ''}
			` }
			key={((request || requestByDate)?.id)?.toString()} 
			onClick={() => {
				if ((request || requestByDate) && setSelectedRequest) {
					setSelectedRequest && setSelectedRequest(request || requestByDate);
				}
				setIsListOpen && setIsListOpen(false);
				setIsMessageOpen && setIsMessageOpen(true);
			}}
		>
			{requestByDate?.deleted_at && <p className="my-conversation__list__detail__item__deleted">SUPPRIMÉ PAR L&apos;UTILISATEUR</p>}
			{(request || requestByDate)?.urgent && <p className="my-conversation__list__detail__item urgent">URGENT</p>}
			<div className="my-conversation__list__detail__item__header">
				<p className="my-conversation__list__detail__item__header date" >
					<span className="my-conversation__list__detail__item__header date-span">
												Date:</span>&nbsp;{new Date(Number((request || requestByDate)?.created_at)).toLocaleString()}
				</p>
				<p className="my-conversation__list__detail__item__header city" >
					<span className="my-conversation__list__detail__item__header city-span">
												Ville:</span>&nbsp;{(request || requestByDate)?.city}
				</p>
				<h2 className="my-conversation__list__detail__item__header job" >
					<span className="my-conversation__list__detail__item__header job-span">
												Métier:</span>&nbsp;{(request || requestByDate)?.job}
				</h2>
				{(request || requestByDate)?.denomination ? (
					<p className="my-conversation__list__detail__item__header name" >
						<span className="my-conversation__list__detail__item__header name-span">
										Entreprise:</span>&nbsp;{(request || requestByDate)?.denomination}
					</p>
				) : (
					<p className="my-conversation__list__detail__item__header name" >
						<span className="my-conversation__list__detail__item__header name-span">
										Nom:</span>&nbsp;{(request || requestByDate)?.first_name} {(request || requestByDate)?.last_name}
					</p>
				)}
				
			</div>
			<h1 className="my-conversation__list__detail__item title" >{(request || requestByDate)?.title}</h1>
			<p 
			//@ts-expect-error no type here
				className={`my-conversation__list__detail__item message ${isMessageExpanded && isMessageExpanded[idRef.current] ? 'expanded' : ''}`}
				onClick={(event) => {
					//to open the message when the user clicks on it just for the selected request 
					idRef.current = (request?.id ?? requestByDate?.id) ?? 0; // check if request or requestByDate is not undefined
					console.log('id', idRef.current);
					
					if (idRef.current !== undefined && setIsMessageExpanded) {
						setIsMessageExpanded((prevState: ExpandedState) => ({
							...prevState,
							[idRef.current as number]: !prevState[idRef.current as number]
						}));
					}
					event.stopPropagation();
				}} 
			>
				{(request || requestByDate)?.message}
			</p>
			<div className="my-conversation__list__detail__item__picture">
								
				{(() => {
					const imageUrls = (request || requestByDate)?.media?.map(media => media.url) || [];
					return (request || requestByDate)?.media?.map((media, index) => (
						media ? (
							media.name.endsWith('.pdf') ? (
								<a 
									href={media.url} 
									key={media.id} 
									download={media.name} 
									target="_blank" 
									rel="noopener noreferrer" 
									onClick={(event) => {event.stopPropagation();}} >
									<img 
										className="my-conversation__list__detail__item__picture img" 
										src={pdfLogo} 
										alt={media.name} 
									/>
								</a>
							) : (
								<img 
									className="my-conversation__list__detail__item__picture img" 
									key={media.id} 
									src={media.url} 
									onClick={(event) => {
										openModal && openModal(imageUrls, index),
										event.stopPropagation();
									}}
									alt={media.name} 
								/>
							)
						) : null
					));
				})()}
								
			</div>
			<button
				id={`delete-request-${(request || requestByDate)?.id ?? ''}`}
				className="my-conversation__list__detail__item__delete" 
				type='button' 
				onClick={(event) => {
					if (request?.id) {
						resetRequest && resetRequest();
					} else {
						setDeleteItemModalIsOpen(true);
						/* handleHideRequest && handleHideRequest(event, requestByDate?.id); */
						if (requestByDate) {
							setModalArgs({ event, requestId: requestByDate.id });
							console.log('requestByDateID', requestByDate.id);
							
						}
					}
					event.stopPropagation();
				}}>
			</button>
			<FaTrashAlt 
				className="my-conversation__list__detail__item__delete-FaTrashAlt" 
				onClick={(event) => {
					document.getElementById(`delete-request-${(request || requestByDate)?.id}`)?.click(),
					event.stopPropagation();
				}}
			/>
		</div>
	);
};
export default RequestItem;