import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Account from './Account/Account';
import Request from './Request/Request';
import MyRequest from './MyRequest/MyRequest';
import MyConversation from './MyConversation/MyConversation';
import ClientRequest from './ClientRequest/ClientRequest';
import { userDataStore } from '../../store/UserData';
import { useQueryUserData, useQueryUserSubscriptions } from '../Hook/Query';

import './Dashboard.scss';
import { subscriptionDataStore } from '../../store/subscription';

function Dashboard() {
	const navigate = useNavigate();

	// State
	const [selectedTab, setSelectedTab] = useState('My Profile');
	
	//store 
	const role = userDataStore((state) => state.role);
	const setAll = userDataStore((state) => state.setAll);
	const setSubscription = subscriptionDataStore((state) => state.setSubscription);
	
	
	// Query to get the user data
	const getUserData = useQueryUserData();
	const getUserSubscription = useQueryUserSubscriptions();
	
	// condition if user not logged in
	const isLogged = localStorage.getItem('ayl') || sessionStorage.getItem('ayl');
	


	// function to check if user is logged in
	useEffect(() => {
		// clear local storage and session storage when user leaves the page if local storage is set to session
		const handleBeforeUnload = () => {
			if (localStorage.getItem('ayl') === 'session') {
				// clear local storage and session storage
				sessionStorage.clear();
				localStorage.clear();
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);

		// check if user is logged in
		if (!isLogged) {
			navigate('/');
			// if user logged in, set the user data to the store
		} 

	});

	// set user data to the store
	useEffect(() => {
		if (getUserData) {
			console.log('userdata', getUserData?.user);
			
			setAll(getUserData?.user);
		}
	},[getUserData]);

	// set user subscription to the store
	useEffect(() => {
		if (getUserSubscription) {
			console.log('subscription', getUserSubscription?.user.subscription);
			setSubscription(getUserSubscription?.user.subscription);
		}
	},[getUserSubscription]);

	const handleMyConvesationNavigate = () => {
		setSelectedTab('My conversations');
	};

	return(
		<div className='dashboard-container'>
			<nav className="menu-container">
				<ul className="menu">
					<li className="tab" onClick={() => setSelectedTab('Request')}>Demande</li>
					<li className="tab" onClick={() => setSelectedTab('My requests')}>Mes demandes</li>
					{role === 'pro' && <li className="tab" onClick={() => setSelectedTab('Client request')}>Client</li>}
					<li className="tab" onClick={() => setSelectedTab('My conversations')}>Mes échanges</li>
					<li className="tab" onClick={() => setSelectedTab('My profile')}>Mon compte</li>


				</ul>
			</nav>

			<div className="content-container">
				{selectedTab === 'Request' && <Request/>}
				{selectedTab === 'My requests' && <MyRequest/>}
				{selectedTab === 'My conversations' && <MyConversation/>}
				{selectedTab === 'My profile' && <Account />}
				{selectedTab === 'Client request' && <ClientRequest onDetailsClick={handleMyConvesationNavigate} />}

			</div>	
		</div>
		
	);
}

export default Dashboard;