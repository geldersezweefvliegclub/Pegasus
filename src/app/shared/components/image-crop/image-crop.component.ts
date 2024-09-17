import { Component, EventEmitter, Output } from '@angular/core';
import { ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';
import { faSearchMinus, faSearchPlus, faTimesCircle, faUndoAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-image-crop',
  templateUrl: './image-crop.component.html',
  styleUrls: ['./image-crop.component.scss']
})
export class ImageCropComponent {
  @Output() cropped: EventEmitter<string | null | undefined> = new EventEmitter<string | null | undefined>();
  @Output() opslaan: EventEmitter<string> = new EventEmitter<string>();
  imageChangedEvent: Event | null = null;
  croppedImage: string | undefined;
  canvasRotation = 0;
  rotation = 0;
  scale = 1;
  showCropper = false;
  transform: ImageTransform = {};

  draaienIcon = faUndoAlt;
  zoomInIcon = faSearchPlus;
  zoomUitIcon = faSearchMinus;
  resetIcon = faTimesCircle;

  fileChangeEvent(event: Event): void {
    this.imageChangedEvent = event;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64 as string;
    this.cropped.emit(this.croppedImage);
  }

  imageLoaded() {
    this.showCropper = true;
  }

  loadImageFailed() {
    console.error('Load failed');
  }

  rotateLeft() {
    this.canvasRotation--;
    this.flipAfterRotate();
  }

  rotateRight() {
    this.canvasRotation++;
    this.flipAfterRotate();
  }

  private flipAfterRotate() {
    const flippedH = this.transform.flipH;
    const flippedV = this.transform.flipV;
    this.transform = {
      ...this.transform,
      flipH: flippedV,
      flipV: flippedH
    };
  }


  flipHorizontal() {
    this.transform = {
      ...this.transform,
      flipH: !this.transform.flipH
    };
  }

  flipVertical() {
    this.transform = {
      ...this.transform,
      flipV: !this.transform.flipV
    };
  }

  resetImage() {
    this.scale = 1;
    this.rotation = 0;
    this.canvasRotation = 0;
    this.transform = {};
  }

  zoomOut() {
    this.scale -= .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  zoomIn() {
    this.scale += .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  // laat parent weten dat we kunnen opslaan
  submit() {
    this.opslaan.emit(this.croppedImage);
  }
}
