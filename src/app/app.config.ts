import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash URLs so deep links (e.g. #/board) work on GitHub Pages without a server rewrite.
    provideRouter(routes, withHashLocation(), withComponentInputBinding()),
    // Offline support for the installed app; skipped when embedded in another page's frame.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && window.self === window.top,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
