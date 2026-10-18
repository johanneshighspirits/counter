'use client';

import { useRef, useState } from 'react';
import { QrLink } from './QrLink';

// Opens a dialog with the event's link and QR code, e.g. to let a new
// volunteer scan their way in
export const ShareEventButton = ({
  path,
  eventName,
}: {
  // "/team16/julmarknad"
  path: string;
  eventName: string;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const open = () => {
    setUrl(`${globalThis.location.origin}${path}`);
    setCopied(false);
    dialogRef.current?.showModal();
  };

  const copyLink = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="text-slate-400 underline underline-offset-2">
        Dela med QR-kod
      </button>

      <dialog
        ref={dialogRef}
        // Close when tapping the backdrop around the box
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border border-white bg-black text-white backdrop:bg-black/70 backdrop:backdrop-blur-sm">
        <div className="flex flex-col gap-4 p-6 text-center">
          <h2 className="font-brand text-3xl">{eventName}</h2>
          {url && (
            <>
              <QrLink url={url} fileName={path.slice(1).replace('/', '-')} />
              <p className="font-mono break-all">{url}</p>
              <button
                type="button"
                onClick={copyLink}
                className="border border-white p-3 rounded-sm hover:bg-white hover:text-black transition-colors font-medium">
                {copied ? 'Kopierad!' : 'Kopiera länk'}
              </button>
            </>
          )}
          <form method="dialog">
            <button
              type="submit"
              className="w-full bg-white text-black p-3 rounded-sm font-medium">
              Stäng
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
};
