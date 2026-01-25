import { EmotionState, EmotionDetection } from '../../models/emotion.model';

// Scripted emotion sequence for demo purposes
export const DEMO_EMOTION_SEQUENCE: EmotionDetection[] = [
    {
        state: EmotionState.Engaged,
        confidence: 0.85,
        timestamp: new Date(Date.now())
    },
    {
        state: EmotionState.Engaged,
        confidence: 0.90,
        timestamp: new Date(Date.now() + 5000)
    },
    {
        state: EmotionState.Confused,
        confidence: 0.75,
        timestamp: new Date(Date.now() + 15000)
    },
    {
        state: EmotionState.Confused,
        confidence: 0.80,
        timestamp: new Date(Date.now() + 20000)
    },
    {
        state: EmotionState.Engaged,
        confidence: 0.88,
        timestamp: new Date(Date.now() + 30000)
    },
    {
        state: EmotionState.Bored,
        confidence: 0.70,
        timestamp: new Date(Date.now() + 45000)
    },
    {
        state: EmotionState.Engaged,
        confidence: 0.92,
        timestamp: new Date(Date.now() + 60000)
    },
    {
        state: EmotionState.Frustrated,
        confidence: 0.65,
        timestamp: new Date(Date.now() + 75000)
    },
    {
        state: EmotionState.Engaged,
        confidence: 0.95,
        timestamp: new Date(Date.now() + 90000)
    }
];

// Helper function to get random emotion for testing
export function getRandomEmotion(): EmotionDetection {
    const emotions = [
        EmotionState.Engaged,
        EmotionState.Confused,
        EmotionState.Bored,
        EmotionState.Frustrated,
        EmotionState.Neutral
    ];

    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];

    return {
        state: randomEmotion,
        confidence: 0.6 + Math.random() * 0.4, // Random confidence between 0.6 and 1.0
        timestamp: new Date()
    };
}
