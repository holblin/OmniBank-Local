import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './lib/theme';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import './styles/tokens.css';
import { LanguageProvider } from './lib/i18n';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';

createRoot(document.getElementById('root')).render(
  <ThemeProvider><LanguageProvider><RouterProvider router={router}/></LanguageProvider></ThemeProvider>,
);
