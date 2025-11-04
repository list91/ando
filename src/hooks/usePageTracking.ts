import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView } from '@/lib/analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    logPageView();
  }, [location]);
};
