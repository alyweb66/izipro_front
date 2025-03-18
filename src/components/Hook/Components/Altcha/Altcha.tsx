import { useEffect, useRef } from 'react';
import 'altcha';
import { AltchaStore } from '../../../../store/Altcha';
import { useShallow } from 'zustand/shallow';

const Altcha = ({ onSubmit = false }) => {
  // Store
  const setLocalPayload = AltchaStore(useShallow((state) => state.setPayload));
  const setLocalAltchaStatut = AltchaStore(
    useShallow((state) => state.setStatus)
  );

  // Ref
  const widgetRef = useRef<HTMLElement>(null);

  // useEffect to check altchaStatut
  useEffect(() => {
    const handleStateChange = (ev: Event | CustomEvent) => {
      if ('detail' in ev) {
        setLocalPayload(ev.detail.payload || null);
        setLocalAltchaStatut(ev.detail.state);

        // Hide widget after verification
        if (ev.detail.state === 'verified' && widgetRef.current) {
          setTimeout(() => {
            if (widgetRef.current) {
              widgetRef.current.style.display = 'none';
            }
          }, 1000);
        }
      }
    };

    const { current } = widgetRef;

    if (current) {
      current.addEventListener('statechange', handleStateChange);
      return () =>
        current.removeEventListener('statechange', handleStateChange);
    }
  }, []);

  return (
    <div className="altcha">
      <altcha-widget
        challengeurl={`${import.meta.env.MODE === 'production' ? import.meta.env.VITE_SERVER_URL : 'http://localhost:3000/'}altcha-challenge`}
        auto={onSubmit ? 'onsubmit' : 'onload'}
        floating="auto"
        delay={500}
        ref={widgetRef}
        style={
          {
            '--altcha-color-border': '#ccc',
            '--altcha-border-width': '1px',
            '--altcha-border-radius': '8px',
            '--altcha-max-width': '200px',
            '--altcha-color-base': 'rgb(255, 255, 255)',
          } as React.CSSProperties
        }
        strings='{
  "ariaLinkLabel": "Visitez Altcha.org",
  "error": "Échec de la vérification. Réessayez plus tard.",
  "expired": "Vérification expirée. Réessayez.",
  "footer": "Protégé par <a href=\"https://altcha.org/\" target=\"_blank\" aria-label=\"Visitez Altcha.org\">ALTCHA</a>",
  "label": "Je ne suis pas un robot",
  "verified": "Vérifié",
  "verifying": "Vérification en cours...",
  "waitAlert": "Vérification en cours... veuillez patienter."
}'
      ></altcha-widget>
    </div>
  );
};

export default Altcha;
