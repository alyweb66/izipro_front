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
import { LOGOUT_USER_MUTATION } from '../GraphQL/UserMutations';
import { useMutation } from '@apollo/client';

function Dashboard() {
	const navigate = useNavigate();

	// State
	const [selectedTab, setSelectedTab] = useState('My Profile');
	
	//store
	const id = userDataStore((state) => state.id);
	const role = userDataStore((state) => state.role);
	const setAll = userDataStore((state) => state.setAll);
	const setSubscription = subscriptionDataStore((state) => state.setSubscription);

	// Query to get the user data
	const getUserData = useQueryUserData();
	const getUserSubscription = useQueryUserSubscriptions();

	//mutation
	const [logout, { error: logoutError }] = useMutation(LOGOUT_USER_MUTATION);
	
	// condition if user not logged in
	let isLogged;
	if (localStorage.getItem('ayl') === 'session') {
		isLogged = {value: true};
	} else {
		isLogged = JSON.parse(localStorage.getItem('ayl') || '{}');
	}
	
	
	
	
	// set user subscription to the store
	useEffect(() => {
		if (getUserSubscription) {
			
			setSubscription(getUserSubscription?.user.subscription);
		}
	},[getUserSubscription]);

	
	// function to check if user is logged in
	useEffect(() => {
		// clear local storage and session storage when user leaves the page if local storage is set to session
		const handleBeforeUnload = () => {
			if (localStorage.getItem('ayl') === 'session') {
				// clear local storage,session storage and cookie
				logout({
					variables: {
						logoutId: id
					}
				}).then(() => {

					sessionStorage.clear();
					localStorage.clear();
				});

				if (logoutError) {
					throw new Error('Error while logging out');
				}
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);

		// check if user is logged in
		if (isLogged !== null && Object.keys(isLogged).length !== 0) {
			if (new Date().getTime() > isLogged.expiry) {
				// The data has expired
				localStorage.removeItem('ayl');
				
				
				if (window.location.pathname !== '/') {
					navigate('/');
				}
			} 
		} else {
			
			
			if (window.location.pathname !== '/') {
				navigate('/');
			}
			// if user logged in, set the user data to the store
		} 

	},[]);


	// set user data to the store
	useEffect(() => {
		if (getUserData) {
			
			
			setAll(getUserData?.user);
		}
	},[getUserData]);



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