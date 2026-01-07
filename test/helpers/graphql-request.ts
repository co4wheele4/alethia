// test/helpers/graphql-request.ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export interface GraphQLResponse {
  body?: {
    data?: any;
    errors?: Array<{ message: string; extensions?: any }>;
  };
  status: number;
}

export const graphqlRequest = async (
  app: INestApplication,
  query: string,
  variables?: Record<string, any>,
): Promise<GraphQLResponse> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return (await request(app.getHttpServer())
    .post('/graphql')
    .set('Content-Type', 'application/json')
    .send({ query, variables })) as unknown as GraphQLResponse;
};

