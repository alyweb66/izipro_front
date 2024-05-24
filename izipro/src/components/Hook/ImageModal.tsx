import { useState } from 'react';
//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';
import { MdKeyboardArrowRight, MdKeyboardArrowLeft, MdClose} from 'react-icons/md';

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
		setSelectedImageIndex((selectedImageIndex + 1) % images.length);
	}

	function previousImage() {
		setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
	}

	return { modalIsOpen, openModal, closeModal, selectedImage: images[selectedImageIndex], nextImage, previousImage };
}

export function ImageModal({ modalIsOpen, closeModal, selectedImage, nextImage, previousImage }: { modalIsOpen: boolean, closeModal: () => void, selectedImage: string, nextImage: () => void, previousImage: () => void }) {
	return (
		<ReactModal
			className="react-modal"
			isOpen={modalIsOpen}
			onRequestClose={closeModal}
			contentLabel="Image Modal"
		>
			<button 
				id="close"
				className="react-modal__button" 
				onClick={closeModal}>Fermer
			</button>
			<MdClose 
				className="react-modal__button-close" 
				onClick={() => document.getElementById('close')?.click()} 
			/>
			<div className="react-modal__picture">
				<button
					id="previous" 
					className="react-modal__picture button" 
					onClick={previousImage}>Précédent</button>
				<MdKeyboardArrowLeft 
					className="react-modal__picture back" 
					onClick={() => document.getElementById('previous')?.click()}
				/>
				<img className="react-modal__picture img" src={selectedImage} alt="Selected" />
				<button
					id="next" 
					className="react-modal__picture button" 
					onClick={nextImage}>Suivant</button>
				<MdKeyboardArrowRight 
					className="react-modal__picture forward" 
					onClick={() => document.getElementById('next')?.click()}
				/>
			</div>
		</ReactModal>
	);
}