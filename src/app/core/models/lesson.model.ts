/**
 * Lesson models for the dynamic curriculum system
 */

export interface Lesson {
    id: string;
    title: string;
    description: string;
    subject: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedMinutes: number;
    thumbnailUrl?: string;
    objectives?: string[];

    // New: Dynamic curriculum structure
    curriculum?: Curriculum;

    // Legacy: Old content blocks (for backward compatibility)
    contentBlocks?: ContentBlock[];

    // Metadata
    metadata?: LessonMetadata;

    // Session tracking
    sessionHistory?: Message[];
    completedAt?: Date;
    progress?: number;
}

export interface Curriculum {
    totalTopics: number;
    currentTopicIndex?: number;
    topics: Topic[];
}

export interface Topic {
    id: string;
    title: string;
    order: number;
    completed?: boolean;
    messages: Message[];
}

export interface Message {
    id?: string;
    type: 'ai' | 'question' | 'encouragement' | 'user' | 'system';
    content: string;
    requiresResponse?: boolean;
    emotion?: any; // EmotionState from emotion.model.ts
    timestamp?: Date;
    adaptationApplied?: string;
    adapted?: boolean;
    originalContent?: string;
}

export interface LessonMetadata {
    topic: string;
    level: string;
    learningStyle?: string;
    age?: number;
    alias?: string;
    language?: string; // 'en', 'es', 'pt'
    generatedBy?: string;
    curriculumVersion?: string;
}

// Legacy models (kept for backward compatibility)
export interface ContentBlock {
    id: string;
    type: 'text' | 'video' | 'interactive' | 'visual' | 'quiz' | 'explanation' | 'example' | 'practice';
    title?: string;
    content: any;
    order: number;
    durationMinutes?: number;
    adaptationVariants?: Record<string, ContentBlock>;
}

export interface LessonProgress {
    lessonId: string;

    // For curriculum-based lessons
    currentTopicIndex?: number;
    currentMessageIndex?: number;
    completedTopics?: string[];

    // For legacy block-based lessons
    currentBlockId?: string;
    completedBlocks?: string[];

    startedAt: Date;
    lastUpdated: Date;
    emotionHistory: any[];
}

/**
 * Request/Response types for API calls
 */
export interface GenerateLessonRequest {
    topic: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    learningStyle: 'visual' | 'textual' | 'interactive' | 'mixed';
    age?: number;
    alias?: string;
    language?: string; // 'en', 'es', 'pt'
    excludedTopics?: string[];
}

export interface GenerateLessonResponse {
    lesson_id: string;
    title: string;
    description: string;
    objectives: string[];
    curriculum: {
        total_topics: number;
        topics: {
            id: string;
            title: string;
            order: number;
            messages: {
                type: string;
                content: string;
                requires_response: boolean;
            }[];
        }[];
    };
    estimated_duration_minutes: number;
    difficulty_level: string;
    metadata: any;
}

export interface ContinueLessonRequest {
    lesson: Lesson;
    numTopics?: number;
}

export interface ContinueLessonResponse {
    topics: Topic[];
}

export interface AdaptMessageRequest {
    message: Message;
    emotion: string;
    studentContext?: any;
}

export interface AdaptMessageResponse extends Message {
    adaptationReason?: string;
}
