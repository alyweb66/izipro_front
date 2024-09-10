import { useState } from 'react';

export function useFileHandler() {
	const [fileError, setFileError] = useState('');
	const [file, setFile] = useState<File[]>([]);
	const [urlFile, setUrlFile] = useState<File[]>([]);

	const handleFileChange = (event?: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLLabelElement>, onDrag = false, media?: File[] ) => {
		setFileError('');
		let files;
		if (onDrag) {
			files = (event as React.DragEvent<HTMLLabelElement>).dataTransfer.files;
		} else if (media) {
			files = media;
		} else {
			files = (event as React.ChangeEvent<HTMLInputElement>).target.files;
		}
		const maxFileSize = 1048576; // 1MB in bytes
		// filter pdf files that are too large
		const validFiles = Array.from(files!).filter(file => {

				const extension = file.name.split('.').pop()?.toLowerCase();
				if (extension && !['jpg', 'jpeg', 'png', 'pdf'].includes(extension)) {
					setFileError(`Fichier ${file.name} n'est pas un fichier valide, fichiers acceptés .jpg, .jpeg .png ou .pdf.`);
					
					setTimeout(() => {
						setFileError('');
					}, 15000);
					return false;
				}

			if (file.name.endsWith('.pdf')) {
				if (file.size > maxFileSize) {
					setFileError(`Fichier ${file.name} est trop grand, veuillez choisir un fichier de moins de 1MB.`);
					setTimeout(() => {
						setFileError('');
					}, 15000);
					return false;
				}
				return true;
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