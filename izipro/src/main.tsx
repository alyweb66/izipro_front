import { RouterProvider } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, DefaultOptions } from '@apollo/client';
// @ts-expect-error - no types available
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
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

// create a client
const client = new ApolloClient({
	cache: new InMemoryCache(),
	link: createUploadLink({uri: 'http://localhost:3000/', credentials: 'include', headers: {'Apollo-Require-Preflight': 'true'}}),
	defaultOptions: defaultOptions,
});

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