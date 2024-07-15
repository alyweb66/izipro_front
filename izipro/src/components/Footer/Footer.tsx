import { useEffect, useRef, useState } from 'react';

// State management and stores
import { cookieConsents, rulesStore, userDataStore } from '../../store/UserData';

// Custom hooks and components
import { RulesModal } from '../Hook/RulesModal';
import { ContactModal } from '../Hook/ContactModal';

// Apollo Client
import { useMutation, FetchResult } from '@apollo/client';
import {
	COOKIE_CONSENTS_MUTATION,
	UPDATE_COOKIE_CONSENTS_MUTATION,
	UPDATE_USER_MUTATION
} from '../GraphQL/UserMutations';

// Custom hooks and queries
import { useQueryCookieConsents, useQueryRules } from '../Hook/Query';

// Types
import { CookieConsentsProps } from '../../Type/CookieConsents';

// Utility hook
import useHandleLogout from '../Hook/HandleLogout';

// Styles
import './Footer.scss';


type ResponseCookieConsents = {
	data: {
		createCookieConsents: CookieConsentsProps;
		updateCookieConsents: CookieConsentsProps;
	}
}

function Footer() {
	
	//state
	const [cookiesModal, setCookiesModal] = useState<boolean>(false);
	const [isGetCookieConsents, setIsGetCookieConsents] = useState<boolean>(true);
	const [clickCookie, setClickCookie] = useState<boolean>(false);
	const [CGUModal, setCGUModal] = useState<boolean>(false);
	const [contactModal, setContactModal] = useState<boolean>(false);
	
	//useRef
	const isGetRulesRef = useRef<boolean>(false);

	//store
	const [id, CGU] = userDataStore((state) => [state.id, state.CGU]);
	//const CGU = userDataStore((state) => state.CGU);
	const [CGUStore, cookieStore] = rulesStore((state) => [state.CGU, state.cookies]);
	const [cookieConsentsId, cookiesNecessaryStore] = cookieConsents((state) => [state.id, state.cookies_necessary]);

	const handleLogout = useHandleLogout();

	//Query
	const { loading: rulesLoading, rulesData } = useQueryRules(isGetRulesRef.current);
	const { loading: getCookieConsentsLoading, cookieData } = useQueryCookieConsents(isGetCookieConsents);

	//Mutation
	const [createCookieConsents, { loading: createCookieConsentsLoading, error: createCookieConsentsError }] = useMutation(COOKIE_CONSENTS_MUTATION);
	const [updateCookieConsents, { loading: updateCookieConsentsLoading, error: updateCookieConsentsError }] = useMutation(UPDATE_COOKIE_CONSENTS_MUTATION);
	const [updateUser, { loading: updateUserLoading, error: updateUserError }] = useMutation(UPDATE_USER_MUTATION);

	// function to transform the result to match ResponseCookieConsents structure of response data
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function transformResultToResponseCookieConsents(result: FetchResult<any>): ResponseCookieConsents {
		// Transform the result to match ResponseCookieConsents structure
		return {
			data: result.data
		};
	}

	// handle accept cookies to set the cookie consents to the store and database
	function handleAcceptCookies(localConsents?: string, acceptAll?: boolean | null) {

		if (acceptAll) {
			localStorage.setItem('cookieConsents', 'all');
			setCookiesModal(false);
		} else {
			localStorage.setItem('cookieConsents', 'necessary');
			setCookiesModal(false);
		}

		if (id !== 0) {
			if (cookieConsentsId === 0 && !clickCookie) {
				
				createCookieConsents({
					variables: {
						createCookieConsentsId: id,
						input: {
							cookies_analytics: localConsents === 'all' || acceptAll || false,
							cookies_marketing: localConsents === 'all' || acceptAll || false,
							cookies_necessary: true,
						}
					}
				}).then(result => handleResponse(transformResultToResponseCookieConsents(result)));

			} else {
				updateCookieConsents({
					variables: {
						createCookieConsentsId: id,
						input: {
							id: cookieConsentsId,
							cookies_analytics: localConsents === 'all' || acceptAll || false,
							cookies_marketing: localConsents === 'all' || acceptAll || false,
							cookies_necessary: true,
						}
					}
				}).then(result => handleResponse(transformResultToResponseCookieConsents(result)));

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
			cookies_necessary: cookieConsent?.cookies_necessary,
		});
	}

	// function to set true CGU userData
	const handleAcceptCGU = () => {

		updateUser({
			variables: {
				updateUserId: id,
				input: {
					CGU: true
				},
			}
		}).then(() => {
			setCGUModal(false);
			userDataStore.setState({ CGU: true });
		});

		if (updateUserError) {
			throw new Error('Error while updating user');
		}
	};

	// set the cookie consents to the store and database
	useEffect(() => {
		if (!getCookieConsentsLoading && !rulesLoading && !isGetRulesRef) {
			if (cookieData && cookieData.user.cookieConsents && cookieData.user.cookieConsents.user_id === id) {
			// set cookie consents to the store
				const { id, cookies_analytics, cookies_marketing, cookies_necessary } = cookieData.user.cookieConsents;
				cookieConsents.setState({
					id,
					user_id: id,
					cookies_analytics,
					cookies_marketing,
					cookies_necessary
				});

				setIsGetCookieConsents(false);
			} else {
			// set cookie consents to the database and store
				const localConsents = localStorage.getItem('cookieConsents');

				if (id !== 0 && (localConsents === 'all' || localConsents === 'necessary') && !cookiesNecessaryStore && isGetCookieConsents) {
					handleAcceptCookies(localConsents);

					setIsGetCookieConsents(false);
				}
			}
		}
	}, [cookieData, id]);

	// get rules data and set it to the store
	useEffect(() => {

		if (rulesData && rulesData.rules) {
			// set rules to the store
			rulesStore.setState({ CGU: rulesData.rules.CGU, cookies: rulesData.rules.cookies });
			isGetRulesRef.current = false;
		}
	}, [rulesData]);

	// check if cookie consents are accepted
	useEffect(() => {
		if (!localStorage.getItem('cookieConsents')) {
			if(!CGUStore) {
				isGetRulesRef.current = true;
			}
			setCookiesModal(true);
		}
	},[]);

	// check if user accept CGU if not show the modal
	useEffect(() => {
		if (!rulesLoading) {
			if (id !== 0 && CGU === false) {
				if (!CGUStore) {
					isGetRulesRef.current = true;
				}
				if (CGUModal === false) {
					setCGUModal(true);
				}
			}
		}
	}, [CGU, CGUStore, id]);

	return (

		<div className="footer">
			<footer className="footer-container">
				<a className="footer-container__link" href="#" onClick={() => {setCGUModal(true), isGetRulesRef.current = true;}}>CGU</a>
				<a className="footer-container__link" href="#" onClick={() => setContactModal(true)} >Contact</a>
				<a className="footer-container__link" href="#" onClick={() => {setCookiesModal(true), isGetRulesRef.current = true, setClickCookie(true);}}>Cookies</a>
			</footer>

			<RulesModal
				isCookie={true}
				content={cookieStore}
				setIsOpenModal={setCookiesModal}
				isOpenModal={cookiesModal}
				handleAccept={handleAcceptCookies}
				loading={createCookieConsentsLoading || updateCookieConsentsLoading || rulesLoading || getCookieConsentsLoading}
			/>
			<RulesModal
				content={CGUStore}
				setIsOpenModal={setCGUModal}
				isOpenModal={CGUModal}
				handleAccept={handleAcceptCGU}
				handleLogout={handleLogout}
				loading={rulesLoading || updateUserLoading}
			/>
			<ContactModal
				setIsOpenModal={setContactModal}
				isOpenModal={contactModal}
			/>
		</div>
	);
}

export default Footer;