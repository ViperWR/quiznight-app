import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Setup } from './setup/setup';
import { Score } from './score/score';
import { Board } from './board/board';
import { Tv } from './tv';

export const routes: Routes = [
  { path: '', component: Home, title: 'Quiz Night' },
  { path: 'setup', component: Setup, title: 'Set up · Quiz Night' },
  { path: 'score', component: Score, title: 'Scores · Quiz Night' },
  { path: 'board', component: Board, title: 'Scoreboard · Quiz Night' },
  { path: 'tv', component: Tv, title: 'TV · Quiz Night' },
  { path: '**', redirectTo: '' },
];
