import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CameraStatus {
  isPermissionGranted: boolean;
  isActive: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private cameraStatusSubject = new BehaviorSubject<CameraStatus>({
    isPermissionGranted: false,
    isActive: false
  });

  public cameraStatus$ = this.cameraStatusSubject.asObservable();

  constructor() { }

  // Request camera permission
  async requestPermission(): Promise<boolean> {
    try {
      // For MVP, we'll simulate permission request
      // In production, this would use navigator.mediaDevices.getUserMedia()

      // Simulate async permission request
      await this.delay(500);

      // For demo, always grant permission
      this.cameraStatusSubject.next({
        isPermissionGranted: true,
        isActive: false
      });

      return true;
    } catch (error) {
      this.cameraStatusSubject.next({
        isPermissionGranted: false,
        isActive: false,
        error: 'Permission denied'
      });
      return false;
    }
  }

  // Start camera (mock for MVP)
  async startCamera(): Promise<void> {
    const currentStatus = this.cameraStatusSubject.value;

    if (!currentStatus.isPermissionGranted) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Camera permission not granted');
      }
    }

    // Simulate camera initialization
    await this.delay(300);

    this.cameraStatusSubject.next({
      isPermissionGranted: true,
      isActive: true
    });
  }

  // Stop camera
  stopCamera(): void {
    const currentStatus = this.cameraStatusSubject.value;
    this.cameraStatusSubject.next({
      ...currentStatus,
      isActive: false
    });
  }

  // Get current camera status
  getCameraStatus(): CameraStatus {
    return this.cameraStatusSubject.value;
  }

  // Check if camera is active
  isCameraActive(): boolean {
    return this.cameraStatusSubject.value.isActive;
  }

  // Helper method to simulate async operations
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup camera resources
  cleanup(): void {
    this.stopCamera();
    this.cameraStatusSubject.next({
      isPermissionGranted: false,
      isActive: false
    });
  }
}
