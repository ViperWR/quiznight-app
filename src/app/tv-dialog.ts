import { Component, inject, output } from '@angular/core';
import { CastService } from './cast.service';

@Component({
  selector: 'app-tv-dialog',
  template: `
    <div class="dialog-backdrop" (click)="closed.emit()">
      <section class="card" (click)="$event.stopPropagation()" role="dialog" aria-label="Show on TV">
        <div class="row">
          <h2>Show it on the TV</h2>
          <span class="spacer"></span>
          <button class="icon-btn plain" (click)="closed.emit()" aria-label="Close">✕</button>
        </div>

        @if (cast.supported) {
          @if (cast.state() === 'connected') {
            <p><strong>The scoreboard is on the TV.</strong> Keep entering scores here; the TV updates when you show a round.</p>
            <button class="btn dark block" (click)="cast.stop()">Stop casting</button>
          } @else {
            <p>Sends only the scoreboard to a Chromecast or Cast-enabled TV, so the phone stays free for entering scores.</p>
            <button class="btn sunset block" (click)="cast.start()" [disabled]="cast.state() === 'connecting'">
              {{ cast.state() === 'connecting' ? 'Connecting…' : 'Cast scoreboard' }}
            </button>
          }
          @if (cast.error(); as err) {
            <p class="err">{{ err }}</p>
          }
          <h3>Or mirror the screen</h3>
        }

        <p><strong>Android:</strong></p>
        <ol>
          <li>Swipe down twice from the top and tap <em>Cast</em>, <em>Screen cast</em> or <em>Smart View</em>.</li>
          <li>Pick the TV.</li>
          <li>Open the scoreboard here and tap <em>Full screen</em>. Turn the phone sideways.</li>
        </ol>
        <p><strong>iPhone:</strong></p>
        <ol>
          <li>Open Control Center and tap <em>Screen Mirroring</em>.</li>
          <li>Pick the Apple TV or AirPlay TV.</li>
          <li>Open the scoreboard and turn the phone sideways.</li>
        </ol>
        <p class="hint">
          When mirroring, the TV shows whatever is on the phone, so enter scores before switching back to the scoreboard.
          Running the quiz on a laptop plugged into the TV? Open the scoreboard in a second window on the TV screen
          and it updates live as you enter scores in the first.
        </p>
      </section>
    </div>
  `,
  styles: `
    h3 { font-family: var(--font-display); font-size: 1.1rem; margin-top: 20px; }
    p { margin: 10px 0; line-height: 1.45; }
    .err { color: var(--sunset-deep); font-weight: 600; }
  `,
})
export class TvDialog {
  protected cast = inject(CastService);
  readonly closed = output<void>();
}
