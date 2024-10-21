import React, { useEffect, useState } from 'react';
import '../../styles/spinner.scss';
import { motion } from 'framer-motion';

type SpinnerProps = {
	className?: 'small-spinner' | '';
	delay?: number;
}

const Spinner: React.FC<SpinnerProps> = ({ className = '', delay = 500 }) => {

	const [show, setShow] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setShow(true), delay);

		return () => clearTimeout(timer);
	}, [delay]);

	if (!show) return null;
	return (
		<motion.div
			className={`spinner ${className}`}
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
			transition={{ duration: 0.3, type: 'tween' }}
		>
			<span className="loader"></span>
		</motion.div>
	);

};

export default Spinner;