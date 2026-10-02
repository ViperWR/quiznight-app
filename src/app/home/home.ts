import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuizService } from '../quiz.service';
import { Acacia, Backdrop, Wordmark } from '../art';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Acacia, Backdrop, Wordmark],
  template: `
    <app-backdrop class="sky" />
    <div class="shade"></div>

    <header class="hero">
      <h1><app-wordmark /></h1>
      <p class="tagline"><span>Good Food</span> <span>Great Company</span> <span>Great Prizes</span></p>
    </header>

    <main class="page">
      @if (quiz.quiz(); as q) {
        <section class="card now">
          <app-acacia class="mark" />
          <h2>{{ q.title }}</h2>
          <dl class="stats">
            <div>
              <dt>{{ q.teams.length === 1 ? 'Team' : 'Teams' }}</dt>
              <dd>{{ q.teams.length }}</dd>
            </div>
            <div>
              <dt>Rounds</dt>
              <dd>{{ q.rounds.length }}</dd>
            </div>
            <div>
              <dt>On the board</dt>
              <dd>{{ quiz.revealedCount() }}</dd>
            </div>
          </dl>
          <div class="actions">
            <a class="btn sunset block lead" routerLink="/score">Enter scores</a>
            <a class="btn block" routerLink="/board">Show scoreboard</a>
            <a class="btn dark block" routerLink="/setup">Edit rounds &amp; teams</a>
          </div>
        </section>

        <section class="card quiet">
          <h2>Start over</h2>
          @if (confirmReset()) {
            <p>This wipes all teams and scores on this phone. Sure?</p>
            <div class="row">
              <button class="btn sunset small" (click)="newQuiz()">Yes, new quiz</button>
              <button class="btn ghost small" (click)="confirmReset.set(false)">Cancel</button>
            </div>
          } @else {
            <button class="btn ghost small" (click)="confirmReset.set(true)">New quiz</button>
          }
        </section>
      } @else {
        <section class="card now">
          <app-acacia class="mark" />
          <h2>Ready when you are</h2>
          <ol class="steps">
            <li>Set the rounds and questions</li>
            <li>Add the teams</li>
            <li>Enter the scores after every round</li>
          </ol>
          <p class="hint">The scoreboard can go up on the TV.</p>
          <a class="btn sunset block lead" routerLink="/setup">Set up a quiz</a>
        </section>
        <section class="card quiet stack">
          <h2>Is this the TV?</h2>
          <p class="hint">Open this page in the TV's web browser and tap below to show only the scoreboard.</p>
          <a class="btn ghost block" routerLink="/tv">Use this screen as the TV</a>
        </section>
      }
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      min-height: 100dvh;
    }
    /* The artwork stays put behind the page; the cards scroll over it */
    .sky,
    .shade {
      position: fixed;
      inset: 0;
    }
    .sky {
      --focus: 50% 40%;
    }
    .shade {
      background: linear-gradient(
        180deg,
        rgba(10, 7, 5, 0.72) 0%,
        rgba(10, 7, 5, 0.3) 26%,
        rgba(10, 7, 5, 0) 46%,
        rgba(10, 7, 5, 0.25) 100%
      );
    }
    .hero,
    .page {
      position: relative;
    }
    .hero {
      height: 38vh;
      min-height: 220px;
      max-height: 380px;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: calc(5vh + env(safe-area-inset-top)) 16px 0;
      text-align: center;
    }
    h1 {
      font-size: clamp(1.9rem, 10.4vw, 3.6rem);
      animation: slideUp 600ms var(--ease-out) both;
    }
    .tagline {
      margin: 16px 0 0;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 2px 0;
      font-size: clamp(0.6rem, 2.6vw, 0.78rem);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--cream);
      text-shadow: 0 1px 6px rgba(0, 0, 0, 0.8);
      animation: fadeIn 900ms var(--ease-out) 150ms both;
    }
    .tagline span + span::before {
      content: '◆';
      margin: 0 0.9em 0 0.7em;
      font-size: 0.6em;
      vertical-align: 0.2em;
      color: var(--gold-hi);
    }

    .page {
      padding-top: 0;
    }

    /* Wide screens: title and cards sit in the darker left of the picture, the tree stands clear on the right */
    @media (min-aspect-ratio: 4/3) and (min-width: 900px) {
      .sky {
        --focus: 100% 50%;
      }
      .shade {
        background: linear-gradient(90deg, rgba(10, 7, 5, 0.6) 0%, rgba(10, 7, 5, 0.25) 45%, rgba(10, 7, 5, 0) 70%);
      }
      .hero,
      .page {
        width: min(520px, 42vw);
        max-width: none;
        margin: 0 0 0 max(5vw, env(safe-area-inset-left));
      }
      .hero {
        height: auto;
        min-height: 0;
        max-height: none;
        align-items: flex-start;
        padding: 7vh 0 4vh;
        text-align: left;
      }
      h1 {
        font-size: clamp(2.4rem, 4.4vw, 3.8rem);
      }
      .tagline {
        justify-content: flex-start;
      }
      .page {
        padding-left: 0;
        padding-right: 0;
      }
    }

    .mark {
      position: absolute;
      right: 14px;
      top: 12px;
      width: 92px;
      color: var(--gold-lo);
      opacity: 0.16;
      pointer-events: none;
    }
    .card > :not(.mark) {
      position: relative;
    }
    .card {
      animation: slideUp 460ms var(--ease-out) 80ms both;
    }
    .card + .card {
      animation-delay: 160ms;
    }
    .now h2 {
      font-size: clamp(1.5rem, 6.4vw, 1.9rem);
      line-height: 1.15;
      color: var(--ink);
      overflow-wrap: anywhere;
      margin-bottom: 12px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin: 0;
    }
    .stats div {
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
      /* reversed column: this keeps the numbers level when a label wraps */
      justify-content: flex-end;
      padding: 10px 4px 9px;
      border-radius: var(--radius-sm);
      background: rgba(169, 120, 24, 0.09);
      border: 1px solid rgba(169, 120, 24, 0.22);
    }
    .stats dd {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.9rem;
      line-height: 1;
      color: var(--sunset-deep);
    }
    .stats dt {
      margin-top: 5px;
      font-size: 0.62rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #7a6a55;
      text-align: center;
    }

    .actions {
      display: grid;
      gap: 10px;
      margin-top: 16px;
    }
    .lead {
      min-height: 56px;
      font-size: 1.12rem;
    }

    .steps {
      list-style: none;
      counter-reset: step;
      margin: 0 0 12px;
      padding: 0;
      display: grid;
      gap: 9px;
    }
    .steps li {
      counter-increment: step;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      line-height: 1.3;
    }
    .steps li::before {
      content: counter(step);
      flex: none;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-family: var(--font-display);
      background: linear-gradient(180deg, var(--gold-hi), var(--gold));
      box-shadow: 0 1px 0 var(--gold-lo);
    }
    .now .hint {
      margin: 0 0 14px;
    }

    /* Secondary panel: dark, so the cream card above stays the focus */
    .quiet {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px 12px;
      background: var(--surface-dark);
      color: var(--cream);
      border: 1px solid rgba(232, 184, 74, 0.3);
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
    }
    .quiet h2 {
      flex: 1;
      margin: 0;
      font-size: 1.15rem;
      color: var(--gold-hi);
    }
    .quiet p {
      flex-basis: 100%;
      margin: 0;
      line-height: 1.45;
    }
    .quiet .hint {
      color: var(--muted);
    }
    .quiet.stack h2 {
      flex-basis: 100%;
    }
  `,
})
export class Home {
  protected quiz = inject(QuizService);
  private router = inject(Router);
  protected confirmReset = signal(false);

  newQuiz() {
    this.quiz.reset();
    this.confirmReset.set(false);
    this.router.navigate(['/setup']);
  }
}
