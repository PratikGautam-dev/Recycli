import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  isLoading: boolean;
  result: string | null;
}

export function ImageUpload({ onImageSelect, selectedImage, isLoading, result }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    onImageSelect(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Upload Area */}
      {!selectedImage && (
        <Card 
          className={`relative overflow-hidden transition-all duration-300 border-2 border-dashed cursor-pointer shadow-upload hover:shadow-card
            ${dragActive ? 'border-primary bg-accent/50 scale-105' : 'border-border bg-gradient-upload hover:border-primary/50'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-ai rounded-full flex items-center justify-center mb-6 shadow-ai">
              <Upload className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Upload an object image</h3>
            <p className="text-muted-foreground mb-6">
              Drag and drop an image or click to browse
            </p>
            
            <Button variant="outline" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Choose Image
            </Button>
            
            <p className="text-sm text-muted-foreground mt-4">
              Supports PNG, JPG, WebP up to 10MB
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
        </Card>
      )}

      {/* Image Preview & Results */}
      {selectedImage && (
        <Card className="overflow-hidden bg-gradient-card shadow-card">
          <div className="p-6">
            {/* Preview Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-ai rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Image Preview</h3>
                <p className="text-sm text-muted-foreground">{selectedImage.name}</p>
              </div>
            </div>

            {/* Image Display */}
            {imagePreview && (
              <div className="relative mb-6">
                <img
                  src={imagePreview}
                  alt="Uploaded object"
                  className="w-full max-w-md mx-auto rounded-lg shadow-md object-contain max-h-96"
                />
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 bg-gradient-ai rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Analyzing object...</h4>
                <p className="text-muted-foreground">AI is identifying your object</p>
              </div>
            )}

            {/* Result Display */}
            {result && !isLoading && (
              <div className="text-center py-6 border-t border-border">
                <div className="mx-auto w-12 h-12 bg-gradient-ai rounded-full flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-3">Object Detected:</h4>
                <p className="text-3xl font-bold bg-gradient-ai bg-clip-text text-transparent">
                  {result}
                </p>
              </div>
            )}

            {/* New Upload Button */}
            <div className="text-center pt-4 border-t border-border">
              <Button 
                variant="outline" 
                onClick={() => {
                  setImagePreview(null);
                  onImageSelect(null as any);
                }}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Another Image
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}