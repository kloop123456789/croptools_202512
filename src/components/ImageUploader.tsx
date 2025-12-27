import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { clsx } from 'clsx';

interface ImageUploaderProps {
    onImageSelected: (imageUrl: string, fileName: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            onImageSelected(imageUrl, file.name);
        }
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(false);
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            const imageUrl = URL.createObjectURL(file);
            onImageSelected(imageUrl, file.name);
        }
    };

    return (
        <div
            className={clsx(
                'relative group flex flex-col items-center justify-center w-full h-96 border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden',
                isDragging
                    ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
                    : 'border-slate-600 hover:border-blue-400/50 bg-slate-800/30 hover:bg-slate-800/50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
            />

            <div className="relative z-10 flex flex-col items-center gap-6 text-slate-400 group-hover:text-slate-200 transition-colors">
                <div className="p-6 bg-slate-800/50 rounded-full ring-1 ring-white/10 shadow-xl group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:ring-blue-400/30 transition-all duration-300">
                    <Upload size={48} className="group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        ここに画像をドロップ
                    </p>
                    <p className="text-base font-medium text-slate-500 group-hover:text-slate-400">
                        またはクリックしてファイルを選択
                    </p>
                    <div className="pt-4 flex gap-3 justify-center">
                        <span className="px-3 py-1 text-xs font-semibold bg-white/5 rounded-full border border-white/5">JPG</span>
                        <span className="px-3 py-1 text-xs font-semibold bg-white/5 rounded-full border border-white/5">PNG</span>
                        <span className="px-3 py-1 text-xs font-semibold bg-white/5 rounded-full border border-white/5">WebP</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
