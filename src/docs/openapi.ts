import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';

// Use different docs for each api
import '@@handlers/user/index';
//import './product.docs'//other docs

export function getOpenApiDocumentation() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Greg test api',
      version: '1.0.0',
    },
    tags: [{ name: 'User', description: 'User' }],
    servers: [
      {
        url: process.env.API_URL_LOCAL ?? 'http://localhost:3000/dev',
        description: 'Local Development',
      },
      process.env.API_URL_DEV && {
        url: process.env.API_URL_DEV,
        description: 'AWS Dev',
      },
      process.env.API_URL_PROD && {
        url: process.env.API_URL_PROD,
        description: 'AWS Prod',
      },
    ].filter(Boolean) as { url: string; description: string }[],
  });
}
