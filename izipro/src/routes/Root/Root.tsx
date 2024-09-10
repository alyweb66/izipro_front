//import { Outlet } from "react-router-dom";
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Outlet } from 'react-router-dom';
import './Root.scss';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Root() {
	const navigate = useNavigate();
	// state
	const [isFooter, setIsFooter] = useState(true);

	// disable background image on home page
	useEffect(() => {
		// check whitch page is active
		if (window.location.pathname === '/') {
			//add className to root
			document.querySelector('.root')?.classList.add('no-background-image');

		}

		if (localStorage.getItem('login') === null) {
			navigate('/');
		}
	}, []);


	// useEffect to check the size of the window
	useEffect(() => {

		// function to check the size of the window
		const handleResize = () => {
			if (window.innerWidth < 480) {
				setIsFooter(false);
			} else {
				setIsFooter(true);
			}
		};

		// add event listener to check the size of the window
		window.addEventListener('resize', handleResize);

		// 	call the function to check the size of the window
		handleResize();

		// remove the event listener when the component unmount
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return (
		<div className="root">
			<Header />
			<Outlet />
			{isFooter && <Footer />}
		</div>
	);
}

export default Root;
