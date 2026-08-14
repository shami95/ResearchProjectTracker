import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      © {new Date().getFullYear()} Shameena Bawa. All rights reserved.
    </footer>
  );
};

export default Footer;
