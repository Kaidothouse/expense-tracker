import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Navbar />
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;