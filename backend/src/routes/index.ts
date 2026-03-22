import express from 'express';
import healthRoute from './health.route';
import docsRoute from './docs.route';
import signalRoute from './signal.route';
import strategyRoute from './strategy.route';
import authRoute from './auth.route';
import executionRoute from './execution.route';
import investmentRoute from './investment.route';

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
  {
    path: '/strategy',
    route: strategyRoute,
  },
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/execution',
    route: executionRoute,
  },
  {
    path: '/investments',
    route: investmentRoute,
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
