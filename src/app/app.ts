import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CastService } from './cast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  // Created at startup so a TV receiving a cast starts listening straight away.
  private cast = inject(CastService);
}
