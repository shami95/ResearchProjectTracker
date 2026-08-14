import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="page-container text-center" style={{ paddingTop: '5rem' }}>
      <div className="eyebrow">404</div>
      <h1>Page not found</h1>
      <p className="text-muted-2">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard">← Back to dashboard</Link>
    </div>
  );
};

export default NotFoundPage;
