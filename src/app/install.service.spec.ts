import { Device, installOffer } from './install.service';

const SAMSUNG =
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const ANDROID_WEBVIEW =
  'Mozilla/5.0 (Linux; Android 14; SM-S918B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36';
const ANDROID_TV =
  'Mozilla/5.0 (Linux; Android 12; BRAVIA 4K VH2 Build/STT2.230203.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Safari/537.36';
const CHROMECAST =
  'Mozilla/5.0 (Linux; Android 12.0; Build/STTL.240206.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 CrKey/1.56.500000 DeviceType/AndroidTV';
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const WINDOWS_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

function device(userAgent: string, over: Partial<Device> = {}): Device {
  return {
    userAgent,
    platform: '',
    maxTouchPoints: 0,
    standalone: false,
    bridge: false,
    framed: false,
    pathname: '/quiznight-app/',
    hash: '',
    ...over,
  };
}

describe('installOffer', () => {
  it('offers the Android app in an Android browser', () => {
    expect(installOffer(device(SAMSUNG))).toBe('android');
    expect(installOffer(device(ANDROID_CHROME))).toBe('android');
  });

  it('stays away inside the Android app', () => {
    expect(installOffer(device(ANDROID_WEBVIEW))).toBeNull();
    expect(installOffer(device(ANDROID_CHROME, { bridge: true }))).toBeNull();
  });

  it('stays away once installed to the home screen', () => {
    expect(installOffer(device(ANDROID_CHROME, { standalone: true }))).toBeNull();
    expect(installOffer(device(IPHONE, { standalone: true }))).toBeNull();
  });

  it('offers Add to Home Screen on iPhone and iPad', () => {
    expect(installOffer(device(IPHONE))).toBe('ios');
    expect(installOffer(device(MAC_SAFARI, { platform: 'MacIntel', maxTouchPoints: 5 }))).toBe('ios');
  });

  it('leaves desktop browsers alone', () => {
    expect(installOffer(device(WINDOWS_CHROME, { platform: 'Win32' }))).toBeNull();
    expect(installOffer(device(MAC_SAFARI, { platform: 'MacIntel' }))).toBeNull();
    // a touch-screen Windows laptop is still a desktop
    expect(installOffer(device(WINDOWS_CHROME, { platform: 'Win32', maxTouchPoints: 10 }))).toBeNull();
  });

  it('leaves TV screens alone', () => {
    expect(installOffer(device(ANDROID_TV))).toBeNull();
    expect(installOffer(device(CHROMECAST))).toBeNull();
    expect(installOffer(device(ANDROID_CHROME, { pathname: '/quiznight-app/receiver.html' }))).toBeNull();
    expect(installOffer(device(ANDROID_CHROME, { pathname: '/quiznight-app/tv/' }))).toBeNull();
    expect(installOffer(device(ANDROID_CHROME, { hash: '#/tv' }))).toBeNull();
    expect(installOffer(device(IPHONE, { hash: '#/board?tv=1' }))).toBeNull();
    expect(installOffer(device(ANDROID_CHROME, { framed: true }))).toBeNull();
  });
});
