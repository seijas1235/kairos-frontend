export enum EmotionState {
    Engaged = 'engaged',
    Confused = 'confused',
    Bored = 'bored',
    Frustrated = 'frustrated',
    Neutral = 'neutral'
}

export interface EmotionDetection {
    state: EmotionState;
    confidence: number;
    timestamp: Date;
}

export interface EmotionConfig {
    detectionInterval: number;
    confidenceThreshold: number;
    enableDebug: boolean;
}
