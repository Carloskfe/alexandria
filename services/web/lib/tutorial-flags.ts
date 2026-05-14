const FLAGS = {
  welcome: 'noetia_welcome_seen',
  fragments: 'noetia_fragments_tutorial_seen',
  audio: 'noetia_audio_tutorial_seen',
} as const;

function hasSeen(key: string): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(key) === '1';
}

function markSeen(key: string): void {
  localStorage.setItem(key, '1');
}

export function hasSeenWelcome(): boolean { return hasSeen(FLAGS.welcome); }
export function markWelcomeSeen(): void { markSeen(FLAGS.welcome); }

export function hasSeenFragmentsTutorial(): boolean { return hasSeen(FLAGS.fragments); }
export function markFragmentsTutorialSeen(): void { markSeen(FLAGS.fragments); }

export function hasSeenAudioTutorial(): boolean { return hasSeen(FLAGS.audio); }
export function markAudioTutorialSeen(): void { markSeen(FLAGS.audio); }
