import { Component, inject, output, signal } from '@angular/core';
import { CastService } from './cast.service';
import { LiveService } from './live.service';

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
        <p>The TV shows only the scoreboard. This phone keeps the scoring screen.</p>

        <h3>Any smart TV</h3>
        @if (live.phoneCode(); as code) {
          <p class="ok"><strong>Connected to TV {{ code }}.</strong> It updates each time you show a round.</p>
          <button class="btn dark block" (click)="live.disconnect()">Disconnect TV</button>
        } @else {
          <ol>
            <li>On the TV, open the web browser and go to <strong class="url">{{ tvUrl }}</strong></li>
            <li>Type the code the TV shows:</li>
          </ol>
          <form class="row" (submit)="$event.preventDefault(); live.connect(code())">
            <input
              id="tv-code"
              type="text"
              class="code"
              maxlength="6"
              autocapitalize="characters"
              autocomplete="off"
              placeholder="ABCD"
              [value]="code()"
              (input)="code.set(str($event))"
              aria-label="TV code"
            />
            <button class="btn sunset" type="submit" [disabled]="code().trim().length < 4">Connect</button>
          </form>
        }
        @if (live.phoneError(); as err) {
          <p class="err">{{ err }}</p>
        }

        @if (cast.supported()) {
          <h3>Chromecast or Google TV</h3>
          @if (cast.state() === 'connected') {
            <p class="ok"><strong>Casting the scoreboard.</strong></p>
            <button class="btn dark block" (click)="cast.stop()">Stop casting</button>
          } @else {
            <button class="btn block" (click)="cast.start()" [disabled]="cast.state() === 'connecting'">
              {{ cast.state() === 'connecting' ? 'Connecting…' : 'Cast scoreboard' }}
            </button>
          }
          @if (cast.error(); as err) {
            <p class="err">{{ err }}</p>
          }
        }

        <p class="hint">
          Screen mirroring (Smart View, Screen cast, AirPlay) also works, but then the TV shows everything on the phone,
          including the scores you're typing.
        </p>
      </section>
    </div>
  `,
  styles: `
    h3 { font-family: var(--font-display); font-size: 1.1rem; margin: 18px 0 6px; }
    p { margin: 8px 0; line-height: 1.45; }
    ol { margin: 6px 0 10px; }
    .url { overflow-wrap: anywhere; }
    .code { margin: 0; font-family: var(--font-display); font-size: 1.6rem; letter-spacing: 0.2em; text-transform: uppercase; text-align: center; }
    .ok { color: #2f6b2f; }
    .err { color: var(--sunset-deep); font-weight: 600; }
  `,
})
export class TvDialog {
  protected cast = inject(CastService);
  protected live = inject(LiveService);
  readonly closed = output<void>();

  protected code = signal('');
  /** Short address for the TV, e.g. viperwr.github.io/quiznight-app/tv */
  protected tvUrl = location.host + location.pathname.replace(/[^/]*$/, '') + 'tv';

  str(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
}
