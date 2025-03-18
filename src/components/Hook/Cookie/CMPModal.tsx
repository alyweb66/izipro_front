import {
  Modal,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  ThemeProvider,
  Backdrop,
  Fade,
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import useCookieConsent from './UseCookieConsent';
import { Link } from 'react-router';
import { useEffect } from 'react';
import './CookieModal.scss';

type CookieConsentModalProps = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  handleAcceptCookies: () => void;
};

const CookieConsentModal = ({
  isOpen,
  setIsOpen,
  handleAcceptCookies,
}: CookieConsentModalProps) => {
  const {
    showConsentModal,
    consent,
    handleConsentChange,
    handleAcceptAll,
    handleDeclineAll,
    handleAcceptChange,
    setShowConsentModal,
  } = useCookieConsent(handleAcceptCookies);

  const isAccedptedCookies = localStorage.getItem('cookieConsent');

  const theme = createTheme({
    typography: {
      fontFamily: 'Fredoka, sans-serif',
    },
  });

  // handle save preferences
  const handleSavePreferences = () => {
    handleAcceptChange();
    setShowConsentModal(false);
  };

  const onClose = () => {
    setShowConsentModal(false);
  };

  // show modal
  useEffect(() => {
    if (isOpen) {
      setShowConsentModal(true);
    } else if (!isOpen) {
      setShowConsentModal(false);
    }
  }, [isOpen]);

  // open modal
  useEffect(() => {
    if (showConsentModal) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [showConsentModal]);

  return (
    <Modal
      open={isOpen}
      onClose={isAccedptedCookies ? onClose : () => {}}
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className="modal-container"
      container={document.body}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 300,
        },
      }}
    >
      <>
        <ThemeProvider theme={theme}>
          <Fade in={isOpen}>
            <Box
              className="cookie-modal"
              sx={{ backgroundColor: 'white', borderRadius: '8px' }}
            >
              {isAccedptedCookies && (
                <button className="close-cookie-modal" onClick={onClose}>
                  X
                </button>
              )}
              <div className="title-content">
                <Typography
                  id="cookie-consent-title"
                  variant="h6"
                  sx={{ textAlign: 'center', color: '#f37c04' }}
                >
                  Gestion des cookies
                </Typography>
                <Typography
                  id="cookie-consent-description"
                  sx={{ textAlign: 'center' }}
                  component="p"
                >
                  Les cookies nous aident à personnaliser le contenu et les
                  publicités, à offrir des fonctionnalités pour les réseaux
                  sociaux et à analyser notre trafic. Nous partageons des
                  informations sur l'utilisation de notre site avec nos
                  partenaires, qui peuvent les combiner avec d'autres données
                  que vous leur avez fournies ou qu'ils ont collectées.
                  <span
                    style={{ display: 'inline-block', width: '0.5rem' }}
                  ></span>
                  <a 
                  aria-label="En savoir plus sur les cookies"
                  href="https://www.cnil.fr/fr/definition/cookie"
                  rel="noopener noreferrer"
                  >
                    Qu'est-ce qu'un cookie ?
                  </a>

                </Typography>
              </div>
              <div className="switch-container">
                <Box className="item essential">
                  <div className="item-container">
                    <Typography
                      variant="subtitle1"
                      className="item-container__subtitle"
                      component="h2"
                    >
                      <strong className="no-bold">Cookies essentiels</strong>
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={true}
                          name="functional"
                          color="warning"
                          sx={{ marginLeft: '1rem' }}
                        />
                      }
                      label=""
                    />
                  </div>
                  <Typography variant="body2">
                    Cookies essentiels pour la sécurité et le bon fonctionnement
                    du site, ce qui permet de garder votre session active et de
                    sécuriser vos données.
                  </Typography>
                </Box>
                <Box className="item">
                  <div className="item-container analytics">
                    <Typography
                      variant="subtitle1"
                      className="item-container__subtitle"
                      component="h2"
                    >
                      <strong className="no-bold">Google Analytics</strong>
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={consent.analytics}
                          onChange={(e) =>
                            handleConsentChange('analytics', e.target.checked)
                          }
                          name="analytics"
                          color="warning"
                          sx={{ marginLeft: '1rem' }}
                        />
                      }
                      label=""
                    />
                  </div>
                  <Typography variant="body2">
                    Google Analytics nous aide à comprendre comment vous
                    utilisez notre site afin d'améliorer votre expérience.
                    <br />
                    <Link
                      to="https://policies.google.com/technologies/partner-sites"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      En savoir plus sur Google Analytics
                    </Link>
                  </Typography>
                </Box>
               {/*  <Box className="item">
                  <div className="item-container">
                    <Typography
                      variant="subtitle1"
                      className="item-container__subtitle"
                      component="h2"
                    >
                      <strong className="no-bold">Google Adsense</strong>
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={consent.adsense}
                          onChange={(e) =>
                            handleConsentChange('adsense', e.target.checked)
                          }
                          name="adsense"
                          color="warning"
                          sx={{ marginLeft: '1rem' }}
                        />
                      }
                      label=""
                    />
                  </div>
                  <Typography variant="body2">
                    Google AdSense utilise des cookies pour personnaliser les
                    publicités. Si vous refusez ces cookies, les publicités
                    seront affichées, mais sans personnalisation.
                    <br />
                    <Link
                      to="https://support.google.com/adsense/answer/1348695?hl=fr"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      En savoir plus sur Google Adsense
                    </Link>
                  </Typography>
                </Box> */}
              </div>

              <Box className="button-container">
                <button className="button decline" onClick={handleDeclineAll}>
                  Tout refuser
                </button>
                <button className="button" onClick={handleAcceptAll}>
                  Tout accepter
                </button>
                <button
                  className="button preferences"
                  onClick={handleSavePreferences}
                >
                  Valider la sélection
                </button>
              </Box>
            </Box>
          </Fade>
        </ThemeProvider>
      </>
    </Modal>
  );
};

export default CookieConsentModal;
