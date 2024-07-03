import { useEffect, useState } from 'react';
import { cookieConsents, rulesStore, userDataStore } from '../../store/UserData';
import { RulesModal } from '../Hook/RulesModal';
import './Footer.scss';
import { FetchResult, useMutation } from '@apollo/client';
import { COOKIE_CONSENTS_MUTATION, UPDATE_COOKIE_CONSENTS_MUTATION } from '../GraphQL/UserMutations';
import { useQueryCookieConsents, useQueryRules } from '../Hook/Query';
import { CookieConsentsProps } from '../../Type/CookieConsents';

type ResponseCookieConsents = {
	data: {
		createCookieConsents: CookieConsentsProps;
		updateCookieConsents: CookieConsentsProps;
	}
}

function Footer() {
	//state
	const [cookiesModal, setCookiesModal] = useState<boolean>(false);
	const [isGetRules, setIsGetRules] = useState<boolean>(true);
	const [isGetCookieConsents, setIsGetCookieConsents] = useState<boolean>(true);
	const [clickCookie, setClickCookie] = useState<boolean>(false);

	//store
	const id = userDataStore((state) => state.id);
	const [cookieStore] = rulesStore((state) => [state.CGU, state.cookies]);
	const [cookieConsentsId, cookiesNecessaryStore] = cookieConsents((state) => [state.id, state.cookies_necessary]);
	const [createCookieConsents, { loading: createCookieConsentsLoading, error: createCookieConsentsError }] = useMutation(COOKIE_CONSENTS_MUTATION);
	const [updateCookieConsents, { loading: updateCookieConsentsLoading, error: updateCookieConsentsError }] = useMutation(UPDATE_COOKIE_CONSENTS_MUTATION);
	//console.log('isGetCookieConsents', isGetCookieConsents);

	//Query
	const { loading: rulesLoading, rulesData } = useQueryRules(isGetRules);
	const { loading: getCookieConsentsLoading, cookieData } = useQueryCookieConsents(isGetCookieConsents);

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
				console.log('createCookieConsents is doing', cookieConsentsId, clickCookie);
				
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
	//console.log('cookieData', cookieData);
	//console.log('cookieConsentsId', cookieConsentsId);

	// set the cookie consents to the store and database
	useEffect(() => {
		if (!getCookieConsentsLoading) {
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
				//	console.log('passe a false 1');
			
				setIsGetCookieConsents(false);
			} else {
			// set cookie consents to the database and store
				const localConsents = localStorage.getItem('cookieConsents');

				if (id !== 0 && (localConsents === 'all' || localConsents === 'necessary') && !cookiesNecessaryStore && isGetCookieConsents) {
					handleAcceptCookies(localConsents);
					//	console.log('passe a false 2');
				
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
			setIsGetRules(false);
		}

	}, [rulesData]);

	// check if cookie consents are accepted
	useEffect(() => {
		if (!localStorage.getItem('cookieConsents')) {
			setCookiesModal(true);
		}
	
	}, []);



	return (

		<div>
			<footer>
				<a href="#">CGU</a>
				<a href="#">Contact</a>
				<a href="#" onClick={() =>{setCookiesModal(true), setClickCookie(true);}}>Cookies</a>
			</footer>

			<RulesModal
				isCookie={true}
				content={cookieStore}
				setIsOpenModal={setCookiesModal}
				isOpenModal={cookiesModal}
				handleAccept={handleAcceptCookies}
				loading={createCookieConsentsLoading || updateCookieConsentsLoading || rulesLoading || getCookieConsentsLoading}
			/>
		</div>
	);
}

export default Footer;