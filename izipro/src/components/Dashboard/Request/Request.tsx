import { useState } from 'react';
import './Request.scss';
import { GET_JOBS_BY_CATEGORY, GET_JOB_CATEGORY } from '../../GraphQL/RequestQueries';
import { useQuery } from '@apollo/client';

type CategoryPros = {
	id: number;
	name: string;
}

type jobProps = {
	id: number;
    name: string;
    description: string;
}


function Request() {
	//state
	const [selectedCategory, setSelectedCategory] = useState('');
	const [selectedJob, setSelectedJob] = useState('');
	const [urgent, setUrgent] = useState(false);
	console.log(urgent);
	
	// fetch categories 
	const { error: categoryError, data: categoriesData} = useQuery(GET_JOB_CATEGORY);

	
	if (categoryError) {
		throw new Error('Error while fetching categories data');
	}
	// fetch jobs
	const { error: jobError, data: jobData} = useQuery(GET_JOBS_BY_CATEGORY,
		{
			variables:{
				categoryId: Number(selectedCategory)
			},
			skip: !selectedCategory

		});

		
	if (jobError) {
		throw new Error('Error while fetching jobs');
	}


	return (
		<div className="request-container">
			<form className="request-form">
				<button 
					className="urgent-button"
					onClick={(event) => {
						event.preventDefault();
						setUrgent(!urgent);}
					}
				>Urgent</button>
				<select 
					className="job-select" 
					name="job" 
					id="job"
					value={selectedCategory}
					onChange={(event) => setSelectedCategory(event.target.value)}
				>
					<option value="">Catégorie</option>
					{categoriesData && categoriesData.categories.map((category: CategoryPros, index: number) => (
						<option key={index} value={category.id}>
							{category.name}
						</option>
							
					))}
				</select>
				<select
					className="category_select" 
					name="job" 
					id="job"
					value={selectedJob}
					onChange={(event)=> setSelectedJob(event.target.value)}
				>	
					<option value="">Métiers</option>
					{jobData && jobData.category.jobs.map((job: jobProps, index: number) =>(

						<option 
							key={index} 
							value={job.id}
							title={job.description}
						>
							{job.name}
						</option>
					))}

				</select>
				<input className="inpout-request" type="text" placeholder="Titre de la demande" />
				<textarea className="text-request" name="description" id="description" placeholder="Description de la demande"></textarea>
				<button className="request_submit" type="submit">Envoyer</button>
			</form>

		</div>
	);
}

export default Request;