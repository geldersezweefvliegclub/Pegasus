import { Component, output } from '@angular/core';
import { ImageCroppedEvent, ImageTransform, ImageCropperComponent } from 'ngx-image-cropper';
import { faSearchMinus, faSearchPlus, faTimesCircle, faUndoAlt } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconButtonComponent } from '../icon-button/icon-button.component';

@Component({
    selector: 'app-image-crop',
    templateUrl: './image-crop.component.html',
    styleUrls: ['./image-crop.component.scss'],
    imports: [FormsModule, ImageCropperComponent, FaIconComponent, IconButtonComponent]
})
export class ImageCropComponent {
  readonly cropped = output<string | null | undefined>();
  readonly opslaan = output<string>();
  transform: ImageTransform = {};

  // variablen in html formulier
  protected imageChangedEvent: Event | null = null;
  protected croppedImage: string | undefined;
  protected canvasRotation = 0;
  protected draaienIcon = faUndoAlt;
  protected zoomInIcon = faSearchPlus;
  protected zoomUitIcon = faSearchMinus;
  protected resetIcon = faTimesCircle;

  // private variable voor ts script
  private scale = 1;

  protected fileChangeEvent(event: Event): void {
    this.imageChangedEvent = event;
  }

  protected imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64 as string;
    this.cropped.emit(this.croppedImage);
  }

  protected imageLoaded() {
  }

  protected loadImageFailed() {
    console.error('Load failed');
  }

  protected rotateLeft() {
    this.canvasRotation--;
    this.flipAfterRotate();
  }

  protected rotateRight() {
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

  protected flipHorizontal() {
    this.transform = {
      ...this.transform,
      flipH: !this.transform.flipH
    };
  }

  protected flipVertical() {
    this.transform = {
      ...this.transform,
      flipV: !this.transform.flipV
    };
  }

  protected resetImage() {
    this.scale = 1;
    this.canvasRotation = 0;
    this.transform = {};
  }

  protected zoomOut() {
    this.scale -= .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  protected zoomIn() {
    this.scale += .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  // laat parent weten dat we kunnen opslaan
  protected submit() {
    const croppedImage = this.croppedImage;
    if (croppedImage != null) {
      this.opslaan.emit(croppedImage);
    }
  }
}
