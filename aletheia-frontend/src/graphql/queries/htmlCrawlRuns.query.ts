import { gql } from '@apollo/client';

export const HTML_CRAWL_RUNS_QUERY = gql`
  query HtmlCrawlRuns {
    htmlCrawlIngestionRuns {
      id
      seedUrl
      startedAt
      status
      crawlDepth
      maxPages
    }
  }
`;

export const HTML_CRAWL_RUN_DETAIL_QUERY = gql`
  query HtmlCrawlRunDetail($id: ID!) {
    htmlCrawlIngestionRun(id: $id) {
      id
      seedUrl
      crawlDepth
      maxPages
      allowedDomains
      includeQueryParams
      followMode
      startedAt
      finishedAt
      status
      errorLog
      fetchedEvidence {
        evidenceId
        url
        depth
        fetchStatus
        errorMessage
      }
    }
  }
`;
