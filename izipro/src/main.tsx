import { RouterProvider } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, DefaultOptions } from '@apollo/client';
// @ts-expect-error - no types available
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import ReactDOM from 'react-dom/client';
import { router } from './routes';

import './styles/index.scss';

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

// Create an upload link
const httpLink = createUploadLink({
	uri: 'http://localhost:3000/',
	credentials: 'include',
	headers: { 'Apollo-Require-Preflight': 'true' },
});

const wsLink = new GraphQLWsLink(createClient({
	url: 'ws://localhost:3000/subscriptions',
}));

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
	httpLink,
);
// create a client and check if it exists
let client;
if (!client) {
	client = new ApolloClient({
		cache: new InMemoryCache(),
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