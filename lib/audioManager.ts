export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  description: string;
  duration?: number;
}

// Nature sounds and white noise (generated locally)
export const AMBIENT_TRACKS: AudioTrack[] = [
  {
    id: 'rain',
    name: 'Light Rain',
    url: '', // Will be generated procedurally
    description: '🌧️ Gentle rain sounds for focus'
  },
  {
    id: 'forest',
    name: 'Forest Ambience',
    url: '', // Will be generated procedurally
    description: '🌲 Birds and rustling leaves'
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    url: '', // Will be generated procedurally
    description: '🌊 Calming ocean waves'
  },
  {
    id: 'cafe',
    name: 'Coffee Shop',
    url: '', // Will be generated procedurally
    description: '☕ Coffee shop chatter and ambience'
  },
  // White/Pink Noise
  {
    id: 'brown_noise',
    name: 'Brown Noise',
    url: '', // Will be generated procedurally
    description: '🔊 Deep, warm background noise'
  },
  {
    id: 'pink_noise',
    name: 'Pink Noise',
    url: '', // Will be generated procedurally
    description: '🔊 Balanced ambient sound'
  }
];

export class AudioManager {
  private currentAudioSystem: { audioContext: AudioContext; gainNode: GainNode; stop: () => void } | null = null;
  private currentTrack: AudioTrack | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.5;
  private isEnabled: boolean = false;

  constructor() {
    // Only initialize in browser
    if (typeof window !== 'undefined') {
      this.loadSettings();
    }
  }

  private loadSettings() {
    const settings = localStorage.getItem('audioSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.volume = parsed.volume || 0.5;
      this.isEnabled = parsed.enabled || false;
    }
  }

  private saveSettings() {
    localStorage.setItem('audioSettings', JSON.stringify({
      volume: this.volume,
      enabled: this.isEnabled,
      currentTrackId: this.currentTrack?.id
    }));
  }

  // Create procedural ambient sounds (nature sounds only)
  private createAmbientSound(track: AudioTrack): { audioContext: AudioContext; gainNode: GainNode; stop: () => void } {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = this.volume * 0.3; // Keep ambient sounds quiet
    gainNode.connect(audioContext.destination);

    const stopFunctions: (() => void)[] = [];

    switch (track.id) {
      case 'rain':
        stopFunctions.push(this.createRainSound(audioContext, gainNode));
        break;
      case 'ocean':
        stopFunctions.push(this.createOceanSound(audioContext, gainNode));
        break;
      case 'forest':
        stopFunctions.push(this.createForestSound(audioContext, gainNode));
        break;
      case 'cafe':
        stopFunctions.push(this.createCafeSound(audioContext, gainNode));
        break;
      case 'brown_noise':
        stopFunctions.push(this.createBrownNoise(audioContext, gainNode));
        break;
      case 'pink_noise':
        stopFunctions.push(this.createPinkNoise(audioContext, gainNode));
        break;
      default:
        // Fallback to rain sound for unknown tracks
        stopFunctions.push(this.createRainSound(audioContext, gainNode));
    }

    return {
      audioContext,
      gainNode,
      stop: () => {
        stopFunctions.forEach(fn => fn());
        audioContext.close();
      }
    };
  }





