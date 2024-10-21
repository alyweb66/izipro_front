import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import Spinner from './Spinner';
import { JobProps } from '../../Type/Request';

type SelectBoxProps = {
	isSetting?: boolean;
	isWishList?: boolean;
	wishListJob?: JobProps[];
	setWishListJob?: Dispatch<SetStateAction<JobProps[]>>;
	data: { id: number; name: string }[];
	isCategory: boolean;
	loading: boolean;
	selected?: number;
	setSelected?: (value: number) => void;
};


const SelectBox = ({ setSelected, loading, isCategory, selected, data, wishListJob, setWishListJob, isWishList, isSetting }: SelectBoxProps) => {

	const [isOpen, setIsOpen] = useState(false);
	const selectRef = useRef<HTMLDivElement>(null);
	const toggleOptions = () => setIsOpen(!isOpen);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);


	return (
		<div className={`center ${isSetting ? 'setting' : ''}`} ref={selectRef} role="combobox" aria-haspopup="listbox" aria-expanded={isOpen}>
			<div className="custom-select-wrapper">
				<div className={`custom-select ${isOpen ? 'opened' : ''}`} onClick={toggleOptions} aria-labelledby="selectLabel">
					<div className={`custom-select-trigger ${(data.length === 0) ? 'no-data' : ''}`} id="selectLabel">
						{loading && <Spinner className="small-spinner" />}
						{selected ? data.find(value => value.id === selected)?.name : isCategory ? 'Catégories' : 'Métiers'}
					</div>
					<div className="custom-options" style={{ display: isOpen ? 'block' : 'none'}} role="listbox">
						{data?.map((option, index) => (
							<div
								className={`custom-option ${selected === option.id ? 'selection' : ''}`}
								key={index}
								onClick={isWishList
									? (event) => {
										const selectedOption = JSON.parse(event.currentTarget.getAttribute('data-option') ?? '');
										if (!wishListJob?.find(option => option.id === selectedOption.id)) {
											setWishListJob && setWishListJob([selectedOption, ...(wishListJob ?? [])]);
										}
									}
									: () => {
										if (typeof option.id === 'number') {
											setSelected && setSelected(option.id);
										}
									}
								}
								role="option"
								aria-selected={selected === option.id}
								data-option={JSON.stringify(option)}
							>
								{option.name}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);

};

export default SelectBox;