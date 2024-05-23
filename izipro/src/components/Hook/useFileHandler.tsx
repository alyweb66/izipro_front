import { useState } from 'react';

export function useFileHandler() {
	const [fileError, setFileError] = useState('');
	const [file, setFile] = useState<File[]>([]);
	const [urlFile, setUrlFile] = useState<File[]>([]);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLLabelElement>, onDrag = false) => {

		let files;
		if (onDrag) {
			files = (event as React.DragEvent<HTMLLabelElement>).dataTransfer.files;
		} else {
			files = (event as React.ChangeEvent<HTMLInputElement>).target.files;
		}
		const maxFileSize = 1048576; // 1MB in bytes
		// filter pdf files that are too large
		const validFiles = Array.from(files!).filter(file => {
			if (file.name.endsWith('.pdf')) {
				if (file.size > maxFileSize) {
					setFileError(`File ${file.name} is too large, please select a file smaller than 1MB.`);
					return false;
				}
				return true;
			}
			return true;
		});
		setFileError('');
		
		if (validFiles) {
			const urls = validFiles.map(file => URL.createObjectURL(file));
			const fileObjects = urls.map((url, index) => new File([url], url, { type: validFiles[index].type }));
			setFile([...file, ...validFiles]);
			setUrlFile([...urlFile, ...fileObjects]);
		}
	};

	return { fileError, file, setFile, setUrlFile, setFileError, urlFile, handleFileChange };
}