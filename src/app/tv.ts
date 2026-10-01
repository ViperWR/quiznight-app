import { Component, inject } from '@angular/core';
import { Board } from './board/board';
import { LiveService } from './live.service';
import { QuizService } from './quiz.service';
import { Sunset } from './sunset';

/** Opened in a TV's web browser: shows a pairing code, then the live scoreboard. */
@Component({
  selector: 'app-tv',
  imports: [Board, Sunset],
  template: `
    @if (live.tvConnected() && quiz.quiz()) {
      <app-board tv="1" />
    } @else {
      <div class="pair">
        <app-sunset class="sky" />
        <div class="shade"></div>
        <div class="content">
          <h1 class="script">Quiz Night</h1>
          <p class="lead">On the host's phone, tap <strong>TV</strong>, then type this code under <strong>Any smart TV</strong>:</p>
          <p class="code display gold">{{ live.tvCode() }}</p>
          <p class="hint">The scoreboard appears here by itself once the phone connects.</p>
          <button class="btn ghost small" (click)="live.newTvCode()">New code</button>
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
      display: grid;
      place-items: center;
      text-align: center;
      background: var(--ink);
    }
    .sky {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 55%;
    }
    .shade {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, var(--ink) 40%, rgba(15, 11, 9, 0.6) 80%, rgba(15, 11, 9, 0.3));
    }
    .content {
      position: relative;
      padding: 0 6vw;
    }
    h1 {
      font-size: clamp(3rem, 12vmin, 8rem);
      transform: rotate(-5deg);
    }
    .lead {
      font-size: clamp(1rem, 3.4vmin, 2.2rem);
      color: var(--cream);
      max-width: 34ch;
      margin: 3vh auto 1vh;
    }
    .code {
      font-size: clamp(4rem, 22vmin, 14rem);
      letter-spacing: 0.12em;
      margin: 0;
      line-height: 1.1;
    }
    .hint {
      font-size: clamp(0.9rem, 2.4vmin, 1.5rem);
      margin-bottom: 3vh;
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
