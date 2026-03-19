import express from 'express';
import healthRoute from './health.route';
import docsRoute from './docs.route';
import signalRoute from './signal.route';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/health',
    route: healthRoute,
  },
  {
    path: '/signals',
    route: signalRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

// Always serve docs in development (or depending on environment)
if (process.env.NODE_ENV === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
