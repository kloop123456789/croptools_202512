import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function downloadZip(blobs: { blob: Blob; name: string }[]) {
    const zip = new JSZip();

    blobs.forEach((item) => {
        zip.file(item.name, item.blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'cropped-images.zip');
}
