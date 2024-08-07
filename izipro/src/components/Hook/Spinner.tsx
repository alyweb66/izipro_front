import { useEffect, useState } from 'react';
import '../../styles/spinner.scss';

const Spinner = ({ className = '', delay = 500 }) => {
	console.log('className', className);
	
	const [show, setShow] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setShow(true), delay);

		return () => clearTimeout(timer);
	}, [delay]);

	if (!show) return null;
	return (
		<div className={`spinner ${className}`}>
			<span className="loader"></span>
		</div>
	);

};

export default Spinner;