import { AcousticConfig, AcousticPresetId } from '../types';

export const ACOUSTIC_PRESETS: Record<AcousticPresetId, AcousticConfig> = {
  cellphone: {
    presetId: 'cellphone',
    name: 'Weak Cell Signal',
    description: 'AMR-NB codec fallback with high packet loss and artifacts.',
    highPassHz: 300,
    lowPassHz: 3400,
    distortionDrive: 12,
    snrDb: 10,
    noiseType: 'white',
    packetLossRate: 15,
    reverbWet: 0.01
  },
  landline: {
    presetId: 'landline',
    name: 'Phone Call',
    description: 'Traditional POTS voiceband (300-3400Hz) with slight line noise.',
    highPassHz: 300,
    lowPassHz: 3400,
    distortionDrive: 15,
    snrDb: 20,
    noiseType: 'radio_hum',
    packetLossRate: 0,
    reverbWet: 0.05
  },
  train_pa: {
    presetId: 'train_pa',
    name: 'Train Station',
    description: 'Horn speaker (400-6000Hz) in a highly reverberant space.',
    highPassHz: 400,
    lowPassHz: 6000,
    distortionDrive: 25,
    snrDb: 12,
    noiseType: 'subway_rumble',
    packetLossRate: 0,
    reverbWet: 0.6
  },
  intercom_staccato: {
    presetId: 'intercom_staccato',
    name: 'Office Intercom',
    description: 'Small 3-inch wall speaker driven hard, cutting in and out.',
    highPassHz: 400,
    lowPassHz: 4000,
    distortionDrive: 35,
    snrDb: 15,
    noiseType: 'pink',
    packetLossRate: 10,
    reverbWet: 0.08
  },
  walkie_talkie: {
    presetId: 'walkie_talkie',
    name: 'Walkie-Talkie',
    description: 'Standard FM narrowband voice (300-3000Hz) with RF static.',
    highPassHz: 300,
    lowPassHz: 3000,
    distortionDrive: 45,
    snrDb: 8,
    noiseType: 'white',
    packetLossRate: 5,
    reverbWet: 0.02
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
