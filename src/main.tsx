import { RouterProvider } from 'react-router/dom';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  DefaultOptions,
  ApolloLink,
  ServerError,
} from '@apollo/client';
// @ts-expect-error - no types available
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { GraphQLFormattedError } from 'graphql';
import { split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import ReactDOM from 'react-dom/client';
import { router } from './routes';
import { ErrorResponse, onError } from '@apollo/client/link/error';
import './styles/index.scss';
import { serverErrorStore } from './store/LoginRegister';
import { setContext } from '@apollo/client/link/context';
import { isLoggedOutStore, userDataStore } from './store/UserData';
//import ReloadPrompt from './Prompt';
import { registerSW } from 'virtual:pwa-register';


// Show message to the user if the app is opened in an in-app browser
async function redirectToCompatibleBrowser() {
  const isInAppBrowser = () => {
    const ua = navigator.userAgent.toLowerCase();
    // Verify if the user agent is in an in-app browser
    return /fban|fbav|Instagram|gsa|line|whatsapp|twitter/.test(ua);
  };

  if (isInAppBrowser()) {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        // Attendre un petit délai pour être sûr que tout est fini
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }

    alert(
      'Vous devez ouvrir ce lien dans un autre navigateur (Chrome, Safari...) pour une meilleure expérience.'
    );
  } else {
    // if it's not in an in-app browser, register the service worker
    let updateNotified = false;
 
    registerSW({
      onNeedRefresh() {},
      onRegistered(registration) {
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller && !updateNotified) {
                    alert('Votre application a été mise à jour');
                    updateNotified = true;
                  }
                }
              });
            }
          });
        }
      },
      onRegisterError(error) {
        console.error(
          "Erreur lors de l'enregistrement du Service Worker:",
          error
        );
      },
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/serviceWorker.js')
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (
                  installingWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  installingWorker.postMessage({ type: 'SKIP_WAITING' });
                  installingWorker.postMessage({ type: 'CLEAR_CACHE' });
                }
              };
            }
          };
        });
    }
  }
}

redirectToCompatibleBrowser();

// store
const setServerError = (serverError: {
  status: number;
  statusText: string;
  message: string;
}) => {
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
  mutate: {
    errorPolicy: 'all',
  },
};

// Étendre le type GraphQLFormattedError pour inclure httpStatus
type CustomGraphQLFormattedError = GraphQLFormattedError & {
  httpStatus?: number;
  code?: string;
};
// Global flag to indicate if the user is logged out
let isLoggedOut = false;
// Middleware to check if the user has a 401 error from the server
const errorLink = onError((error: ErrorResponse) => {
  const formattedErrors: CustomGraphQLFormattedError[] = [
    ...(error.graphQLErrors || []),
  ];

  const statusCode =
    formattedErrors[0]?.httpStatus ||
    (error.networkError as ServerError)?.statusCode ||
    500;

  setServerError({
    status: statusCode,
    statusText: formattedErrors[0]?.code?.toString() || '',
    message: formattedErrors[0]?.message,
  });

  if (statusCode === 401) {
    localStorage.removeItem('login');
    isLoggedOut = true;

    if (window.location.pathname === '/dashboard') {
      window.location.href = '/';
    }
  }
  //console.error('Error', serverErrorStore.getState(), error.response);
});

// get X-Session-ID cookie in headers to compare with navigator session-id cookie
// if they are different, the user is logged out
// Custom link to intercept responses and get headers
// Middleware pour capturer le header X-Session-ID
const captureSessionIdLink = new ApolloLink((operation, forward) => {
  return forward(operation).map((response) => {
    const context = operation.getContext();
    // Verify that the context has a response
    const { response: httpResponse } = context;
    if (httpResponse && httpResponse.headers) {
      // Get le X-Session-ID from the headers
      const sessionId = httpResponse.headers.get('X-Session-ID');

      if (sessionId) {
        const sessionCookie = document.cookie
          .split(';')
          .find((cookie) => cookie.includes('session-id'));
        const sessionIdCookie = sessionCookie?.split('=')[1].trim();

        if (sessionIdCookie !== sessionId) {
          isLoggedOutStore.setState({ isLoggedOut: true });
          isLoggedOut = true;
        }
      }
    }

    return response;
  });
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
  uri:
    import.meta.env.MODE === 'production'
      ? import.meta.env.VITE_SERVER_URL
      : 'http://localhost:3000/',
  credentials: 'include',
  headers: { 'Apollo-Require-Preflight': 'true' },
});

let wsLink = navigator.onLine
  ? new GraphQLWsLink(
      createClient({
        url:
          import.meta.env.MODE === 'production'
            ? import.meta.env.VITE_SERVER_SUBSCRIPTION
            : 'ws://localhost:3000/subscriptions',
        retryAttempts: Infinity,
        shouldRetry: () => true,
        keepAlive: 10000,
      })
    )
  : null;

// Listen for online and offline events
window.addEventListener('online', () => {
  wsLink = new GraphQLWsLink(
    createClient({
      url:
        import.meta.env.MODE === 'production'
          ? import.meta.env.VITE_SERVER_SUBSCRIPTION
          : 'ws://localhost:3000/subscriptions',
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

const httpLinkWithMiddleware = ApolloLink.from([
  userIdMiddleware,
  authMiddleware,
  errorLink,
  captureSessionIdLink,
  httpLink,
]);
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
  wsLink || httpLinkWithMiddleware,
  httpLinkWithMiddleware
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
    {/* <ReloadPrompt /> */}
  </ApolloProvider>
);
