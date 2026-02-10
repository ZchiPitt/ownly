import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../../contexts';
import { Screen } from '../../../components';
import {
  ImageProcessingError,
  processImageForUpload,
  uploadAndAnalyzeImage,
  type UploadAndAnalyzeResult,
} from '../../../lib';

export default function AddPreviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    imageUri?: string;
    source?: string;
    imageWidth?: string;
    imageHeight?: string;
    imageFileName?: string;
    imageMimeType?: string;
  }>();

  const imageUri = typeof params.imageUri === 'string' ? params.imageUri : null;
  const sourceLabel = params.source === 'camera' ? 'Camera' : params.source === 'library' ? 'Photo Library' : null;
  const imageWidth = typeof params.imageWidth === 'string' ? Number(params.imageWidth) : NaN;
  const imageHeight = typeof params.imageHeight === 'string' ? Number(params.imageHeight) : NaN;
  const imageFileName = typeof params.imageFileName === 'string' ? params.imageFileName : undefined;
  const imageMimeType = typeof params.imageMimeType === 'string' ? params.imageMimeType : undefined;

  const [artifacts, setArtifacts] = useState<Awaited<ReturnType<typeof processImageForUpload>> | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [analysisResult, setAnalysisResult] = useState<UploadAndAnalyzeResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<'idle' | 'uploading' | 'analyzing' | 'timeout'>('idle');

  const hasValidDimensions = useMemo(
    () => Number.isFinite(imageWidth) && imageWidth > 0 && Number.isFinite(imageHeight) && imageHeight > 0,
    [imageHeight, imageWidth],
  );

  useEffect(() => {
    if (!imageUri) {
      return;
    }

    const sourceUri = imageUri;
    let isCancelled = false;

    async function runProcessing() {
      setIsProcessing(true);
      setProcessingError(null);
      setArtifacts(null);
      setAnalysisResult(null);
      setAnalysisError(null);
      setAnalysisPhase('idle');

      try {
        const processed = await processImageForUpload({
          uri: sourceUri,
          width: hasValidDimensions ? imageWidth : undefined,
          height: hasValidDimensions ? imageHeight : undefined,
          fileName: imageFileName,
          mimeType: imageMimeType,
        });

        if (!isCancelled) {
          setArtifacts(processed);
        }
      } catch (error) {
        if (!isCancelled) {
          const message =
            error instanceof ImageProcessingError
              ? error.message
              : 'Unable to process this image right now. Please try another photo.';
          setProcessingError(message);
          Alert.alert('Image processing failed', message);
        }
      } finally {
        if (!isCancelled) {
          setIsProcessing(false);
        }
      }
    }

    runProcessing();

    return () => {
      isCancelled = true;
    };
  }, [hasValidDimensions, imageFileName, imageHeight, imageMimeType, imageUri, imageWidth]);

  const handleAnalyze = async () => {
    if (!artifacts || !user || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setAnalysisPhase('uploading');

    const timeoutId = setTimeout(() => {
      setAnalysisPhase((currentPhase) => (currentPhase === 'analyzing' ? 'timeout' : currentPhase));
    }, 15000);

    try {
      const result = await uploadAndAnalyzeImage({
        userId: user.id,
        processedImageUri: artifacts.processed.uri,
        thumbnailUri: artifacts.thumbnail.uri,
      });

      setAnalysisPhase('analyzing');
      setAnalysisResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image analysis failed. Please try again.';
      setAnalysisError(message);
      Alert.alert('Analysis failed', message);
    } finally {
      clearTimeout(timeoutId);
      setIsAnalyzing(false);
      setAnalysisPhase((currentPhase) => (currentPhase === 'timeout' ? 'timeout' : 'idle'));
    }
  };

  return (
    <Screen style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Photo Preview',
          headerLargeTitle: false,
        }}
      />
      <View style={styles.card}>
        <Text style={styles.title}>Preview</Text>
        {imageUri ? (
          <>
            <Image source={{ uri: artifacts?.processed.uri ?? imageUri }} resizeMode="cover" style={styles.previewImage} />
            {sourceLabel ? <Text style={styles.metaText}>Source: {sourceLabel}</Text> : null}
            {isProcessing ? <Text style={styles.body}>Optimizing image for upload...</Text> : null}
            {processingError ? <Text style={styles.errorText}>{processingError}</Text> : null}
            {!isProcessing && artifacts ? (
              <>
                <Text style={styles.body}>
                  Optimized image ready. Upload: {artifacts.processed.width}x{artifacts.processed.height}
                  {artifacts.processed.sizeBytes ? ` (${Math.round(artifacts.processed.sizeBytes / 1024)} KB)` : ''}.
                </Text>
                <Text style={styles.body}>
                  Thumbnail generated: {artifacts.thumbnail.width}x{artifacts.thumbnail.height}
                  {artifacts.thumbnail.sizeBytes ? ` (${Math.round(artifacts.thumbnail.sizeBytes / 1024)} KB)` : ''}.
                </Text>
                <Image source={{ uri: artifacts.thumbnail.uri }} resizeMode="cover" style={styles.thumbnailImage} />
              </>
            ) : null}
          </>
        ) : (
          <Text style={styles.body}>No image selected yet. Return to Add and choose camera or photo library.</Text>
        )}

        {artifacts && !processingError ? (
          <Pressable
            style={({ pressed }) => [
              styles.primaryActionButton,
              pressed && styles.primaryActionButtonPressed,
              (isAnalyzing || isProcessing) && styles.buttonDisabled,
            ]}
            disabled={isAnalyzing || isProcessing}
            onPress={handleAnalyze}
          >
            <Text style={styles.primaryActionButtonText}>{isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}</Text>
          </Pressable>
        ) : null}

        {analysisPhase === 'uploading' && isAnalyzing ? (
          <Text style={styles.statusText}>Uploading optimized photo to your storage...</Text>
        ) : null}
        {(analysisPhase === 'analyzing' || analysisPhase === 'timeout') && isAnalyzing ? (
          <Text style={styles.statusText}>
            {analysisPhase === 'timeout'
              ? 'Still analyzing. This is taking longer than expected.'
              : 'Analyzing image and detecting items...'}
          </Text>
        ) : null}
        {analysisError ? <Text style={styles.errorText}>{analysisError}</Text> : null}

        {analysisResult ? (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Detected items ({analysisResult.analysis.detected_items.length})</Text>
            {analysisResult.analysis.detected_items.length === 0 ? (
              <Text style={styles.body}>No items detected. You can continue with manual entry.</Text>
            ) : (
              analysisResult.analysis.detected_items.map((detectedItem, index) => (
                <View key={`${detectedItem.name}-${index}`} style={styles.resultCard}>
                  <Text style={styles.resultName}>{detectedItem.name}</Text>
                  <Text style={styles.resultMeta}>
                    Confidence: {Math.round((detectedItem.confidence || 0) * 100)}%
                  </Text>
                  {detectedItem.category_suggestion ? (
                    <Text style={styles.resultMeta}>Category: {detectedItem.category_suggestion}</Text>
                  ) : null}
                  {detectedItem.brand ? <Text style={styles.resultMeta}>Brand: {detectedItem.brand}</Text> : null}
                </View>
              ))
            )}
          </View>
        ) : null}

        {artifacts && !processingError ? (
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/add/manual',
                params: {
                  imageUri: artifacts.processed.uri,
                  thumbnailUri: artifacts.thumbnail.uri,
                },
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Continue to Manual Entry</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.replace('/(tabs)/add')}
        >
          <Text style={styles.buttonText}>{imageUri ? 'Choose Another Photo' : 'Back to Add'}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#6e6e73',
    lineHeight: 20,
  },
  previewImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f2f2f7',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6e6e73',
    marginBottom: 8,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#8e3b2d',
    lineHeight: 18,
  },
  statusText: {
    marginTop: 10,
    fontSize: 13,
    color: '#3a3a3c',
    lineHeight: 18,
  },
  thumbnailImage: {
    marginTop: 10,
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#f2f2f7',
  },
  primaryActionButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#34c759',
  },
  primaryActionButtonPressed: {
    backgroundColor: '#30b357',
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  resultsSection: {
    marginTop: 14,
    gap: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  resultCard: {
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#f9f9fb',
  },
  resultName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  resultMeta: {
    fontSize: 13,
    color: '#5a5a5f',
  },
  secondaryButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0a84ff',
    backgroundColor: '#ffffff',
  },
  secondaryButtonPressed: {
    backgroundColor: '#f2f2f7',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a84ff',
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#0a84ff',
  },
  buttonPressed: {
    backgroundColor: '#007aff',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
