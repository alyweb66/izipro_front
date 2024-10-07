import { useState } from 'react';
import './Prompt.scss';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Function to update PWA
function ReloadPrompt() {
	
	/* const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered( r ) {
			// eslint-disable-next-line prefer-template
			//console.log('SW Registered: ' + r);
		},
		onRegisterError( error ) {
			//console.log('SW registration error', error);
		},
	});

	const close = () => {
		setOfflineReady(false);
		setNeedRefresh(false);
	}; */
   // const [offlineReady, setOfflineReady] = useState(false);
    const [needRefresh, setNeedRefresh] = useState(false);
   // const [updateDone, setUpdateDone] = useState(false); // Nouvel état pour suivre la mise à jour

    useRegisterSW({
		onRegistered( /* r */) {
			// eslint-disable-next-line prefer-template
			//console.log('SW Registered: ' + r);
		},
		onRegisterError( /* error */) {
			//console.log('SW registration error', error);
		},
		onNeedRefresh() {
			setNeedRefresh(true);
		},
		onOfflineReady() {
			//      setOfflineReady(true);
		},
	});

    const close = () => {
      //  setOfflineReady(false);
        setNeedRefresh(false);
    };

	return (
		<div className="ReloadPrompt-container">
			{needRefresh && <div className="ReloadPrompt-toast">
        	<div className="ReloadPrompt-message">
        			 <span>L'application a été mis à jour</span>
        	</div>
        	{/* {needRefresh && <button className="ReloadPrompt-toast-button" onClick={() => updateServiceWorker(true)}>Reload</button>} */}
        	<button className="ReloadPrompt-toast-button" onClick={() => close()}>Close</button>
        </div>
		}
			{/* {(offlineReady || needRefresh)
        && <div className="ReloadPrompt-toast">
        	<div className="ReloadPrompt-message">
        		{offlineReady
        			? <span>App ready to work offline</span>
        			: <span>New content available, click on reload button to update.</span>
        		}
        	</div>
        	{needRefresh && <button className="ReloadPrompt-toast-button" onClick={() => updateServiceWorker(true)}>Reload</button>}
        	<button className="ReloadPrompt-toast-button" onClick={() => close()}>Close</button>
        </div>
			} */}
		</div>
	);
}

export default ReloadPrompt;