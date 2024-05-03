import { useQuery } from '@apollo/client';
import { GET_JOBS_BY_CATEGORY, GET_JOB_CATEGORY, GET_REQUEST_BY_JOB, GET_USER_REQUESTS } from '../GraphQL/RequestQueries';
import { GET_JOB_DATA } from '../GraphQL/Job';
import { GET_MESSAGES_BY_CONVERSATION, GET_MY_MESSAGES_BY_CONVERSATION, GET_USERS_CONVERSATION, GET_USER_DATA, GET_USER_REQUEST_BY_CONVERSATIONS, GET_USER_SUBSCRIPTION } from '../GraphQL/UserQueries';
import { GET_CONVERSATION } from '../GraphQL/ConversationQueries';


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
	
	const { error: getUserRequestsError, data: getUserRequestsData, fetchMore } = useQuery(GET_USER_REQUESTS, {
		fetchPolicy: 'network-only',
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
	
	const jobIdArray = jobId.map((job) => job.job_id);

	const { subscribeToMore, error: requestError, data: getRequestsByJob, fetchMore } = useQuery(GET_REQUEST_BY_JOB, {
		
		fetchPolicy: 'network-only',
		variables: {
			ids: jobIdArray,
			offset: offset,
			limit: limit
		},
		skip: !jobIdArray
	});

	if (requestError) {
		throw new Error('Error while fetching requests by jobs');
	}
	return {getRequestsByJob, subscribeToMore, fetchMore};
};

export const useQueryUserConversations = (offset: number, limit: number) => {


	const {loading, error: conversationError, data, fetchMore} = useQuery(GET_USER_REQUEST_BY_CONVERSATIONS, {
		fetchPolicy: 'network-only',
		variables: {
			offset: offset,
			limit: limit
		},
	});

	if (conversationError) {
		throw new Error('Error while fetching user conversations');
	}
	if (!data) {
		return [];
	}
	return {loading, data, fetchMore};
};

export const useQueryMessagesByConversation = (messagesId: number, conversationId: number, offset: number, limit: number) => {
	
	const {  subscribeToMore,error: messageError, data: messageData, fetchMore: fetchMoreMessage } = useQuery(GET_MESSAGES_BY_CONVERSATION, {
		variables: {
			messagesId: messagesId,
			conversationId: conversationId,
			offset: offset,
			limit: limit
		},
		skip: !messagesId || !conversationId
	});

	if (messageError) {
		throw new Error('Error while fetching messages by conversation');
	}
	return {subscribeToMore, messageData, fetchMoreMessage};
};

export const useQueryUserSubscriptions = () => {
	const { error: subscriptionError, data: subscriptionData } = useQuery(GET_USER_SUBSCRIPTION);
	if (subscriptionError) {
		throw new Error('Error while fetching user subscriptions');
	}
	return subscriptionData;
};

export const useQueryUsersConversation = (userIds: number[], offset: number, limit: number) => {

	const { error: usersConversationError, data: usersConversationData } = useQuery(GET_USERS_CONVERSATION, {
		variables: {
			ids: userIds,
			offset: offset,
			limit: limit
		},
		skip: !userIds || userIds.length === 0
	});
	if (usersConversationError) {
		throw new Error('Error while fetching user conversation');
	}
	return {usersConversationData};
};

export const useQueryMyMessagesByConversation = (conversationId: number, offset: number, limit: number) => {
		
	const {  subscribeToMore,error: messageError, data: messageData, fetchMore: fetchMoreMessage } = useQuery(GET_MY_MESSAGES_BY_CONVERSATION, {
		variables: {
			conversationId: conversationId,
			offset: offset,
			limit: limit
		},
		skip: !conversationId
	});

	if (messageError) {
		throw new Error('Error while fetching messages by conversation');
	}
	
	return {subscribeToMore, messageData, fetchMoreMessage};
};

export const useQueryConversation = (id: number) => {

	const { error: conversationError, data: conversationData, refetch: refetchConversation } = useQuery(GET_CONVERSATION, {
		variables: {
			id: id
		},
		skip: !id
	});
	if (conversationError) {
		throw new Error('Error while fetching conversation');
	}
	return {conversationData, refetchConversation};
};