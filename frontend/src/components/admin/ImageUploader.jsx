import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { Upload, X, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const ImageUploader = ({ 
  onUpload,  // New prop name for single upload callback
  onImagesUploaded,  // Legacy prop name for compatibility
  images = [],  // Current images (new prop name)
  existingImages,  // Legacy prop name
  maxImages = 10,
  label = "Upload Images"
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  
  // Use either prop name for images
  const currentImages = images.length > 0 ? images : (existingImages || []);
  
  // Use either callback
  const handleImagesChange = useCallback((newImages) => {
    if (onUpload) {
      onUpload(newImages);
    }
    if (onImagesUploaded) {
      onImagesUploaded(newImages);
    }
  }, [onUpload, onImagesUploaded]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = [...e.dataTransfer.files].filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      await uploadFiles(files);
    }
  }, [currentImages, maxImages]);

  const handleFileInput = async (e) => {
    const files = [...e.target.files];
    if (files.length > 0) {
      await uploadFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFiles = async (files) => {
    // Check max images limit
    const remainingSlots = maxImages - currentImages.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }
    
    const filesToUpload = files.slice(0, remainingSlots);
    setUploading(true);
    const newImageUrls = [];

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
          `${BACKEND_URL}/api/upload/image`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
          }
        );

        if (response.data.secure_url) {
          newImageUrls.push(response.data.secure_url);
        }
      }

      const updatedImages = [...currentImages, ...newImageUrls];
      handleImagesChange(updatedImages);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const updatedImages = currentImages.filter((_, i) => i !== index);
    handleImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : uploading 
              ? 'border-slate-300 bg-slate-50' 
              : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxImages > 1}
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-blue-600">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-medium">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-600">{label}</p>
            <p className="text-xs text-slate-400">
              Drag & drop or click to browse
            </p>
            {maxImages > 1 && (
              <p className="text-xs text-slate-400">
                {currentImages.length}/{maxImages} images
              </p>
            )}
          </div>
        )}
      </div>

      {/* Image Previews */}
      {currentImages.length > 0 && (
        <div className={`grid gap-3 ${maxImages === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}`}>
          {currentImages.map((image, index) => (
            <div key={`${image}-${index}`} className="relative group aspect-square">
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-slate-200"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
