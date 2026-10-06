import React from 'react';
import { createRoot } from 'react-dom/client';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import './styles/tokens.css';
import { LanguageProvider } from './lib/i18n';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';

createRoot(document.getElementById('root')).render(
  <Theme theme={neutralTheme} mode="light"><LanguageProvider><RouterProvider router={router}/></LanguageProvider></Theme>,
);
