/**
 * Example component demonstrating GraphQL queries
 */

'use client';

import { useHello } from '../../hooks/useHello';

export function GraphQLExample() {
  const { hello, loading, error, refetch } = useHello();

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">
        Error: {error.message}
        <button
          onClick={() => refetch()}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">GraphQL Query Result:</h3>
        <p className="text-lg">{hello || 'No data'}</p>
      </div>
      <button
        onClick={() => refetch()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refetch
      </button>
    </div>
  );
}
