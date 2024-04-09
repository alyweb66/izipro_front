import { useQuery } from '@apollo/client';
import { GET_JOBS_BY_CATEGORY, GET_JOB_CATEGORY } from '../GraphQL/RequestQueries';
import { GET_JOB_DATA } from '../GraphQL/Job';
import { GET_USER_DATA } from '../GraphQL/UserQueries';

// fetch user data
export const useQueryUserData = () => {
	const { error: getUserError, data: getUserData } = useQuery(GET_USER_DATA, {
		fetchPolicy: 'network-only'
	}
	);
	
	if (getUserError) {
		throw new Error('Error while fetching user data');
	}

	return getUserData;
};		


// fetch categories 
export const useQueryCategory = () => {
	const { error: categoryError, data: categoriesData } = useQuery(GET_JOB_CATEGORY);
	if (categoryError) {
		throw new Error('Error while fetching categories data');
	}

	return categoriesData;
};

// fetch jobs
export const useQueryJobs = (selectedCategory: string) => {
	
	const { error: jobError, data: jobData } = useQuery(GET_JOBS_BY_CATEGORY,
		{
			variables: {
				categoryId: Number(selectedCategory)
			},
			skip: !selectedCategory
		});

	if (jobError) {
		throw new Error('Error while fetching jobs');
	}
	return jobData;
};

// fetch job data
export const useQueryJobData = (jobId:{job_id: number}[] ) => {

	
	const jobIdArray = jobId.map((job) => job.job_id);
	
	if (!jobIdArray) {
		return;
	
	}

	const {error: jobError, data: jobData } = useQuery(GET_JOB_DATA,
		{
			variables: {
				ids: jobIdArray
			},
		});

	const jobs = jobData?.jobs;

	if (jobError) {
		throw new Error('Error while fetching job data');
	}
	return jobs;
};