import { useState } from 'react';
import { Scissors, Circle, Square } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { CropSection } from './components/CropSection';
import { getCroppedImgWithEffect } from './utils/cropUtils';
import { downloadZip } from './utils/downloadUtils';
import { saveAs } from 'file-saver';
import { clsx } from 'clsx';
import type { Area } from 'react-easy-crop';

function App() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [originalFileName, setOriginalFileName] = useState<string>('');
    const [customFileName, setCustomFileName] = useState<string>('');
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // New State for Features
    const [frameColor, setFrameColor] = useState<string | null>('#FFFFFF');
    const [isCircular, setIsCircular] = useState(true);

    // Store crop data for each aspect ratio
    const [cropData, setCropData] = useState<{
        square: Area | null;
        landscape: Area | null;
        portrait: Area | null;
    }>({
        square: null,
        landscape: null,
        portrait: null,
    });

    const handleImageSelected = (imageUrl: string, fileName: string) => {
        setImageSrc(imageUrl);
        setOriginalFileName(fileName);
        setCustomFileName(''); // Reset custom filename

        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
            setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = imageUrl;

        setCropData({
            square: null,
            landscape: null,
            portrait: null,
        });
    };

    const handleReset = () => {
        setImageSrc(null);
        setOriginalFileName('');
        setCustomFileName('');
        setImageDimensions(null);
        setFrameColor('#FFFFFF');
        setIsCircular(true);
    };

    const generateBlobs = async () => {
        if (!imageSrc) return [];
        const blobs: { blob: Blob; name: string }[] = [];

        // Determine base filename (remove extension from original if exists)
        const baseNameFull = customFileName.trim() || originalFileName;
        const baseName = baseNameFull.replace(/\.[^/.]+$/, ""); // simple extension removal

        try {
            // 1:1 Square
            if (cropData.square) {
                // Standard Square
                const squareBlob = await getCroppedImgWithEffect(imageSrc, cropData.square);
                if (squareBlob) blobs.push({ blob: squareBlob, name: `${baseName}_1x1.jpg` });

                // Framed Square (if color selected)
                if (frameColor) {
                    const framedBlob = await getCroppedImgWithEffect(imageSrc, cropData.square, { frameColor });
                    if (framedBlob) blobs.push({ blob: framedBlob, name: `${baseName}_1x1_framed.jpg` });
                }

                // Circular Output (if enabled)
                if (isCircular) {
                    // Circle with optional frame
                    const circleBlob = await getCroppedImgWithEffect(imageSrc, cropData.square, {
                        isCircular: true,
                        frameColor: frameColor || undefined
                    });
                    if (circleBlob) blobs.push({ blob: circleBlob, name: `${baseName}_1x1_circle.png` });
                }
            }

            // 16:9 Landscape
            if (cropData.landscape) {
                const landscapeBlob = await getCroppedImgWithEffect(imageSrc, cropData.landscape);
                if (landscapeBlob) blobs.push({ blob: landscapeBlob, name: `${baseName}_16x9.jpg` });
            }

            // 9:16 Portrait
            if (cropData.portrait) {
                const portraitBlob = await getCroppedImgWithEffect(imageSrc, cropData.portrait);
                if (portraitBlob) blobs.push({ blob: portraitBlob, name: `${baseName}_9x16.jpg` });
            }
        } catch (e) {
            console.error('Error generating blobs', e);
            throw e;
        }
        return blobs;
    };

    const handleDownloadZip = async () => {
        if (!imageSrc) return;
        setIsProcessing(true);
        try {
            const blobs = await generateBlobs();
            if (blobs.length > 0) {
                await downloadZip(blobs);
            }
        } catch (e) {
            alert('ZIPの生成に失敗しました。');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadSequential = async () => {
        if (!imageSrc) return;
        setIsProcessing(true);
        try {
            const blobs = await generateBlobs();
            if (blobs.length > 0) {
                // Download files individually
                blobs.forEach((item, index) => {
                    setTimeout(() => {
                        saveAs(item.blob, item.name);
                    }, index * 500); // Add a small delay to prevent browser blocking
                });
            }
        } catch (e) {
            alert('画像の生成に失敗しました。');
        } finally {
            setIsProcessing(false);
        }
    };

    const colors = [
        { name: 'Red', value: '#EF4444' },
        { name: 'Blue', value: '#3B82F6' },
        { name: 'Green', value: '#22C55E' },
        { name: 'Yellow', value: '#EAB308' },
        { name: 'Purple', value: '#A855F7' },
        { name: 'White', value: '#FFFFFF' },
        { name: 'Black', value: '#000000' },
    ];

    return (
        <div className="min-h-screen bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 text-white p-8">
            <div className="max-w-7xl mx-auto space-y-12">
                <header className="flex items-center justify-between pb-8 border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-slate-900/50 px-6 py-4 rounded-2xl shadow-2xl ring-1 ring-white/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20">
                            <Scissors size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                マルチクロップツール
                            </h1>
                            <p className="text-slate-400 font-medium">一度のクロップで、全てのサイズを書き出し</p>
                        </div>
                    </div>
                    {imageDimensions && (
                        <div className="hidden md:block px-4 py-2 bg-slate-800/50 rounded-lg border border-white/5">
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Original Size</p>
                            <p className="text-sm font-mono font-bold text-blue-300">
                                {imageDimensions.width} <span className="text-slate-500">x</span> {imageDimensions.height} px
                            </p>
                        </div>
                    )}
                </header>

                <main className="px-2">
                    {!imageSrc ? (
                        <div className="max-w-2xl mx-auto mt-20">
                            <ImageUploader onImageSelected={handleImageSelected} />
                        </div>
                    ) : (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">

                            {/* Feature Controls (Only for Square) */}
                            <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 space-y-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Square size={20} className="text-blue-400" />
                                    1:1 出力オプション
                                </h3>
                                <div className="flex flex-wrap gap-8">
                                    {/* Frame Color Selector */}
                                    <div className="space-y-3">
                                        <label className="text-sm text-slate-400 font-medium block">枠の色</label>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setFrameColor(null)}
                                                className={clsx(
                                                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                                                    frameColor === null ? "border-blue-500 bg-white/10" : "border-slate-600 bg-transparent hover:border-slate-500"
                                                )}
                                                title="なし"
                                            >
                                                <span className="text-xs text-slate-400">なし</span>
                                            </button>
                                            {colors.map(color => (
                                                <button
                                                    key={color.name}
                                                    onClick={() => setFrameColor(color.value)}
                                                    className={clsx(
                                                        "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                                                        frameColor === color.value ? "border-blue-500 scale-110 shadow-lg shadow-blue-500/20" : "border-transparent"
                                                    )}
                                                    style={{ backgroundColor: color.value }}
                                                    title={color.name}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Circular Toggle */}
                                    <div className="space-y-3">
                                        <label className="text-sm text-slate-400 font-medium block">追加フォーマット</label>
                                        <button
                                            onClick={() => setIsCircular(!isCircular)}
                                            className={clsx(
                                                "flex items-center gap-3 px-4 py-2 rounded-lg border transition-all duration-200",
                                                isCircular
                                                    ? "bg-blue-500/20 border-blue-500 text-blue-200"
                                                    : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                                            )}
                                        >
                                            <Circle size={18} />
                                            <span>円形クロップを含める</span>
                                            <div className={clsx("w-3 h-3 rounded-full ml-1", isCircular ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" : "bg-slate-600")} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <CropSection
                                    imageSrc={imageSrc}
                                    aspectRatio={1}
                                    label="正方形 (1:1)"
                                    onCropComplete={(area) => setCropData(prev => ({ ...prev, square: area }))}
                                />
                                <CropSection
                                    imageSrc={imageSrc}
                                    aspectRatio={16 / 9}
                                    label="横長 (16:9)"
                                    onCropComplete={(area) => setCropData(prev => ({ ...prev, landscape: area }))}
                                />
                                <CropSection
                                    imageSrc={imageSrc}
                                    aspectRatio={9 / 16}
                                    label="縦長 (9:16)"
                                    onCropComplete={(area) => setCropData(prev => ({ ...prev, portrait: area }))}
                                />
                            </div>



                            <div className="flex flex-col items-center gap-6 pb-20">
                                {/* Filename Input */}
                                <div className="w-full max-w-md space-y-2 text-center">
                                    <label className="block text-sm font-bold text-slate-300">
                                        ファイル名を入力（任意）
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={`未記入の場合は "${originalFileName.replace(/\.[^/.]+$/, "")}"`}
                                        value={customFileName}
                                        onChange={(e) => setCustomFileName(e.target.value)}
                                        className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border-2 border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 text-center"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap justify-center gap-4 w-full px-4">
                                    <button
                                        onClick={handleDownloadZip}
                                        disabled={isProcessing}
                                        className="flex-1 min-w-[200px] max-w-xs py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-bold text-lg shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        {isProcessing ? '処理中...' : 'ZIPでまとめてダウンロード'}
                                    </button>

                                    <button
                                        onClick={handleDownloadSequential}
                                        disabled={isProcessing}
                                        className="flex-1 min-w-[200px] max-w-xs py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-bold text-lg shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        {isProcessing ? '処理中...' : '3枚連続ダウンロード'}
                                    </button>

                                    <button
                                        onClick={handleReset}
                                        className="flex-1 min-w-[200px] max-w-xs py-4 bg-white text-blue-600 border-2 border-blue-400 hover:bg-blue-50 rounded-full font-bold text-lg shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        別の画像を選択
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div >
        </div >
    );
}

export default App;
