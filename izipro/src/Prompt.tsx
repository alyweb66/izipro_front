import './Prompt.scss';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Function to update PWA
function ReloadPrompt() {
	
	const {
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered( r ) {
			// eslint-disable-next-line prefer-template
			console.log(`SW Registered:  + ${r}`);
		},
		onRegisterError( error ) {
			console.log('SW registration error', error);
		},
	});
console.log('needRefresh', needRefresh);

	const close = () => {
		setNeedRefresh(false);
	};

	return (
		<div className="ReloadPrompt-container">
			{needRefresh
        && <div className="ReloadPrompt-toast">
        	<div className="ReloadPrompt-message">
        			 <span>Une mise à jour est disponible.</span>
        	</div>
        	{needRefresh && <button className="ReloadPrompt-toast-button" onClick={() => updateServiceWorker(true)}>Mettre à jour</button>}
        	<button className="ReloadPrompt-toast-button" onClick={() => close()}>Fermer</button>
        </div>
			}
		</div>
	);
}

export default ReloadPrompt;