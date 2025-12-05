import React, { useCallback, useState } from 'react';

interface ImageUploaderProps {
    onImagesChange: (images: string[]) => void;
    currentImages?: string[];
    maxImages?: number;
    label?: string;
    hint?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
    onImagesChange,
    currentImages = [],
    maxImages = 10,
    label = 'Reference Images',
    hint = 'Drag & drop or click to upload',
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFiles = useCallback(
        async (files: FileList) => {
            const newImages: string[] = [];

            for (let i = 0; i < files.length; i++) {
                if (currentImages.length + newImages.length >= maxImages) break;

                const file = files[i];
                if (!file.type.startsWith('image/')) continue;

                const reader = new FileReader();
                await new Promise<void>((resolve) => {
                    reader.onload = (e) => {
                        newImages.push(e.target?.result as string);
                        resolve();
                    };
                    reader.readAsDataURL(file);
                });
            }

            onImagesChange([...currentImages, ...newImages]);
        },
        [currentImages, maxImages, onImagesChange]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) {
                handleFiles(e.dataTransfer.files);
            }
        },
        [handleFiles]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
                handleFiles(e.target.files);
            }
        },
        [handleFiles]
    );

    const removeImage = useCallback(
        (index: number) => {
            const updated = currentImages.filter((_, i) => i !== index);
            onImagesChange(updated);
        },
        [currentImages, onImagesChange]
    );

    return (
        <div className="space-y-2">
            <label className="text-sm text-zinc-200 font-medium">{label}</label>

            {/* Upload Zone */}
            <div
                className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
                        ? 'border-cyan-400 bg-cyan-400/10'
                        : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
                    }
        `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input')?.click()}
            >
                <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                />
                <div className="text-zinc-400 text-sm">
                    {hint}
                    <br />
                    <span className="text-xs text-zinc-500">
                        {currentImages.length}/{maxImages} images
                    </span>
                </div>
            </div>

            {/* Image Preview Grid */}
            {currentImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {currentImages.map((img, idx) => (
                        <div
                            key={idx}
                            className="relative aspect-square rounded-lg overflow-hidden glass-panel group"
                        >
                            <img
                                src={img}
                                alt={`Reference ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(idx);
                                }}
                                className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 
                         text-white rounded-full w-6 h-6 flex items-center justify-center
                         opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
