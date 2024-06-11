import '../../styles/badge.scss'; // Assurez-vous d'importer le fichier CSS

export const ClientRequestBadge = ({count} : {count: number}) => {
	return (
		<div className="notification-badge">
			{count > 99 ? '99+' : count > 0 ? count : null}
		</div>
	);
};

export const ClientMessageBadge = ({count} : {count: number}) => {
	return (
		<div className="notification-badge">
			{count > 0 ? count : null}
		</div>
	);
};

export const MyRequestBadge = ({count} : {count: number}) => {
	return (
		<div className="notification-badge">
			{count > 0 ? count : null}
		</div>
	);
};
