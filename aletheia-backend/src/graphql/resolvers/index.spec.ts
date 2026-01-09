import * as resolvers from './index';

describe('resolvers/index', () => {
  it('should export UserResolver', () => {
    expect(resolvers.UserResolver).toBeDefined();
  });

  it('should export LessonResolver', () => {
    expect(resolvers.LessonResolver).toBeDefined();
  });

  it('should export DocumentResolver', () => {
    expect(resolvers.DocumentResolver).toBeDefined();
  });

  it('should export DocumentChunkResolver', () => {
    expect(resolvers.DocumentChunkResolver).toBeDefined();
  });

  it('should export EmbeddingResolver', () => {
    expect(resolvers.EmbeddingResolver).toBeDefined();
  });

  it('should export EntityResolver', () => {
    expect(resolvers.EntityResolver).toBeDefined();
  });

  it('should export EntityMentionResolver', () => {
    expect(resolvers.EntityMentionResolver).toBeDefined();
  });

  it('should export EntityRelationshipResolver', () => {
    expect(resolvers.EntityRelationshipResolver).toBeDefined();
  });

  it('should export AiQueryResolver', () => {
    expect(resolvers.AiQueryResolver).toBeDefined();
  });

  it('should export AiQueryResultResolver', () => {
    expect(resolvers.AiQueryResultResolver).toBeDefined();
  });
});
