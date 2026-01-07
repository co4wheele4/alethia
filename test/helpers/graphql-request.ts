// test/helpers/graphql-request.ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export interface GraphQLResponse<T = unknown> {
  body?: {
    data?: T;
    errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
  };
  status: number;
}

export const graphqlRequest = async <T = unknown>(
  app: INestApplication,
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResponse<T>> => {
  const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
  return (await request(httpServer)
    .post('/graphql')
    .set('Content-Type', 'application/json')
    .send({ query, variables })) as unknown as GraphQLResponse<T>;
};
