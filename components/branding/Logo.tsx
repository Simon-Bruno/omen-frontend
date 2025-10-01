import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function Logo({ className = '', width = 32, height = 32 }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/assets/logo_small.png"
        alt="Omen Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}
