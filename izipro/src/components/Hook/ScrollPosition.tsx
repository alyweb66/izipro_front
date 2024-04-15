import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const savedScrollPosition = () => {
	sessionStorage.setItem('scrollPosition', window.scrollY.toString());
};

export const restoreScrollPosition = () => {
	const savedPosition = sessionStorage.getItem('scrollPosition');
	if (savedPosition) {
		window.scrollTo(0, parseInt(savedPosition, 10));
	}
};

export const useScrollRestoration = () => {
	const location = useLocation();
	useLayoutEffect(() => {
		restoreScrollPosition();
		return () => {
			savedScrollPosition();
		};
	}, [location.pathname]);
};

