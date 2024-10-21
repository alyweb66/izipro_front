import { useEffect, useState } from 'react';
//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
import { MdKeyboardArrowRight, MdKeyboardArrowLeft, MdClose } from 'react-icons/md';
import '../../styles/imageModal.scss';
import { motion } from 'framer-motion';
import pdfLogo from '/logo-pdf.webp';

ReactModal.setAppElement('#root');


// function to use the image modal
export function useModal() {
	const [modalIsOpen, setModalIsOpen] = useState(false);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);
	const [images, setImages] = useState<string[]>([]);




	function openModal(imageUrls: string[], initialIndex: number) {
		setImages(imageUrls);
		setSelectedImageIndex(initialIndex);
		setModalIsOpen(true);
	}

	function closeModal() {
		setModalIsOpen(false);
	}

	function nextImage() {
		setSelectedImageIndex((prevIndex) => (prevIndex + 1) % images.length);

	}

	function previousImage() {
		setSelectedImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);

	}

	return { modalIsOpen, openModal, closeModal, selectedImage: images[selectedImageIndex], nextImage, previousImage };
}

export function ImageModal({
	modalIsOpen,
	closeModal,
	selectedImage,
	nextImage,
	previousImage,
	hasManyImages

}: {

	modalIsOpen: boolean, closeModal: () => void, selectedImage: string, nextImage: () => void, previousImage: () => void, hasManyImages: boolean
}) {

	// useEffect to block the background scrolling
	useEffect(() => {
		if (modalIsOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [modalIsOpen]);

	return (
		<ReactModal
			className="react-modal"
			isOpen={modalIsOpen}
			onRequestClose={closeModal}
			aria-labelledby="react-modal-title"
			aria-describedby="react-modal-description"
			shouldCloseOnOverlayClick={true}
			overlayClassName="react-image-modal__overlay"
		>
			<header>
				<button
					id="close"
					className="react-modal__button"
					onClick={closeModal}>Fermer
					aria-label="Fermer le modal"
				</button>
			</header>
			<section className="react-modal__picture" aria-labelledby="image-modal-title">
				<MdClose
					className="react-modal__button-close"
					onClick={() => document.getElementById('close')?.click()}
					aria-label="Fermer le modal"
				/>
				<button
					id="previous"
					className="react-modal__picture button"
					aria-label="Image précédente"
					onClick={previousImage}
				>Précédent
				</button>
				{hasManyImages && <MdKeyboardArrowLeft
					className="react-modal__picture back"
					onClick={() => document.getElementById('previous')?.click()}
					aria-label="Image précédente"
				/>}
				{selectedImage?.endsWith('.pdf') ? (
					<a
						className="a-pdf"
						href={selectedImage}
						key={selectedImage}
						download={selectedImage}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(event) => { event.stopPropagation(); }}
						aria-label="Télécharger le fichier PDF"
					>
						<img
							className="react-modal__picture img"
							src={pdfLogo}
							alt={selectedImage}
						/>
					</a>
				) : (
					<motion.img
						className="react-modal__picture img"
						key={selectedImage}
						src={selectedImage}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ type: 'Spring', duration: 0.3 }}
					/>
				)}
				<button
					id="next"
					className="react-modal__picture button"
					onClick={nextImage}
					aria-label="Image suivante"
				>Suivant
				</button>
				{hasManyImages && <MdKeyboardArrowRight
					className="react-modal__picture forward"
					onClick={() => document.getElementById('next')?.click()}
					aria-label="Image suivante"
				/>}
			</section>

		</ReactModal>
	);
}