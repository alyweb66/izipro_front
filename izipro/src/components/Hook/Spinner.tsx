import '../../styles/spinner.scss';

const Spinner = ({ className = '' }) => {

	return (
		<div className={`spinner ${className}`}>
			<span className="loader"></span>
		</div>
	);

};

export default Spinner;