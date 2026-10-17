import Image from 'next/image';

export const BajenLogo = ({ className = '' }: { className?: string }) => (
  <Image
    className={`mx-auto w-auto ${className}`}
    src="/bajen.png"
    width={1172}
    height={1198}
    alt="Bajen"
  />
);
