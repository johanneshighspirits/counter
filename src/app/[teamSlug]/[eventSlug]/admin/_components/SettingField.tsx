'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export const inputClassName =
  'border border-white/60 bg-transparent p-2 rounded-sm text-white scheme-dark focus:bg-white focus:text-black focus:placeholder-gray-500 focus:scheme-light focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

export const buttonClassName =
  'border border-white px-4 py-2 rounded-sm hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

// A labelled input with a Save button, posting { [field]: value } to url
export const SettingField = <T,>({
  id,
  label,
  url,
  field,
  value,
  isChanged,
  validate,
  children,
}: {
  id: string;
  label: string;
  url: string;
  field: string;
  value: T;
  isChanged: boolean;
  // Returns an error message, or null when the value is fine
  validate: () => string | null;
  children: (props: { id: string; disabled: boolean }) => ReactNode;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<
    { ok: true } | { ok: false; error: string } | null
  >(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setStatus({ ok: false, error });
      return;
    }

    try {
      setIsLoading(true);
      setStatus(null);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to update ${label.toLowerCase()}`);
      }

      setStatus({ ok: true });
      router.refresh();
    } catch (err) {
      setStatus({
        ok: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-slate-400">
        {label}
      </label>
      <div className="flex gap-2">
        {children({ id, disabled: isLoading })}
        <button
          type="submit"
          disabled={isLoading || !isChanged}
          className={buttonClassName}>
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
      {status?.ok && !isChanged && (
        <p className="text-green-400 text-sm">Saved</p>
      )}
      {status && !status.ok && (
        <p className="text-red-400 text-sm">{status.error}</p>
      )}
    </form>
  );
};
