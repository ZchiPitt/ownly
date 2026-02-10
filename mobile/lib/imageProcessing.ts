import { manipulateAsync, SaveFormat, type Action } from 'expo-image-manipulator';

const MAX_UPLOAD_DIMENSION = 1600;
const SECOND_PASS_UPLOAD_DIMENSION = 1280;
const MAX_THUMBNAIL_DIMENSION = 320;
const PRIMARY_UPLOAD_COMPRESSION = 0.78;
const SECOND_PASS_UPLOAD_COMPRESSION = 0.6;
const THUMBNAIL_COMPRESSION = 0.6;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

type ProcessImageInput = {
  uri: string;
  width?: number;
  height?: number;
  fileName?: string;
  mimeType?: string;
};

type ProcessedImage = {
  uri: string;
  width: number;
  height: number;
  sizeBytes: number | null;
  mimeType: 'image/jpeg';
};

export type ProcessedImageArtifacts = {
  processed: ProcessedImage;
  thumbnail: ProcessedImage;
};

function getFileExtension(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const cleanValue = value.split('?')[0];
  const lastDot = cleanValue.lastIndexOf('.');
  if (lastDot < 0) {
    return null;
  }

  return cleanValue.slice(lastDot).toLowerCase();
}

function isHeicInput(input: ProcessImageInput): boolean {
  if (input.mimeType) {
    const mime = input.mimeType.toLowerCase();
    if (mime === 'image/heic' || mime === 'image/heif') {
      return true;
    }
  }

  const uriExtension = getFileExtension(input.uri);
  const fileNameExtension = getFileExtension(input.fileName);
  return uriExtension === '.heic' || uriExtension === '.heif' || fileNameExtension === '.heic' || fileNameExtension === '.heif';
}

function getResizeAction(width: number | undefined, height: number | undefined, maxDimension: number): Action | null {
  if (!width || !height || width <= 0 || height <= 0) {
    return null;
  }

  if (Math.max(width, height) <= maxDimension) {
    return null;
  }

  if (width >= height) {
    const resizedHeight = Math.max(1, Math.round((height / width) * maxDimension));
    return { resize: { width: maxDimension, height: resizedHeight } };
  }

  const resizedWidth = Math.max(1, Math.round((width / height) * maxDimension));
  return { resize: { width: resizedWidth, height: maxDimension } };
}

async function getFileSizeBytes(uri: string): Promise<number | null> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch {
    return null;
  }
}

async function processAsJpeg(
  uri: string,
  width: number | undefined,
  height: number | undefined,
  maxDimension: number,
  compression: number,
): Promise<ProcessedImage> {
  const resizeAction = getResizeAction(width, height, maxDimension);
  const actions: Action[] = resizeAction ? [resizeAction] : [];

  const result = await manipulateAsync(uri, actions, {
    compress: compression,
    format: SaveFormat.JPEG,
  });

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    sizeBytes: await getFileSizeBytes(result.uri),
    mimeType: 'image/jpeg',
  };
}

export async function processImageForUpload(input: ProcessImageInput): Promise<ProcessedImageArtifacts> {
  const heicSource = isHeicInput(input);

  let processed: ProcessedImage;
  try {
    processed = await processAsJpeg(
      input.uri,
      input.width,
      input.height,
      MAX_UPLOAD_DIMENSION,
      PRIMARY_UPLOAD_COMPRESSION,
    );
  } catch (error) {
    if (heicSource) {
      throw new ImageProcessingError(
        'HEIC image conversion failed. Please re-select the photo and choose Most Compatible in iOS Camera settings if the issue continues.',
      );
    }
    throw error;
  }

  if (processed.sizeBytes !== null && processed.sizeBytes > MAX_UPLOAD_BYTES) {
    const secondPass = await processAsJpeg(
      processed.uri,
      processed.width,
      processed.height,
      SECOND_PASS_UPLOAD_DIMENSION,
      SECOND_PASS_UPLOAD_COMPRESSION,
    );

    if (secondPass.sizeBytes !== null && secondPass.sizeBytes > MAX_UPLOAD_BYTES) {
      throw new ImageProcessingError(
        `Image is too large after compression (${Math.round(secondPass.sizeBytes / 1024 / 1024)}MB). Please choose a smaller photo.`,
      );
    }

    processed = secondPass;
  }

  const thumbnail = await processAsJpeg(
    processed.uri,
    processed.width,
    processed.height,
    MAX_THUMBNAIL_DIMENSION,
    THUMBNAIL_COMPRESSION,
  );

  return {
    processed,
    thumbnail,
  };
}
