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
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';


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
			setJobsState(jobData.category.jobs);
		}
	}, [jobData]);

	// Update categories when data is fetched
	useEffect(() => {
		if (categoriesData) {
			setCategoriesState(categoriesData.categories);
		}
	}, [categoriesData]);


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
		// Filter wishListJob to get only the jobs whose IDs are not already in jobs
		const newJobIds = wishListJob
			.filter((job) => !jobs.some((jobStore) => jobStore.job_id === job.id))
			.map((job) => job.id);

		// Add new jobs to selectedJob
		setSelectedJob([...selectedJob || [], ...wishListJob.filter((job) => newJobIds.includes(job.id))]);

		// Update jobs in the store
		setJobs([...jobs, ...newJobIds.map((id) => ({ job_id: id }))]);

		// add job to the database
		createUserJob({
			variables: {
				input: {
					user_id: id,
					job_id: newJobIds
				}
			}
		}).then(() => {

			setWishListJob([]);
			setSelectedCategory(0);

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
							<h1 className="setting-account__form__title">Options de recherche:</h1>
							<h2 className="setting-account__subtitle">Séléctionnez un ou plusieurs métier:</h2>
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
							<button className="setting-account__form__button" type='submit'>valider les métiers</button>
							<ul className={`setting-account__form__list job ${(userJobLoading || deleteJobLoading || categoryLoading) ? 'loading' : ''}`}>
								{(userJobLoading || categoryLoading) && <Spinner className="small-spinner"/>}

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
								<span className="setting-account__radius__range">
									{radius === 0 ? 'Toute la france' : `Autour de moi: ${radius / 1000} Km`}
								</span>
							</label>
							<Box className="slider-container" sx={{ width: 300 }}>
								<Slider
									defaultValue={105}
									aria-label="Distance d'action"
									valueLabelDisplay="auto"
									value={radius === 0 ? 105 : radius / 1000}
									step={5}
									marks
									min={5}
									max={105}
									// transform 105 to 0 for condition in the function and database
									onChange={(_, value) => setRadius((value as number) === 105 ? 0 : (value as number) * 1000)}
									valueLabelFormat={(value) => value === 105 ? 'France' : `${value} Km`}
								/>
							</Box>
							<div className="message">
								<Stack sx={{ width: '100%' }} spacing={2}>
									{message && (
										<Fade in={!!message} timeout={300}>
											<Alert variant="filled" severity="success">{message}</Alert>
										</Fade>
									)}
								</Stack>
							</div>
							<button className="setting-account__radius__button" onClick={handleValidateRange}>Valider la distance</button>
						</div>
					</>
				</div >
			)
			}
		</>
	);
}

export default SettingAccount;