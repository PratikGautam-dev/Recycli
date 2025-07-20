import React, { useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const ObjectDetector: React.FC = () => {
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [results, setResults] = useState<cocoSsd.DetectedObject[]>([]);
  const [loading, setLoading] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageURL(URL.createObjectURL(e.target.files[0]));
      setResults([]);
    }
  };

  const handleDetect = async () => {
    setLoading(true);
    const model = await cocoSsd.load();
    if (imageRef.current) {
      const predictions = await model.detect(imageRef.current);
      setResults(predictions);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h2>Object Detection (coco-ssd)</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {imageURL && (
        <div>
          <img
            ref={imageRef}
            src={imageURL}
            alt="Upload Preview"
            style={{ maxWidth: '100%', marginTop: 16 }}
          />
          <button onClick={handleDetect} disabled={loading} style={{ marginTop: 16 }}>
            {loading ? 'Detecting...' : 'Detect Objects'}
          </button>
        </div>
      )}
      {results.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>Detected Objects:</h3>
          <ul>
            {results.map((obj, idx) => (
              <li key={idx}>
                {obj.class} ({Math.round(obj.score * 100)}%)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ObjectDetector;
