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

export async function uploadAndAnalyzeImage({
  userId,
  processedImageUri,
  thumbnailUri,
}: UploadAndAnalyzeInput): Promise<UploadAndAnalyzeResult> {
  const base = buildBaseFilename();
  const imagePath = `${userId}/${base}.jpg`;
  const thumbnailPath = `${userId}/${base}_thumb.jpg`;

  const [uploadedImagePath, uploadedThumbnailPath] = await Promise.all([
    uploadUriToStorage(imagePath, processedImageUri),
    uploadUriToStorage(thumbnailPath, thumbnailUri),
  ]);

  const { data, error } = await supabase.functions.invoke<AnalyzeImageResponse>('analyze-image', {
    body: {
      storage_path: `items/${uploadedImagePath}`,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to analyze image');
  }

  if (!data) {
    throw new Error('No analysis data returned from analyze-image.');
  }

  return {
    analysis: data,
    imagePath: uploadedImagePath,
    thumbnailPath: uploadedThumbnailPath,
    imageUrl: toPublicUrl(uploadedImagePath),
    thumbnailUrl: toPublicUrl(uploadedThumbnailPath),
  };
}
