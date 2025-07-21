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
  const [zeroShotResults, setZeroShotResults] = useState<{label: string, score: number}[] | null>(null);
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
      setZeroShotResults(null);
      setZeroShotError(null);
    }
  };

  const handleImageHfClassify = async () => {
    if (!imageFileRef.current) return;
    setLoadingImageHf(true);
    setImageHfResult(null);
    setImageHfError(null);
    setZeroShotResults(null);
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
    setZeroShotResults(null);
    setZeroShotError(null);
    try {
      const labels = ['recyclable', 'reusable', 'sellable'];
      const endpoint = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: imageHfResult.label,
          parameters: { candidate_labels: labels },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error('Hugging Face Zero-Shot API error: ' + (data.error || response.status));
      }
      if (data && data.labels && data.scores) {
        const results = data.labels
          .map((label: string, i: number) => ({ label, score: data.scores[i] }));
        setZeroShotResults(results);
        return;
      }
      throw new Error('Zero-shot classification failed: ' + JSON.stringify(data));
    } catch (err: any) {
      setZeroShotError(err.message || 'Unknown error');
    } finally {
      setLoadingZeroShot(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(60,60,120,0.12)', maxWidth: 420, width: '100%', padding: 32 }}>
        <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 28, marginBottom: 8, letterSpacing: -1, color: '#3b3b5c' }}>
          ♻️ EcoSort AI
        </h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 24, fontSize: 16 }}>
          Upload an image to detect and classify for recycling, reusing, or selling.
        </p>
        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'block', margin: '0 auto 20px auto', fontSize: 16 }} />
        {imageURL && (
          <div>
            <img
              ref={imageRef}
              src={imageURL}
              alt="Upload Preview"
              style={{ maxWidth: '100%', borderRadius: 12, margin: '0 auto', display: 'block', boxShadow: '0 2px 12px rgba(60,60,120,0.08)' }}
            />
            <div style={{ display: 'flex', gap: 16, marginTop: 24, justifyContent: 'center' }}>
              <button
                onClick={handleImageHfClassify}
                disabled={loadingImageHf}
                style={{
                  background: loadingImageHf ? '#e0e7ef' : 'linear-gradient(90deg, #4f8cff 0%, #38bdf8 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: loadingImageHf ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(60,60,120,0.08)',
                  transition: 'background 0.2s',
                }}
              >
                {loadingImageHf ? 'Detecting Image...' : 'Detect Image'}
              </button>
              <button
                onClick={handleZeroShotClassify}
                disabled={loadingZeroShot || !imageHfResult}
                style={{
                  background: loadingZeroShot || !imageHfResult ? '#e0e7ef' : 'linear-gradient(90deg, #22d3ee 0%, #38bdf8 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: loadingZeroShot || !imageHfResult ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(60,60,120,0.08)',
                  transition: 'background 0.2s',
                }}
              >
                {loadingZeroShot ? 'Classifying...' : 'Classify as Recyclable/Reusable/Sellable'}
              </button>
            </div>
          </div>
        )}
        {imageHfResult && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <h3 style={{ color: '#3b3b5c', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Detected Label</h3>
            <div style={{ fontWeight: 700, fontSize: 22, color: '#2563eb', background: '#f1f5f9', borderRadius: 8, display: 'inline-block', padding: '8px 18px' }}>
              {imageHfResult.label} <span style={{ color: '#64748b', fontWeight: 500 }}>({Math.round(imageHfResult.score * 100)}%)</span>
            </div>
          </div>
        )}
        {imageHfError && (
          <div style={{ color: '#ef4444', marginTop: 16, textAlign: 'center', fontWeight: 600 }}>{imageHfError}</div>
        )}
        {zeroShotResults && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <h3 style={{ color: '#3b3b5c', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Classification</h3>
            {["recyclable", "reusable", "sellable"].map((label, idx) => {
              const item = zeroShotResults.find(z => z.label === label);
              const score = item ? Math.round(item.score * 100) : 0;
              const isTop = item && item.score === Math.max(...zeroShotResults.map(z => z.score));
              return (
                <div
                  key={label}
                  style={{
                    fontWeight: 700,
                    fontSize: 22,
                    color: isTop ? '#059669' : '#64748b',
                    background: isTop ? '#f0fdf4' : '#f1f5f9',
                    borderRadius: 8,
                    display: 'inline-block',
                    padding: '8px 18px',
                    margin: 4
                  }}
                >
                  {label} ({score}%)
                </div>
              );
            })}
          </div>
        )}
        {zeroShotError && (
          <div style={{ color: '#ef4444', marginTop: 16, textAlign: 'center', fontWeight: 600 }}>{zeroShotError}</div>
        )}
      </div>
    </div>
  );
};

export default CombinedDetectClassify;
