'use client';

import { useState } from 'react';
import Link from 'next/link';

const inputClassName =
  'border border-white bg-transparent p-3 rounded-sm text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed';

export const CreateEventForm = ({
  teamNames,
  initialTeamName,
}: {
  teamNames: string[];
  initialTeamName: string;
}) => {
  const [teamName, setTeamName] = useState(initialTeamName);
  const [eventName, setEventName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdPath, setCreatedPath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamName, eventName, pin }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? 'Något gick fel');
      }

      setCreatedPath(`/${body.teamSlug}/${body.eventSlug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel');
    } finally {
      setIsLoading(false);
    }
  };

  if (createdPath) {
    const url = `${globalThis.location.origin}${createdPath}`;

    const copyLink = async () => {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    };

    return (
      <div className="flex flex-col gap-4 p-6 border border-white rounded-lg text-center">
        <p className="text-slate-400">Klart! Dela länken med dina funktionärer:</p>
        <p className="font-mono text-lg break-all">{url}</p>
        <button
          type="button"
          onClick={copyLink}
          className="border border-white p-3 rounded-sm hover:bg-white hover:text-black transition-colors font-medium">
          {copied ? 'Kopierad!' : 'Kopiera länk'}
        </button>
        <Link
          href={createdPath}
          className="bg-white text-black p-3 rounded-sm font-medium">
          Öppna evenemanget
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 p-6 border border-white rounded-lg">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Lag</span>
        <input
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          list="team-names"
          placeholder="t.ex. Team 17"
          maxLength={40}
          disabled={isLoading}
          className={inputClassName}
          autoFocus={!initialTeamName}
        />
        <datalist id="team-names">
          {teamNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Evenemang</span>
        <input
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="t.ex. Skridskodisco"
          maxLength={60}
          disabled={isLoading}
          className={inputClassName}
          autoFocus={!!initialTeamName}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">PIN-kod för admin</span>
        <input
          type="password"
          inputMode="numeric"
          pattern="\d{4,8}"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="4–8 siffror"
          maxLength={8}
          disabled={isLoading}
          className={inputClassName}
        />
      </label>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={
          isLoading || !teamName.trim() || !eventName.trim() || pin.length < 4
        }
        className="border border-white p-3 rounded-sm hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
        {isLoading ? 'Skapar...' : 'Skapa evenemang'}
      </button>
    </form>
  );
};
