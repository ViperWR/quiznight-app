import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuizService } from '../quiz.service';
import { Sunset } from '../sunset';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Sunset],
  template: `
    <header class="hero">
      <app-sunset class="sky" />
      <div class="brand">
        <h1 class="script">Quiz Night</h1>
        <p class="tagline">Good Food · Great Company · Great Prizes</p>
      </div>
    </header>

    <main class="page">
      @if (quiz.quiz(); as q) {
        <section class="card">
          <h2>{{ q.title }}</h2>
          <p class="hint">
            {{ q.teams.length }} {{ q.teams.length === 1 ? 'team' : 'teams' }} ·
            {{ q.rounds.length }} rounds · {{ quiz.revealedCount() }} on the scoreboard so far
          </p>
          <div class="actions">
            <a class="btn sunset block" routerLink="/score">Enter scores</a>
            <a class="btn block" routerLink="/board">Show scoreboard</a>
            <a class="btn dark block" routerLink="/setup">Edit rounds &amp; teams</a>
          </div>
        </section>

        <section class="card">
          <h2>Start over</h2>
          @if (confirmReset()) {
            <p>This wipes all teams and scores on this phone. Sure?</p>
            <div class="row">
              <button class="btn sunset small" (click)="newQuiz()">Yes, new quiz</button>
              <button class="btn dark small" (click)="confirmReset.set(false)">Cancel</button>
            </div>
          } @else {
            <button class="btn dark block" (click)="confirmReset.set(true)">New quiz</button>
          }
        </section>
      } @else {
        <section class="card">
          <h2>Ready when you are</h2>
          <p class="hint">
            Set the rounds and questions, add the teams, then enter the scores after every round.
            The scoreboard can go up on the TV.
          </p>
          <a class="btn sunset block" routerLink="/setup">Set up a quiz</a>
        </section>
      }
    </main>
  `,
  styles: `
    .hero {
      position: relative;
      height: 42vh;
      min-height: 240px;
      max-height: 380px;
    }
    .sky {
      position: absolute;
      inset: 0;
    }
    .brand {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding-top: calc(5% + env(safe-area-inset-top));
      text-align: center;
    }
    h1 {
      font-size: clamp(3.4rem, 15vw, 5.5rem);
      transform: rotate(-6deg);
      color: var(--gold-hi);
      text-shadow: 0 3px 0 rgba(0, 0, 0, 0.45);
    }
    .tagline {
      margin: 8px 0 0;
      font-family: var(--font-script);
      font-size: 1.15rem;
      color: var(--gold-hi);
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
    }
    .page {
      margin-top: -24px;
      position: relative;
    }
    .actions {
      display: grid;
      gap: 10px;
      margin-top: 14px;
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
