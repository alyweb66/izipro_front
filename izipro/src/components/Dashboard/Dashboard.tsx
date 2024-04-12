import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Account from './Account/Account';
import Request from './Request/Request';
import MyRequest from './MyRequest/MyRequest';
import ClientRequest from './ClientRequest/ClientRequest';
import { userDataStore } from '../../store/UserData';
import { useQueryUserData } from '../Hook/Query';

import './Dashboard.scss';

function Dashboard() {
	const navigate = useNavigate();

	// State
	const [selectedTab, setSelectedTab] = useState('My Profile');
	
	//store 
	const role = userDataStore((state) => state.role);
	const setAll = userDataStore((state) => state.setAll);
	
	// Query to get the user data
	const getUserData = useQueryUserData();
	
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

	useEffect(() => {
		if (getUserData) {
			console.log('userdata', getUserData?.user);
			
			setAll(getUserData?.user);
		}
	},[getUserData]);


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
				{selectedTab === 'My conversations' && <div>Mes échanges</div>}
				{selectedTab === 'My profile' && <Account />}
				{selectedTab === 'Client request' && <ClientRequest />}

			</div>	
		</div>
		
	);
}

export default Dashboard;