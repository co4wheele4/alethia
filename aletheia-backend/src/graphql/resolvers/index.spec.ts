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

  it('should export EntityResolver', () => {
    expect(resolvers.EntityResolver).toBeDefined();
  });

  it('should export EntityMentionResolver', () => {
    expect(resolvers.EntityMentionResolver).toBeDefined();
  });

  it('should export EntityRelationshipResolver', () => {
    expect(resolvers.EntityRelationshipResolver).toBeDefined();
  });

  it('should export ClaimResolver', () => {
    expect(resolvers.ClaimResolver).toBeDefined();
  });

  it('should export EvidenceResolver', () => {
    expect(resolvers.EvidenceResolver).toBeDefined();
  });

  it('should export EvidenceReproResolver', () => {
    expect(resolvers.EvidenceReproResolver).toBeDefined();
  });

  it('should export AletheiaBundleResolver', () => {
    expect(resolvers.AletheiaBundleResolver).toBeDefined();
  });

  it('should export EpistemicEventsResolver', () => {
    expect(resolvers.EpistemicEventsResolver).toBeDefined();
  });
});
