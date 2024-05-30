/* eslint-disable @typescript-eslint/ban-types */
import { FaTrashAlt } from 'react-icons/fa';
import pdfLogo from '/logo/pdf-icon.svg';
import { RequestProps } from '../../Type/Request';


const RequestItem = ({ 
	isListOpen,
	request,
	resetRequest,
	selectedRequest, 
	setSelectedRequest, 
	isMessageExpanded, 
	setIsMessageExpanded, 
	setIsListOpen, 
	handleHideRequest, 
	openModal 
}: {
    isListOpen?: boolean,
    request?: RequestProps,
	resetRequest?: Function, // replace YourRequestType with the actual type of your request object
    selectedRequest?: RequestProps,
    setSelectedRequest?: Function,
    isMessageExpanded?: boolean,
    setIsMessageExpanded?: Function,
    setIsListOpen?: Function,
    handleHideRequest?: Function,
    openModal?: Function
  }) => {
	return (
		<div
			className={`my-conversation__list__detail__item ${request?.urgent} ${selectedRequest === request ? 'selected' : ''} ` }
			key={request?.id} 
			onClick={() => {
				if (request && setSelectedRequest) {
					setSelectedRequest(request);
				}
				setIsListOpen && setIsListOpen(!isListOpen);
			}}
		>
			{request?.urgent && <p className="my-conversation__list__detail__item urgent">URGENT</p>}
			<div className="my-conversation__list__detail__item__header">
				<p className="my-conversation__list__detail__item__header date" >
					<span className="my-conversation__list__detail__item__header date-span">
												Date:</span>&nbsp;{new Date(Number(request?.created_at)).toLocaleString()}
				</p>
				<p className="my-conversation__list__detail__item__header city" >
					<span className="my-conversation__list__detail__item__header city-span">
												Ville:</span>&nbsp;{request?.city}
				</p>
				<h2 className="my-conversation__list__detail__item__header job" >
					<span className="my-conversation__list__detail__item__header job-span">
												Métier:</span>&nbsp;{request?.job}
				</h2>
				<p className="my-conversation__list__detail__item__header name" >
					<span className="my-conversation__list__detail__item__header name-span">
												Nom:</span>&nbsp;{request?.first_name} {request?.last_name}
				</p>
			</div>
			<h1 className="my-conversation__list__detail__item title" >{request?.title}</h1>
			<p 
				className={`my-conversation__list__detail__item message ${isMessageExpanded ? 'expanded' : ''}`}
				onClick={(event) => {
					setIsMessageExpanded && setIsMessageExpanded(!isMessageExpanded),
					event.stopPropagation();
				}} 
			>
				{request?.message}
			</p>
			<div className="my-conversation__list__detail__item__picture">
								
				{(() => {
					const imageUrls = request?.media?.map(media => media.url) || [];
					return request?.media?.map((media, index) => (
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
				id="delete-request"
				className="my-conversation__list__detail__item__delete" 
				type='button' 
				onClick={(event) => {
					if (request?.id) {
						resetRequest && resetRequest();
					} else {
						handleHideRequest && handleHideRequest(event, request?.id);
					}
					event.stopPropagation();
				}}>
			</button>
			<FaTrashAlt 
				className="my-conversation__list__detail__item__delete-FaTrashAlt" 
				onClick={(event) => {
					document.getElementById('delete-request')?.click(),
					event.stopPropagation();
				}}
			/>
		</div>
	);
};
export default RequestItem;