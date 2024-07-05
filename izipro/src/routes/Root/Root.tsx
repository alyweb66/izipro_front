//import { Outlet } from "react-router-dom";
import Header from '../../components/Header/Header';
import { Outlet } from 'react-router-dom';
import './Root.scss';
import { useEffect } from 'react';

function Root() {

	useEffect(() => {
	// check whitch page is active
		if (window.location.pathname === '/') {
		//add className to root
			document.querySelector('.root')?.classList.add('no-background-image');

		}
	},[]);

	return (
		<div className="root">
			<Header /> 
			<Outlet /> 
		</div>
	);
}

export default Root;
