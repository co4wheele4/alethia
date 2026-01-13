/**
 * Tests for queries.ts
 */

import {
  HELLO_QUERY,
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  CHANGE_PASSWORD_MUTATION,
  FORGOT_PASSWORD_MUTATION,
} from '../../../lib/graphql/queries';

describe('GraphQL queries', () => {
  describe('HELLO_QUERY', () => {
    it('should be defined', () => {
      expect(HELLO_QUERY).toBeDefined();
    });

    it('should be a GraphQL query', () => {
      expect(HELLO_QUERY.definitions).toBeDefined();
      expect(HELLO_QUERY.definitions.length).toBeGreaterThan(0);
      expect(HELLO_QUERY.definitions[0].kind).toBe('OperationDefinition');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((HELLO_QUERY.definitions[0] as any).operation).toBe('query');
    });

    it('should have correct query name', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const operationName = (HELLO_QUERY.definitions[0] as any).name?.value;
      expect(operationName).toBe('Hello');
    });
  });

  describe('LOGIN_MUTATION', () => {
    it('should be defined', () => {
      expect(LOGIN_MUTATION).toBeDefined();
    });

    it('should be a GraphQL mutation', () => {
      expect(LOGIN_MUTATION.definitions).toBeDefined();
      expect(LOGIN_MUTATION.definitions.length).toBeGreaterThan(0);
      expect(LOGIN_MUTATION.definitions[0].kind).toBe('OperationDefinition');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((LOGIN_MUTATION.definitions[0] as any).operation).toBe('mutation');
    });

    it('should have correct mutation name', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const operationName = (LOGIN_MUTATION.definitions[0] as any).name?.value;
      expect(operationName).toBe('Login');
    });

    it('should have email and password variables', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const variables = (LOGIN_MUTATION.definitions[0] as any).variableDefinitions;
      expect(variables).toBeDefined();
      expect(variables?.length).toBe(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const varNames = variables?.map((v: any) => v.variable.name.value) || [];
      expect(varNames).toContain('email');
      expect(varNames).toContain('password');
    });
  });

  describe('REGISTER_MUTATION', () => {
    it('should be defined', () => {
      expect(REGISTER_MUTATION).toBeDefined();
    });

    it('should be a GraphQL mutation', () => {
      expect(REGISTER_MUTATION.definitions).toBeDefined();
      expect(REGISTER_MUTATION.definitions.length).toBeGreaterThan(0);
      expect(REGISTER_MUTATION.definitions[0].kind).toBe('OperationDefinition');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((REGISTER_MUTATION.definitions[0] as any).operation).toBe('mutation');
    });

    it('should have correct mutation name', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const operationName = (REGISTER_MUTATION.definitions[0] as any).name?.value;
      expect(operationName).toBe('Register');
    });

    it('should have email, password, and optional name variables', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const variables = (REGISTER_MUTATION.definitions[0] as any).variableDefinitions;
      expect(variables).toBeDefined();
      expect(variables?.length).toBeGreaterThanOrEqual(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const varNames = variables?.map((v: any) => v.variable.name.value) || [];
      expect(varNames).toContain('email');
      expect(varNames).toContain('password');
    });
  });

  describe('CHANGE_PASSWORD_MUTATION', () => {
    it('should be defined', () => {
      expect(CHANGE_PASSWORD_MUTATION).toBeDefined();
    });

    it('should be a GraphQL mutation', () => {
      expect(CHANGE_PASSWORD_MUTATION.definitions).toBeDefined();
      expect(CHANGE_PASSWORD_MUTATION.definitions.length).toBeGreaterThan(0);
      expect(CHANGE_PASSWORD_MUTATION.definitions[0].kind).toBe('OperationDefinition');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((CHANGE_PASSWORD_MUTATION.definitions[0] as any).operation).toBe('mutation');
    });

    it('should have correct mutation name', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const operationName = (CHANGE_PASSWORD_MUTATION.definitions[0] as any).name?.value;
      expect(operationName).toBe('ChangePassword');
    });

    it('should have currentPassword and newPassword variables', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const variables = (CHANGE_PASSWORD_MUTATION.definitions[0] as any).variableDefinitions;
      expect(variables).toBeDefined();
      expect(variables?.length).toBe(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const varNames = variables?.map((v: any) => v.variable.name.value) || [];
      expect(varNames).toContain('currentPassword');
      expect(varNames).toContain('newPassword');
    });
  });

  describe('FORGOT_PASSWORD_MUTATION', () => {
    it('should be defined', () => {
      expect(FORGOT_PASSWORD_MUTATION).toBeDefined();
    });

    it('should be a GraphQL mutation', () => {
      expect(FORGOT_PASSWORD_MUTATION.definitions).toBeDefined();
      expect(FORGOT_PASSWORD_MUTATION.definitions.length).toBeGreaterThan(0);
      expect(FORGOT_PASSWORD_MUTATION.definitions[0].kind).toBe('OperationDefinition');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((FORGOT_PASSWORD_MUTATION.definitions[0] as any).operation).toBe('mutation');
    });

    it('should have correct mutation name', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const operationName = (FORGOT_PASSWORD_MUTATION.definitions[0] as any).name?.value;
      expect(operationName).toBe('ForgotPassword');
    });

    it('should have email variable', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const variables = (FORGOT_PASSWORD_MUTATION.definitions[0] as any).variableDefinitions;
      expect(variables).toBeDefined();
      expect(variables?.length).toBe(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const varNames = variables?.map((v: any) => v.variable.name.value) || [];
      expect(varNames).toContain('email');
    });
  });
});
