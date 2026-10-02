import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { AirplayService } from './airplay.service';
import { PUBLIC_URL } from './cast.config';
import { CastService } from './cast.service';
import { LiveService } from './live.service';

@Component({
  selector: 'app-tv-dialog',
  template: `
    <div class="dialog-backdrop" (click)="closed.emit()">
      <section class="card" (click)="$event.stopPropagation()" role="dialog" aria-label="Show on TV">
        <div class="row top">
          <h2>Show it on the TV</h2>
          <span class="spacer"></span>
          <button class="icon-btn plain" (click)="closed.emit()" aria-label="Close">✕</button>
        </div>
        <p class="intro">The TV shows only the scoreboard. This {{ desktop ? 'screen' : 'phone' }} keeps the scoring screen.</p>

        @if (desktop) {
          <div class="way">
            <h3>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="13" height="9" rx="1.5" /><rect x="9" y="11" width="13" height="9" rx="1.5" /></svg>
              TV plugged into this laptop
            </h3>
            <p class="how">
              With the TV on an HDMI cable or wireless display, open the scoreboard in its own window, drag it onto the TV
              and click it to fill the screen.
            </p>
            <button class="btn block" (click)="openWindow()">Open scoreboard window</button>
          </div>
        }

        <div class="way">
          <h3>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
            Any smart TV
          </h3>
          @if (live.phoneCode(); as code) {
            <p class="ok"><strong>Connected to TV {{ code }}.</strong> It updates each time you show a round.</p>
            <button class="btn dark block" (click)="live.disconnect()">Disconnect TV</button>
          } @else {
            <ol class="steps">
              <li><span>On the TV, open the web browser and go to <strong class="url">{{ tvUrl }}</strong></span></li>
              <li><span>Type the code the TV shows:</span></li>
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
        </div>

        @if (cast.supported()) {
          <div class="way">
            <h3>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6M3 13a6 6 0 0 1 6 6M3 17a2 2 0 0 1 2 2" /></svg>
              Chromecast or Google TV
            </h3>
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
          </div>
        }

        @if (airplay.supported) {
          <div class="way">
            <h3>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1M12 15l5 6H7z" /></svg>
              AirPlay
            </h3>
            @if (airplay.connected()) {
              <p class="ok"><strong>Sending the scoreboard over AirPlay.</strong> Keep this page open and the screen on.</p>
              <button class="btn dark block" (click)="airplay.pick()">Change or stop AirPlay</button>
            } @else {
              <button class="btn block" (click)="airplay.pick()">AirPlay scoreboard</button>
            }
            <p class="note">
              AirPlay: needs an AirPlay-capable TV (an Apple TV, or a newer Samsung, LG or Sony) on the same Wi-Fi. New and
              not yet tried on a real TV.
              @if (airplay.canClip) {
                If the TV stays black,
                <button class="link" (click)="airplay.switchMode()">
                  try the {{ airplay.mode() === 'live' ? 'looping video' : 'live picture' }} instead</button
                >.
              }
            </p>
            @if (airplay.error(); as err) {
              <p class="err">{{ err }}</p>
            }
          </div>
        }

        <p class="hint">
          Screen mirroring (Smart View, Screen cast, AirPlay mirroring) also works, but then the TV shows everything on the phone,
          including the scores you're typing.
        </p>
      </section>
    </div>
  `,
  styles: `
    .top h2 { margin: 0; font-size: 1.45rem; line-height: 1.15; }
    .top .icon-btn { margin: -6px -8px -6px 0; }
    p { margin: 8px 0; line-height: 1.45; }
    .intro { margin: 6px 0 0; color: #5d4f3d; }

    .way {
      margin-top: 12px;
      padding: 14px;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(169, 120, 24, 0.24);
      box-shadow: 0 1px 2px rgba(15, 11, 9, 0.05);
    }
    h3 {
      display: flex;
      align-items: center;
      gap: 9px;
      font-family: var(--font-display);
      font-size: 1.12rem;
      margin: 0 0 10px;
    }
    h3 svg {
      flex: none;
      width: 22px;
      height: 22px;
      fill: none;
      stroke: var(--gold-lo);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .steps {
      list-style: none;
      counter-reset: step;
      margin: 0 0 12px;
      padding: 0;
      display: grid;
      gap: 8px;
      line-height: 1.4;
    }
    .steps li {
      counter-increment: step;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .steps li::before {
      content: counter(step);
      flex: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.8rem;
      font-weight: 800;
      background: linear-gradient(180deg, var(--gold-hi), var(--gold));
      box-shadow: 0 1px 0 var(--gold-lo);
    }
    .steps span { padding-top: 1px; min-width: 0; }
    .how { margin: 0 0 12px; }
    .url { overflow-wrap: anywhere; color: var(--sunset-deep); }

    .code {
      flex: 1;
      min-width: 0;
      margin: 0;
      padding: 8px 6px 8px 0.3em;
      font-family: var(--font-display);
      font-size: 1.7rem;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      text-align: center;
      background: #fff;
    }
    .code::placeholder { color: rgba(42, 32, 24, 0.22); }
    form .btn { min-height: 56px; }

    .ok,
    .err {
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid;
    }
    .ok {
      margin: 0 0 12px;
      color: #23561f;
      background: rgba(47, 107, 47, 0.1);
      border-color: rgba(47, 107, 47, 0.3);
    }
    .ok::before {
      content: '';
      display: inline-block;
      width: 0.6em;
      height: 0.6em;
      margin-right: 0.55em;
      border-radius: 50%;
      background: #2f8a2f;
      box-shadow: 0 0 0 3px rgba(47, 138, 47, 0.2);
    }
    .err {
      margin: 12px 0 0;
      color: var(--sunset-deep);
      font-weight: 600;
      background: rgba(158, 26, 28, 0.08);
      border-color: rgba(158, 26, 28, 0.3);
    }

    .note { margin: 10px 0 0; font-size: 0.8rem; color: #5d4f3d; }
    .link {
      padding: 0;
      border: 0;
      background: none;
      font: inherit;
      font-weight: 700;
      color: var(--sunset-deep);
      text-decoration: underline;
      cursor: pointer;
    }

    .hint {
      margin: 14px 0 0;
      padding-top: 12px;
      border-top: 1px dashed rgba(169, 120, 24, 0.35);
      font-size: 0.8rem;
    }
  `,
})
export class TvDialog {
  protected cast = inject(CastService);
  protected live = inject(LiveService);
  protected airplay = inject(AirplayService);
  readonly closed = output<void>();

  protected code = signal('');
  /** A laptop or desktop: it can put a second window on a TV that's plugged in */
  protected desktop = matchMedia('(hover: hover) and (pointer: fine)').matches;
  /** Short address for the TV, e.g. viperwr.github.io/quiznight-app/tv */
  protected tvUrl =
    (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
      ? PUBLIC_URL
      : location.host + location.pathname.replace(/[^/]*$/, '')) + 'tv';

  constructor() {
    // The video has to exist before the tap, or Safari won't open the AirPlay list
    this.airplay.prepare();
    inject(DestroyRef).onDestroy(() => this.airplay.release());
  }

  /** Scoreboard-only window; it follows this one through the saved quiz. */
  openWindow() {
    window.open(
      location.href.replace(/#.*$/, '') + '#/board?tv=1',
      'quiznight-board',
      'popup,width=1280,height=720',
    );
  }

  str(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
}
