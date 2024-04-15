import { useQuery } from '@apollo/client';
import { GET_JOBS_BY_CATEGORY, GET_JOB_CATEGORY, GET_REQUEST_BY_JOB, GET_USER_REQUESTS } from '../GraphQL/RequestQueries';
import { GET_JOB_DATA } from '../GraphQL/Job';
import { GET_USER_DATA } from '../GraphQL/UserQueries';

// fetch user data
export const useQueryUserData = () => {
	const { error: getUserError, data: getUserData } = useQuery(GET_USER_DATA);
	
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
	
	const {error: jobError, data: jobData } = useQuery(GET_JOB_DATA,
		{
			variables: {
				ids: jobIdArray
			},
			skip: !jobIdArray
		});

	const jobs = jobData?.jobs;

	if (jobError) {
		throw new Error('Error while fetching job data');
	}
	return jobs;
};

export const  useQueryUserRequests = (id: number, offset: number, limit: number) => {
	console.log('id', id, 'offset', offset, 'limit', limit);
	
	const { error: getUserRequestsError, data: getUserRequestsData, fetchMore } = useQuery(GET_USER_REQUESTS, {
		variables: {
			requestsId: id,
			offset: offset,
			limit: limit 
		},
	
	});

	if (getUserRequestsError) {
		throw new Error('Error while fetching user requests');
	}

	return {getUserRequestsData, fetchMore};
};

export const useQueryRequestByJob = (jobId:{job_id: number}[], offset: number, limit: number) => {
	/* console.log('jobId', jobId);
	console.log('offset', offset, 'limit', limit); */
	

	const jobIdArray = jobId.map((job) => job.job_id);
	//console.log('jobIdArray', jobIdArray);

	const { subscribeToMore, error: requestError, data: getRequestsByJob } = useQuery(GET_REQUEST_BY_JOB,
		{
			variables: {
				ids: jobIdArray,
				offset: offset,
				limit: limit
			},
			skip: !jobIdArray
		}
	);

	if (requestError) {
		throw new Error('Error while fetching requests by jobs');
	}
	return {getRequestsByJob, subscribeToMore};
};