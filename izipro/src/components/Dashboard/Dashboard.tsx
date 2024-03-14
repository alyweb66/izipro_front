import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Account from './account/Account';

import './Dashboard.scss';

function Dashboard() {
	
	const navigate = useNavigate();
	// condition if user not logged in
	useEffect(() => {
		if (document.cookie === '') {
			navigate('/');
		}
	}),[navigate];

	const [selectedTab, setSelectedTab] = useState('My Profile');



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
				{selectedTab === 'Request' && <div>Demande</div>}
				{selectedTab === 'My requests' && <div>Mes demandes</div>}
				{selectedTab === 'My conversations' && <div>Mes échanges</div>}
				{selectedTab === 'My profile' && <Account />}

			</div>	
		</div>
		
	);
}

export default Dashboard;