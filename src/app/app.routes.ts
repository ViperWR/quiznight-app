import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Setup } from './setup/setup';
import { Score } from './score/score';
import { Board } from './board/board';
import { Tv } from './tv';

export const routes: Routes = [
  { path: '', component: Home, title: 'Watergat Quiz Night' },
  { path: 'setup', component: Setup, title: 'Set up · Watergat Quiz Night' },
  { path: 'score', component: Score, title: 'Scores · Watergat Quiz Night' },
  { path: 'board', component: Board, title: 'Scoreboard · Watergat Quiz Night' },
  { path: 'tv', component: Tv, title: 'TV · Watergat Quiz Night' },
  { path: '**', redirectTo: '' },
];
