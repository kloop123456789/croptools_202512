import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropUtils';

interface CropSectionProps {
    imageSrc: string;
    aspectRatio: number;
    label: string;
    onCropComplete: (croppedAreaPixels: Area) => void;
    filters?: {
        brightness: number;
        saturation: number;
        contrast: number;
    };
}

export const CropSection: React.FC<CropSectionProps> = ({
    imageSrc,
    aspectRatio,
    label,
    onCropComplete,
    filters,
}) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [completedCrop, setCompletedCrop] = useState<Area | null>(null);

    const onCropChange = (crop: Point) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const handleCropComplete = useCallback(
        (_croppedArea: Area, croppedAreaPixels: Area) => {
            setCompletedCrop(croppedAreaPixels);
            onCropComplete(croppedAreaPixels);
        },
        [onCropComplete]
    );

    useEffect(() => {
        if (completedCrop && imageSrc) {
            const generatePreview = async () => {
                try {
                    const blob = await getCroppedImg(imageSrc, completedCrop);
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setPreviewUrl(url);
                    }
                } catch (e) {
                    console.error(e);
                }
            };
            // Debounce slightly to avoid rapid updates
            const timer = setTimeout(generatePreview, 100);
            return () => clearTimeout(timer);
        }
    }, [completedCrop, imageSrc]);

    return (
        <div className="flex flex-col gap-5 p-6 bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-white/5 shadow-xl hover:shadow-2xl hover:bg-slate-800/50 transition-all duration-300">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white tracking-tight">{label}</h3>
                <span className="text-xs font-bold px-3 py-1.5 bg-white/10 rounded-full text-blue-200 border border-white/5">
                    {aspectRatio === 1 ? '1:1' : aspectRatio === 16 / 9 ? '16:9' : '9:16'}
                </span>
            </div>

            <div className="relative w-full h-72 bg-slate-900/80 rounded-2xl overflow-hidden border border-white/5 shadow-inner group">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspectRatio}
                    onCropChange={onCropChange}
                    onZoomChange={onZoomChange}
                    onCropComplete={handleCropComplete}
                    objectFit="contain"
                    style={{
                        mediaStyle: filters ? { filter: `brightness(${filters.brightness}%) saturate(${filters.saturation}%) contrast(${filters.contrast}%)` } : undefined
                    }}
                />
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-2xl" />
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-medium">ズーム</span>
                    <span className="text-blue-400 font-bold">{Math.round(zoom * 100)}%</span>
                </div>
                <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-colors"
                />
            </div>

            {previewUrl && (
                <div className="mt-2 pt-4 border-t border-white/5">
                    <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">プレビュー</p>
                    <div className="w-full flex justify-center bg-slate-900/50 p-4 rounded-2xl border border-white/5 shadow-inner relative group/preview">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="max-h-96 object-contain rounded-lg shadow-lg"
                            style={filters ? { filter: `brightness(${filters.brightness}%) saturate(${filters.saturation}%) contrast(${filters.contrast}%)` } : undefined}
                        />
                        {completedCrop && (
                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-md rounded text-xs font-mono text-white/90 border border-white/10 opacity-0 group-hover/preview:opacity-100 transition-opacity">
                                {completedCrop.width} x {completedCrop.height} px
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
