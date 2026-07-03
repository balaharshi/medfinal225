let audio: HTMLAudioElement | null = null;
let unlocked = false;

const getAudio = () => {
  if (!audio) {
    audio = new Audio('/sounds/notification.mp3');
    audio.preload = 'auto';
  }
  return audio;
};

export const unlockNotificationSound = () => {
  if (unlocked) return;
  const sound = getAudio();
  sound.muted = true;
  sound
    .play()
    .then(() => {
      sound.pause();
      sound.currentTime = 0;
      sound.muted = false;
      unlocked = true;
    })
    .catch(() => {
      sound.muted = false;
    });
};

export const playNotificationSound = () => {
  const sound = getAudio();
  sound.muted = false;
  sound.currentTime = 0;
  sound.play().catch(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.24);
    } catch {
      // The toast still shows if the browser refuses audio playback.
    }
  });
};

export const setupNotificationSoundUnlock = () => {
  const unlock = () => unlockNotificationSound();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
};
