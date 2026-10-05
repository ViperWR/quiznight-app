import { Component, inject } from '@angular/core';
import { Board } from './board/board';
import { LiveService } from './live.service';
import { QuizService } from './quiz.service';
import { Backdrop, Wordmark } from './art';

/** Opened in a TV's web browser: shows a pairing code, then the live scoreboard. */
@Component({
  selector: 'app-tv',
  imports: [Board, Backdrop, Wordmark],
  template: `
    @if (live.tvConnected() && quiz.quiz()) {
      <app-board tv="1" />
    } @else {
      <div class="pair">
        <app-backdrop class="sky" />
        <div class="shade"></div>
        <div class="content">
          <div class="intro">
            <h1><app-wordmark /></h1>
            <p class="lead">On the host's phone or laptop, tap <strong>TV</strong>, then type this code under <strong>Any smart TV</strong>:</p>
            <p class="hint"><span class="pulse"></span>The scoreboard appears here by itself once the phone connects.</p>
            <button class="btn ghost small" (click)="live.newTvCode()">New code</button>
          </div>
          <div class="plaque">
            <p class="code display gold">{{ live.tvCode() }}</p>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .pair {
      position: relative;
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
      background: var(--ink);
    }
    .sky,
    .shade {
      position: absolute;
      inset: 0;
    }
    /* The instructions sit in the darker left of the picture, the code plaque over the tree */
    .shade {
      background: linear-gradient(90deg, rgba(10, 7, 5, 0.8) 0%, rgba(10, 7, 5, 0.55) 45%, rgba(10, 7, 5, 0.2) 100%);
    }
    .content {
      position: relative;
      height: 100%;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 5vw;
      /* generous edges: many TVs crop the outer few percent of the picture */
      padding: 5vh 7vw;
    }
    h1 {
      font-size: clamp(1.8rem, 9vmin, 6.8rem);
    }
    .lead {
      font-size: clamp(1.05rem, 3.6vmin, 2.7rem);
      line-height: 1.35;
      color: var(--cream);
      max-width: 30ch;
      margin: 4vh 0 0;
      text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
    }
    .lead strong {
      color: var(--gold-hi);
    }
    .hint {
      display: flex;
      align-items: center;
      gap: 0.7em;
      font-size: clamp(0.9rem, 2.3vmin, 1.7rem);
      margin: 2.4vh 0 2.6vh;
      color: var(--cream-2);
      text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
    }
    .pulse {
      flex: none;
      width: 0.6em;
      height: 0.6em;
      border-radius: 50%;
      background: var(--gold-hi);
      animation: pulse 2s ease-out infinite;
    }
    .btn {
      min-height: clamp(38px, 5.4vmin, 62px);
      padding: 0 clamp(14px, 2.6vmin, 30px);
      font-size: clamp(0.88rem, 2vmin, 1.4rem);
    }
    /* TV remotes move focus rather than a pointer, so make it obvious */
    .btn:focus-visible {
      outline: 3px solid var(--gold-hi);
      outline-offset: 4px;
    }

    .plaque {
      padding: 1.5vmin 5vmin 2.5vmin;
      border-radius: 3vmin;
      border: 0.35vmin solid var(--gold);
      background: linear-gradient(180deg, rgba(36, 28, 20, 0.92), rgba(15, 11, 8, 0.94));
      box-shadow:
        inset 0 0 0 0.9vmin rgba(10, 7, 5, 0.9),
        inset 0 0 0 1.1vmin rgba(232, 184, 74, 0.4),
        0 0 8vmin rgba(232, 184, 74, 0.22),
        0 2vmin 5vmin rgba(0, 0, 0, 0.6);
      animation: slideUp 600ms var(--ease-out) both;
    }
    .code {
      min-width: 2.5em;
      font-size: clamp(4rem, 19vmin, 15rem);
      line-height: 1.15;
      letter-spacing: 0.12em;
      /* letter-spacing trails the last character; pull it back so the code sits centred */
      margin: 0 -0.12em 0 0;
      text-align: center;
      white-space: nowrap;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(255, 224, 138, 0.6); }
      100% { box-shadow: 0 0 0 0.9em rgba(255, 224, 138, 0); }
    }

    /* A phone or tablet held upright: stack everything, code in the middle */
    @media (orientation: portrait) {
      .shade { background: linear-gradient(180deg, rgba(10, 7, 5, 0.78) 0%, rgba(10, 7, 5, 0.6) 55%, rgba(10, 7, 5, 0.3) 100%); }
      .content {
        grid-template-columns: minmax(0, 1fr);
        align-content: center;
        justify-items: center;
        gap: 0;
        padding: 4vh 6vw;
        text-align: center;
      }
      .intro { display: contents; }
      h1 { order: 1; }
      .lead { order: 2; margin-bottom: 2.4vh; }
      .plaque { order: 3; }
      .hint { order: 4; }
      .btn { order: 5; }
    }
  `,
})
export class Tv {
  protected live = inject(LiveService);
  protected quiz = inject(QuizService);

  constructor() {
    this.live.startTv();
  }
}
