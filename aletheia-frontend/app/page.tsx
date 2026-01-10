'use client';

import { GraphQLExample } from './components/ui/GraphQLExample';
import { LoginForm } from './components/ui/LoginForm';
import { useAuth } from './hooks/useAuth';

export default function Home() {
  // useAuth uses Apollo hooks, so it must be called inside ApolloProvider
  // The provider is in layout.tsx, so this should work
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center gap-8 py-16 px-8 bg-white dark:bg-black">
        <div className="w-full text-center">
          <h1 className="text-4xl font-bold mb-4 text-black dark:text-zinc-50">
            Aletheia
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
            Frontend connected to GraphQL Backend
          </p>
        </div>

        <div className="w-full max-w-md space-y-8">
          {/* Login Form - Prominently Displayed */}
          {!isAuthenticated ? (
            <div className="p-8 border-2 border-blue-300 dark:border-blue-700 rounded-lg shadow-lg bg-white dark:bg-gray-900">
              <h2 className="text-2xl font-bold mb-6 text-center text-black dark:text-zinc-50">
                Welcome to Aletheia
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Please login to continue
              </p>
              <LoginForm />
            </div>
          ) : (
            <>
              {/* Authentication Status */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    ✅ Status: Authenticated
                  </span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* GraphQL Example */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                  GraphQL Query Example
                </h2>
                <GraphQLExample />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
