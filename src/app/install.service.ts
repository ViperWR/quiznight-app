import { Injectable, signal } from '@angular/core';

/** Fixed link to the newest Android app build (.github/workflows/android.yml publishes it). */
export const APK_URL =
  'https://github.com/ViperWR/quiznight-app/releases/download/android-latest/quiz-night.apk';

/** Set once the person picks "continue in browser" or "not now"; the install screen stays away after that. */
const SKIP_KEY = 'quiznight.install.skip';
/** Set the first time the download starts by itself, so it never starts by itself again. */
const AUTO_KEY = 'quiznight.install.auto';
/** Long enough to read the screen before the download bar appears */
const AUTO_DELAY_MS = 2500;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable; the choice just won't survive a reload
  }
}

export type InstallOffer = 'android' | 'ios' | null;

/** What the page can tell about where it is running */
export interface Device {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  /** Opened from the home screen (installed web app) */
  standalone: boolean;
  /** Inside the Quiz Night Android app, which adds `window.QuizNightCast` */
  bridge: boolean;
  /** Inside another page's frame */
  framed: boolean;
  pathname: string;
  hash: string;
}

/**
 * Which install screen to show: the Android app download on an Android phone or tablet's
 * browser, Add to Home Screen on an iPhone or iPad, nothing on a desktop, a TV or an
 * already installed app.
 */
export function installOffer(d: Device): InstallOffer {
  if (d.bridge || d.standalone || d.framed) return null;
  // The Chromecast page, the TV pairing page and the scoreboard-only window are TV screens
  if (/\/receiver\.html$|\/tv\/?(index\.html)?$/.test(d.pathname)) return null;
  if (/^#\/tv\b|^#\/board\?.*\btv=/.test(d.hash)) return null;

  const ua = d.userAgent;
  if (/Android/i.test(ua)) {
    // "; wv)" marks an Android WebView (an app showing the page); TVs and Chromecasts get no app
    if (/; wv\)|CrKey|TV\b|AFT[A-Z]|BRAVIA/.test(ua)) return null;
    return 'android';
  }
  // iPadOS Safari calls itself a Mac; the touch screen gives it away
  if (/iPhone|iPad|iPod/.test(ua) || (d.platform === 'MacIntel' && d.maxTouchPoints > 1)) return 'ios';
  return null;
}

function thisDevice(): Device {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    standalone:
      (navigator as any).standalone === true ||
      ['standalone', 'fullscreen', 'minimal-ui'].some((m) => matchMedia(`(display-mode: ${m})`).matches),
    bridge: !!(window as any).QuizNightCast,
    framed: window.self !== window.top,
    pathname: location.pathname,
    hash: location.hash,
  };
}

/** Decides whether to show the "install the app" screen, and remembers when it was turned down. */
@Injectable({ providedIn: 'root' })
export class InstallService {
  /** The install this device can use; null on desktops, TVs and inside the installed app */
  readonly offer = installOffer(thisDevice());
  readonly open = signal(this.offer !== null && !read(SKIP_KEY));
  /** The Android download has been started from this screen */
  readonly started = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  /** "Continue in browser" / "Not now": close the screen and keep it closed on later visits. */
  dismiss() {
    this.cancelAuto();
    write(SKIP_KEY, '1');
    this.open.set(false);
  }

  /** Bring the screen back from the link on the home screen. */
  reopen() {
    this.open.set(true);
  }

  /** The download button was tapped (the link itself does the download). */
  markStarted() {
    this.cancelAuto();
    write(AUTO_KEY, '1');
    this.started.set(true);
  }

  /**
   * Start the Android download by itself, a moment after the screen first appears.
   * Once per device: the flag is saved before the download starts, so a reload,
   * a second visit or coming back from the download can never start it again.
   */
  scheduleAuto() {
    if (this.offer !== 'android' || this.timer || read(AUTO_KEY)) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      if (!this.open() || this.started() || read(AUTO_KEY) || document.visibilityState !== 'visible') return;
      write(AUTO_KEY, '1');
      // Without storage the flag can't be kept, so leave the download to the button
      if (!read(AUTO_KEY)) return;
      this.started.set(true);
      location.assign(APK_URL);
    }, AUTO_DELAY_MS);
  }

  cancelAuto() {
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
