import type { AnalyzeImageResponse } from '../../src/types/api';

import { supabase } from './supabase';

type UploadAndAnalyzeInput = {
  userId: string;
  processedImageUri: string;
  thumbnailUri: string;
};

export type UploadAndAnalyzeResult = {
  analysis: AnalyzeImageResponse;
  imagePath: string;
  thumbnailPath: string;
  imageUrl: string;
  thumbnailUrl: string;
};

export type UploadedImageArtifacts = {
  imagePath: string;
  thumbnailPath: string;
  imageUrl: string;
  thumbnailUrl: string;
};

export class AnalyzeImageError extends Error {
  uploadedPaths: string[];

  constructor(message: string, uploadedPaths: string[] = []) {
    super(message);
    this.name = 'AnalyzeImageError';
    this.uploadedPaths = uploadedPaths;
  }
}

function buildBaseFilename(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${randomPart}`;
}

async function uploadUriToStorage(path: string, uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage.from('items').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  return data.path;
}

function toPublicUrl(path: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from('items').getPublicUrl(path);

  return publicUrl;
}

export async function uploadProcessedImageArtifacts({
  userId,
  processedImageUri,
  thumbnailUri,
}: UploadAndAnalyzeInput): Promise<UploadedImageArtifacts> {
  const base = buildBaseFilename();
  const imagePath = `${userId}/${base}.jpg`;
  const thumbnailPath = `${userId}/${base}_thumb.jpg`;

  const [uploadedImagePath, uploadedThumbnailPath] = await Promise.all([
    uploadUriToStorage(imagePath, processedImageUri),
    uploadUriToStorage(thumbnailPath, thumbnailUri),
  ]);

  return {
    imagePath: uploadedImagePath,
    thumbnailPath: uploadedThumbnailPath,
    imageUrl: toPublicUrl(uploadedImagePath),
    thumbnailUrl: toPublicUrl(uploadedThumbnailPath),
  };
}

export async function cleanupTemporaryUploads(paths: string[]): Promise<void> {
  const validPaths = paths.map((path) => path.trim()).filter(Boolean);
  if (!validPaths.length) {
    return;
  }

  const { error } = await supabase.storage.from('items').remove(validPaths);
  if (error) {
    throw new Error(`Failed to clean up temporary uploads: ${error.message}`);
  }
}

export async function uploadAndAnalyzeImage({
  userId,
  processedImageUri,
  thumbnailUri,
}: UploadAndAnalyzeInput): Promise<UploadAndAnalyzeResult> {
  const uploadedArtifacts = await uploadProcessedImageArtifacts({
    userId,
    processedImageUri,
    thumbnailUri,
  });

  const { data, error } = await supabase.functions.invoke<AnalyzeImageResponse>('analyze-image', {
    body: {
      storage_path: `items/${uploadedArtifacts.imagePath}`,
    },
  });

  if (error) {
    throw new AnalyzeImageError(error.message || 'Failed to analyze image', [
      uploadedArtifacts.imagePath,
      uploadedArtifacts.thumbnailPath,
    ]);
  }

  if (!data) {
    throw new AnalyzeImageError('No analysis data returned from analyze-image.', [
      uploadedArtifacts.imagePath,
      uploadedArtifacts.thumbnailPath,
    ]);
  }

  return {
    analysis: data,
    imagePath: uploadedArtifacts.imagePath,
    thumbnailPath: uploadedArtifacts.thumbnailPath,
    imageUrl: uploadedArtifacts.imageUrl,
    thumbnailUrl: uploadedArtifacts.thumbnailUrl,
  };
}
