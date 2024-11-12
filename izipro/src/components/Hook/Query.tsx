import { useLazyQuery, useQuery } from '@apollo/client';
import { GET_JOBS_BY_CATEGORY, GET_JOB_CATEGORY, GET_REQUEST_BY_ID, GET_REQUEST_BY_JOB, GET_USER_REQUESTS } from '../GraphQL/RequestQueries';
import { GET_JOB_DATA } from '../GraphQL/Job';
import { GET_COOKIE_CONSENTS, GET_USERS_CONVERSATION, GET_USER_DATA, GET_USER_NOTIFICATION, GET_USER_NOT_VIEWED_REQUESTS, GET_USER_REQUEST_BY_CONVERSATIONS, GET_USER_SUBSCRIPTION, RULES, VAPID_PUBLIC_KEY } from '../GraphQL/UserQueries';
import { GET_CONVERSATION, GET_CONVERSATION_ID, NOT_VIEWED_CONVERSATIONS } from '../GraphQL/ConversationQueries';
import { GET_MESSAGES_BY_CONVERSATION, GET_MY_MESSAGES_BY_CONVERSATION } from '../GraphQL/MessageQueries';


import '../../styles/spinner.scss';


// fetch user data
export const useQueryUserData = (skip: boolean) => {

	const { loading, error: getUserError, data: getUserData } = useQuery(GET_USER_DATA, {
		skip: skip
	});
	
	if (getUserError) {
		throw new Error('Error while fetching user data');
	}

	return { loading, getUserData};
};

export const useQueryRules = (getData: boolean) => {
	const { loading, error: rulesError, data: rulesData } = useQuery(RULES, {
		skip: !getData
	
	});
	
	if (rulesError) {
		
		throw new Error('Error while fetching rules data');
	}
	return {loading, rulesData};
};

export const useQueryCookieConsents = (skip: boolean) => {
	const { loading, error: cookieError, data: cookieData } = useQuery(GET_COOKIE_CONSENTS, {
		skip
	
	});

	if (cookieError) {
		throw new Error('Error while fetching cookie consents data');
	}
	return {loading, cookieData};
};

// fetch categories 
export const useQueryCategory = () => {
	const { loading, error: categoryError, data: categoriesData } = useQuery(GET_JOB_CATEGORY);
	if (categoryError) {
		throw new Error('Error while fetching categories data');
	}

	return {loading, categoriesData};
};

// fetch jobs
export const useQueryJobs = (selectedCategory: number) => {
	
	const { loading, error: jobError, data: jobData } = useQuery(GET_JOBS_BY_CATEGORY,
		{
			variables: {
				categoryId: Number(selectedCategory)
			},
			skip: !selectedCategory
		});

	if (jobError) {
		throw new Error('Error while fetching jobs');
	}
	return {loading, jobData};
};

// fetch job data
export const useQueryJobData = (jobId:{job_id: number}[], skip: boolean ) => {
	
	const jobIdArray = jobId.map((job) => job.job_id);
	

	const {loading, error: jobDataError, data: jobData } = useQuery(GET_JOB_DATA,
		{
			variables: {
				ids: jobIdArray
			},
			skip
		});
		
	const jobs = jobData?.jobs;
	
	if (jobDataError) {
		throw new Error('Error while fetching job data');
	}
	return {loading, jobs};
};

// fetch user requests
export const  useQueryUserRequests = (id: number, offset: number, limit: number, skip: boolean) => {
	console.log('skip', skip);
	
	const { loading, error: getUserRequestsError, data: getUserRequestsData, fetchMore } = useQuery(GET_USER_REQUESTS, {
		fetchPolicy: 'no-cache',
		variables: {
			requestsId: id,
			offset: offset,
			limit: limit 
		},
		skip
	
	});
console.log('getUserRequestsData query', getUserRequestsData);

	if (getUserRequestsError) {
		throw new Error('Error while fetching user requests');
	}

	return {loading, getUserRequestsData, fetchMore};
};

// fetch requests by job
export const useQueryRequestByJob = (jobId:{job_id: number}[], offset: number, limit: number, skip: boolean) => {

	const jobIdArray = jobId.map((job) => job.job_id);

	const { loading, subscribeToMore, error: requestError, data: getRequestsByJob, fetchMore } = useQuery(GET_REQUEST_BY_JOB, {
		
		fetchPolicy: 'network-only',
		variables: {
			ids: jobIdArray,
			offset: offset,
			limit: limit
		},
		skip: skip || !jobIdArray
	});

	if (requestError) {
		throw new Error('Error while fetching requests by jobs');
	}
	return {loading, getRequestsByJob, subscribeToMore, fetchMore};
};

