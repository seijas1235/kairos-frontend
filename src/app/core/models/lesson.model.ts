export interface Lesson {
    id: string;
    title: string;
    description: string;
    subject: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedMinutes: number;
    thumbnailUrl?: string;
    contentBlocks: ContentBlock[];
}

export interface ContentBlock {
    id: string;
    type: 'text' | 'video' | 'interactive' | 'visual' | 'quiz';
    content: any;
    order: number;
    adaptationVariants?: Record<string, ContentBlock>;
}

export interface LessonProgress {
    lessonId: string;
    currentBlockId: string;
    completedBlocks: string[];
    startedAt: Date;
    lastUpdated: Date;
    emotionHistory: any[];
}
