import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className }: CardProps) => {
  return (
    <div className={clsx('bg-white overflow-hidden shadow rounded-lg', className)}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader = ({ children, className }: CardHeaderProps) => {
  return <div className={clsx('px-4 py-5 sm:px-6 border-b border-gray-200', className)}>{children}</div>;
};

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

const CardBody = ({ children, className }: CardBodyProps) => {
  return <div className={clsx('px-4 py-5 sm:p-6', className)}>{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardFooter = ({ children, className }: CardFooterProps) => {
  return <div className={clsx('px-4 py-3 bg-gray-50 border-t border-gray-200', className)}>{children}</div>;
};

export { Card, CardHeader, CardBody, CardFooter };
export default Card;
