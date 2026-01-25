import { Lesson } from '../../models/lesson.model';

export const MOCK_LESSONS: Lesson[] = [
    {
        id: '1',
        title: 'Introduction to Fractions',
        description: 'Learn the basics of fractions with visual examples and interactive exercises',
        subject: 'Mathematics',
        difficulty: 'beginner',
        estimatedMinutes: 15,
        thumbnailUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Fractions',
        contentBlocks: [
            {
                id: 'block-1',
                type: 'text',
                order: 1,
                content: {
                    title: 'What are Fractions?',
                    body: 'A fraction represents a part of a whole. It consists of a numerator (top number) and a denominator (bottom number).'
                },
                adaptationVariants: {
                    confused: {
                        id: 'block-1-visual',
                        type: 'visual',
                        order: 1,
                        content: {
                            title: 'What are Fractions? (Visual)',
                            body: 'Imagine a pizza cut into 8 slices. If you eat 3 slices, you ate 3/8 of the pizza!',
                            imageUrl: 'https://via.placeholder.com/400x300/10b981/ffffff?text=Pizza+Visual'
                        }
                    },
                    bored: {
                        id: 'block-1-game',
                        type: 'interactive',
                        order: 1,
                        content: {
                            title: 'Fraction Challenge!',
                            body: 'Can you identify which fraction is larger? 1/2 or 1/4?',
                            gameType: 'quiz'
                        }
                    }
                }
            },
            {
                id: 'block-2',
                type: 'text',
                order: 2,
                content: {
                    title: 'Adding Fractions',
                    body: 'To add fractions with the same denominator, simply add the numerators and keep the denominator the same.'
                },
                adaptationVariants: {
                    confused: {
                        id: 'block-2-simple',
                        type: 'text',
                        order: 2,
                        content: {
                            title: 'Adding Fractions - Simplified',
                            body: 'Example: 1/4 + 2/4 = 3/4. Think of it like combining pizza slices!'
                        }
                    }
                }
            }
        ]
    },
    {
        id: '2',
        title: 'The Solar System',
        description: 'Explore planets, stars, and the wonders of our solar system',
        subject: 'Science',
        difficulty: 'beginner',
        estimatedMinutes: 20,
        thumbnailUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Solar+System',
        contentBlocks: [
            {
                id: 'block-1',
                type: 'text',
                order: 1,
                content: {
                    title: 'Our Solar System',
                    body: 'The solar system consists of the Sun and everything that orbits around it, including 8 planets.'
                },
                adaptationVariants: {
                    confused: {
                        id: 'block-1-visual',
                        type: 'visual',
                        order: 1,
                        content: {
                            title: 'Our Solar System (Visual)',
                            body: 'Here\'s a diagram showing all 8 planets in order from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.',
                            imageUrl: 'https://via.placeholder.com/600x300/8b5cf6/ffffff?text=Solar+System+Diagram'
                        }
                    }
                }
            }
        ]
    },
    {
        id: '3',
        title: 'World War II Overview',
        description: 'Understanding the causes, events, and impact of World War II',
        subject: 'History',
        difficulty: 'intermediate',
        estimatedMinutes: 25,
        thumbnailUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=WWII',
        contentBlocks: [
            {
                id: 'block-1',
                type: 'text',
                order: 1,
                content: {
                    title: 'Causes of WWII',
                    body: 'World War II began in 1939 due to various factors including the Treaty of Versailles, economic depression, and rise of totalitarian regimes.'
                },
                adaptationVariants: {
                    bored: {
                        id: 'block-1-analogy',
                        type: 'text',
                        order: 1,
                        content: {
                            title: 'Causes of WWII - Modern Analogy',
                            body: 'Think of it like a pressure cooker: economic hardship, unfair treaties, and political tension built up pressure until it exploded into war.'
                        }
                    }
                }
            }
        ]
    },
    {
        id: '4',
        title: 'Basic Programming Concepts',
        description: 'Learn variables, loops, and functions in programming',
        subject: 'Computer Science',
        difficulty: 'beginner',
        estimatedMinutes: 30,
        thumbnailUrl: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Programming',
        contentBlocks: [
            {
                id: 'block-1',
                type: 'text',
                order: 1,
                content: {
                    title: 'What is a Variable?',
                    body: 'A variable is like a container that stores information in your program.'
                },
                adaptationVariants: {
                    confused: {
                        id: 'block-1-analogy',
                        type: 'text',
                        order: 1,
                        content: {
                            title: 'What is a Variable? (Analogy)',
                            body: 'Think of a variable like a labeled box. You can put things in it, take things out, and change what\'s inside!'
                        }
                    }
                }
            }
        ]
    }
];
