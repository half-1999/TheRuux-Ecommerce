import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { initClientSentry } from './lib/sentry.js';
import './index.css';

initClientSentry();

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (measurementId && /^G-[A-Z0-9]+$/.test(measurementId)) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

const searchConsole = import.meta.env.VITE_GSC_VERIFICATION;
if (searchConsole) {
  const meta = document.createElement('meta');
  meta.name = 'google-site-verification';
  meta.content = searchConsole;
  document.head.appendChild(meta);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (count, err) => err?.status !== 401 && count < 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
