import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

/** Full-screen layout for the authentication pages — no navbar or footer. */
export const AuthLayout: React.FC = () => {

  useEffect(() => {
    // Auth pages can be taller than the viewport on small screens, so allow
    // vertical scrolling while they're mounted (the app locks it globally).
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return <Outlet />;
};

export default AuthLayout;
