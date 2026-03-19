import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/error';
import routes from './routes';

const app: Express = express();


// Set security HTTP headers
app.use(helmet());

// Parse json request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable cors
app.use(cors());
app.options('*', cors());

// HTTP request logger
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  })
);

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(limiter);

// v1 api routes
app.use('/v1', routes);

// Default route
app.get('/', (req: Request, res: Response) => {
  res.send('Tether API is running');
});

// Use error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
