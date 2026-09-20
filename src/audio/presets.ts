import { AcousticConfig, AcousticPresetId } from '../types';

export const ACOUSTIC_PRESETS: Record<AcousticPresetId, AcousticConfig> = {
  cellphone: {
    presetId: 'cellphone',
    name: 'Weak Cell Signal',
    description: 'Slight crackle and small audio dropouts like a phone call with low bars.',
    highPassHz: 200,
    lowPassHz: 7000,
    distortionDrive: 8,
    snrDb: 18,
    noiseType: 'pink',
    packetLossRate: 4,
    reverbWet: 0.02
  },
  landline: {
    presetId: 'landline',
    name: 'Phone Call',
    description: 'Slightly muffled audio with faint line noise, like a telephone call.',
    highPassHz: 300,
    lowPassHz: 3400,
    distortionDrive: 22,
    snrDb: 12,
    noiseType: 'radio_hum',
    packetLossRate: 0,
    reverbWet: 0.05
  },
  train_pa: {
    presetId: 'train_pa',
    name: 'Train Station',
    description: 'Echoing speaker announcement with background station rumble and crowd noise.',
    highPassHz: 350,
    lowPassHz: 4200,
    distortionDrive: 35,
    snrDb: 5,
    noiseType: 'subway_rumble',
    packetLossRate: 0,
    reverbWet: 0.38
  },
  intercom_staccato: {
    presetId: 'intercom_staccato',
    name: 'Office Intercom',
    description: 'Voice cuts in and out through a small, crackly wall speaker.',
    highPassHz: 450,
    lowPassHz: 3000,
    distortionDrive: 45,
    snrDb: 2,
    noiseType: 'white',
    packetLossRate: 28,
    reverbWet: 0.08
  },
  walkie_talkie: {
    presetId: 'walkie_talkie',
    name: 'Walkie-Talkie',
    description: 'Scratchy two-way radio with background hiss and static.',
    highPassHz: 500,
    lowPassHz: 2500,
    distortionDrive: 60,
    snrDb: 0,
    noiseType: 'radio_hum',
    packetLossRate: 12,
    reverbWet: 0.04
  },
  custom: {
    presetId: 'custom',
    name: 'Custom Settings',
    description: 'Manually adjust the sound clarity, background noise, and static.',
    highPassHz: 300,
    lowPassHz: 3400,
    distortionDrive: 20,
    snrDb: 10,
    noiseType: 'pink',
    packetLossRate: 10,
    reverbWet: 0.1
  }
};
