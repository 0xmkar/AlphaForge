import { version } from '../../package.json';

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Tether API documentation',
    version,
    description: 'This is the API documentation for the Tether backend.',
    license: {
      name: 'MIT',
      url: 'https://choosealicense.com/licenses/mit/',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}/v1`,
      description: 'Development server',
    },
  ],
};

export default swaggerDef;
