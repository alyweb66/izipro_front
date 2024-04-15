
import { useQueryCategory, useQueryJobData, useQueryJobs } from '../../../Hook/Query';
import { CategoryPros, JobProps } from '../../../../Type/Request';
import { DELETE_USER_HAS_JOB_MUTATION, USER_HAS_JOB_MUTATION, USER_SETTING_MUTATION } from '../../../GraphQL/UserMutations';
import './SettingAccount.scss';
import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { userDataStore } from '../../../../store/UserData';


function SettingAccount() {

	//store
	const id = userDataStore((state) => state.id);
	const [jobs, setJobs] = userDataStore((state) => [state.jobs || [], state.setJobs]);
	const [settings, setSettings] = userDataStore((state) => [state.settings || [], state.setSettings]);
	const role = userDataStore((state) => state.role);

	// State
	const [selectedCategory, setSelectedCategory] = useState('');
	const [wishListJob, setWishListJob] = useState<JobProps[]>([]);
	const [selectedJob, setSelectedJob] = useState<JobProps[]>([]);
	const [radius, setRadius] = useState(settings[0]?.range || 0);

	// set radius with the value from the database
	useEffect(() => {
		setRadius(settings[0]?.range || 0);
	}, [settings]);

	// fetch jobs
	const categoriesData = useQueryCategory();
	const jobData  = useQueryJobs(selectedCategory);
	const jobDataName = useQueryJobData(jobs);

	// set job with the value from the database
	useEffect(() => {
		setSelectedJob(jobDataName);
	}, [jobDataName]);

	// mutation
	const [createUserJob, { error: errorCreateUserJob }] = useMutation(USER_HAS_JOB_MUTATION);
	const [deleteUserJob, { error: errorDeleteUserJob }] = useMutation(DELETE_USER_HAS_JOB_MUTATION);
	const [userSetting, { error: errorUserSetting}] = useMutation(USER_SETTING_MUTATION);
	
	// function to remove list job before submit
	const handleRemoveListJob = (id: number, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		event.preventDefault();
		event?.stopPropagation();
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

	// function to submit job
	const handleSubmitJob = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		// get unique job id to submit
		let submitJobId: number[] = [];
		if (wishListJob !== undefined && wishListJob.length > 0) {
			submitJobId = wishListJob.filter(job => job).map((job) => job.id);
			submitJobId = [...new Set(submitJobId)];
		
		}

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
		
			const { createUserJob } = response.data;
			if (createUserJob) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const newJob = createUserJob.map((job: any) => ({job_id:job.job_id}));
		
				//setNewJob(newJob);
				if (jobs.length === 0) {
					setJobs(newJob);
				} else {
					setJobs(newJob);
				}
			}
			setWishListJob([]);
			
		});
    
		if (errorCreateUserJob) {
			throw new Error('Error while adding job');
		}
	};

	// function to validate the range
	const handleValidateRange = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		event.preventDefault();

		userSetting({
			variables: {
				userSettingId: id,
				input: {
					range: radius,
					user_id: id
				}
			}
		}).then(() => {
			setSettings([{range: radius}]);
		});

		if (errorUserSetting) {
			throw new Error('Error while setting user');
		}

	};
console.log('settings', settings[0]);

	return (
		<div className="setting-account">
			{role === 'pro' && (
				<>
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
									<button onClick={(event) => handleRemoveListJob(job.id, event)}>X</button>
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
				
					<label htmlFor="radius">
						<p>Selectionnez une distance:</p>
						{radius === 0 ? 'Toute la france' : `Autour de moi: ${radius / 1000} Km`}
					</label>
					<input
						id="radius"
						type="range"
						min="0"
						max="100000"
						step="5000"
						value={radius}
						onChange={e => setRadius(Number(e.target.value))}
					/>
					<button onClick={handleValidateRange}>Valider</button>
				</>
			)}
		</div>
	);
}

export default SettingAccount;