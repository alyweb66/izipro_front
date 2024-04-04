import { useQueryCategory, useQueryJobs } from '../../../Hook/Query';
import { CategoryPros, JobProps } from '../../../../Type/Request';
import { USER_HAS_JOB_MUTATION } from '../../../GraphQL/UserMutations';
import './SettingAccount.scss';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { userDataStore } from '../../../../store/UserData';

function SettingAccount() {
	// State
	const [selectedCategory, setSelectedCategory] = useState('');
	const [selectedJob, setSelectedJob] = useState<JobProps[]>([]);
	console.log(selectedJob);

	//store
	const id = userDataStore((state) => state.id);
    
	// fetch categories 
	const categoriesData = useQueryCategory();

	// fetch jobs
	const jobData  = useQueryJobs(selectedCategory);

	// mutation
	const [createUserJob, {error: errorCreateUserJob}] = useMutation(USER_HAS_JOB_MUTATION);

	// function to remove list job before submit
	const handleRemoveJob = (id: number) => {
		setSelectedJob(selectedJob.filter((job) => job.id !== id));
	};

	// function to submit job
	const handleSubmitJob = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const jobId = selectedJob.map((job) => job.id);

		createUserJob({
			variables: {
				input: {
					user_id: id,
					job_id: jobId
				}
			}
		}).then((response) => {
			if (response.data.createUserJob === true) {
                
			}
		});
    

		if (errorCreateUserJob) {
			throw new Error('Error while adding job');
		}
	};

	return (
		<div className="setting-account">
			<form action="" onSubmit={handleSubmitJob}>
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
					value={JSON.stringify(selectedJob)}
					onChange={(event) => setSelectedJob([JSON.parse(event.target.value), ...selectedJob])}
				>
					<option value="">Métiers</option>
					{jobData && jobData.category.jobs.map((job: JobProps, index: number) => (

						<option
							key={index}
							value={JSON.stringify({ id: job.id, name: job.name })}
							title={job.description}
						>
							{job.name}
						</option>
					))}

				</select>
				<ul>
					{selectedJob.map((job: JobProps, index: number) => (
						<li key={index}>
							{job.name}
							<button onClick={() => handleRemoveJob(job.id)}>X</button>
						</li>
					))}
				</ul>
				<button type='submit'>valider les métiers</button>
			</form>
		</div>
	);
}

export default SettingAccount;