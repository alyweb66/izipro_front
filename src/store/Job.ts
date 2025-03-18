import { create } from 'zustand';
import { CategoryProps, JobProps } from '../Type/Request';


type CategoriesJobStore = {
    categories: CategoryProps[];
	setcategories: (data: CategoryProps[]) => void;
};

type JobsStore = {
    jobs: JobProps[];
    setJobs: (data: JobProps[]) => void;
}



export const categoriesJobStore = create<CategoriesJobStore>((set) => ({
	categories: [],
	setcategories: (data: CategoryProps[]) => set({ categories: data }),
}));


export const jobsStore = create<JobsStore>((set) => ({
	jobs: [],
	setJobs: (data:JobProps[] ) => set({ jobs: data }),
}));
