import { useEffect, useState } from 'react';
import { VscDebugDisconnect } from "react-icons/vsc";
import './OffLine.scss';

const OffLine: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOnline) {
        return (
            <div className="offline">
                <VscDebugDisconnect className="offline__logo" />
                <span className="offline__content">Vous êtes hors ligne. Veuillez vérifier votre connexion internet.</span>
            </div>
        );
    }

    return null;
};

export default OffLine;