import { useState, useEffect } from 'react';
// Custom hook to manage cookie consent
declare global {
  interface Window {
    dataLayer: any[];
    adsbygoogle: any[];
    gtag: (...args: any[]) => void;
  }
}

interface Consent {
  adsense: boolean;
  analytics: boolean;
}

// Custom hook to manage cookie consent
const useCookieConsent = (handleAcceptCookies: () => void) => {
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consent, setConsent] = useState({
    adsense: false,
    analytics: false,
  });

  // Function to delete a cookie
  const deleteCookie = (cookieName: string) => {
    document.cookie = `${cookieName}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
  };

  // Check if user has already given consent
  useEffect(() => {
    const savedConsent = JSON.parse(
      localStorage.getItem('cookieConsent') || 'null'
    );
    if (!savedConsent) {
      setShowConsentModal(true);
    } else {
      setConsent(savedConsent);
      applyCookies(savedConsent);
    }
  }, []);

  // Inject Google Analytics script
  const injectAnalyticsScript = (id: string) => {
    if (!document.getElementById('google-analytics-script')) {
      // Inject the Google Analytics script
      const script = document.createElement('script');
      script.id = 'google-analytics-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.appendChild(script);
  
      const inlineScript = document.createElement('script');
      inlineScript.id = 'google-analytics-inline';
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${id}');
      `;
      document.head.appendChild(inlineScript);
    }
  };

  // Remove Google Analytics script
  const removeAnalyticsScript = () => {
    // Remove the Google Analytics scripts if they exist
    const script = document.getElementById('google-analytics-script');
    const inlineScript = document.getElementById('google-analytics-inline');
    if (script) document.head.removeChild(script);
    if (inlineScript) document.head.removeChild(inlineScript);
  };
  
  // Apply cookies based on current consent
  const applyCookies = (currentConsent: Consent) => {
    console.log('Applying cookies', currentConsent);
    /* window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'update_consent',
      ad_storage: currentConsent.adsense ? 'granted' : 'denied',
      analytics_storage: currentConsent.analytics ? 'granted' : 'denied',
    }); */
    if (currentConsent.analytics) {
      injectAnalyticsScript('G-V908390R5K');
    } else {
    // delete cookie and script if consent is false
      removeAnalyticsScript();
      deleteCookie('_ga');
      deleteCookie('_gid');
      deleteCookie('_ga_V908390R5K');
    }
  };
  console.log(window.dataLayer);

  interface HandleConsentChange {
    (type: 'adsense' | 'analytics', value: boolean): void;
  }

  // Handle consent change
  const handleConsentChange: HandleConsentChange = (type, value) => {
    const updatedConsent = { ...consent, [type]: value };
    setConsent(updatedConsent);
    localStorage.setItem('cookieConsent', JSON.stringify(updatedConsent));
  };

  // Handle accept change
  const handleAcceptChange = () => {
    const ConsentValue = JSON.parse(
      localStorage.getItem('cookieConsent') || 'null'
    ) as Consent | null;

    if (ConsentValue) {
      applyCookies(ConsentValue);
    } else {
      localStorage.setItem('cookieConsent', JSON.stringify(consent));
      applyCookies(consent);
    }
    handleAcceptCookies();
  };

  // Handle accept all
  const handleAcceptAll = () => {
    const fullConsent = { adsense: true, analytics: true };
    setConsent(fullConsent);
    localStorage.setItem('cookieConsent', JSON.stringify(fullConsent));
    applyCookies(fullConsent);
    setShowConsentModal(false);
    handleAcceptCookies();
  };

  // Handle decline all
  const handleDeclineAll = () => {
    const noConsent = { adsense: false, analytics: false };
    setConsent(noConsent);
    localStorage.setItem('cookieConsent', JSON.stringify(noConsent));
    setShowConsentModal(false);
    handleAcceptCookies();
  };

  return {
    showConsentModal,
    consent,
    handleConsentChange,
    handleAcceptAll,
    handleDeclineAll,
    handleAcceptChange,
    setShowConsentModal,
  };
};

export default useCookieConsent;
