import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/home/home').then(m => m.Home)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
    },
    {
        path: 'lessons',
        loadComponent: () => import('./features/lesson-selection/lesson-selection').then(m => m.LessonSelection)
    },
    {
        path: 'create-lesson',
        loadComponent: () => import('./features/lesson-creator/lesson-creator').then(m => m.LessonCreator)
    },
    {
        path: 'lesson/:lessonId',
        loadComponent: () => import('./features/learning-session/learning-session').then(m => m.LearningSession)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
