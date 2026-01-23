import heic2any from 'heic2any';
import { supabase } from '@/lib/supabase';

// Supported image formats
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

// Minimum dimensions
const MIN_WIDTH = 200;
const MIN_HEIGHT = 200;

// Maximum file size for compression (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Thumbnail dimensions
const THUMBNAIL_SIZE = 200;

/**
 * Validation result interface
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Validates an image file for minimum dimensions and supported formats.
 * @param file - The image file to validate
 * @returns Promise with validation result
 */
export async function validateImage(file: File): Promise<ImageValidationResult> {
  // Check if file is a supported format
  const format = file.type.toLowerCase();

  // Handle HEIC/HEIF which may not have correct MIME type
  const isHeic = format.includes('heic') || format.includes('heif') ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');

  if (!SUPPORTED_FORMATS.includes(format) && !isHeic) {
    return {
      valid: false,
      error: `Unsupported format. Please use JPEG, PNG, WebP, or HEIC.`,
      format,
    };
  }

  // For HEIC files, we need to convert first to check dimensions
  let imageFile = file;
  if (isHeic) {
    try {
      const convertedBlob = await convertHeicToJpeg(file);
      imageFile = new File([convertedBlob], 'converted.jpg', { type: 'image/jpeg' });
    } catch {
      return {
        valid: false,
        error: 'Failed to process HEIC image. Please try a different format.',
        format,
      };
    }
  }

  // Check dimensions
  try {
    const dimensions = await getImageDimensions(imageFile);

    if (dimensions.width < MIN_WIDTH || dimensions.height < MIN_HEIGHT) {
      return {
        valid: false,
        error: `Image too small. Minimum size is ${MIN_WIDTH}x${MIN_HEIGHT} pixels.`,
        width: dimensions.width,
        height: dimensions.height,
        format,
      };
    }

    return {
      valid: true,
      width: dimensions.width,
      height: dimensions.height,
      format,
    };
  } catch {
    return {
      valid: false,
      error: 'Failed to read image dimensions. Please try a different image.',
      format,
    };
  }
}

/**
 * Gets the dimensions of an image file.
 * @param file - The image file
 * @returns Promise with width and height
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Converts a HEIC/HEIF file to JPEG format.
 * @param file - The HEIC/HEIF file to convert
 * @returns Promise with the converted JPEG Blob
 */
export async function convertHeicToJpeg(file: File): Promise<Blob> {
  try {
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });

    // heic2any can return an array for multi-frame images, take the first one
    if (Array.isArray(result)) {
      return result[0];
    }

    return result;
  } catch (error) {
    console.error('HEIC conversion error:', error);
    throw new Error('Failed to convert HEIC image');
  }
}

/**
 * Compresses an image to a maximum file size of 2MB.
 * Resizes if necessary and adjusts quality to meet the size limit.
 * @param file - The image file to compress
 * @param maxSize - Maximum file size in bytes (default 2MB)
 * @returns Promise with the compressed image Blob
 */
