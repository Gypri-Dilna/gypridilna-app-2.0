import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, ArrowLeft, PackageCheck } from 'lucide-react';
import { inventoryService } from '../services/api';
import { InventoryItem } from '../types';

export const QrScanner: React.FC = () => {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      const html5Qrcode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          setScannedResult(decodedText);
          stopScanner();
          // Extract item code
          const codeClean = decodedText.replace('GD:INV:', '').trim();
          try {
            const item = await inventoryService.getItem(codeClean);
            setFoundItem(item);
          } catch (err) {
            setErrorMsg(`Scanned code '${decodedText}', but no matching inventory item was found.`);
          }
        },
        () => {}
      );
    } catch (err) {
      setErrorMsg('Unable to access browser camera. Check camera permissions.');
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
  };

  const resetScanner = () => {
    setScannedResult(null);
    setFoundItem(null);
    setErrorMsg(null);
    startScanner();
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-full">
      <div>
        <h2 className="text-2xl font-black text-brand-paper tracking-wider">
          BROWSER CAMERA QR SCANNER
        </h2>
        <p className="text-xs text-brand-paperMuted mt-1">
          HTML5 browser API camera scanner for instant item lookup
        </p>
      </div>

      {foundItem ? (
        <div className="bg-brand-surface border border-brand-mint rounded-2xl p-6 shadow-xl space-y-6 max-w-xl mx-auto">
          <div className="flex items-center space-x-3 text-brand-granted">
            <PackageCheck className="w-8 h-8" />
            <div>
              <h3 className="text-lg font-black text-brand-paper">{foundItem.name}</h3>
              <p className="text-xs font-mono font-bold text-brand-mint">LOC: {foundItem.item_code}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-brand-dark p-4 rounded-xl text-xs">
            <div>
              <span className="text-brand-paperMuted">Rack Storage (X):</span>
              <p className="font-bold text-brand-paper">Rack #{foundItem.rack}</p>
            </div>
            <div>
              <span className="text-brand-paperMuted">Position / Shelf (Y):</span>
              <p className="font-bold text-brand-paper">Position #{foundItem.pozice}</p>
            </div>
            <div>
              <span className="text-brand-paperMuted">Box (Z):</span>
              <p className="font-bold text-brand-paper">{foundItem.box > 0 ? `Box #${foundItem.box}` : 'No Box'}</p>
            </div>
            <div>
              <span className="text-brand-paperMuted">Barcode Payload:</span>
              <p className="font-mono text-brand-mintLight">{foundItem.barcode}</p>
            </div>
          </div>

          <button
            onClick={resetScanner}
            className="w-full py-3 bg-brand-mint text-brand-dark font-bold rounded-xl text-sm hover:bg-brand-mintLight transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Scan Another Item</span>
          </button>
        </div>
      ) : (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl max-w-lg mx-auto space-y-4 text-center">
          <div id="qr-reader" className="overflow-hidden rounded-xl bg-brand-dark" />

          {errorMsg && (
            <p className="text-xs font-bold text-brand-denied bg-brand-denied/15 border border-brand-denied p-3 rounded-xl">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-center space-x-2 text-xs text-brand-paperMuted">
            <QrCode className="w-4 h-4 text-brand-mint" />
            <span>Align printed 18mm Brother QR label inside camera frame</span>
          </div>
        </div>
      )}
    </div>
  );
};
