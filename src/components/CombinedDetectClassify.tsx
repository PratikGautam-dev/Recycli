import React, { useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const CATEGORY_LABELS = [
  'Recyclable',
  'Non-Recyclable',
  'E-Waste',
  'Compostable',
  'Hazardous',
  'Sellable',
  'Donate-worthy'
];

// Hugging Face API key (single declaration)
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;
const HF_IMAGE_MODEL = 'microsoft/resnet-50'; // You can change to another model if needed

async function classifyImageWithHuggingFace(imageFile: File): Promise<{label: string, score: number} | null> {
  const endpoint = `https://api-inference.huggingface.co/models/${HF_IMAGE_MODEL}`;
  const mimeType = imageFile.type || "image/jpeg";
  const arrayBuffer = await imageFile.arrayBuffer();
  console.log('Hugging Face Image API endpoint:', endpoint);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': mimeType,
      },
      body: arrayBuffer,
    });
    console.log('Hugging Face Image API status:', response.status);
    const data = await response.json();
    console.log('Hugging Face Image API response:', data);
    if (!response.ok) {
      throw new Error('Hugging Face Image API error: ' + (data.error || response.status));
    }
    if (Array.isArray(data) && data.length > 0) {
      // Return the top prediction
      return { label: data[0].label, score: data[0].score };
    }
    return null;
  } catch (err: any) {
    console.error('Hugging Face Image API call failed:', err);
    throw err;
  }
}

async function classifyWithHuggingFaceZeroShot(objectClass: string): Promise<string> {
  const labels = ['recyclable', 'reusable', 'sellable'];
  const endpoint = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';
  console.log('Hugging Face Zero-Shot API endpoint:', endpoint);
  console.log('Hugging Face Zero-Shot API input:', objectClass, labels);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: objectClass,
        parameters: { candidate_labels: labels },
      }),
    });
    console.log('Hugging Face Zero-Shot API status:', response.status);
    const data = await response.json();
    console.log('Hugging Face Zero-Shot API response:', data);
    if (!response.ok) {
      throw new Error('Hugging Face Zero-Shot API error: ' + (data.error || response.status));
    }
    if (data && data.labels && data.scores) {
      return data.labels[0]; // Best label
    }
    throw new Error('Zero-shot classification failed: ' + JSON.stringify(data));
  } catch (err: any) {
    console.error('Hugging Face Zero-Shot API call failed:', err);
    throw err;
  }
}

const CombinedDetectClassify: React.FC = () => {
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [imageHfResult, setImageHfResult] = useState<{label: string, score: number} | null>(null);
  const [loadingImageHf, setLoadingImageHf] = useState(false);
  const [imageHfError, setImageHfError] = useState<string | null>(null);
  const [zeroShotResult, setZeroShotResult] = useState<string | null>(null);
  const [loadingZeroShot, setLoadingZeroShot] = useState(false);
  const [zeroShotError, setZeroShotError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageFileRef = useRef<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageURL(URL.createObjectURL(e.target.files[0]));
      imageFileRef.current = e.target.files[0];
      setImageHfResult(null);
      setImageHfError(null);
      setZeroShotResult(null);
      setZeroShotError(null);
    }
  };

  const handleImageHfClassify = async () => {
    if (!imageFileRef.current) return;
    setLoadingImageHf(true);
    setImageHfResult(null);
    setImageHfError(null);
    setZeroShotResult(null);
    setZeroShotError(null);
    try {
      const result = await classifyImageWithHuggingFace(imageFileRef.current);
      setImageHfResult(result);
    } catch (err: any) {
      setImageHfError(err.message || 'Unknown error');
    } finally {
      setLoadingImageHf(false);
    }
  };

  const handleZeroShotClassify = async () => {
    if (!imageHfResult) return;
    setLoadingZeroShot(true);
    setZeroShotResult(null);
    setZeroShotError(null);
    try {
      const result = await classifyWithHuggingFaceZeroShot(imageHfResult.label);
      setZeroShotResult(result);
    } catch (err: any) {
      setZeroShotError(err.message || 'Unknown error');
    } finally {
      setLoadingZeroShot(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h2>Detect and Classify Image</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {imageURL && (
        <div>
          <img
            ref={imageRef}
            src={imageURL}
            alt="Upload Preview"
            style={{ maxWidth: '100%', marginTop: 16 }}
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={handleImageHfClassify} disabled={loadingImageHf}>
              {loadingImageHf ? 'Detecting Image...' : 'Detect Image'}
            </button>
            <button onClick={handleZeroShotClassify} disabled={loadingZeroShot || !imageHfResult}>
              {loadingZeroShot ? 'Classifying...' : 'Classify as Recyclable/Reusable/Sellable'}
            </button>
          </div>
        </div>
      )}
      {imageHfResult && (
        <div style={{ marginTop: 24 }}>
          <h3>Detected Label:</h3>
          <div style={{ fontWeight: 'bold', fontSize: 20 }}>{imageHfResult.label} ({Math.round(imageHfResult.score * 100)}%)</div>
        </div>
      )}
      {imageHfError && (
        <div style={{ color: 'red', marginTop: 16 }}>{imageHfError}</div>
      )}
      {zeroShotResult && (
        <div style={{ marginTop: 24 }}>
          <h3>Classification:</h3>
          <div style={{ fontWeight: 'bold', fontSize: 20 }}>{zeroShotResult}</div>
        </div>
      )}
      {zeroShotError && (
        <div style={{ color: 'red', marginTop: 16 }}>{zeroShotError}</div>
      )}
    </div>
  );
};

export default CombinedDetectClassify;
