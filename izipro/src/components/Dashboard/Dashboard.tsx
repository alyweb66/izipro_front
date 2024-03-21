import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Account from './Account/Account';
import Request from './Request/Request';
import { useQuery } from '@apollo/client';
import { GET_USER_DATA } from '../GraphQL/UserQueries';
import { userDataStore, userIsLoggedStore } from '../../store/UserData';

import './Dashboard.scss';

function Dashboard() {

	const [selectedTab, setSelectedTab] = useState('My Profile');
	
	//store 
	const setAll = userDataStore((state) => state.setAll);
	const isLogged = userIsLoggedStore((state) => state.isLogged);
	
	// Query to get the user data
	const { error: getUserError, data: getUserData } = useQuery(GET_USER_DATA);

	const navigate = useNavigate();
	// condition if user not logged in
	useEffect(() => {
		// if user not logged in, redirect to login page
		if (!document.cookie && !isLogged) {
			navigate('/');
		} 
		// if user logged in, set the user data to the store
		setAll(getUserData?.user);

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
					<li className="tab" onClick={() => setSelectedTab('My conversations')}>Mes échanges</li>
					<li className="tab" onClick={() => setSelectedTab('My profile')}>Mon compte</li>
				</ul>
			</nav>

			<div className="content-container">
				{selectedTab === 'Request' && <Request/>}
				{selectedTab === 'My requests' && <div>Mes demandes</div>}
				{selectedTab === 'My conversations' && <div>Mes échanges</div>}
				{selectedTab === 'My profile' && <Account />}

			</div>	
		</div>
		
	);
}

export default Dashboard;