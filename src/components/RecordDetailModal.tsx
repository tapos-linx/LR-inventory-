import React, { useState } from 'react';
import {
  X,
  FileText,
  MapPin,
  Building,
  User,
  PieChart,
  FileCheck,
  Save,
  CheckCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { LandRecord } from '../types/landRecord';
import { toBengaliNumber } from '../utils/bengaliNumerals';

interface RecordDetailModalProps {
  record: LandRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveRecord: (updated: LandRecord) => void;
  isNew?: boolean;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  isOpen,
  onClose,
  onSaveRecord,
  isNew = false,
}) => {
  if (!isOpen || !record) return null;

  const [formData, setFormData] = useState<LandRecord>({ ...record });
  const [extraKey, setExtraKey] = useState('');
  const [extraVal, setExtraVal] = useState('');

  const handleChange = (field: keyof LandRecord, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleExtraChange = (key: string, val: string) => {
    setFormData((prev) => ({
      ...prev,
      extraAttributes: { ...prev.extraAttributes, [key]: val },
    }));
  };

  const handleAddExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraKey.trim()) return;
    setFormData((prev) => ({
      ...prev,
      extraAttributes: { ...prev.extraAttributes, [extraKey.trim()]: extraVal.trim() },
    }));
    setExtraKey('');
    setExtraVal('');
  };

  const handleDeleteExtra = (key: string) => {
    setFormData((prev) => {
      const copy = { ...prev.extraAttributes };
      delete copy[key];
      return { ...prev, extraAttributes: copy };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRecord(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#121827] border border-amber-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161f32]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white font-bengali">
                {isNew ? 'নতুন খতিয়ান ও দাগ রেকর্ড অন্তর্ভুক্তি' : 'খতিয়ান ও দাগ রেকর্ড বিশদ বিবরণ'}
              </h2>
              <p className="text-xs text-slate-400 font-bengali">
                খতিয়ান নং: {formData.khatianNo || 'নতুন'} · দাগ নং: {formData.dagNo || 'নতুন'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-bengali">
          {/* Geographical & Survey row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">জেলা:</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleChange('district', e.target.value)}
                className="w-full bg-[#151d30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">উপজেলা:</label>
              <input
                type="text"
                value={formData.upazila}
                onChange={(e) => handleChange('upazila', e.target.value)}
                className="w-full bg-[#151d30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">মৌজা:</label>
              <input
                type="text"
                value={formData.mouza}
                onChange={(e) => handleChange('mouza', e.target.value)}
                className="w-full bg-[#151d30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">জে.এল. নং:</label>
              <input
                type="text"
                value={formData.jlNo}
                onChange={(e) => handleChange('jlNo', e.target.value)}
                className="w-full bg-[#151d30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono-num focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          {/* Survey, Khatian & Dag */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">জরিপের ধরণ:</label>
              <select
                value={formData.surveyType}
                onChange={(e) => handleChange('surveyType', e.target.value)}
                className="w-full bg-[#151d30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="CS">CS (Cadastral Survey)</option>
                <option value="SA">SA (State Acquisition)</option>
                <option value="RS">RS (Revisional Survey)</option>
                <option value="BRS">BRS / BS (Bangladesh Revisional)</option>
                <option value="City Survey">সিটি জরিপ</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">খতিয়ান নং:</label>
              <input
                type="text"
                value={formData.khatianNo}
                onChange={(e) => handleChange('khatianNo', e.target.value)}
                className="w-full bg-[#151d30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono-num focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">দাগ নং:</label>
              <input
                type="text"
                value={formData.dagNo}
                onChange={(e) => handleChange('dagNo', e.target.value)}
                className="w-full bg-[#151d30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono-num focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          {/* Owner details */}
          <div>
            <label className="text-slate-400 block mb-1">মালিক / স্বত্ত্বাধিকারীর বিবরণ:</label>
            <textarea
              rows={2}
              value={formData.ownerDetails}
              onChange={(e) => handleChange('ownerDetails', e.target.value)}
              className="w-full bg-[#151d30] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-400 leading-relaxed"
              required
            />
          </div>

          {/* Share, Land Class, Area */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">হিস্যা / অংশ:</label>
              <input
                type="text"
                value={formData.share}
                onChange={(e) => handleChange('share', e.target.value)}
                className="w-full bg-[#151d30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono-num focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">জমির শ্রেণি / ধরণ:</label>
              <input
                type="text"
                value={formData.landClass}
                onChange={(e) => handleChange('landClass', e.target.value)}
                className="w-full bg-[#151d30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">দাগের মোট পরিমাণ:</label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => handleChange('area', e.target.value)}
                className="w-full bg-[#151d30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono-num focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-slate-400 block mb-1">মন্তব্য (Remarks):</label>
            <input
              type="text"
              value={formData.remarks || ''}
              onChange={(e) => handleChange('remarks', e.target.value)}
              className="w-full bg-[#151d30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Dynamic Extra Attributes section */}
          <div className="border-t border-slate-800 pt-3">
            <div className="text-xs font-semibold text-amber-300 mb-2">
              অতিরিক্ত কলাম / স্কিমা অ্যাট্রিবিউটস (তৌজি, সাবেক দাগ, হাল দাগ ইত্যাদি):
            </div>
            <div className="space-y-2">
              {Object.entries(formData.extraAttributes).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-28 text-slate-400 text-[11px] truncate">{k}:</span>
                  <input
                    type="text"
                    value={v}
                    onChange={(e) => handleExtraChange(k, e.target.value)}
                    className="flex-1 bg-[#141b2c] border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono-num"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteExtra(k)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="অ্যাট্রিবিউট নাম"
                  value={extraKey}
                  onChange={(e) => setExtraKey(e.target.value)}
                  className="w-28 bg-[#0c101c] border border-slate-700 rounded px-2 py-1 text-white text-xs"
                />
                <input
                  type="text"
                  placeholder="মান"
                  value={extraVal}
                  onChange={(e) => setExtraVal(e.target.value)}
                  className="flex-1 bg-[#0c101c] border border-slate-700 rounded px-2 py-1 text-white text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddExtra}
                  className="px-2.5 py-1 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded hover:bg-amber-500/30"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  যোগ
                </button>
              </div>
            </div>
          </div>

          {/* File Path info if present */}
          {formData.relativePath && (
            <div className="bg-[#0b0f19] p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 font-mono-num break-all">
              <span className="text-amber-400/80">আর্কাইভ পাথ: </span>
              {formData.relativePath}
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.verified}
                  onChange={(e) => handleChange('verified', e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>যাচাইকৃত রেকর্ড (Verified)</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