// fetch user conversations
export const useQueryUserConversations = (offset: number, limit: number, skip: boolean) => {


	const {loading, error: conversationError, data, fetchMore} = useQuery(GET_USER_REQUEST_BY_CONVERSATIONS, {
		fetchPolicy: 'network-only',
		variables: {
			offset: offset,
			limit: limit
		},
		skip
	});

	if (conversationError) {
		throw new Error('Error while fetching user conversations');
	}
	/* 
	if (!data) {
		return fetchMore;
	} */
	return {loading, data, fetchMore};
};

// fetch messages by conversation
export const useQueryMessagesByConversation = (conversationId: number, offset: number, limit: number, skip:boolean) => {
	
	const {  loading, subscribeToMore,error: messageError, data: messageData, fetchMore: fetchMoreMessage } = useQuery(GET_MESSAGES_BY_CONVERSATION, {
		variables: {
			conversationId: conversationId,
			offset: offset,
			limit: limit
		},
		skip
	});

	if (messageError) {
		throw new Error('Error while fetching messages by conversation');
	}
	return {loading, subscribeToMore, messageData, fetchMoreMessage};
};

// fetch user subscriptions
export const useQueryUserSubscriptions = (skip: boolean) => {
	const { error: subscriptionError, data: subscriptionData } = useQuery(GET_USER_SUBSCRIPTION, {
		skip
	});
	if (subscriptionError) {
		throw new Error('Error while fetching user subscriptions');
	}
	return subscriptionData;
};

// fetch users conversation
export const useQueryUsersConversation = (userIds: number[], offset: number, limit: number) => {

	const { loading, error: usersConversationError, data: usersConversationData } = useQuery(GET_USERS_CONVERSATION, {
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
	
	return {loading, usersConversationData};
};

// fetch messages by conversation
export const useQueryMyMessagesByConversation = (conversationId: number, offset: number, limit: number, skip: boolean) => {
		
	const {  loading, subscribeToMore,error: messageError, data: messageData } = useQuery(GET_MY_MESSAGES_BY_CONVERSATION, {
		variables: {
			conversationId: conversationId,
			offset: offset,
			limit: limit
		},
		skip
	});

	if (messageError) {
		throw new Error('Error while fetching messages by conversation');
	}
	
	return {loading, subscribeToMore, messageData};
};

// fetch conversation
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

export const useQueryNotViewedRequests = (skip: boolean) => {
	const { loading, error: viewedError, data: viewedData } = useQuery(GET_USER_NOT_VIEWED_REQUESTS, {
		skip
	});

	if (viewedError) {
		throw new Error('Error while fetching viewed requests');
	}
	return {loading, viewedData};
};

export const useQueryNotViewedConversations = (skip: boolean) => {
	const { loading, error: viewedError, data: notViewedConversationQuery } = useQuery(NOT_VIEWED_CONVERSATIONS, {
		skip
	});

	if (viewedError) {
		throw new Error('Error while fetching viewed requests');
	}
	return {loading, notViewedConversationQuery};
};

export const useQueryUserConversationIds = (skip: boolean) => {
	const { loading, error: myConversationIdsError, data: myConversationIds } = useQuery(GET_CONVERSATION_ID, {
		skip
	});

	if (myConversationIdsError) {
		throw new Error('Error while fetching viewed requests');
	}
	return {loading, myConversationIds};
};

export const useQueryGetRequestById = (requestId: number) => {

	let skip;
	if (requestId === 0) {
		skip = true;
	} else {
		skip = false;
	}

	const { loading, error: requestByIdError, data: requestById } = useQuery(GET_REQUEST_BY_ID, {
		variables: {
			requestId: requestId,
		},
		skip
	});

	if (requestByIdError) {
		throw new Error('Error while fetching request');
	}
	return {loading, requestById};
};

export const useQueryVAPIDKey = () => {
	
	const [fetchVAPIDKey, { loading, error: getVAPIDKeyError, data: getVAPIDKey }] = useLazyQuery(VAPID_PUBLIC_KEY);
	
	if (getVAPIDKeyError) {
		
		throw new Error('Error while fetching user data');
	}


	return { loading, getVAPIDKey, fetchVAPIDKey };
};

export const useQueryGetNotification = (skip: boolean) => {
	const { loading, error: notificationError, data: notificationData } = useQuery(GET_USER_NOTIFICATION, {
		fetchPolicy: 'no-cache',
		skip
	});
	if (notificationError) {
		throw new Error('Error while fetching notifications');
	}
	
	return {loading, notificationData};
}