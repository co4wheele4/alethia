// test/helpers/graphql-request.ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export interface GraphQLResponse<T = Record<string, any>> {
  body?: {
    data?: T;
    errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
  };
  status: number;
}

export const graphqlRequest = async <T = Record<string, any>>(
  app: INestApplication,
  query: string,
  variables?: Record<string, unknown>,
  options?: { authToken?: string },
): Promise<GraphQLResponse<T>> => {
  const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

  const token = options?.authToken ?? globalThis.__ALETHEIA_E2E_AUTH_TOKEN__;

  const req = request(httpServer)
    .post('/graphql')
    .set('Content-Type', 'application/json');
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  return (await req.send({
    query,
    variables,
  })) as unknown as GraphQLResponse<T>;
};
