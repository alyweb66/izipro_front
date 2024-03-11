import { RouterProvider } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import { router } from './routes';

import './styles/index.scss';

// create a root
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// render element in the DOM
root.render(<RouterProvider router={router} />);