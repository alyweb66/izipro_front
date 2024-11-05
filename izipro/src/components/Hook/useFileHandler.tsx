import { useState } from 'react';

export function useFileHandler() {
	const [fileError, setFileError] = useState('');
	const [file, setFile] = useState<File[]>([]);
	const [urlFile, setUrlFile] = useState<File[]>([]);

	const handleFileChange = (event?: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLLabelElement>, onDrag = false, media?: File[]) => {
		setFileError('');
		let files;
		if (onDrag) {
			files = (event as React.DragEvent<HTMLLabelElement>).dataTransfer.files;
		} else if (media) {
			files = media;
		} else {
			files = (event as React.ChangeEvent<HTMLInputElement>).target.files;
		}
		const maxFileSize = 1.5e+7; 
		const maxPdfFileSize = 1048576; // 1 Mo
		// filter pdf files that are too large
		const validFiles = Array.from(files!).filter(file => {


			// check if file is too large
			if (file.size > maxFileSize) {
				setFileError(`Fichier ${file.name} est trop grand, veuillez choisir un fichier de moins de 15Mo.`);
				setTimeout(() => {
					setFileError('');
				}, 15000);
				return false;
			}

			if (file.name.endsWith('.pdf') && file.size > maxPdfFileSize) {
				setFileError(`Fichier ${file.name} est trop grand, veuillez choisir un PDF de moins de 1Mo.`);
				setTimeout(() => {
					setFileError('');
				}, 15000);
				return false;
			}

			// check if format is a valid file
			const extension = file.name.split('.').pop()?.toLowerCase();
			if (extension && !['jpg', 'jpeg', 'png', 'pdf'].includes(extension)) {
				setFileError(`Fichier ${file.name} n'est pas un fichier valide, fichiers acceptés .jpg, .jpeg, .png ou .pdf.`);

				setTimeout(() => {
					setFileError('');
				}, 15000);
				return false;
			}

			return true;
		});

		if (validFiles) {
			const urls = validFiles.map(file => URL.createObjectURL(file));
			const fileObjects = urls.map((url, index) => new File([url], url, { type: validFiles[index].type }));
			setFile([...file, ...validFiles]);
			setUrlFile([...urlFile, ...fileObjects]);
		}
	};


	return { fileError, file, setFile, setUrlFile, setFileError, urlFile, handleFileChange };
}