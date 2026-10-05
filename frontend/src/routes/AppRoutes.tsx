import { useRoutes } from 'react-router-dom';

import NotFound from '../pages/NotFound';
import { adminRoutes } from './adminRoutes';
import { publicRoutes } from './publicRoutes';

export default function AppRoutes() {
  return useRoutes([
    ...publicRoutes,
    ...adminRoutes,
    { path: '*', element: <NotFound /> },
  ]);
}
