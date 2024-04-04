import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Account from './Account/Account';
import Request from './Request/Request';
import MyRequest from './MyRequest/MyRequest';
import ClientRequest from './ClientRequest/ClientRequest';
import { useQuery } from '@apollo/client';
import { GET_USER_DATA } from '../GraphQL/UserQueries';
import { userDataStore } from '../../store/UserData';

import './Dashboard.scss';

function Dashboard() {
	const navigate = useNavigate();

	// State
	const [selectedTab, setSelectedTab] = useState('My Profile');
	
	//store 
	const role = userDataStore((state) => state.role);
	const setAll = userDataStore((state) => state.setAll);
	
	// Query to get the user data
	const { error: getUserError, data: getUserData } = useQuery(GET_USER_DATA);

	// condition if user not logged in
	const isLogged = localStorage.getItem('ayl') || sessionStorage.getItem('ayl');



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
		} else {
			setAll(getUserData?.user);
		}

		if (getUserError) {
			throw new Error ('Error while fetching user data');
		}


	}),[];


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