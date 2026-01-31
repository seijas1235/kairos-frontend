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

  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  constructor() { }

  // Request camera permission and start stream
  async requestPermission(): Promise<boolean> {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Request camera access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      this.cameraStatusSubject.next({
        isPermissionGranted: true,
        isActive: false
      });

      console.log('Camera permission granted');
      return true;

    } catch (error: any) {
      console.error('Camera permission error:', error);

      let errorMessage = 'Permission denied';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied by user';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use';
      }

      this.cameraStatusSubject.next({
        isPermissionGranted: false,
        isActive: false,
        error: errorMessage
      });

      return false;
    }
  }

  // Start camera
  async startCamera(videoElement?: HTMLVideoElement): Promise<void> {
    const currentStatus = this.cameraStatusSubject.value;

    // Request permission if not granted
    if (!currentStatus.isPermissionGranted || !this.mediaStream) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Camera permission not granted');
      }
    }

    // Attach stream to video element if provided
    if (videoElement && this.mediaStream) {
      this.videoElement = videoElement;
      videoElement.srcObject = this.mediaStream;
      await videoElement.play();
    }

    this.cameraStatusSubject.next({
      isPermissionGranted: true,
      isActive: true
    });

    console.log('Camera started');
  }

  // Stop camera
  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    const currentStatus = this.cameraStatusSubject.value;
    this.cameraStatusSubject.next({
      ...currentStatus,
      isActive: false
    });

    console.log('Camera stopped');
  }

  // Capture frame from video element
  captureFrame(videoElement: HTMLVideoElement): string | null {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Convert to base64 JPEG
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);

      // Remove data:image/jpeg;base64, prefix
      return base64Image.split(',')[1];

    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }

  // Get current camera status
  getCameraStatus(): CameraStatus {
    return this.cameraStatusSubject.value;
  }

  // Check if camera is active
  isCameraActive(): boolean {
    return this.cameraStatusSubject.value.isActive;
  }

  // Get media stream
  getMediaStream(): MediaStream | null {
    return this.mediaStream;
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
