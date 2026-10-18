'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// basePath is "/{team}/{event}" for an event, or "" for the global admin page
export const AdminLogin = ({
  basePath,
  placeholder = 'Enter PIN or admin password',
}: {
  basePath: string;
  placeholder?: string;
}) => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${basePath}/api/admin/verify-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.error ??
            (response.status === 429
              ? 'Too many attempts. Wait a while and try again.'
              : 'Invalid password'),
        );
      }

      // Refresh the page to re-evaluate server-side auth
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      alert(`Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-dvh">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-80 p-6 bg-[#0f1a14] border border-white/20 rounded-lg">
        <h1 className="text-2xl font-bold">Admin Access</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="border border-white bg-transparent p-3 rounded-sm text-white placeholder-gray-400 focus:bg-white focus:text-black focus:placeholder-gray-500 focus:scheme-light focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading || !password}
          className="border border-white p-3 rounded-sm hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
          {isLoading ? 'Verifying...' : 'Enter'}
        </button>
      </form>
    </div>
  );
};
