import { LinksFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import './tailwind.css';

// Polaris translations
const translations = {
  Polaris: {
    Common: {
      done: 'Done',
      cancel: 'Cancel',
    },
    Page: {
      Header: {
        rollupButton: 'Actions',
      },
    },
  },
};

export const links: LinksFunction = () => [
  // Stylesheets
  { rel: 'stylesheet', href: 'https://unpkg.com/@shopify/polaris@11.1.2/build/esm/styles.css' },
  { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css' },
  
  // Favicons
  { rel: 'icon', type: 'image/svg+xml', href: '/images/favicon.svg' },
  { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
  { rel: 'apple-touch-icon', href: '/images/logo-small.svg' },
];

// Define global styles with new color palette
const globalStyles = `
  :root {
    --color-primary-darkest: #0C0950;
    --color-primary-dark: #161179;
    --color-primary: #261FB3;
    --color-accent: #FBE4D6;
  }
  
  .gradient-bg {
    background: var(--color-primary-darkest);
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  /* Custom background colors */
  .bg-primary-darkest {
    background-color: var(--color-primary-darkest);
  }
  .bg-primary-dark {
    background-color: var(--color-primary-dark);
  }
  .bg-primary {
    background-color: var(--color-primary);
  }
  .bg-accent {
    background-color: var(--color-accent);
  }
  
  /* Custom text colors */
  .text-primary-darkest {
    color: var(--color-primary-darkest);
  }
  .text-primary-dark {
    color: var(--color-primary-dark);
  }
  .text-primary {
    color: var(--color-primary);
  }
  .text-accent {
    color: var(--color-accent);
  }
  
  /* Button styling */
  .btn-primary {
    background-color: var(--color-primary);
    color: white;
  }
  .btn-primary:hover {
    background-color: var(--color-primary-dark);
  }
  
  .btn-secondary {
    background-color: var(--color-accent);
    color: var(--color-primary-darkest);
  }
  .btn-secondary:hover {
    background-color: #f5d7c5;
  }
`;

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AI-Enhanced Product Customizer</title>
        <Meta />
        <Links />
        <style>{globalStyles}</style>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body>
        <AppProvider i18n={translations}>
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
} 