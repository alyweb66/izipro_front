import Login from './LoginRegister/Login';
import Register from './LoginRegister/Register';
import Presentation from './Presentation/Presentation';
import Footer from '../Footer/Footer';
import { useNavigate } from 'react-router-dom';
import './Home.scss';
import { useEffect, useState } from 'react';
import { useQueryRules } from '../Hook/Query';
import { rulesStore } from '../../store/UserData';
import { RulesModal } from '../Hook/RulesModal';
import Spinner from '../Hook/Spinner';

function Home() {
	const navigate = useNavigate();

	
	//const isLogged = localStorage.getItem('ayl') || sessionStorage.getItem('ayl');

	//state
	//const [isGetRules, setIsGetRules] = useState<boolean>(false);
	//const [cookiesModal, setCookiesModal] = useState<boolean>(false);
	//const [isGetCookieConsents, setIsGetCookieConsents] = useState<boolean>(true);

	//store
	//const [cookiesAnalyticsStore, cookiesMarketingStore, cookiesNecessaryStore] = cookieConsents((state) => [state.cookies_analytics, state.cookies_marketing, state.cookies_necessary]);
	//const [cookieStore] = rulesStore((state) => [state.CGU, state.cookies]);
	
	//Query
	//const { loading: rulesLoading, rulesData } = useQueryRules(isGetRules);
	//const { loading: getCookieConsentsLoading, cookieData} = useQueryCookieConsents(isGetCookieConsents);
	
	/* useEffect(() => {
		if (isLogged) {
			navigate('/dashboard');
		}
	}, [navigate]); */

	// get rules data and set it to the store
	/* useEffect(() => {

		if (rulesData && rulesData.rules) {
			// set rules to the store
			rulesStore.setState({ CGU: rulesData.rules.CGU, cookies: rulesData.rules.cookies });
			setIsGetRules(false);
		}

	}, [rulesData]); */

	// check if user is logged in and if cookie consents are accepted
	useEffect(() => {

		/* if (!localStorage.getItem('cookieConsents')) {
			setCookiesModal(true);
		} */
		// condition if user not logged in
		const getItem = localStorage.getItem('chekayl');
		if (!getItem) {	
			return;
		}
		const decodeData = atob(getItem || '');
		let isLogged;
		console.log('isLogged', isLogged);
		
		if (decodeData === 'session') {
			isLogged = { value: true };
		} else {
			isLogged = JSON.parse(decodeData || '{}');
		}
		if (isLogged) {
			navigate('/dashboard');
		}
		
	},[]);

	/* useEffect(() => {
		console.log('cookieData', cookieData);
		if (cookieData !== undefined 
			&& cookieData?.user.cookieConsents === null ) {
			setCookiesModal(true);
			// set cookie consents to the store
			setIsGetCookieConsents(false);
		} else if (cookieData !== undefined) {
			// set cookie consents to the store
			cookieConsents.setState({ 
				cookies_analytics: cookieData.user.cookieConsents.cookies_analytics, 
				cookies_marketing: cookieData.user.cookieConsents.cookies_marketing, 
				cookies_necessary: cookieData.user.cookieConsents.cookies_necessary });
			setIsGetCookieConsents(false);
		}
	}, [cookieData]); */

	/* function handleAcceptCookies(acceptAll?: boolean | null) {
		if (acceptAll) {
			localStorage.setItem('cookieConsents', 'all');
			setCookiesModal(false);
		} else {
			localStorage.setItem('cookieConsents', 'necessary');
			setCookiesModal(false);
		}
	} */

	return (
		<div className="home">
			
			<Login />
			<Register />
			<Presentation />
			<Footer />

		{/* 	<RulesModal
				isCookie={true}
				content={cookieStore}
				setIsOpenModal={setCookiesModal}
				isOpenModal={cookiesModal}
				handleAccept={handleAcceptCookies}
			/> */}
		</div>
	);
}

export default Home;