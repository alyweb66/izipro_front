
import { RouterProvider } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, DefaultOptions, ApolloLink, ServerError } from '@apollo/client';
// @ts-expect-error - no types available
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import ReactDOM from 'react-dom/client';
import { router } from './routes';
//import { onError } from "apollo-link-error";
import {ErrorResponse, onError  } from "@apollo/client/link/error"; 
import './styles/index.scss';


/* type ResponseError = ErrorResponse & {
	networkError?: {
	  statusCode?: number;
	  bodyText?: string;
	};
}
 */
// Default options for Apollo Client
const defaultOptions: DefaultOptions = {
	watchQuery: {
		fetchPolicy: 'network-only',
		errorPolicy: 'ignore',
	},
	query: {
		fetchPolicy: 'network-only',
		errorPolicy: 'all',
	},
};
// Global flag to indicate if the user is logged out
let isLoggedOut = false;
// Middleware to check if the user has a 401 error from the server
const errorLink = onError((error: ErrorResponse) => {
	const statusCode = (error.networkError as ServerError).statusCode;

	if (statusCode === 401) {
		localStorage.removeItem('login');
		isLoggedOut = true;
		
		if (window.location.pathname === '/dashboard') {
			window.location.href = '/';
		}
	}
	
});

// Middleware to check if the user is logged out before making requests
const authMiddleware = new ApolloLink((operation, forward) => {
	if (isLoggedOut) {
	  // Prevent further requests if the user is logged out
	  return null;
	}
	return forward(operation);
  });
  
// Create an upload link
const httpLink = createUploadLink({
	uri: import.meta.env.VITE_SERVER_URL,
	credentials: 'include',
	headers: { 'Apollo-Require-Preflight': 'true' },
});

// Create a WebSocket link
const wsLink = new GraphQLWsLink(createClient({
	url: import.meta.env.VITE_SERVER_SUBSCRIPTION,
}));



//const httpLinkWithLogout = errorLink.concat(httpLink);
const httpLinkWithMiddleware = ApolloLink.from([authMiddleware, errorLink, httpLink]);
// The split function takes three parameters:
// * A function that's called for each operation to execute
// * The Link to use for an operation if the function returns a "truthy" value
// * The Link to use for an operation if the function returns a "falsy" value
const splitLink = split(
	({ query }) => {
		const definition = getMainDefinition(query);
		return (
			definition.kind === 'OperationDefinition' &&
			definition.operation === 'subscription'
		);
	},
	wsLink,
	httpLinkWithMiddleware,
);
// create a client and check if it exists
let client;
if (!client) {
	client = new ApolloClient({
		// configure cache to merge objects for no duplicates 
		cache: new InMemoryCache({
			typePolicies: {
				Query: {
					fields: {
						user: {
							merge(existing = {}, incoming, { mergeObjects }) {
								return mergeObjects(existing, incoming);
							},
						},
					},
				},
				User: {
					fields: {
						subscription: {
							merge(existing = [], incoming) {
								return [...existing, ...incoming];
							},
						},
						conversationRequestIds: {
							merge(existing = [], incoming) {
								return [...new Set([...existing, ...incoming])];
							},
						},
						requests: {

							merge(existing = [], incoming) {
								return [...existing, ...incoming];
							},
						},
					},
				},
				UserSubscription: {
					keyFields: ['id'],
				},
			},
		}),
		link: splitLink,
		defaultOptions: defaultOptions,
	});
}

// create a root
const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);


// render element in the DOM
root.render(
	<ApolloProvider client={client}>
		<RouterProvider router={router} />
	</ApolloProvider>,
);