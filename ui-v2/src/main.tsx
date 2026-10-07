import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/server/queryClient";
import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./lib/theme";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "./styles/tokens.css";
import { LanguageProvider } from "./lib/i18n";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>,
);
