import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { CastService } from './cast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  // Created at startup so a TV receiving a cast starts listening straight away.
  private cast = inject(CastService);

  constructor() {
    // The short TV address (…/quiznight-app/tv/) opens the TV pairing screen
    if (/\/tv\/?(index\.html)?$/.test(location.pathname)) inject(Router).navigate(['/tv']);

    // Pick up a new deploy straight away; the quiz itself is kept in storage.
    const sw = inject(SwUpdate);
    if (sw.isEnabled) {
      sw.versionUpdates.subscribe((e) => {
        if (e.type === 'VERSION_READY') document.location.reload();
      });
    }
  }
}
