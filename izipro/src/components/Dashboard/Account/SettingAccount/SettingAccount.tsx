// React and React hooks
import { useEffect, useState } from 'react';

// Apollo Client and GraphQL mutations
import { useMutation } from '@apollo/client';
import { DELETE_USER_HAS_JOB_MUTATION, USER_HAS_JOB_MUTATION, USER_SETTING_MUTATION } from '../../../GraphQL/UserMutations';

// Custom hooks for queries
import { useQueryCategory, useQueryJobData, useQueryJobs } from '../../../Hook/Query';

// State management
import { userDataStore } from '../../../../store/UserData';

// Type definitions
import { CategoryPros, JobProps } from '../../../../Type/Request';

// Local components and assets
import Spinner from '../../../Hook/Spinner';

// Styling imports
import './SettingAccount.scss';
import { motion, AnimatePresence } from 'framer-motion';
import SelectBox from '../../../Hook/SelectBox';


function SettingAccount() {

	//store
	const id = userDataStore((state) => state.id);
	const [jobs, setJobs] = userDataStore((state) => [state.jobs || [], state.setJobs]);
	const [settings, setSettings] = userDataStore((state) => [state.settings || [], state.setSettings]);
	const role = userDataStore((state) => state.role);

	// State
	const [selectedCategory, setSelectedCategory] = useState(0);
	const [wishListJob, setWishListJob] = useState<JobProps[]>([]);
	const [selectedJob, setSelectedJob] = useState<JobProps[]>([]);
	const [radius, setRadius] = useState(settings[0]?.range || 0);
	const [message, setMessage] = useState('');
	const [skip, setSkip] = useState(false);
	const [categoriesState, setCategoriesState] = useState<CategoryPros[]>([]);
	const [jobsState, setJobsState] = useState<JobProps[]>([]);
	


	// query
	const { loading: categoryLoading, categoriesData } = useQueryCategory();
	const { loading: jobLoading, jobData } = useQueryJobs(selectedCategory);
	const { loading: jobDataLoading, jobs: jobDataName } = useQueryJobData(jobs ? jobs : [], skip);

	// set job with the value from the database
	useEffect(() => {
		if (jobDataName) {
			setSelectedJob(jobDataName);
			setSkip(true);
		}
		
	}, [jobDataName, jobDataLoading]);

	// Update jobs when category changes
	useEffect(() => {
		if (jobData) {
			console.log('jobData', jobData.category.jobs);
			
			setJobsState(jobData.category.jobs);
		}
	}, [jobData]);

	// Update categories when data is fetched
	useEffect(() => {
		if (categoriesData) {
			setCategoriesState(categoriesData.categories);
		}
	}, [categoriesData]);

	useEffect(() => {
		if (selectedCategory) {
		}
	}, [selectedCategory]);

	// mutation
	const [createUserJob, { loading: userJobLoading, error: errorCreateUserJob }] = useMutation(USER_HAS_JOB_MUTATION);
	const [deleteUserJob, { loading: deleteJobLoading, error: errorDeleteUserJob }] = useMutation(DELETE_USER_HAS_JOB_MUTATION);
	const [userSetting, { loading: settingLoading, error: errorUserSetting }] = useMutation(USER_SETTING_MUTATION);

	// function to remove wishlist job before submit
	const handleRemoveListJob = (id: number, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		event.preventDefault();
		event?.stopPropagation();
		setWishListJob(wishListJob.filter((job) => job.id !== id));

	};

	// function to delete job in the database
	const handleDeleteJob = (jobId: number, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		event.preventDefault();
		event?.stopPropagation();

		// update selectedJob and jobs
		setSelectedJob(selectedJob.filter((job) => job.id !== jobId));
		setJobs(jobs.filter((job) => job.job_id !== jobId));

		deleteUserJob({
			variables: {
				input: {
					user_id: id,
					job_id: [jobId]
				}
			}
		});

		if (errorDeleteUserJob) {
			throw new Error('Error while deleting job');
		}

	};

	// function to submit job
	const handleSubmitJob = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		let submitJobId = [];

		if (jobs.length === 0) {
			submitJobId = wishListJob;
		} else {
			// check if the job is already in the store
			submitJobId = wishListJob.filter((job) => jobs.some((jobStore) => jobStore.job_id !== job.id));
		}
		// add job to the selectedJob
		setSelectedJob([...selectedJob || [], ...submitJobId]);

		// get unique job id to submit
		let uniqueJobId: number[] = [];
		if (submitJobId !== undefined && submitJobId.length > 0) {
			uniqueJobId = submitJobId.filter(job => job).map((job) => job.id);
			// delete duplicate job id
			uniqueJobId = [...new Set(uniqueJobId)];

		}

		// update jobs in the store
		// check if the job is already in the store
		const newjobs = uniqueJobId?.filter((id) => !jobs.some((job) => job.job_id === id));
		console.log('newjobs', newjobs);


		setJobs([...jobs, ...(newjobs || [])].map((job) => typeof job === 'number' ? { job_id: job } : job));

		// add job to the database
		createUserJob({
			variables: {
				input: {
					user_id: id,
					job_id: uniqueJobId || submitJobId
				}
			}
		}).then(() =>{

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
			setSettings([{ range: radius }]);
			setMessage('distance validée');
			setTimeout(() => {
				setMessage('');
			}, 5000);
		});

		if (errorUserSetting) {
			throw new Error('Error while setting user');
		}

	};

	return (
		<>
			{role === 'pro' && (
				<div className="setting-account">
					<>
						<form className={`setting-account__form ${jobLoading ? 'loading' : ''}`} onSubmit={handleSubmitJob}>
							{/* {jobLoading && <Spinner />} */}
							<h1 className="setting-account__form__title">Vos métiers:</h1>
							<SelectBox
								isSetting={true}
								data={categoriesState}
								selected={selectedCategory}
								isCategory={true}
								loading={categoryLoading}
								setSelected={setSelectedCategory}
							/>
				
							<SelectBox
								isSetting={true}
								isWishList={true}
								wishListJob={wishListJob}
								data={jobsState}
								isCategory={false}
								setWishListJob={setWishListJob}
								loading={jobLoading}
								
							/>
							
							<ul className="setting-account__form__list" >
								<h2 className="setting-account__subtitle">Métiers séléctionné:</h2>
								<AnimatePresence>
									{wishListJob && [...wishListJob].reverse().map((job: JobProps) => (
										<motion.li
											key={job.id}
											className="setting-account__form__list__tag"
											initial={{ opacity: 0, scale: 0.5 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.2 }}
											transition={{
												duration: 0.2,
												ease: [0, 0, 0.2, 0],
												scale: {
													type: 'tween',
													damping: 5,
													stiffness: 20,
													restDelta: 0.001
												}
											}}
										>
											{job.name}
											<button className="setting-account__form__list__delete__button" onClick={(event) => handleRemoveListJob(job.id, event)}>X</button>
										</motion.li>
									))}
								</AnimatePresence>
							</ul>
							<button className="setting-account__form__button" type='submit'>valider</button>
							<ul className={`setting-account__form__list job ${(userJobLoading || deleteJobLoading || categoryLoading) ? 'loading' : ''}`}>
								{(userJobLoading || categoryLoading) && <Spinner />}

								<h2 className="setting-account__subtitle">Métiers actuel:</h2>
								<AnimatePresence>
									{/* {jobDataLoading && <Spinner />} */}
									{selectedJob && selectedJob.length > 0 ? selectedJob.map((job: JobProps) => (
										<motion.li
											key={job.id}
											className="setting-account__form__list__tag"
											initial={{ opacity: 0, scale: 0.5 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.2 }}
											transition={{
												duration: 0.2,
												ease: [0, 0, 0.2, 0],
												scale: {
													type: 'tween',
													damping: 5,
													stiffness: 20,
													restDelta: 0.001
												}
											}}
										>
											{job.name}
											<button className="setting-account__form__list__delete__button" onClick={(event) => handleDeleteJob(job.id, event)}>X</button>
										</motion.li>
									))
										:
										<p className="setting-account__form__list noJobs">Vous n&apos;avez pas de métier séléctionné</p>
									}
								</AnimatePresence>
							</ul>


						</form>

						<div className={`setting-account__radius ${settingLoading ? 'loading' : ''}`}>
							{settingLoading && <Spinner />}
							<label className="setting-account__radius__label">
								<h2 className="setting-account__subtitle">Selectionnez une distance d&apos;action:</h2>
								{radius === 0 ? 'Toute la france' : `Autour de moi: ${radius / 1000} Km`}
							</label>
							<input
								className="setting-account__radius__input"
								id="radius"
								type="range"
								min="0"
								max="100000"
								step="5000"
								value={radius}
								onChange={e => setRadius(Number(e.target.value))}
							/>
							<div className="setting-account__radius__input__message">
								{message && <p>{message}</p>}
							</div>
							<button className="setting-account__radius__button" onClick={handleValidateRange}>Valider</button>
						</div>
					</>
				</div >
			)
			}
		</>
	);
}

export default SettingAccount;