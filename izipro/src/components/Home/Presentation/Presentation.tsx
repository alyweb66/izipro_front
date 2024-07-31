import { useEffect, useState } from 'react';
import './Presentation.scss';

function Presentation() {
	// State 
	const [imagePosition, setImagePosition] = useState(false);

	// useEffect to check the size of the window
	useEffect(() => {

		// function to check the size of the window
		const handleResize = () => {
			if (window.innerWidth < 800) {
				setImagePosition(true);
			} else {
				setImagePosition(false);
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
		<div className="presentation-container">
			<h2 className="presentation-container__title">&quot;La solution pour connecter efficacement particuliers et professionnels.&quot;</h2>
			<div className="presentation-container__particular">
				<div className="image image-1">
				</div>
				<div className="image image-2"></div>
			</div>
			<div className="presentation-container__content">
				<p className="content">
					Plus de temps à perdre ? Dites adieu aux recherches fastidieuses de professionnels. Simplifiez votre vie avec notre plateforme pratique pour faire vos demandes de devis ou d&apos;urgence aux proffessionnel. Faites place à l&apos;efficacité et gagnez du temps pour ce qui compte vraiment.
				</p>
			</div>
			{imagePosition ? (
				<>
					<div className="presentation-container__particular-pro">
						<div className="image image-1">
						</div>
						<div className="image image-2">
						</div>
						<div className="image image-3">
						</div>
					</div>
					<div className="presentation-container__content">
						<p className="content">
							Avec notre plateforme, les jeunes entrepreneurs comme vous peuvent enfin se lancer dans leurs projets avec confiance et facilité. Plus besoin de chercher désespérément des clients - notre réseau dynamique vous met en contact avec les bonnes personnes au bon moment.
						</p>
					</div>
				</>
			) : (
				<>
					<div className="presentation-container__content">
						<p className="content">
							Avec notre plateforme, les jeunes entrepreneurs comme vous peuvent enfin se lancer dans leurs projets avec confiance et facilité. Plus besoin de chercher désespérément des clients - notre réseau dynamique vous met en contact avec les bonnes personnes au bon moment.
						</p>
					</div>
					<div className="presentation-container__particular-pro">
						<div className="image image-1">
						</div>
						<div className="image image-2">
						</div>
						<div className="image image-3">
						</div>
					</div>
				</>
			)}

		</div>
	);
}

export default Presentation;