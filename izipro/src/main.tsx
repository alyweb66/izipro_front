import { RouterProvider } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import ReactDOM from 'react-dom/client';
import { router } from './routes';

import './styles/index.scss';

// create a client
const client = new ApolloClient({
	uri: 'http://localhost:3000/',
	credentials: 'include',
	cache: new InMemoryCache(),
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