export async function compressImage(file: File, maxSize: number = MAX_FILE_SIZE): Promise<Blob> {
  // Handle HEIC conversion first
  let imageBlob: Blob = file;
  const isHeic = file.type.includes('heic') || file.type.includes('heif') ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');

  if (isHeic) {
    imageBlob = await convertHeicToJpeg(file);
  }

  // If already under max size and not HEIC, return as-is (unless it's PNG that could be compressed)
  if (imageBlob.size <= maxSize && !isHeic && file.type !== 'image/png') {
    return imageBlob;
  }

  const img = await loadImage(imageBlob);

  // Start with original dimensions
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  // Calculate max dimensions based on file size (heuristic)
  // Large images need to be scaled down more
  const maxDimension = imageBlob.size > maxSize * 2 ? 2048 : 3000;

  // Scale down if necessary
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Try different quality levels
  const qualities = [0.9, 0.8, 0.7, 0.6, 0.5];

  for (const quality of qualities) {
    const compressed = await resizeImage(img, width, height, quality);

    if (compressed.size <= maxSize) {
      return compressed;
    }

    // If still too large at lowest quality, reduce dimensions
    if (quality === 0.5) {
      const ratio = 0.75;
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
  }

  // Final attempt with smallest dimensions and lowest quality
  return resizeImage(img, width, height, 0.5);
}

/**
 * Loads an image from a Blob.
 * @param blob - The image blob
 * @returns Promise with the loaded HTMLImageElement
 */
function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Resizes an image using canvas.
 * @param img - The HTMLImageElement to resize
 * @param width - Target width
 * @param height - Target height
 * @param quality - JPEG quality (0-1)
 * @returns Promise with the resized image Blob
 */
function resizeImage(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Generates a 200x200 thumbnail from an image.
 * The thumbnail is cropped to a square from the center.
 * @param file - The image file
 * @returns Promise with the thumbnail Blob
 */
export async function generateThumbnail(file: File): Promise<Blob> {
  // Handle HEIC conversion first
  let imageBlob: Blob = file;
  const isHeic = file.type.includes('heic') || file.type.includes('heif') ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');

  if (isHeic) {
    imageBlob = await convertHeicToJpeg(file);
  }

  const img = await loadImage(imageBlob);

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = THUMBNAIL_SIZE;
    canvas.height = THUMBNAIL_SIZE;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calculate crop area (center crop for square)
    const srcWidth = img.naturalWidth;
    const srcHeight = img.naturalHeight;
    const size = Math.min(srcWidth, srcHeight);
    const srcX = (srcWidth - size) / 2;
    const srcY = (srcHeight - size) / 2;

    // Draw cropped and scaled image
    ctx.drawImage(
      img,
      srcX, srcY, size, size,  // Source rectangle
      0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE  // Destination rectangle
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create thumbnail'));
        }
      },
      'image/jpeg',
      0.8
    );
  });
}

/**
 * Generates a unique filename with UUID.
 * @param extension - File extension (default 'jpg')
 * @returns Unique filename
 */
function generateFilename(extension: string = 'jpg'): string {
  const uuid = crypto.randomUUID();
  return `${uuid}.${extension}`;
}

/**
 * Upload result interface
 */
export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Uploads an image to Supabase Storage.
 * Images are stored in the items/{user_id}/ folder.
 * @param file - The image file or blob to upload
 * @param userId - The user's ID
 * @param filename - Optional custom filename (UUID generated if not provided)
 * @returns Promise with the upload result containing URL and path
 */
export async function uploadToStorage(
  file: File | Blob,
  userId: string,
  filename?: string
): Promise<UploadResult> {
  const finalFilename = filename || generateFilename();
  const filePath = `${userId}/${finalFilename}`;

  const { data, error } = await supabase.storage
    .from('items')
    .upload(filePath, file, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('items')
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

/**
 * Deletes an image from Supabase Storage.
 * @param path - The storage path of the image
 */
export async function deleteFromStorage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('items')
    .remove([path]);

  if (error) {
    console.error('Storage delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Processes an image file for upload: validates, compresses, and generates thumbnail.
 * @param file - The image file to process
 * @param userId - The user's ID
 * @returns Promise with URLs for main image and thumbnail
 */
export async function processAndUploadImage(
  file: File,
  userId: string
): Promise<{ imageUrl: string; thumbnailUrl: string; imagePath: string; thumbnailPath: string }> {
  // Validate
  const validation = await validateImage(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image');
  }

  // Compress main image
  const compressed = await compressImage(file);

  // Generate thumbnail
  const thumbnail = await generateThumbnail(file);

  // Generate filenames
  const uuid = crypto.randomUUID();
  const mainFilename = `${uuid}.jpg`;
  const thumbnailFilename = `${uuid}_thumb.jpg`;

  // Upload both in parallel
  const [mainResult, thumbnailResult] = await Promise.all([
    uploadToStorage(compressed, userId, mainFilename),
    uploadToStorage(thumbnail, userId, thumbnailFilename),
  ]);

  return {
    imageUrl: mainResult.url,
    thumbnailUrl: thumbnailResult.url,
    imagePath: mainResult.path,
    thumbnailPath: thumbnailResult.path,
  };
}
