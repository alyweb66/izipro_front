import { useQueryCategory, useQueryJobData, useQueryJobs, useQueryUserData } from '../../../Hook/Query';
import { CategoryPros, JobProps } from '../../../../Type/Request';
import { DELETE_USER_HAS_JOB, USER_HAS_JOB_MUTATION } from '../../../GraphQL/UserMutations';
import './SettingAccount.scss';
import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { userDataStore } from '../../../../store/UserData';

function SettingAccount() {
	// State
	const [selectedCategory, setSelectedCategory] = useState('');
	const [wishListJob, setWishListJob] = useState<JobProps[]>([]);
	const [selectedJob, setSelectedJob] = useState<JobProps[]>([]);
	
	const [newJob, setNewJob] = useState<JobProps[]>([]);
	//console.log('wishListJob', wishListJob);
	//console.log('selectedJob', selectedJob);

	//store
	const id = userDataStore((state) => state.id);
	const [jobs, setJobs] = userDataStore((state) => [state.jobs, state.setJobs]);
	//const [jobDataId, setJobDataId] = useState<number[]>([]);
	console.log('jobs', jobs);
	
	// fetch jobs
	const categoriesData = useQueryCategory();
	const jobData  = useQueryJobs(selectedCategory);
		
	const jobDataName = useQueryJobData(jobs);
	console.log('jobDataName', jobDataName);

	useEffect(() => {
		setSelectedJob(jobDataName);
	}, [jobDataName]);


	// mutation
	const [createUserJob, { error: errorCreateUserJob }] = useMutation(USER_HAS_JOB_MUTATION);
	const [deleteUserJob, { error: errorDeleteUserJob }] = useMutation(DELETE_USER_HAS_JOB);
	

	// function to remove list job before submit
	const handleRemoveListJob = (id: number) => {
		setWishListJob(wishListJob.filter((job) => job.id !== id));

	};

	// function to delete job in the database
	const handleDeleteJob = (jobId: number, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		event.preventDefault();

		deleteUserJob({
			variables: {
				input:{
					user_id: id,
					job_id: [jobId]
				}
			}
		}).then((response) => {
			console.log('response', response);
			if (response.data.deleteUserJob.length >= 0) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const newJob = response.data.deleteUserJob.map((job: any) => ({job_id:job.job_id}));
				setJobs(newJob);
			}
		});

		if (errorDeleteUserJob) {
			throw new Error('Error while deleting job');
		}
		
	};

	// get unique job id to submit
	let submitJobId: number[] = [];
	if (wishListJob !== undefined && wishListJob.length > 0) {
		submitJobId = wishListJob.filter(job => job).map((job) => job.id);
		submitJobId = [...new Set(submitJobId)];
		
	}
	// function to submit job
	const handleSubmitJob = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		console.log('submitJobId', submitJobId);

		// Remove jobs that are already in selectedJob
		let filteredJobId;
		if (selectedJob) {
			filteredJobId = submitJobId.filter(
				jobId => !selectedJob.some(selected => selected.id === jobId)
			);
		}
		
		createUserJob({
			variables: {
				input: {
					user_id: id,
					job_id: filteredJobId || submitJobId
				}
			}
		}).then((response): void => {
			console.log('response', response.data);
			const { createUserJob } = response.data;
			if (createUserJob) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const newJob = createUserJob.map((job: any) => ({job_id:job.job_id}));
				console.log('newJob', newJob);
			
				setNewJob(newJob);
			}
			setWishListJob([]);
			
		});
    
		if (errorCreateUserJob) {
			throw new Error('Error while adding job');
		}
	};

	/* useEffect(() => {
		setJobs(newJob);
	}, [newJob]); */


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
					onChange={(event) => setWishListJob([JSON.parse(event.target.value), ...wishListJob])}
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
					{wishListJob && wishListJob.map((job: JobProps, index: number) => (
						<li key={index}>
							{job.name}
							<button onClick={() => handleRemoveListJob(job.id)}>X</button>
						</li>
					))}
				</ul>
				<button type='submit'>valider les métiers</button>
				<ul>
					Vos métiers séléctionné
					{selectedJob && selectedJob.map((job: JobProps, index: number) => (
						<li key={index}>
							{job.name}
							<button onClick={(event) => handleDeleteJob(job.id, event)}>X</button>
						</li>
					))}
				</ul>


			</form>
		</div>
	);
}

export default SettingAccount;