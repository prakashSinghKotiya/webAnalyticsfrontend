import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { InitialDataProvider } from './context';

export default function App() {
  return (
    <InitialDataProvider>
      <RouterProvider router={router} />
    </InitialDataProvider>
  );
}
