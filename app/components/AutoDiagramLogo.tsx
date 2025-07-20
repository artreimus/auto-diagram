interface AutoDiagramLogoProps {
  className?: string;
}

export const AutoDiagramLogo = ({ className }: AutoDiagramLogoProps) => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    className={className}
  >
    {/* Abstract diagram representation with nodes and connections */}
    <circle cx='6' cy='6' r='2' fill='currentColor' />
    <circle cx='18' cy='6' r='2' fill='currentColor' />
    <circle cx='12' cy='18' r='2' fill='currentColor' />

    {/* Connection lines */}
    <path
      d='M8 6h8M6 8l5.2 8.4M18 8l-5.2 8.4'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
    />

    {/* Central accent element */}
    <circle cx='12' cy='10' r='1.5' fill='currentColor' opacity='0.6' />
  </svg>
);
