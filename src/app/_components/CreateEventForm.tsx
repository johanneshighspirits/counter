'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QrLink } from '@/components/QrLink';
import { toEventDate } from '@/lib/event-date';

const inputClassName =
  'border border-white bg-transparent p-3 rounded-sm text-white placeholder-gray-400 focus:bg-white focus:text-black focus:placeholder-gray-500 focus:scheme-light focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

const Hint = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <p id={id} className="text-sm text-slate-400">
    {children}
  </p>
);

export const CreateEventForm = ({
  teamNames,
  initialTeamName,
}: {
  teamNames: string[];
  initialTeamName: string;
}) => {
  const [teamName, setTeamName] = useState(initialTeamName);
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState(() => toEventDate(Date.now()));
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
        body: JSON.stringify({ teamName, eventName, date, pin }),
      });
      // Vercel's rate limit answers 429 without a JSON body
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body.error ??
            (response.status === 429
              ? 'För många försök, vänta en stund och prova igen'
              : 'Något gick fel'),
        );
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
      <div className="flex flex-col gap-4 p-6 bg-[#0f1a14] border border-white/20 rounded-lg text-center">
        <p className="text-slate-400">Klart! Dela länken med dina funktionärer:</p>
        <p className="font-mono text-lg break-all">{url}</p>
        <QrLink url={url} fileName={createdPath.slice(1).replace('/', '-')} />
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
      className="flex flex-col gap-4 p-6 bg-[#0f1a14] border border-white/20 rounded-lg">
      <div className="flex flex-col gap-2">
        <label htmlFor="team-name" className="text-sm font-medium">
          Lag
        </label>
        <input
          id="team-name"
          aria-describedby="team-name-hint"
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
        <Hint id="team-name-hint">
          Välj ditt lag i listan eller skriv ett nytt namn. Alla lagets
          evenemang samlas på en gemensam sida.
        </Hint>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="event-name" className="text-sm font-medium">
          Evenemang
        </label>
        <input
          id="event-name"
          aria-describedby="event-name-hint"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="t.ex. Skridskodisco"
          maxLength={60}
          disabled={isLoading}
          className={inputClassName}
          autoFocus={!!initialTeamName}
        />
        <Hint id="event-name-hint">
          Namnet visas för funktionärerna och blir en del av länken, t.ex.
          /team17/skridskodisco.
        </Hint>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="event-date" className="text-sm font-medium">
          Datum
        </label>
        <input
          id="event-date"
          aria-describedby="event-date-hint"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isLoading}
          className={`${inputClassName} scheme-dark`}
        />
        <Hint id="event-date-hint">
          Dagen evenemanget äger rum. Visas på lagets sida och kan ändras
          senare under admin.
        </Hint>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="event-pin" className="text-sm font-medium">
          PIN-kod för admin
        </label>
        <input
          id="event-pin"
          aria-describedby="event-pin-hint"
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
        <Hint id="event-pin-hint">
          Skyddar admin-sidan där du ändrar maxantal och datum och nollställer
          räknaren. Spara koden – den går inte att visa igen.
        </Hint>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={
          isLoading ||
          !teamName.trim() ||
          !eventName.trim() ||
          !date ||
          pin.length < 4
        }
        className="border border-white p-3 rounded-sm hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
        {isLoading ? 'Skapar...' : 'Skapa evenemang'}
      </button>
    </form>
  );
};
