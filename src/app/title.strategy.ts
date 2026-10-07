import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { QuizService } from './quiz.service';

/** Puts the venue in the browser tab, e.g. "Scores · Watergat Quiz Night". */
@Injectable()
export class VenueTitleStrategy extends TitleStrategy {
  private title = inject(Title);
  private quiz = inject(QuizService);

  override updateTitle(snapshot: RouterStateSnapshot) {
    const title = this.buildTitle(snapshot) ?? 'Quiz Night';
    const venue = this.quiz.venue();
    this.title.setTitle(venue ? title.replace('Quiz Night', `${venue} Quiz Night`) : title);
  }
}
