
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
import { ErrorResponse, onError } from "@apollo/client/link/error";
import './styles/index.scss';
import { serverErrorStore } from './store/LoginRegister';
import { setContext } from '@apollo/client/link/context';
import { userDataStore } from './store/UserData';
//import ReloadPrompt from './Prompt';
import { registerSW } from 'virtual:pwa-register'

// Register the service worker PWA
//registerSW({ immediate: true })
let updateNotified = false;
// Enregistre le service worker avec des événements de feedback
registerSW({
	onNeedRefresh() {
		//console.log("Nouvelle version disponible ! Mise à jour en cours...");
		// Optionnel : Afficher une notification si nécessaire
	},
	onOfflineReady() {
		//	console.log("L'application est prête à fonctionner hors ligne !");
	},
	onRegistered(registration) {
		if (registration) {
			registration.addEventListener('updatefound', () => {
				const newWorker = registration.installing;
				if (newWorker) {
					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'installed') {
							// Le nouveau service worker est installé
							if (navigator.serviceWorker.controller && !updateNotified) {
								alert('Votre applicaiton a été mise à jour');
								updateNotified = true;
							}
						}
					});
				}
			});
		}
	},
	onRegisterError(error) {
		console.error("Erreur lors de l'enregistrement du Service Worker:", error);
	},
});
// store
const setServerError = (serverError: { status: number; statusText: string }) => {
	serverErrorStore.getState().setServerError(serverError);
};

// Middleware to add the userId to the headers
const userIdMiddleware = setContext((_, { headers }) => {
	const { id } = userDataStore.getState();

	if (id === 0) {
		return { headers };
	} else {

		return {
			headers: {
				...headers,
				userid: id > 0 ? id : '',
			},
		};
	}
});

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
	const statusCode = (error.networkError as ServerError)?.statusCode;

	setServerError({
		status: (statusCode || 500),
		statusText: (
			(error.networkError as ServerError)?.response?.headers.get('message')
			|| (error.networkError && (error.networkError as ServerError).response?.statusText)
			|| (error.graphQLErrors && error.graphQLErrors[0]?.extensions?.code?.toString())
			|| ''
		)
	});

	if (statusCode === 401) {
		localStorage.removeItem('login');
		isLoggedOut = true;

		if (window.location.pathname === '/dashboard') {
			window.location.href = '/';
		}
	}
	console.error('Error', serverErrorStore.getState(), error.response);
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
	uri: import.meta.env.MODE === 'production' ? import.meta.env.VITE_SERVER_URL : 'http://localhost:3000/',
	credentials: 'include',
	headers: { 'Apollo-Require-Preflight': 'true' },
});

let wsLink = navigator.onLine
	? new GraphQLWsLink(
		createClient({
			url: import.meta.env.MODE === 'production' ? import.meta.env.VITE_SERVER_SUBSCRIPTION : 'ws://localhost:3000/subscriptions',
			retryAttempts: Infinity,
			shouldRetry: () => true,
			keepAlive: 10000,
		})
	)
	: null;

// Écoute les changements d'état de connexion
window.addEventListener('online', () => {
	wsLink = new GraphQLWsLink(
		createClient({
			url: import.meta.env.MODE === 'production' ? import.meta.env.VITE_SERVER_SUBSCRIPTION : 'ws://localhost:3000/subscriptions',
			retryAttempts: Infinity,
			shouldRetry: () => true,
			keepAlive: 10000,
		})
	);
	//console.log('wsLink (online)', wsLink);
});

window.addEventListener('offline', () => {
	wsLink = null;
	//console.log('wsLink (offline)', wsLink);
});
//console.log('Initial navigator.onLine:', navigator.onLine);
//console.log('Initial wsLink:', wsLink);
//const httpLinkWithLogout = errorLink.concat(httpLink);
const httpLinkWithMiddleware = ApolloLink.from([userIdMiddleware, authMiddleware, errorLink, httpLink]);
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
	(wsLink || httpLinkWithMiddleware),
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

/* if ('serviceWorker' in navigator) {
	navigator.serviceWorker.addEventListener('controllerchange', () => {
	  console.log('Nouveau service worker activé, rechargement de la page...');
	  window.location.reload(); // Recharge la page pour utiliser la nouvelle version
	});
  } */
// register the service worker
/* if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/serviceWorker.js', {type: 'module'}).then((registration) => {
			console.log('Service Worker registered with scope:', registration.scope);
		}, (error) => {
			console.error('Service Worker registration failed:', error);
		});
	});
} */

// render element in the DOM
root.render(
	<ApolloProvider client={client}>
		<RouterProvider router={router} />
		{/* <ReloadPrompt /> */}
	</ApolloProvider>,
);