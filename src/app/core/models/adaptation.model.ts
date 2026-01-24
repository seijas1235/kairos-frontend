import { EmotionState } from './emotion.model';

export interface AdaptationEvent {
    id: string;
    timestamp: Date;
    fromEmotion: EmotionState;
    strategy: AdaptationStrategy;
    description: string;
    contentBlockId: string;
}

export enum AdaptationStrategy {
    VisualExplanation = 'visual',
    Gamification = 'gamification',
    Analogy = 'analogy',
    BreakSuggestion = 'break',
    Simplification = 'simplification',
    PracticeExercise = 'practice'
}

export interface AdaptationRule {
    emotion: EmotionState;
    strategy: AdaptationStrategy;
    description: string;
    priority: number;
}
