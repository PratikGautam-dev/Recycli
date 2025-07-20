import React, { useRef, useState } from 'react';

const CATEGORY_LABELS = [
  'Recyclable',
  'Non-Recyclable',
  'E-Waste',
  'Compostable',
  'Hazardous',
  'Sellable',
  'Donate-worthy'
];

const CLIPClassifier: React.FC = () => {
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageFileRef = useRef<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageURL(URL.createObjectURL(e.target.files[0]));
      imageFileRef.current = e.target.files[0];
      setResult(null);
      setError(null);
    }
  };

  const handleClassify = async () => {
    if (!imageFileRef.current) return;
    setLoading(true);
    setResult(null);
    setError(null);
    const formData = new FormData();
    formData.append('image', imageFileRef.current);
    formData.append('labels', JSON.stringify(CATEGORY_LABELS));
    try {
      const response = await fetch('http://localhost:3000/api/classify', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Classification failed');
      const data = await response.json();
      // Parse Replicate response for best label
      const bestLabel = data?.output?.[0] || 'Unknown';
      setResult(bestLabel);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h2>Zero-Shot Classification (CLIP via Replicate)</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {imageURL && (
        <div>
          <img
            src={imageURL}
            alt="Upload Preview"
            style={{ maxWidth: '100%', marginTop: 16 }}
          />
          <button onClick={handleClassify} disabled={loading} style={{ marginTop: 16 }}>
            {loading ? 'Classifying...' : 'Classify Object'}
          </button>
        </div>
      )}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>Classification Result:</h3>
          <div style={{ fontWeight: 'bold', fontSize: 24 }}>{result}</div>
        </div>
      )}
      {error && (
        <div style={{ color: 'red', marginTop: 16 }}>{error}</div>
      )}
    </div>
  );
};

export default CLIPClassifier;
