import Image from 'next/image';
import { Fragment } from 'react/jsx-runtime';

const items = [
  { title: 'Toast', price: 30 },
  { title: 'Korv med bröd', price: 25 },
  { title: 'Hembakat', price: 20, newSection: true },
  { title: 'Kexchoklad', price: 20 },
  { title: 'Kondis', price: 20 },
  { title: 'Festis', price: 15, newSection: true },
  { title: 'Kaffe', price: 25 },
  { title: 'Te', price: 20 },
];

export default function MenuPage() {
  return (
    <main className="text-5xl w-screen h-screen print:w-a4-short print:h-a4-long py-16 grid place-items-center">
      <div className="py-[1em] px-[2em] bg-white text-black flex flex-col gap-[.5em] rounded-lg">
        <header className="text-center">
          <h1 className="text-[2em] font-brand font-bold leading-none">
            KIOSK
          </h1>
          <h2 className="font-mono text-[0.5em]">TEAM 17</h2>
        </header>
        <div className="font-brand grid grid-cols-2 gap-x-[2em] gap-y-[.125em] text-[1em]">
          {items.map((item) => (
            <Fragment key={item.title}>
              {item.newSection && (
                <hr className="col-span-2 opacity-20 my-[.125em]" />
              )}
              <p className="font-brand">{item.title}</p>
              <p className="text-right">
                {item.price}
                <span className="font-sans text-[.75em]">:-</span>
              </p>
            </Fragment>
          ))}
        </div>
        <Image
          className="mx-auto w-auto h-[5em]"
          src="/bajen.png"
          width={1172}
          height={1198}
          alt="Bajen"
        />
      </div>
    </main>
  );
}
