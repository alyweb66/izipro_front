import { useEffect, useState } from 'react';
import './MyConversation.scss';
import { requestDataStore } from '../../../store/Request';
import { RequestProps } from '../../../Type/Request';

function MyConversation() {

	//state
	const [message, setMessage] = useState('');
	const [requestConversation, setRequestConversation] = useState<RequestProps[]>([]);

	//store
	const request = requestDataStore((state) => state.request);
    
	useEffect(() => {
		setRequestConversation([request]);
	}, [request]);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		
		console.log(message);
		setMessage('');
	};
	return (
		<div className="my-conversation-container">
			<div className="my-client-request">Demandes clients
				{requestConversation.map((request) => (
					<div className="request-details" key={request.id} >
						<h1>{request.title}</h1>
						<p>{request.created_at}</p>
						<p>{request.first_name}</p>
						<p>{request.last_name}</p>
						<p>{request.city}</p>
						<h2>{request.job}</h2>
						<p>{request.message}</p>
						<div>
							{request.media.map((media) => (
								media ? (<img key={media.id} src={media.url} alt={media.name} />) : null
							))}
						</div>
					</div>
				))}

			</div>
			
		
			<div className="my-message">Mes messages
				<form onSubmit={handleSubmit}>
					<input
						type="text"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						placeholder="Type your message here"
					/>
					<button type="submit">Send</button>
				</form>
			</div>
			
		
		</div>
	);
}

export default MyConversation;