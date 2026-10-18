'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// QR code for a link, shown on screen and downloadable as a PNG to print or
// share. Black on white with a quiet zone, so it scans from paper and screens.
export const QrLink = ({
  url,
  fileName,
}: {
  url: string;
  // Without extension, e.g. "team16-julmarknad"
  fileName: string;
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    QRCode.toDataURL(url, { width: 1024, margin: 2 })
      .then((generated) => {
        if (isCurrent) setDataUrl(generated);
      })
      .catch((err) => console.error('Could not create QR code:', err));
    return () => {
      isCurrent = false;
    };
  }, [url]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white rounded-lg p-2 size-56">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing for next/image to optimize
          <img
            src={dataUrl}
            alt={`QR-kod för ${url}`}
            className="size-full"
          />
        ) : (
          <div className="size-full bg-slate-200 animate-pulse rounded" />
        )}
      </div>
      {dataUrl && (
        <a
          href={dataUrl}
          download={`${fileName}-qr.png`}
          className="text-slate-400 underline underline-offset-2">
          Ladda ner QR-kod
        </a>
      )}
    </div>
  );
};
