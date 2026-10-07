import { Component, DestroyRef, inject } from '@angular/core';
import { Backdrop, Wordmark } from './art';
import { APK_URL, InstallService } from './install.service';

/**
 * Full-screen "get the app" screen shown over the web app on a phone's browser:
 * the Android app download on Android, Add to Home Screen steps on iPhone and iPad.
 */
@Component({
  selector: 'app-install-gate',
  imports: [Backdrop, Wordmark],
  template: `
    <app-backdrop class="sky" />
    <div class="shade"></div>

    <div class="content" role="dialog" aria-labelledby="install-title">
      <p class="brand"><app-wordmark /></p>

      @if (install.offer === 'android') {
        <section class="card">
          <h1 id="install-title">Install the Watergat Quiz Night app</h1>
          <p class="why">The app puts only the scoreboard on a Chromecast or Google TV, and opens full screen.</p>
          <a class="btn sunset block lead" [href]="apk" download="quiz-night.apk" (click)="install.markStarted()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" /></svg>
            {{ install.started() ? 'Download again' : 'Download the app' }}
          </a>
          @if (install.started()) {
            <p class="status" role="status">Downloading <strong class="file">quiz-night.apk</strong>. Now:</p>
          }
          <ol class="steps">
            <li><span>Open the downloaded file <strong class="file">quiz-night.apk</strong> from the notification or your Downloads.</span></li>
            <li><span>If your phone asks, allow installs from this source.</span></li>
            <li><span>Tap <strong>Install</strong>, then open <strong>Watergat Quiz Night</strong> from your apps.</span></li>
          </ol>
        </section>
        <button class="skip" (click)="install.dismiss()">Continue in the browser</button>
      } @else {
        <section class="card">
          <h1 id="install-title">Add Watergat Quiz Night to your Home Screen</h1>
          <p class="why">It then opens full screen like an app, and works without internet.</p>
          <ol class="steps">
            <li>
              <span>
                Tap <strong>Share</strong>
                <svg class="share" viewBox="0 0 24 24" role="img" aria-label="the Share button"><path d="M12 15V3M8 6.5l4-4 4 4M7 10H5.5v11h13V10H17" /></svg>
                in the toolbar.
              </span>
            </li>
            <li><span>Scroll down and tap <strong>Add to Home Screen</strong>.</span></li>
            <li><span>Tap <strong>Add</strong>, then open <strong>Watergat Quiz Night</strong> from your Home Screen.</span></li>
          </ol>
          <p class="note">Not in the list? Open this page in Safari.</p>
          <button class="btn block" (click)="install.dismiss()">Not now</button>
        </section>
      }
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 100;
      overflow-y: auto;
      overscroll-behavior: contain;
      background: var(--ink);
      animation: fadeIn 240ms var(--ease-out);
    }
    .sky,
    .shade {
      position: fixed;
      inset: 0;
    }
    .sky {
      --focus: 50% 40%;
    }
    .shade {
      background: linear-gradient(180deg, rgba(10, 7, 5, 0.74) 0%, rgba(10, 7, 5, 0.4) 30%, rgba(10, 7, 5, 0.55) 100%);
    }
    .content {
      position: relative;
      min-height: 100%;
      max-width: 520px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));
    }
    .brand {
      margin: 0 0 22px;
      text-align: center;
      font-family: var(--font-display);
      font-size: clamp(1.6rem, 8.6vw, 2.6rem);
    }
    .card {
      animation: slideUp 460ms var(--ease-out) 80ms both;
    }
    h1 {
      font-family: var(--font-display);
      font-size: clamp(1.5rem, 6.6vw, 1.95rem);
      line-height: 1.15;
      color: var(--ink);
    }
    .why {
      margin: 8px 0 16px;
      line-height: 1.45;
      color: #5d4f3d;
    }
    .lead {
      min-height: 60px;
      font-size: 1.18rem;
    }
    .lead svg {
      width: 24px;
      height: 24px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.4;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .status {
      margin: 14px 0 0;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      color: #23561f;
      background: rgba(47, 107, 47, 0.1);
      border: 1px solid rgba(47, 107, 47, 0.3);
    }

    .steps {
      list-style: none;
      counter-reset: step;
      margin: 16px 0 0;
      padding: 0;
      display: grid;
      gap: 10px;
      line-height: 1.4;
    }
    .steps li {
      counter-increment: step;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .steps li::before {
      content: counter(step);
      flex: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-family: var(--font-display);
      background: linear-gradient(180deg, var(--gold-hi), var(--gold));
      box-shadow: 0 1px 0 var(--gold-lo);
    }
    .steps span {
      padding-top: 3px;
      min-width: 0;
    }
    /* keep the file name in one piece */
    .file {
      white-space: nowrap;
    }
    .share {
      width: 1.35em;
      height: 1.35em;
      margin: 0 0.1em;
      vertical-align: -0.3em;
      fill: none;
      stroke: #1a73e8;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .note {
      margin: 12px 0 16px;
      font-size: 0.85rem;
      color: #7a6a55;
    }

    .skip {
      align-self: center;
      margin-top: 14px;
      min-height: 44px;
      padding: 0 16px;
      border: 0;
      background: none;
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--cream);
      text-decoration: underline;
      text-underline-offset: 3px;
      text-shadow: 0 1px 6px rgba(0, 0, 0, 0.8);
    }
  `,
})
export class InstallGate {
  protected install = inject(InstallService);
  protected apk = APK_URL;

  constructor() {
    this.install.scheduleAuto();
    inject(DestroyRef).onDestroy(() => this.install.cancelAuto());
  }
}
