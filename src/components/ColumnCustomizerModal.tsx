import React, { useState } from 'react';
import {
  X,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DynamicColumn } from '../types/landRecord';
import { DEFAULT_COLUMNS } from '../utils/mockData';

interface ColumnCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: DynamicColumn[];
  setColumns: React.Dispatch<React.SetStateAction<DynamicColumn[]>>;
}

export const ColumnCustomizerModal: React.FC<ColumnCustomizerModalProps> = ({
  isOpen,
  onClose,
  columns,
  setColumns,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [newColLabel, setNewColLabel] = useState('');
  const [newColFormula, setNewColFormula] = useState<'none' | 'katha' | 'bigha'>('none');

  if (!isOpen) return null;

  const toggleVisibility = (id: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    );
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;

    setColumns((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((col, idx) => ({ ...col, order: idx + 1 }));
    });
  };

  const startRename = (col: DynamicColumn) => {
    setEditingId(col.id);
    setEditingLabel(col.label);
  };

  const saveRename = (id: string) => {
    if (editingLabel.trim()) {
      setColumns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, label: editingLabel.trim() } : c))
      );
    }
    setEditingId(null);
  };

  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColLabel.trim()) return;

    const newId = `custom_${Date.now()}`;
    const newCol: DynamicColumn = {
      id: newId,
      label: newColLabel.trim(),
      visible: true,
      order: columns.length + 1,
      type: newColFormula !== 'none' ? 'formula' : 'text',
      isCustom: true,
      formula: newColFormula !== 'none' ? newColFormula : undefined,
    };

    setColumns((prev) => [...prev, newCol]);
    setNewColLabel('');
    setNewColFormula('none');
  };

  const handleDeleteCustomColumn = (id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id));
  };

  const resetToDefault = () => {
    setColumns(
      DEFAULT_COLUMNS.map((c) => ({
        ...c,
        isCustom: false,
        isExtra: false,
      }))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#121827] border border-amber-500/30 rounded-xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161f32]">
          <div>
            <h2 className="text-base font-semibold text-white font-bengali">
              ডায়নামিক কলাম কনফিগারেশন ও কাস্টমাইজার
            </h2>
            <p className="text-xs text-slate-400 font-bengali">
              কলামের দৃশ্যমানতা, নাম পরিবর্তন ও নতুন ক্যালকুলেটেড কলাম যুক্ত করুন
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-amber-400 font-bengali">
              বিদ্যমান কলামসমূহ ({columns.filter((c) => c.visible).length}/{columns.length} দৃশ্যমান):
            </div>
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {columns.map((col, idx) => (
                <div
                  key={col.id}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                    col.visible
                      ? 'bg-[#151c2d] border-slate-700/80 text-slate-200'
                      : 'bg-[#0f1422] border-slate-800/60 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                    <button
                      type="button"
                      onClick={() => toggleVisibility(col.id)}
                      className={`p-1 rounded transition-colors ${
                        col.visible
                          ? 'text-amber-400 hover:bg-amber-400/10'
                          : 'text-slate-600 hover:bg-slate-800'
                      }`}
                      title={col.visible ? 'লুকান' : 'প্রদর্শন করুন'}
                    >
                      {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {editingId === col.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          className="bg-[#0b0f19] border border-amber-500/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none flex-1 font-bengali"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && saveRename(col.id)}
                        />
                        <button
                          onClick={() => saveRename(col.id)}
                          className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bengali truncate font-medium">{col.label}</span>
                        {col.isExtra && (
                          <span className="text-[10px] text-amber-300 font-mono">আর্কাইভ</span>
                        )}
                        {col.isCustom && (
                          <span className="text-[10px] text-emerald-300 font-mono">কাস্টম</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startRename(col)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                      title="নাম পরিবর্তন"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveColumn(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                      title="উপরে নিন"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveColumn(idx, 'down')}
                      disabled={idx === columns.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                      title="নিচে নিন"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    {col.isCustom && (
                      <button
                        onClick={() => handleDeleteCustomColumn(col.id)}
                        className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add custom calculated column */}
          <form
            onSubmit={handleAddCustomColumn}
            className="p-3.5 bg-[#0e1424] border border-amber-500/20 rounded-lg space-y-3"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 font-bengali">
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন কাস্টম বা ক্যালকুলেটেড কলাম যোগ করুন</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 block text-[11px] mb-1 font-bengali">
                  কলামের শিরোনাম:
                </label>
                <input
                  type="text"
                  placeholder="যেমন: রূপান্তরিত কাঠা, স্ট্যাটাস..."
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  className="w-full bg-[#141b2e] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-amber-400 focus:outline-none font-bengali"
                />
              </div>
              <div>
                <label className="text-slate-400 block text-[11px] mb-1 font-bengali">
                  ক্যালকুলেশন রূপান্তরকারী:
                </label>
                <select
                  value={newColFormula}
                  onChange={(e) => setNewColFormula(e.target.value as any)}
                  className="w-full bg-[#141b2e] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-amber-400 focus:outline-none font-bengali"
                >
                  <option value="none">সাধারণ টেক্সট কলাম</option>
                  <option value="katha">জমির পরিমাণ → কাঠা (Katha)</option>
                  <option value="bigha">জমির পরিমাণ → বিঘা (Bigha)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newColLabel.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 rounded-lg transition-colors font-bengali flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>কলাম যোগ করুন</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#141b2c] flex items-center justify-between">
          <button
            onClick={resetToDefault}
            className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1.5 font-bengali transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ডিফল্ট কলামে রিসেট</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors font-bengali"
          >
            সংরক্ষণ ও বন্ধ
          </button>
        </div>
      </div>
    </div>
  );
};
