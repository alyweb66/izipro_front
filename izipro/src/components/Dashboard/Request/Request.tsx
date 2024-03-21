import { useState } from 'react';
import './Request.scss';
import { GET_JOBS_BY_CATEGORY, GET_JOB_CATEGORY } from '../../GraphQL/RequestQueries';
import { useMutation, useQuery } from '@apollo/client';
import { REQUEST_MUTATION } from '../../GraphQL/RequestMutation';
import { userDataStore } from '../../../store/UserData';
import DOMPurify from 'dompurify';

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
	const [urgent, setUrgent] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState('');
	const [selectedJob, setSelectedJob] = useState('');
	const [titleRequest, setTitleRequest] = useState('');
	const [descriptionRequest, setDescriptionRequest] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	//store
	const id = userDataStore((state) => state.id);

	// mutation
	const [createRequest, { error: requestError }] = useMutation(REQUEST_MUTATION);
	
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

	const handleSubmitRequest = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		// check if all fields are filled
		let timer: number | undefined;
		if (!titleRequest && !descriptionRequest && !selectedJob) {
			setErrorMessage('Veuiilez remplir tous les champs');
			timer = setTimeout(() => {
				setErrorMessage('');
			}, 5000); // 5000ms = 5s
		} else {
			clearTimeout(timer);
		}
		
		// sanitize input
		const cleanTitle = DOMPurify.sanitize(titleRequest ?? '');
		const cleanDescription = DOMPurify.sanitize(descriptionRequest ?? '');

		createRequest({
			variables: {
				input: {
					urgent: urgent,
					title: cleanTitle,
					message: cleanDescription,
					localization: 'Paris',
					job_id: Number(selectedJob),
					user_id: id
				}
			}
		}).then((response) => {
			console.log(response);
			if (response.data.createRequest) {
				setSuccessMessage('Demande envoyée avec succès');
			}
		});

		if (requestError) {
			throw new Error('Error while creating request');
		}
	};

	return (
		<div className="request-container">
			<form className="request-form" onSubmit={handleSubmitRequest}>
				<button 
					className={`urgent-button ${urgent ? 'urgent-button-active' : ''}`}
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
				<input 
					className="input-request" 
					type="text" 
					placeholder="Titre de la demande"
					value={titleRequest}
					onChange={(event) => setTitleRequest(event.target.value)} 
				/>

				<textarea 
					className="text-request" 
					name="description" 
					id="description" 
					placeholder="Description de la demande"
					value={descriptionRequest}
					onChange={(event) => setDescriptionRequest(event.target.value)}
				>
						
				</textarea>
				{errorMessage && <p className="error-message">{errorMessage}</p>}
				{successMessage && <p className="success-message">{successMessage}</p>}
				<button className="request_submit" type="submit">Envoyer</button>
			</form>

		</div>
	);
}

export default Request;