import Image from 'next/image';

interface AutoDiagramLogoProps {
  className?: string;
}

export const AutoDiagramLogo = ({ className }: AutoDiagramLogoProps) => (
  <Image
    src='/logo.svg'
    alt='Auto Diagram Logo'
    width={24}
    height={24}
    className={className}
  />
);
