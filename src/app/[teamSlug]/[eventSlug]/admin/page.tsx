import Link from 'next/link';
import type { ReactNode } from 'react';
import { DateInput } from './_components/DateInput';
import { MaxCountInput } from './_components/MaxCountInput';
import { TrimLogForm } from './_components/TrimLogForm';
import { AdminLogin } from '@/components/AdminLogin';
import { DeleteEventButton } from '@/components/DeleteEventButton';
import { ResetButton } from '@/components/ResetButton';
import { isAdmin } from '@/lib/admin-auth';
import { formatEventDate } from '@/lib/event-date';
import { getEvent, getLogSummary, getTeam } from '@/lib/firebase-server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// The event layout appends " · Julmarknad · Team 16"
export const metadata: Metadata = {
  title: 'Admin',
};

const Section = ({
  title,
  description,
  className = 'bg-[#0f1a14]',
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) => (
  <section className={`rounded-xl p-4 flex flex-col gap-4 ${className}`}>
    <header>
      <h2 className="font-semibold">{title}</h2>
      {description && (
        <p className="text-sm text-slate-400">{description}</p>
      )}
    </header>
    {children}
  </section>
);

export default async function AdminPage(
  props: PageProps<'/[teamSlug]/[eventSlug]/admin'>,
) {
  const { teamSlug, eventSlug } = await props.params;
  const basePath = `/${teamSlug}/${eventSlug}`;

  // Check authentication server-side
  if (!(await isAdmin(teamSlug, eventSlug))) {
    return <AdminLogin basePath={basePath} />;
  }

  const [team, event, logSummary] = await Promise.all([
    getTeam(teamSlug),
    getEvent(teamSlug, eventSlug),
    getLogSummary(teamSlug, eventSlug),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <div className="w-full max-w-md px-4 pt-6 pb-4 flex flex-col gap-4">
      <header className="text-center">
        <Link
          href={`/${teamSlug}`}
          className="text-slate-400 hover:underline underline-offset-2">
          {team?.name ?? teamSlug}
        </Link>
        <h1 className="font-brand text-4xl">
          <Link href={basePath} className="hover:underline">
            {event.name}
          </Link>
        </h1>
        <p className="text-slate-400">
          {formatEventDate(event.date)} · Admin
        </p>
      </header>

      <Section title="Settings">
        <DateInput basePath={basePath} initialDate={event.date} />
        <MaxCountInput
          basePath={basePath}
          initialMaxCount={event.maxCount || 150}
        />
      </Section>

      <Section
        title="Stats log"
        description="Delete test clicks from before (or after) the event so they don't show up in the stats.">
        <TrimLogForm
          basePath={basePath}
          eventDate={event.date}
          summary={logSummary}
        />
      </Section>

      <Section
        title="Danger zone"
        description="Reset sets both counters to 0 and deletes the whole log. Delete removes the event and its links for good, which also frees up a spot for the team's new events."
        className="border border-red-400/40">
        <ResetButton
          url={`${basePath}/api/counter/reset`}
          label="Reset counters and log"
          className="p-3 border-red-400! text-red-300 hover:bg-red-950/60! hover:text-red-200!"
          confirmMessage={`Reset ${event.name}? This sets both counters to 0 and deletes the history.`}
        />
        <DeleteEventButton
          basePath={basePath}
          eventName={event.name}
          redirect
        />
      </Section>
    </div>
  );
}