  private createRainSound(audioContext: AudioContext, destination: GainNode): () => void {
    // Create rain-like sound with filtered white noise and occasional droplets
    const whiteNoiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
    const whiteNoiseData = whiteNoiseBuffer.getChannelData(0);
    for (let i = 0; i < whiteNoiseData.length; i++) {
      whiteNoiseData[i] = Math.random() * 2 - 1;
    }

    const whiteNoiseSource = audioContext.createBufferSource();
    whiteNoiseSource.buffer = whiteNoiseBuffer;
    whiteNoiseSource.loop = true;

    // High-pass filter for rain-like sound
    const highpass = audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 300;
    
    // Low-pass filter to soften
    const lowpass = audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3000;

    const rainGain = audioContext.createGain();
    rainGain.gain.value = 0.4;

    whiteNoiseSource.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(rainGain);
    rainGain.connect(destination);

    whiteNoiseSource.start();

    // Add occasional droplet sounds
    const dropletInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        const dropletOsc = audioContext.createOscillator();
        const dropletGain = audioContext.createGain();
        
        dropletOsc.frequency.setValueAtTime(800 + Math.random() * 400, audioContext.currentTime);
        dropletOsc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
        
        dropletGain.gain.setValueAtTime(0, audioContext.currentTime);
        dropletGain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        dropletGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        dropletOsc.connect(dropletGain);
        dropletGain.connect(destination);
        
        dropletOsc.start();
        dropletOsc.stop(audioContext.currentTime + 0.1);
      }
    }, 100 + Math.random() * 200);

    return () => {
      clearInterval(dropletInterval);
      whiteNoiseSource.stop();
    };
  }

  private createOceanSound(audioContext: AudioContext, destination: GainNode): () => void {
    // Create ocean waves with low-frequency oscillations
    const waveOsc1 = audioContext.createOscillator();
    const waveOsc2 = audioContext.createOscillator();
    const waveGain = audioContext.createGain();

    waveOsc1.type = 'sine';
    waveOsc1.frequency.value = 0.05; // Very slow wave
    waveOsc2.type = 'sine';
    waveOsc2.frequency.value = 0.08;

    // Create filtered noise for wave texture
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const lowpass = audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 200;

    waveGain.gain.value = 0.3;

    waveOsc1.connect(waveGain);
    waveOsc2.connect(waveGain);
    noiseSource.connect(lowpass);
    lowpass.connect(waveGain);
    waveGain.connect(destination);

    waveOsc1.start();
    waveOsc2.start();
    noiseSource.start();

    return () => {
      waveOsc1.stop();
      waveOsc2.stop();
      noiseSource.stop();
    };
  }

  private createForestSound(audioContext: AudioContext, destination: GainNode): () => void {
    // Create forest ambience with occasional bird chirps
    const windBuffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
    const windData = windBuffer.getChannelData(0);
    for (let i = 0; i < windData.length; i++) {
      windData[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const windSource = audioContext.createBufferSource();
    windSource.buffer = windBuffer;
    windSource.loop = true;

    const windFilter = audioContext.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 400;

    const windGain = audioContext.createGain();
    windGain.gain.value = 0.2;

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(destination);

    windSource.start();

    // Add bird chirps
    const birdInterval = setInterval(() => {
      if (Math.random() < 0.1) {
        const birdOsc = audioContext.createOscillator();
        const birdGain = audioContext.createGain();
        
        const startFreq = 800 + Math.random() * 1200;
        birdOsc.frequency.setValueAtTime(startFreq, audioContext.currentTime);
        birdOsc.frequency.setValueAtTime(startFreq * 1.5, audioContext.currentTime + 0.1);
        birdOsc.frequency.setValueAtTime(startFreq, audioContext.currentTime + 0.2);
        
        birdGain.gain.setValueAtTime(0, audioContext.currentTime);
        birdGain.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.01);
        birdGain.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.19);
        birdGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
        
        birdOsc.connect(birdGain);
        birdGain.connect(destination);
        
        birdOsc.start();
        birdOsc.stop(audioContext.currentTime + 0.2);
      }
    }, 1000 + Math.random() * 3000);

    return () => {
      clearInterval(birdInterval);
      windSource.stop();
    };
  }

  private createCafeSound(audioContext: AudioContext, destination: GainNode): () => void {
    // Create cafe ambience with low murmur and occasional sounds
    const murmurBuffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
    const murmurData = murmurBuffer.getChannelData(0);
    for (let i = 0; i < murmurData.length; i++) {
      murmurData[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const murmurSource = audioContext.createBufferSource();
    murmurSource.buffer = murmurBuffer;
    murmurSource.loop = true;

    const murmurFilter = audioContext.createBiquadFilter();
    murmurFilter.type = 'bandpass';
    murmurFilter.frequency.value = 200;
    murmurFilter.Q.value = 1;

    const murmurGain = audioContext.createGain();
    murmurGain.gain.value = 0.15;

    murmurSource.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(destination);

    murmurSource.start();

    return () => {
      murmurSource.stop();
    };
  }

  private createBrownNoise(audioContext: AudioContext, destination: GainNode): () => void {
    // Create brown noise (1/f² spectrum)
    const bufferSize = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = audioContext.createGain();
    gain.gain.value = 0.3;

    source.connect(gain);
    gain.connect(destination);

    source.start();

    return () => {
      source.stop();
    };
  }

  private createPinkNoise(audioContext: AudioContext, destination: GainNode): () => void {
    // Create pink noise (1/f spectrum)
    const bufferSize = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      output[i] = (b0 + b1 + b2 + white * 0.1848) * 0.05;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = audioContext.createGain();
    gain.gain.value = 0.4;

    source.connect(gain);
    gain.connect(destination);

    source.start();

    return () => {
      source.stop();
    };
  }

  async playTrack(track: AudioTrack): Promise<void> {
    try {
      this.stopCurrent();
      
      // Create procedural ambient sound (nature sounds only)
      this.currentAudioSystem = this.createAmbientSound(track);
      
      this.currentTrack = track;
      this.isPlaying = true;
      this.saveSettings();
    } catch (error) {
      console.error('Error playing audio:', error);
      // Reset state on failure
      this.currentTrack = null;
      this.isPlaying = false;
      throw error;
    }
  }


  stopCurrent(): void {
    if (this.currentAudioSystem) {
      this.currentAudioSystem.stop();
      this.currentAudioSystem = null;
    }
    this.currentTrack = null;
    this.isPlaying = false;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudioSystem && this.currentAudioSystem.gainNode) {
      // For generated nature sounds with Web Audio API
      this.currentAudioSystem.gainNode.gain.value = this.volume * 0.3;
    }
    this.saveSettings();
  }

  getVolume(): number {
    return this.volume;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopCurrent();
    }
    this.saveSettings();
  }


  getEnabled(): boolean {
    return this.isEnabled;
  }

  getCurrentTrack(): AudioTrack | null {
    return this.currentTrack;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getAvailableTracks(): AudioTrack[] {
    return AMBIENT_TRACKS;
  }
}

export const audioManager = new AudioManager();