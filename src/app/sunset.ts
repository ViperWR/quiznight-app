import { Component } from '@angular/core';

/** Sunset sky with an acacia tree and giraffes, after the Watergat quiz night voucher. */
@Component({
  selector: 'app-sunset',
  template: `
    <!-- Wide panorama: phones see the middle (tree, giraffe, sun), TVs see the whole bushveld -->
    <svg viewBox="0 0 800 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="ss-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1c0810" />
          <stop offset="0.24" stop-color="#5c1020" />
          <stop offset="0.5" stop-color="#b02a1e" />
          <stop offset="0.72" stop-color="#e8651c" />
          <stop offset="0.88" stop-color="#f8a52a" />
          <stop offset="1" stop-color="#ffcf5a" />
        </linearGradient>
        <radialGradient id="ss-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#fff4c2" stop-opacity="0.95" />
          <stop offset="0.18" stop-color="#ffc94f" stop-opacity="0.6" />
          <stop offset="0.5" stop-color="#ff8a2a" stop-opacity="0.22" />
          <stop offset="1" stop-color="#ff8a2a" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="ss-disc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fffbe0" />
          <stop offset="1" stop-color="#ffd35a" />
        </linearGradient>
        <linearGradient id="ss-cloud-hi" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#e2502c" stop-opacity="0" />
          <stop offset="0.5" stop-color="#e2502c" stop-opacity="0.5" />
          <stop offset="1" stop-color="#e2502c" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="ss-cloud-lo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#ffd27a" stop-opacity="0" />
          <stop offset="0.5" stop-color="#ffd27a" stop-opacity="0.6" />
          <stop offset="1" stop-color="#ffd27a" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="ss-hills" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a8401a" />
          <stop offset="1" stop-color="#5a160f" />
        </linearGradient>

        <!-- umbrella thorn, origin at the foot of the trunk -->
        <g id="ss-tree" transform="translate(-400 -226)">
          <path
            d="M388 226 C394 206 396 190 395 172 C388 158 372 140 352 122 L358 118 C376 134 392 148 399 160 C400 146 400 132 398 118 L405 118 C407 132 407 148 406 162 C416 146 432 132 452 118 L458 122 C438 138 420 156 411 174 C410 192 412 208 418 226 Z"
          />
          <path
            d="M300 118 C304 110 318 106 330 106 C338 98 356 94 372 96 C386 88 412 88 426 94 C444 90 464 94 474 102 C488 102 500 110 502 118 C496 123 484 122 476 119 C468 125 452 125 444 120 C434 126 416 126 408 121 C398 127 380 127 372 121 C362 126 346 126 338 120 C326 125 308 124 300 118 Z"
          />
        </g>

        <!-- giraffe reaching up to browse, origin between its feet -->
        <g id="ss-giraffe" transform="translate(-30 -100)">
          <path
            d="M9 50 C16 45 28 43 37 39 L57 9 C58 5.5 61 3.5 64.5 3.5 C71 4 76 8 78.5 11.5 C79.5 14 77.5 16 74 15.5 L66.5 14.5 C64.5 14.5 63 15.5 62 17.5 L49 49 C49 55 47 61 43 63 C34 66 22 66 14 63 C9 61 7 55 9 50 Z"
          />
          <path d="M61 5 L60 -1 L62.2 -1 L63.2 4.5 Z M65 4.2 L65.6 -1 L67.8 -0.6 L67.2 4.8 Z M59 7 L53.5 5 L58 10 Z" />
          <path d="M10 56 L12.5 80 L11.5 100 L15.2 100 L16.8 80 L19 60 Z M17 60 L20 80 L19.5 100 L23.2 100 L23.8 80 L25.5 61 Z" />
          <path d="M34.5 60 L36.6 82 L36 100 L39.7 100 L40.4 82 L42 60 Z M41 60 L43.2 82 L43.2 100 L46.9 100 L46.6 82 L48 56 Z" />
          <path d="M9.5 51 C6 56 5 64 5 72 L3.4 81 L7.2 81 L6.6 72 C7 64 8 58 11 54 Z" />
        </g>

        <path id="ss-tuft" d="M-7 0 L-9 -8 L-4 -1 L-3 -12 L0 -1 L3 -10 L4 -1 L8 -7 L7 0 Z" />
        <path id="ss-bird" d="M-6 0 Q-3 -4 0 0 Q3 -4 6 0" />
      </defs>

      <rect width="800" height="240" fill="url(#ss-sky)" />

      <g class="stars">
        <circle cx="62" cy="18" r="0.8" />
        <circle cx="148" cy="34" r="0.6" />
        <circle cx="236" cy="12" r="0.7" />
        <circle cx="318" cy="28" r="0.6" />
        <circle cx="402" cy="10" r="0.8" />
        <circle cx="486" cy="30" r="0.6" />
        <circle cx="571" cy="14" r="0.7" />
        <circle cx="655" cy="36" r="0.6" />
        <circle cx="738" cy="20" r="0.8" />
      </g>

      <!-- cloud streaks, catching more light the nearer they sit to the sun -->
      <ellipse cx="170" cy="62" rx="150" ry="4" fill="url(#ss-cloud-hi)" />
      <ellipse cx="560" cy="48" rx="170" ry="3.5" fill="url(#ss-cloud-hi)" />
      <ellipse cx="380" cy="82" rx="190" ry="4.5" fill="url(#ss-cloud-hi)" />
      <ellipse cx="690" cy="104" rx="120" ry="3.5" fill="url(#ss-cloud-hi)" />
      <ellipse cx="120" cy="126" rx="130" ry="3.5" fill="url(#ss-cloud-lo)" opacity="0.6" />
      <ellipse cx="520" cy="150" rx="170" ry="3.5" fill="url(#ss-cloud-lo)" />
      <ellipse cx="300" cy="168" rx="140" ry="3" fill="url(#ss-cloud-lo)" />
      <ellipse cx="660" cy="176" rx="110" ry="2.5" fill="url(#ss-cloud-lo)" opacity="0.8" />

      <circle class="glow" cx="474" cy="200" r="130" fill="url(#ss-glow)" />
      <circle cx="474" cy="200" r="21" fill="url(#ss-disc)" />

      <!-- far hills with a koppie -->
      <path
        fill="url(#ss-hills)"
        d="M0 240 L0 207 C40 199 80 197 120 203 C160 209 190 205 230 200 C262 196 300 202 340 207 L470 209 C508 206 540 199 572 198 L596 189 L652 189 L670 198 C704 203 744 199 800 205 L800 240 Z"
      />

      <!-- middle distance -->
      <g class="mid">
        <use href="#ss-tree" transform="translate(96 222) scale(0.42)" />
        <use href="#ss-tree" transform="translate(214 221) scale(0.24)" />
        <use href="#ss-tree" transform="translate(704 222) scale(0.5)" />
        <use href="#ss-giraffe" transform="translate(588 222) scale(0.4)" />
        <use href="#ss-giraffe" transform="translate(628 222) scale(-0.34 0.34)" />
        <use href="#ss-giraffe" transform="translate(150 222) scale(-0.3 0.3)" />
      </g>

      <g class="birds">
        <use href="#ss-bird" transform="translate(566 92)" />
        <use href="#ss-bird" transform="translate(584 84) scale(0.8)" />
        <use href="#ss-bird" transform="translate(602 96) scale(0.7)" />
        <use href="#ss-bird" transform="translate(246 112) scale(0.7)" />
        <use href="#ss-bird" transform="translate(262 106) scale(0.55)" />
      </g>

      <!-- foreground silhouettes -->
      <g class="fg">
        <use href="#ss-tree" transform="translate(414 226) scale(0.9)" />
        <use href="#ss-giraffe" transform="translate(312 223) scale(0.9)" />
        <path
          d="M0 240 L0 221 C14 217 28 216 40 220 C52 212 70 211 84 220 C100 222 118 218 134 222 C150 216 168 216 180 222 C210 224 240 220 268 223 C282 218 296 218 306 222 L420 223 C440 219 456 218 470 222 C500 224 530 221 556 223 C570 216 590 215 604 222 C640 224 680 221 716 223 C730 217 748 216 762 221 C776 223 790 221 800 222 L800 240 Z"
        />
        <use href="#ss-tuft" transform="translate(22 220)" />
        <use href="#ss-tuft" transform="translate(236 223) scale(0.8)" />
        <use href="#ss-tuft" transform="translate(290 221)" />
        <use href="#ss-tuft" transform="translate(372 224) scale(0.9)" />
        <use href="#ss-tuft" transform="translate(436 222) scale(1.1)" />
        <use href="#ss-tuft" transform="translate(500 224) scale(0.8)" />
        <use href="#ss-tuft" transform="translate(538 223)" />
        <use href="#ss-tuft" transform="translate(664 224) scale(0.9)" />
        <use href="#ss-tuft" transform="translate(782 222)" />
      </g>
    </svg>
  `,
  styles: `
    :host { display: block; overflow: hidden; }
    svg { display: block; width: 100%; height: 100%; }
    /* The ground is the page colour, so the scene melts into whatever sits below it */
    .fg { fill: var(--ink); }
    .mid { fill: #3b100c; }
    .stars { fill: #ffe9b0; opacity: 0.55; }
    .birds { fill: none; stroke: #2a0a10; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
    .glow { transform-box: fill-box; transform-origin: center; animation: breathe 9s ease-in-out infinite; }
    @keyframes breathe {
      0%, 100% { opacity: 0.85; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.06); }
    }
  `,
})
export class Sunset {}
