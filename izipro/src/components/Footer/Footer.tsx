import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
// State management and stores
import {
  cookieConsents,
  rulesStore,
  userDataStore,
} from '../../store/UserData';

// Custom hooks and components
import { RulesModal } from '../Hook/Modal/RulesModal/RulesModal';
import { ContactModal } from '../Hook/Modal/ContactModal/ContactModal';

// Apollo Client
import { useMutation, FetchResult } from '@apollo/client';
import {
  COOKIE_CONSENTS_MUTATION,
  UPDATE_COOKIE_CONSENTS_MUTATION,
  UPDATE_USER_MUTATION,
} from '../GraphQL/UserMutations';

// Custom hooks and queries
import { useQueryCookieConsents, useQueryRules } from '../Hook/Query';

// Types
import { CookieConsentsProps } from '../../Type/CookieConsents';

// Utility hook
import useHandleLogout from '../Hook/HandleLogout';
import CookieConsentModal from '../Hook/Cookie/CMPModal';
// Styles
import './Footer.scss';



type ResponseCookieConsents = {
  data: {
    createCookieConsents: CookieConsentsProps;
    updateCookieConsents: CookieConsentsProps;
  };
};

function Footer() {
  //state
  const [cookiesModal, setCookiesModal] = useState<boolean>(false);
  const [clickCookie, setClickCookie] = useState<boolean>(false);
  const [rulesModal, setRulesModal] = useState<boolean>(false);
  const [contactModal, setContactModal] = useState<boolean>(false);
  const [isGetCookie, setIsGetCookie] = useState<boolean>(true);
  const [isLegalNotices, setIsLegalNotices] = useState<boolean>(false);

  //useRef
  const isGetRulesRef = useRef<boolean>(false);
  // const isGetCookieConsentsRef = useRef<boolean>(true);

  //store
  const [id, CGU] = userDataStore(useShallow((state) => [state.id, state.CGU]));
  const [CGUStore/* , cookieStore */] = rulesStore(
    useShallow((state) => [state.CGU, state.cookies])
  );
  const [cookieConsentsIdStore, cookiesAnalytics, cookiesMarketing] =
    cookieConsents(
      useShallow((state) => [
        state.id,
        state.cookies_analytics,
        state.cookies_marketing,
      ])
    );

  //custom hooks Logout
  const handleLogout = useHandleLogout();

  //Query
  const { loading: rulesLoading, rulesData } = useQueryRules(
    isGetRulesRef.current
  );
  const { /* loading: getCookieConsentsLoading, */ cookieData } =
    useQueryCookieConsents(isGetCookie);

  //Mutation
  const [
    createCookieConsents,
    { /* loading: createCookieConsentsLoading, */ error: createCookieConsentsError },
  ] = useMutation(COOKIE_CONSENTS_MUTATION);
  const [
    updateCookieConsents,
    { /* loading: updateCookieConsentsLoading, */ error: updateCookieConsentsError },
  ] = useMutation(UPDATE_COOKIE_CONSENTS_MUTATION);
  const [updateUser, { loading: updateUserLoading, error: updateUserError }] =
    useMutation(UPDATE_USER_MUTATION);

  // function to transform the result to match ResponseCookieConsents structure of response data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function transformResultToResponseCookieConsents(
    result: FetchResult<any>
  ): ResponseCookieConsents {
    // Transform the result to match ResponseCookieConsents structure
    return {
      data: result.data,
    };
  }


  // handle accept cookies to set the cookie consents to the store and database
  function handleAcceptCookies(isCreate = false) {
    const localConsents = localStorage.getItem('cookieConsent');

    if (id !== 0 && localConsents) {
      // if id > 0 and localConsents exist, create or update the cookie consents to the database
      if (
        cookieConsentsIdStore === 0 &&
        !clickCookie &&
        isCreate
      ) {

        createCookieConsents({
          variables: {
            createCookieConsentsId: id,
            input: {
              cookies_analytics: JSON.parse(localConsents).analytics,
              cookies_marketing: JSON.parse(localConsents).adsense,
            },
          },
        }).then((result) => {
          // transform the result to match ResponseCookieConsents structure
          handleResponse(transformResultToResponseCookieConsents(result));
          setClickCookie(false);
        });
      } else if (cookieConsentsIdStore > 0) {
  
        updateCookieConsents({
          variables: {
            createCookieConsentsId: id,
            input: {
              id: cookieConsentsIdStore,
              cookies_analytics: JSON.parse(localConsents).analytics,
              cookies_marketing: JSON.parse(localConsents).adsense,
            },
          },
        }).then((result) => {
          handleResponse(transformResultToResponseCookieConsents(result));
          setClickCookie(false);
      });

        if (createCookieConsentsError || updateCookieConsentsError) {
          throw new Error('Error while creating cookie consents');
        }
      }
    }
  }

  // handle response from create or update cookie consents
  function handleResponse(response: ResponseCookieConsents) {
    let cookieConsent;
    if (response.data.createCookieConsents) {
      cookieConsent = response.data.createCookieConsents;
    } else if (response.data.updateCookieConsents) {
      cookieConsent = response.data.updateCookieConsents;
    }

    cookieConsents.setState({
      id: cookieConsent?.id,
      user_id: id,
      cookies_analytics: cookieConsent?.cookies_analytics,
      cookies_marketing: cookieConsent?.cookies_marketing,
    });
  }

  // function to set true CGU userData
  const handleAcceptCGU = () => {
    updateUser({
      variables: {
        updateUserId: id,
        input: {
          CGU: true,
        },
      },
    }).then(() => {
      userDataStore.setState({ CGU: true });
    });

    if (updateUserError) {
      throw new Error('Error while updating user');
    }
  };

  // set the cookie consents to the store and database
  useEffect(() => {
    if (cookieData) {

      if (
        cookieData.user.cookieConsents &&
        cookieData.user.cookieConsents.user_id === id
      ) {
        // set cookie consents to the store
        const { id, cookies_analytics, cookies_marketing } =
          cookieData.user.cookieConsents;
        cookieConsents.setState({
          id,
          user_id: id,
          cookies_analytics,
          cookies_marketing,
        });

        setIsGetCookie(true);
      } else {
        // set cookie consents to the database and store
        if (id !== 0 && cookieData.user.cookieConsents === null) {
          setIsGetCookie(true);
          handleAcceptCookies(true);
        }
      }
    }
  }, [cookieData]);

  // get rules data and set it to the store
  useEffect(() => {
    if (rulesData && rulesData.rules) {
      // set rules to the store
      rulesStore.setState({
        CGU: rulesData.rules.CGU,
        cookies: rulesData.rules.cookies,
      });
      isGetRulesRef.current = false;
    }
  }, [rulesData]);

  // check if cookie consents are already accepted in the database
  useEffect(() => {
    if (window.location.pathname === '/dashboard' && id > 0) {
      setIsGetCookie(false);
    }

    if (window.location.pathname === '/') {
      setIsGetCookie(true);
    }
    // check if cookie consents are accepted to open the modal
    if (!localStorage.getItem('cookieConsent') && id > 0) {
      if (!CGUStore) {
        isGetRulesRef.current = true;
      }
      setCookiesModal(true);
    }
  }, [id]);

  // update cookie consents if the user change the cookie consents
  useEffect(() => {
    // update
    const localConsents = localStorage.getItem('cookieConsent');

    if (localConsents && id > 0 && cookieConsentsIdStore > 0) {
      const parsedConsents = JSON.parse(localConsents);
      
      if (
        parsedConsents.adsense !== cookiesMarketing ||
        parsedConsents.analytics !== cookiesAnalytics
      ) {
  
        handleAcceptCookies();
      }
    }
  }, [cookieConsentsIdStore]);

  // check if cookie consents are accepted to open the modal
  useEffect(() => {
    if (!localStorage.getItem('cookieConsent')) {
      if (!CGUStore) {
        isGetRulesRef.current = true;
      }
      setCookiesModal(true);
    }

  }, []);

  // check if user accept CGU if not show the modal
  useEffect(() => {
    if (!rulesLoading) {
      if (id !== 0 && CGU === false) {
        if (!CGUStore) {
          isGetRulesRef.current = true;
        }
        if (rulesModal === false) {
          setRulesModal(true);
        }
      }
    }
  }, [CGU, CGUStore, id]);


  return (
    <div className="footer">
      <footer className="footer-container">
        <nav
          className="footer-container__nav"
          aria-label="Liens de pied de page"
        >
          <a
            className="footer-container__link"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              setIsLegalNotices(true);
              setRulesModal(true);
              !CGUStore && (isGetRulesRef.current = true);
            }}
            aria-label="Mentions légales"
          >
            Mentions légales
          </a>
          <a
            className="footer-container__link"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              setRulesModal(true);
              !CGUStore && (isGetRulesRef.current = true);
            }}
            aria-label="Conditions Générales d'Utilisation"
          >
            CGU
          </a>
          <a
            className="footer-container__link"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              setContactModal(true);
            }}
            aria-label="Contactez-nous"
          >
            Contact
          </a>
          <a
            className="footer-container__link"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              setCookiesModal(true);
              document.body.classList.remove('menu-open');
              setClickCookie(true);
            }}
            aria-label="Politique de Cookies"
          >
            Cookies
          </a>
          <span className="footer-container__version">
            {import.meta.env.VITE_VERSION}
          </span>
          <span className="footer-container__copyright">
            © {new Date().getFullYear()} Toupro. Tous droits réservés.
          </span>
        </nav>
      </footer>

      <RulesModal
        content={CGUStore}
        setIsOpenModal={setRulesModal}
        isLegalNotices={isLegalNotices}
        setContactModal={setContactModal}
        setIsLegalNotices={setIsLegalNotices}
        isOpenModal={rulesModal}
        handleAccept={handleAcceptCGU}
        handleLogout={handleLogout}
        loading={rulesLoading || updateUserLoading}
      />
      <ContactModal
        setIsOpenModal={setContactModal}
        isOpenModal={contactModal}
      />

      <CookieConsentModal
        isOpen={cookiesModal}
        setIsOpen={setCookiesModal}
        handleAcceptCookies={handleAcceptCookies}
      />
    </div>
  );
}

export default Footer;
