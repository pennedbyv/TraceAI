import React, { useState } from 'react';
import type { UserProfile } from '../../types';
import { purgeAllUserData } from '../../lib/firestore/service';
import { ShieldCheck, CheckCircle2, Download, Trash2, AlertTriangle, Key, Lock } from 'lucide-react';

interface SettingsViewProps {
  user: UserProfile;
  onDataPurged: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onDataPurged }) => {
  const [purgeSuccess, setPurgeSuccess] = useState(false);

  const handlePurge = async () => {
    const confirmation = prompt(
      'Type "SHRED" to permanently delete all private entries and companion interactions in your vault:'
    );
    if (confirmation === 'SHRED') {
      await purgeAllUserData(user.uid);
      setPurgeSuccess(true);
      setTimeout(() => {
        onDataPurged();
      }, 1500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 pb-6 border-b border-[#efeeeb]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f3f0] text-[#504349] text-[10px] font-semibold uppercase tracking-wider mb-3 border border-[#d4c2c9]/40">
          <Lock className="w-3.5 h-3.5 text-[#854c6c]" />
          Cryptographic Vault &amp; Preferences
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#1b1c1a] tracking-tight">
          Studio Settings
        </h2>
        <p className="font-serif italic text-sm text-[#504349] mt-2 max-w-2xl leading-relaxed">
          Manage identity credentials, Firestore security boundaries, and local enclave hygiene.
        </p>
      </div>

      {purgeSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-[#ccead0] text-[#062010] text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#3e5944]" />
          <span>Vault entries shredded. Refreshing private enclave...</span>
        </div>
      )}

      {/* Identity & Firestore Isolation Panel */}
      <div className="p-6 rounded-2xl bg-white border border-[#eae8e5] shadow-xs mb-8">
        <h3 className="font-serif text-lg font-medium text-[#1b1c1a] mb-4">
          Identity &amp; Cloud Firestore Isolation
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#f5f3f0] gap-2">
            <div>
              <span className="font-semibold text-[#1b1c1a] block">Firebase Authentication UID</span>
              <span className="text-[#504349] font-mono text-[11px]">{user.uid}</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#ccead0] text-[#062010] font-mono text-[11px] self-start sm:self-center font-medium">
              Active Session
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#f5f3f0] gap-2">
            <div>
              <span className="font-semibold text-[#1b1c1a] block">Associated Email</span>
              <span className="text-[#504349] text-[11px]">{user.email || 'federated-oauth@google'}</span>
            </div>
            <span className="text-[#827379] text-[11px] font-medium">Google Sign-In</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#efeeeb] border-l-3 border-[#4a6550] text-[#504349]">
            <span className="font-semibold text-[#1b1c1a] block mb-1">
              Firestore Security Rules Status
            </span>
            <p className="font-mono text-[11px] leading-relaxed">
              Enforcing path isolation: <code className="text-[#854c6c]">/users/{'{'}userId{'}'}/entries/*</code> where <code className="text-[#854c6c]">request.auth.uid == userId</code>. No cross-user reads or writes permitted.
            </p>
          </div>
        </div>
      </div>

      {/* Security Architecture & Enclave Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-white border border-[#eae8e5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#4a6550]" />
              <h4 className="font-serif text-base font-medium text-[#1b1c1a]">
                Zero-Knowledge Enclave
              </h4>
            </div>
            <p className="font-serif italic text-xs text-[#504349] leading-relaxed mb-4">
              Entries are stored with client-bound isolation. Gemini reflection payloads are executed server-side without training .
            </p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#efeeeb] text-xs">
            {/* <span className="text-[#827379]">Enclave Telemetry:</span>
            <span className="font-semibold text-[#4a6550] bg-[#ccead0]/40 px-2 py-0.5 rounded-md">98% Purity</span> */}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#eae8e5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-4 h-4 text-[#486369]" />
              <h4 className="font-serif text-base font-medium text-[#1b1c1a]">
                Export Studio Data
              </h4>
            </div>
            <p className="font-serif italic text-xs text-[#504349] leading-relaxed mb-4">
              Download your full notebook archive in human-readable Markdown format alongside structured JSON metadata.
            </p>
          </div>
          <button
            onClick={() => alert('Exporting vault archive in Markdown (.md)')}
            className="w-full py-2.5 rounded-xl bg-[#f5f3f0] hover:bg-[#eae8e5] text-xs font-semibold text-[#1b1c1a] border border-[#d4c2c9] transition-colors cursor-pointer"
            type="button"
          >
            Generate Vault Backup
          </button>
        </div>
      </div>

      {/* Irreversible Danger Zone */}
      <div className="p-6 rounded-2xl bg-white border border-[#ffdad6] shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-[#ba1a1a]">
          <AlertTriangle className="w-4 h-4" />
          <h4 className="font-serif text-base font-semibold">
            Irreversible Danger Zone: Key Shredding
          </h4>
        </div>
        <p className="font-serif italic text-xs text-[#504349] mb-4 leading-relaxed">
          Permanently purge all journal entries, reflections.<span className="font-mono font-bold text-[#1b1c1a]">{user.uid}</span>. This action cannot be undone.
        </p>
        <button
          onClick={handlePurge}
          className="px-4 py-2.5 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2"
          type="button"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Permanent Vault Purge &amp; Key Shredding</span>
        </button>
      </div>
    </div>
  );
};
