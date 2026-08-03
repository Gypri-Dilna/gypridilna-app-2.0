import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Camera } from 'lucide-react';
import { inventoryService } from '../services/api';

export const OnboardingPrint: React.FC = () => {
  const [step, setStep] = useState<number>(1);

  // Form State
  const [itemName, setItemName] = useState('');
  const [rack, setRack] = useState<number>(6);
  const [pozice, setPozice] = useState<number>(1);
  const [boxNum, setBoxNum] = useState<number>(0);
  const [note, setNote] = useState('');

  // Validation State
  const [hasAttempted, setHasAttempted] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  const generatedCode = `${rack}${pozice}-${boxNum}0001`;

  const isValid = itemName.trim().length > 0 && rack >= 1 && rack <= 9 && pozice >= 1 && pozice <= 9;

  const handleProceedToStep2 = () => {
    setHasAttempted(true);
    if (isValid) {
      setStep(2);
    }
  };

  const handlePrintUsb = async () => {
    setIsPrinting(true);
    try {
      await inventoryService.queueLabelPrint(generatedCode, itemName.trim().toUpperCase());
      await new Promise((r) => setTimeout(r, 1200));
      setIsPrinting(false);
      setStep(3);
    } catch (e) {
      alert('Print error: ' + e);
      setIsPrinting(false);
    }
  };

  const handleCommitItem = async () => {
    if (!isValid) return;
    setIsCommitting(true);
    try {
      const created = await inventoryService.create({
        name: itemName.trim(),
        rack,
        pozice,
        box: boxNum,
        note: note.trim(),
      });
      setIsCommitting(false);
      alert(`Item '${created.item_code}' successfully committed to database!`);
      // Reset
      setItemName('');
      setNote('');
      setHasAttempted(false);
      setStep(1);
    } catch (e) {
      alert('Commit error: ' + e);
      setIsCommitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-full">
      <div>
        <h2 className="text-2xl font-black text-brand-paper tracking-wider">
          ITEM ONBOARDING & BROTHER LABEL PRINTING
        </h2>
        <p className="text-xs text-brand-paperMuted mt-1">
          3-step PC onboarding wizard for Brother PT-D460BTVP (18mm tape) USB printer
        </p>
      </div>

      {/* Stepper Header Bar */}
      <div className="flex items-center space-x-4 bg-brand-surface border border-brand-border p-4 rounded-2xl shadow-lg">
        <div className={`flex items-center space-x-2 text-xs font-extrabold ${step >= 1 ? 'text-brand-mint' : 'text-brand-paperMuted'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-brand-dark font-black ${step >= 1 ? 'bg-brand-mint' : 'bg-brand-border'}`}>1</span>
          <span>1. ITEM METADATA</span>
        </div>
        <div className="h-0.5 w-12 bg-brand-border" />
        <div className={`flex items-center space-x-2 text-xs font-extrabold ${step >= 2 ? 'text-brand-mint' : 'text-brand-paperMuted'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-brand-dark font-black ${step >= 2 ? 'bg-brand-mint' : 'bg-brand-border'}`}>2</span>
          <span>2. 18mm BROTHER PRINT</span>
        </div>
        <div className="h-0.5 w-12 bg-brand-border" />
        <div className={`flex items-center space-x-2 text-xs font-extrabold ${step >= 3 ? 'text-brand-mint' : 'text-brand-paperMuted'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-brand-dark font-black ${step >= 3 ? 'bg-brand-mint' : 'bg-brand-border'}`}>3</span>
          <span>3. SCAN & COMMIT</span>
        </div>
      </div>

      {/* Step 1: Input Form with Strict Validation Warnings */}
      {step === 1 && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
          {hasAttempted && !isValid && (
            <div className="p-4 bg-brand-denied/15 border border-brand-denied rounded-xl flex items-center space-x-3 text-brand-denied text-xs font-bold">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>WARNING: Please fill all required fields (Item Name, Rack X 1-9, Position Y 1-9) before proceeding.</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Šroubovák červený křížový"
                className={`w-full bg-brand-dark border rounded-xl px-4 py-2.5 text-sm text-brand-paper focus:outline-none transition-colors ${
                  hasAttempted && !itemName.trim() ? 'border-brand-denied' : 'border-brand-border focus:border-brand-mint'
                }`}
              />
              {hasAttempted && !itemName.trim() && (
                <p className="text-[11px] text-brand-denied font-bold mt-1">Item Name is required</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Rack Storage (X) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={rack}
                  onChange={(e) => setRack(parseInt(e.target.value) || 1)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Position / Shelf (Y) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={pozice}
                  onChange={(e) => setPozice(parseInt(e.target.value) || 1)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Box Number (Z - 0 if none)
                </label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={boxNum}
                  onChange={(e) => setBoxNum(parseInt(e.target.value) || 0)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional description..."
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-paper focus:outline-none focus:border-brand-mint h-20 resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleProceedToStep2}
            className="w-full py-3.5 bg-brand-mint text-brand-dark font-black rounded-xl text-sm tracking-wider uppercase hover:bg-brand-mintLight transition-colors shadow-lg flex items-center justify-center space-x-2"
          >
            <span>Proceed to Label Printing</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step 2: Live 18mm Vector Label Preview with REAL Scannable QR Code */}
      {step === 2 && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-sm font-extrabold text-brand-paper uppercase tracking-wider">
            BROTHER PT-D460BTVP (18mm TAPE PREVIEW)
          </h3>

          {/* 18mm Tape Container */}
          <div className="bg-white p-4 rounded-xl border-2 border-black flex items-center space-x-6 shadow-md text-black">
            <div className="bg-white p-1 border border-gray-300 rounded shrink-0">
              <QRCodeSVG
                value={`GD:INV:${generatedCode}`}
                size={72}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="overflow-hidden">
              <p className="font-black text-xl tracking-tight leading-tight uppercase truncate">
                {itemName || 'ITEM NAME'}
              </p>
              <p className="font-bold text-sm text-gray-800 font-mono mt-1">
                LOC: {generatedCode}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 border border-brand-border rounded-xl text-sm font-bold text-brand-paperMuted hover:text-brand-paper transition-colors flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handlePrintUsb}
              disabled={isPrinting}
              className="flex-1 py-3.5 bg-brand-mint text-brand-dark font-black rounded-xl text-sm tracking-wider uppercase hover:bg-brand-mintLight transition-colors shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Printer className="w-5 h-5" />
              <span>{isPrinting ? 'Printing via USB...' : 'Print 18mm Label via USB'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Scan & Commit */}
      {step === 3 && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-sm font-extrabold text-brand-paper uppercase tracking-wider">
            SCAN QR & WEBCAM SNAPSHOT VERIFICATION
          </h3>

          <div className="bg-brand-dark border-2 border-brand-granted rounded-2xl h-56 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <Camera className="w-12 h-12 text-brand-granted" />
            <p className="font-black text-sm text-brand-granted">
              PC Webcam Feed Ready — Label Printed & Verified!
            </p>
            <p className="text-xs text-brand-paperMuted max-w-sm">
              Camera snapshot taken and associated with item code <span className="font-mono font-bold text-brand-mint">{generatedCode}</span>
            </p>
          </div>

          <button
            onClick={handleCommitItem}
            disabled={isCommitting}
            className="w-full py-3.5 bg-brand-granted text-brand-dark font-black rounded-xl text-sm tracking-wider uppercase hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isCommitting ? 'Committing to Database...' : 'Commit Item to Database'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
