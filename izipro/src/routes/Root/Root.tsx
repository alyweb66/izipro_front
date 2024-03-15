//import { Outlet } from "react-router-dom";
import Header from '../../components/Header/Header';
import { Outlet } from 'react-router-dom';
import './Root.scss';

function Root() {
	return (
		<div className="root">
			<Header /> 
			<Outlet /> 
		</div>
	);
}

export default Root;
