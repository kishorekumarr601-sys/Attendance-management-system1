import React, { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from 'lucide-react';
import { useApp } from '../store/AppContext';
import {
  downloadImportTemplate,
  IMPORT_TEMPLATES,
  ImportCategory,
  parseAndValidateImportFile,
  ParsedPreviewRow,
} from '../utils/excel';

const ADMIN_CATEGORIES: ImportCategory[] = [
  'students',
  'marks',
  'staff',
  'departments',
  'subjects',
  'calendar',
];

export const ImportExcelPage: React.FC = () => {
  const { state, dispatch, session, showToast } = useApp();
  const isAdmin = session?.role === 'admin';
  const availableCategories: ImportCategory[] = isAdmin ? ADMIN_CATEGORIES : ['marks'];

  const [category, setCategory] = useState<ImportCategory>(isAdmin ? 'students' : 'marks');
  const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const summary = useMemo(() => {
    if (!previewRows) return { ready: 0, errors: 0 };
    const ready = previewRows.filter((r) => r.valid).length;
    return { ready, errors: previewRows.length - ready };
  }, [previewRows]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setParseError('');
    setLoading(true);
    setFileName(file.name);
    try {
      const parsed = await parseAndValidateImportFile(file, category, state);
      setPreviewRows(parsed);
    } catch (err) {
      setPreviewRows(null);
      setParseError(err instanceof Error ? err.message : 'Unable to parse file.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitImport = () => {
    if (!previewRows) return;
    const validItems = previewRows
      .filter((r) => r.valid && r.payload)
      .map((r) => r.payload as Record<string, unknown>);
    if (validItems.length === 0) {
      showToast('No valid rows to import', 'error');
      return;
    }
    dispatch({
      type: 'IMPORT_BATCH',
      payload: { category, items: validItems },
    });
    showToast(`Imported ${validItems.length} ${category} record(s)`, 'success');
    setPreviewRows(null);
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const tpl = IMPORT_TEMPLATES[category];

  return (
    <div className="space-y-6">
      <div className="erp-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#7A0000] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#D4A017]" />
            Bulk Import from Excel / CSV
          </h2>
          <p className="text-xs text-[#5A0000] mt-0.5">
            Download a template, upload `.xlsx` or `.csv`, review row validation, and commit ready rows.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            downloadImportTemplate(category);
            showToast('Template downloaded', 'success');
          }}
          className="btn-gold px-4 py-2 min-h-[44px] text-xs inline-flex items-center gap-1.5 self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          Download {tpl.label} Template
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Import category">
        {availableCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={category === cat}
            onClick={() => {
              setCategory(cat);
              setPreviewRows(null);
              setParseError('');
              setFileName('');
            }}
            className={`px-4 py-2 min-h-[44px] rounded-full text-xs font-bold transition-colors ${
              category === cat
                ? 'bg-[#7A0000] text-[#FFD700]'
                : 'bg-white border border-[#E8CFCF] text-[#5A0000] hover:bg-[#FFF5F5]'
            }`}
          >
            {IMPORT_TEMPLATES[cat].label}
          </button>
        ))}
      </div>

      {/* Upload Dropzone */}
      <div className="erp-card p-6 space-y-4">
        <div className="text-xs text-[#5A0000]">
          Expected columns:{' '}
          <span className="font-mono font-bold text-[#7A0000]">{tpl.headers.join(' · ')}</span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver ? 'border-[#7A0000] bg-[#FFF5F5]' : 'border-[#E8CFCF] bg-[#FFF5F5]/40'
          }`}
        >
          <Upload className="w-8 h-8 text-[#7A0000] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#1A0000]">
            {loading
              ? 'Parsing and validating rows...'
              : fileName
              ? `Loaded: ${fileName}`
              : `Drag & drop a .xlsx or .csv file for ${tpl.label}`}
          </p>
          <p className="text-xs text-[#5A0000] mt-1">or choose a file from your computer</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            aria-label="Upload Excel or CSV file"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="mt-4 btn-gold px-5 py-2.5 min-h-[44px] text-xs"
          >
            Choose File
          </button>
        </div>

        {parseError && (
          <div role="alert" className="p-3.5 rounded-xl bg-[#C0000C]/10 text-[#C0000C] text-xs font-bold">
            {parseError}
          </div>
        )}
      </div>

      {/* Preview Table */}
      {previewRows && (
        <section className="erp-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8CFCF] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#7A0000]">Validation Preview</h3>
              <p className="text-xs text-[#5A0000] font-semibold mt-0.5">
                {summary.ready} ready, {summary.errors} with errors
              </p>
            </div>
            <button
              type="button"
              disabled={summary.ready === 0}
              onClick={handleCommitImport}
              className="btn-gold px-5 py-2 min-h-[44px] text-xs disabled:opacity-40"
            >
              Import {summary.ready} Valid Row(s)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FFF5F5] text-[#7A0000] border-b border-[#E8CFCF]">
                  <th className="py-3 px-4">Row</th>
                  <th className="py-3 px-4">Col 1</th>
                  <th className="py-3 px-4">Col 2</th>
                  <th className="py-3 px-4">Col 3</th>
                  <th className="py-3 px-4">Col 4</th>
                  <th className="py-3 px-4">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8CFCF]">
                {previewRows.map((row) => (
                  <tr key={row.rowNum} className={row.valid ? 'bg-white' : 'bg-[#FFF5F5]'}>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#5A0000]">#{row.rowNum}</td>
                    {row.displayCells.map((c, i) => (
                      <td key={i} className="py-2.5 px-4 text-[#1A0000]">
                        {c}
                      </td>
                    ))}
                    <td className="py-2.5 px-4">
                      {row.valid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1E9E4A]/10 text-[#1E9E4A] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C0000C]/10 text-[#C0000C] font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          {row.reason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
