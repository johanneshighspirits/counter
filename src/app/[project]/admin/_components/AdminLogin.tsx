'use client';

import { useState } from 'react';

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin = ({ onSuccess }: AdminLoginProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error('Invalid password');
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-80 p-6 border border-white rounded-lg">
        <h1 className="text-2xl font-bold">Admin Access</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          disabled={isLoading}
          className="border border-white bg-transparent p-3 rounded-sm text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
