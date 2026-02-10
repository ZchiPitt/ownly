export { supabase } from './supabase';
export { queryClient } from './queryClient';
export { processImageForUpload, ImageProcessingError, type ProcessedImageArtifacts } from './imageProcessing';
export {
  uploadAndAnalyzeImage,
  cleanupTemporaryUploads,
  AnalyzeImageError,
  type UploadedImageArtifacts,
  type UploadAndAnalyzeResult,
} from './analyzeImage';
