import { Component } from '@angular/core';

/** Sunset sky with an acacia tree and giraffes, after the Watergat quiz night voucher. */
@Component({
  selector: 'app-sunset',
  template: `
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7a1424" />
          <stop offset="0.35" stop-color="#c8341f" />
          <stop offset="0.7" stop-color="#ef7a1a" />
          <stop offset="1" stop-color="#f9b72c" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#fff4c2" />
          <stop offset="0.6" stop-color="#ffd25a" />
          <stop offset="1" stop-color="#ffb52e" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#sky)" />
      <g fill="#f59a2a" opacity="0.55">
        <ellipse cx="70" cy="40" rx="70" ry="7" />
        <ellipse cx="300" cy="60" rx="90" ry="6" />
        <ellipse cx="180" cy="95" rx="110" ry="5" />
        <ellipse cx="330" cy="130" rx="70" ry="4" />
      </g>
      <circle cx="318" cy="198" r="34" fill="url(#sun)" />
      <g fill="#120a07">
        <!-- acacia trunk and branches -->
        <path d="M196 228 L200 170 L176 132 L182 130 L201 160 L208 120 L214 121 L207 164 L236 128 L241 132 L210 176 L208 228 Z" />
        <!-- flat-topped canopy -->
        <ellipse cx="205" cy="118" rx="96" ry="14" />
        <ellipse cx="160" cy="110" rx="52" ry="12" />
        <ellipse cx="248" cy="108" rx="58" ry="12" />
        <ellipse cx="205" cy="100" rx="60" ry="11" />
        <ellipse cx="120" cy="122" rx="30" ry="7" />
        <ellipse cx="292" cy="122" rx="32" ry="7" />
        <!-- giraffe browsing at the tree -->
        <g transform="translate(34 0)">
          <path d="M54 180 Q56 171 68 170 L96 163 Q106 163 107 173 L104 186 Q82 191 60 189 Q54 187 54 180 Z" />
          <path d="M95 168 L117 116 L125 118 L107 174 Z" />
          <path d="M114 112 Q120 108 128 113 L134 119 Q133 123 129 122 L121 120 Q115 119 114 112 Z" />
          <path d="M117 111 L116 103 L118.5 103 L119.5 110 Z M121 111 L121.5 103 L124 103 L123.5 112 Z" />
          <path d="M60 186 L62 226 L65 226 L65 188 Z" />
          <path d="M69 188 L69 226 L72 226 L73 188 Z" />
          <path d="M96 185 L94 226 L97 226 L100 185 Z" />
          <path d="M101 184 L102 226 L105 226 L105 183 Z" />
          <path d="M55 177 L50 198 L52.5 198 L58 180 Z" />
        </g>
        <!-- small giraffe in the distance -->
        <path d="M352 212 Q360 209 368 211 L368 218 Q360 220 353 219 Z" />
        <path d="M365 211 L368 210 L376 192 L373 191 Z" />
        <path d="M372 189 L379 192 L378 194 L373 193 Z" />
        <rect x="354" y="217" width="1.6" height="12" />
        <rect x="358" y="217" width="1.6" height="12" />
        <rect x="364" y="217" width="1.6" height="12" />
        <rect x="367" y="217" width="1.6" height="12" />
        <!-- bushveld -->
        <path d="M0 240 L0 222 Q20 210 40 220 Q60 206 85 222 Q110 212 130 224 Q160 214 190 226 Q230 216 260 224 Q290 212 320 226 Q350 218 375 226 Q390 220 400 224 L400 240 Z" />
      </g>
    </svg>
  `,
  styles: `
    :host { display: block; overflow: hidden; }
    svg { display: block; width: 100%; height: 100%; }
  `,
})
export class Sunset {}
