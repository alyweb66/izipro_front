import '../../styles/badge.scss';
import { motion, AnimatePresence  } from 'framer-motion';

export const Badge = ({ count }: { count: number }) => {
	
	return (
		<AnimatePresence>
			<motion.div 
				className="notification-badge"
				initial={{ opacity: 0, scale: 0.5 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
				transition={{ 
					duration: 0.1, 
					type: 'spring',  
					stiffness: 300 , 
					damping: 20, 
					mass: 1 
				}}
			>
				{count > 99 ? '99+' : count > 0 ? count : null}
			</motion.div>
		</AnimatePresence>
	);
};

/* export const ClientMessageBadge = ({ count }: { count: number }) => {
	return (
		<div className="notification-badge">
			{count > 0 ? count : null}
		</div>
	);
};

export const MyRequestBadge = ({ count }: { count: number }) => {
	return (
		<div className="notification-badge">
			{count > 0 ? count : null}
		</div>
	);
}; */
