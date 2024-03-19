import { useEffect } from 'react';
import './Request.scss';
import { GET_JOB_CATEGORY } from '../../GraphQL/RequestQueries';
import { useQuery } from '@apollo/client';

type CategoryPros = {
	id: number;
	name: string;
}


function Request() {

	const { error: cetagoryError, data: categoriesData} = useQuery(GET_JOB_CATEGORY);

	if(cetagoryError) {
		console.log('error', cetagoryError);
	}

console.log('categoriesData', categoriesData);



	return (
		<div className="request-container">
			<form className="request-form">
				<button className="urgent-button">Urgent</button>
				<select 
					className="job-select" 
					name="job" 
					id="job">
					{categoriesData && categoriesData.categories.map((category: CategoryPros, index: number) => (
							
						<option key={index} value={category.id}>
							{category.name}
						</option>
							
					))}
				</select>
				<select name="job" id="job">Sous-métier</select>
				<input className="inpout-request" type="text" placeholder="Titre de la demande" />
				<textarea className="text-request" name="description" id="description" placeholder="Description de la demande"></textarea>
				<button className="request_submit" type="submit">Envoyer</button>
			</form>

		</div>
	);
}

export default Request;