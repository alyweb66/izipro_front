import { useQuery } from '@apollo/client';
import { GET_JOBS_BY_CATEGORY, GET_JOB_CATEGORY } from '../GraphQL/RequestQueries';

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