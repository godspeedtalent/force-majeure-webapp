# Audio Player Implementation Plan

> **Status**: Planned for future implementation
> **Priority**: Low
> **Dependencies**: `@regosen/gapless-5` npm package

## Overview

Add in-app audio playback with gapless transitions and warm crossfades for artist recordings. Currently, recordings link out to external platforms (Spotify, SoundCloud, YouTube). This feature would enable direct playback within Force Majeure.

## Goals

- Gapless playback between tracks (no gaps/pops)
- Warm crossfades using equal-power curve (3-5 seconds)
- Minimal, on-brand player UI
- Support for playlist/queue functionality

## Recommended Library

**[Gapless-5](https://github.com/regosen/Gapless-5)** (`@regosen/gapless-5`)

- TypeScript support built-in
- Crossfade shapes: `None`, `Linear`, `EqualPower` (warm)
- Combines HTML5 Audio + WebAudio for true gapless playback
- Browser support: Safari, Chrome, Firefox (including mobile)

```bash
npm install @regosen/gapless-5
```

## Proposed Architecture

```
src/components/common/audio/
├── FmAudioPlayer.tsx           # Main player UI component
├── FmGaplessPlaylist.tsx       # Playlist display with queue
├── hooks/
│   └── useGaplessPlayer.ts     # Gapless-5 wrapper hook
├── types/
│   └── index.ts                # AudioTrack, PlayerState types
└── index.ts                    # Barrel export
```

## Types

```typescript
// types/index.ts

export interface AudioTrack {
  id: string;
  name: string;
  url: string;                    // Direct audio URL (not platform link)
  artistName?: string;
  coverArt?: string;
  duration?: number;              // Seconds
  platform?: 'spotify' | 'soundcloud' | 'youtube' | 'direct';
}

export interface PlayerState {
  isPlaying: boolean;
  currentTrack: AudioTrack | null;
  currentIndex: number;
  position: number;               // Current position in seconds
  duration: number;               // Total duration in seconds
  volume: number;                 // 0-1
  isShuffled: boolean;
  queue: AudioTrack[];
}

export type CrossfadeShape = 'none' | 'linear' | 'equalPower';

export interface PlayerOptions {
  crossfadeDuration?: number;     // Default: 3000ms
  crossfadeShape?: CrossfadeShape; // Default: 'equalPower'
  initialVolume?: number;         // Default: 1.0
}
```

## Hook API

```typescript
// hooks/useGaplessPlayer.ts

import { Gapless5, CrossfadeShape } from '@regosen/gapless-5';

export function useGaplessPlayer(options?: PlayerOptions) {
  // Returns:
  return {
    // State
    state: PlayerState,

    // Playback controls
    play: () => void,
    pause: () => void,
    stop: () => void,
    next: () => void,
    prev: () => void,

    // Queue management
    addTrack: (track: AudioTrack) => void,
    addTracks: (tracks: AudioTrack[]) => void,
    removeTrack: (trackId: string) => void,
    clearQueue: () => void,

    // Settings
    setVolume: (volume: number) => void,
    seek: (position: number) => void,
    toggleShuffle: () => void,
    setCrossfade: (duration: number, shape?: CrossfadeShape) => void,
  };
}
```

## Component Props

```typescript
// FmAudioPlayer.tsx

interface FmAudioPlayerProps {
  /** Initial tracks to load */
  tracks?: AudioTrack[];
  /** Crossfade duration in ms (default: 3000) */
  crossfadeDuration?: number;
  /** Show/hide playlist (default: false) */
  showPlaylist?: boolean;
  /** Compact mode for embedding (default: false) */
  compact?: boolean;
  /** Callback when track changes */
  onTrackChange?: (track: AudioTrack) => void;
  /** Additional className */
  className?: string;
}
```

## UI Design

### Standard Player
```
┌─────────────────────────────────────────────────────────┐
│  [Cover]  Track Name                     advancement     │
│           Artist Name                   0:00 ━━━━ 3:45  │
│                                                         │
│           ⏮  ▶️  ⏭     🔀     🔊 ━━━━━                │
└─────────────────────────────────────────────────────────┘
```

### Compact Player (for embedding in cards)
```
┌───────────────────────────────┐
│  ▶️  Track Name    0:00/3:45  │
└───────────────────────────────┘
```

### Design System Compliance
- Sharp corners (`rounded-none`)
- Gold accent for progress/active states (`text-fm-gold`, `bg-fm-gold`)
- Frosted glass background (`bg-black/60 backdrop-blur-sm`)
- Canela font for track names
- Icon buttons with gold hover glow

## Integration Points

### 1. Artist Details Page
Add player to artist profile to preview their tracks/DJ sets directly.

```tsx
// In ArtistDetails.tsx or ArtistProfile.tsx
<FmAudioPlayer
  tracks={artist.recordings.map(r => ({
    id: r.id,
    name: r.name,
    url: r.audio_url, // Would need direct audio URLs
    coverArt: r.cover_art,
  }))}
/>
```

### 2. Recording Cards
Add inline play button to `FmRecordingsGrid` cards.

### 3. Event Preview
Preview lineup by playing through artist tracks with crossfades.

## Limitations & Considerations

### Audio URL Requirements
Current recordings store **platform links** (Spotify, SoundCloud URLs), not direct audio files. Options:

1. **Store direct audio URLs** - Requires artists to upload audio or provide direct links
2. **Use platform embeds** - Embed Spotify/SoundCloud players (no crossfade support)
3. **Audio extraction service** - Backend service to get playable URLs (legal/TOS concerns)

**Recommendation**: Start with direct audio upload support for DJ sets, use platform embeds for linked tracks.

### Mobile Considerations
- Background playback requires service worker / media session API
- iOS has autoplay restrictions - user must interact first
- Consider battery usage for long playlists

### Future Enhancements
- [ ] Persistent player bar (like Spotify's bottom bar)
- [ ] Media session API for lock screen controls
- [ ] Keyboard shortcuts (space = play/pause, arrows = seek)
- [ ] Waveform visualization
- [ ] BPM detection for smarter crossfade timing

## Implementation Phases

### Phase 1: Core Player
- [ ] Install `@regosen/gapless-5`
- [ ] Create types and `useGaplessPlayer` hook
- [ ] Build basic `FmAudioPlayer` component
- [ ] Test with direct audio URLs

### Phase 2: Integration
- [ ] Add to artist profiles
- [ ] Inline play buttons on recording cards
- [ ] Playlist/queue UI

### Phase 3: Polish
- [ ] Persistent bottom player bar
- [ ] Media session API
- [ ] Keyboard shortcuts
- [ ] Mobile optimization

## Related Files

- [FmRecordingsGrid.tsx](../../src/components/artist/FmRecordingsGrid.tsx) - Recording display
- [TrackInputForm.tsx](../../src/features/artists/components/TrackInputForm.tsx) - Track metadata fetching
- [recordingQueries.ts](../../src/shared/api/queries/recordingQueries.ts) - Recording data queries

## Resources

- [Gapless-5 GitHub](https://github.com/regosen/Gapless-5)
- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API)