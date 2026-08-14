import React from 'react';
import Spinner from 'react-bootstrap/Spinner';

interface Props {
  label?: string;
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<Props> = ({
  label = 'Loading…',
  fullPage = false,
}) => {
  return (
    <div
      className={
        fullPage
          ? 'd-flex flex-column align-items-center justify-content-center'
          : 'd-flex align-items-center gap-2 py-4 justify-content-center'
      }
      style={fullPage ? { minHeight: '60vh' } : undefined}
    >
      <Spinner animation="border" role="status" style={{ color: 'var(--color-navy-800)' }} />
      <span className="text-muted-2 mt-2">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
