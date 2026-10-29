import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { useToast } from '../hooks/useToast';
export interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortUrl: string;
  alias: string;
}
const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, shortUrl, alias }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toast = useToast();
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${alias || 'shortcode'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('QR Code downloaded successfully.', 'success');
  };
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shortUrl);
    toast('Short URL copied to clipboard.', 'success');
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Code Generator" size="sm">
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="p-4 bg-white rounded-2xl shadow-xl border border-zinc-200">
          <QRCodeCanvas
            ref={canvasRef}
            value={shortUrl}
            size={200}
            bgColor="#ffffff"
            fgColor="#030712"
            level="H"
            includeMargin={true}
          />
        </div>
        <div className="w-full text-center">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Shortened Address</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-1 select-all break-all">{shortUrl}</p>
        </div>
        <div className="flex gap-3 w-full">
          <Button variant="secondary" onClick={handleCopyLink} className="flex-1 gap-2 text-xs cursor-pointer">
            <Copy className="w-4 h-4" /> Copy Link
          </Button>
          <Button variant="primary" onClick={handleDownload} className="flex-1 gap-2 text-xs cursor-pointer">
            <Download className="w-4 h-4" /> Download PNG
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default QrCodeModal;
