'use client';

import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme='dark'
      className='toaster group'
      toastOptions={{
        style: {
          background: 'rgb(26, 26, 26)',
          border: '1px solid rgb(42, 42, 42)',
          color: 'rgb(255, 255, 255)',
          fontFamily:
            'ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
          fontSize: '14px',
          fontWeight: '400',
        },
        className: 'rounded-xl backdrop-blur-sm',
      }}
      position='top-right'
      {...props}
    />
  );
};

export { Toaster };
