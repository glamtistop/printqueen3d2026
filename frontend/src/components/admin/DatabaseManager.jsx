import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Download,
  Upload,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileJson,
  Users,
  Package,
  ShoppingCart,
  Settings,
  Layers,
  MapPin,
  Wand2,
  Info
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CollectionIcon = ({ name }) => {
  const icons = {
    users: Users,
    products: Package,
    categories: Layers,
    collections: Layers,
    orders: ShoppingCart,
    site_settings: Settings,
    stripe_settings: Settings,
    email_settings: Settings,
    shipping_settings: Settings,
    pickup_locations: MapPin,
    custom_builders: Wand2,
    homepage_sections: Layers
  };
  const Icon = icons[name] || Database;
  return <Icon className="h-4 w-4" />;
};

export const DatabaseManager = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportInfo, setExportInfo] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [overwriteMode, setOverwriteMode] = useState(false);
  const [importResults, setImportResults] = useState(null);

  useEffect(() => {
    fetchExportInfo();
  }, []);

  const fetchExportInfo = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/export-database-info`, {
        withCredentials: true
      });
      setExportInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch export info:', error);
      toast.error('Failed to load database info');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/export-database`, {
        withCredentials: true,
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `printqueen3d_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Database exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export database');
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }
    
    setImportFile(file);
    setImportResults(null);
    
    // Read and preview the file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.collections) {
          toast.error('Invalid export file format');
          setImportFile(null);
          return;
        }
        setImportPreview(data);
      } catch (err) {
        toast.error('Failed to parse JSON file');
        setImportFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importPreview) return;
    
    setImporting(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/import-database`,
        {
          data: importPreview,
          overwrite: overwriteMode
        },
        { withCredentials: true }
      );
      
      setImportResults(response.data.results);
      toast.success('Database imported successfully!');
      
      // Refresh export info
      fetchExportInfo();
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to import database');
    } finally {
      setImporting(false);
    }
  };

  const clearImport = () => {
    setImportFile(null);
    setImportPreview(null);
    setImportResults(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Database Manager</h1>
        <p className="text-slate-500">Export and import your store data</p>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-500" />
          Export Database
        </h3>
        
        <p className="text-slate-600 mb-4">
          Download a complete backup of your store data as a JSON file.
        </p>

        {exportInfo && (
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-slate-700 mb-3">
              Collections to export ({exportInfo.total_documents} total documents):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Object.entries(exportInfo.collections).map(([name, count]) => (
                <div key={name} className="flex items-center gap-2 text-sm text-slate-600">
                  <CollectionIcon name={name} />
                  <span className="truncate">{name.replace('_', ' ')}</span>
                  <span className="text-slate-400">({count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50"
        >
          {exporting ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Download className="h-5 w-5" />
          )}
          {exporting ? 'Exporting...' : 'Export Database'}
        </button>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-emerald-500" />
          Import Database
        </h3>
        
        <p className="text-slate-600 mb-4">
          Restore your store data from a previously exported JSON file.
        </p>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 text-sm">Important</p>
              <p className="text-amber-700 text-sm mt-1">
                Importing will merge data with existing records. Enable "Overwrite Mode" to replace all existing data.
                User passwords are preserved during import.
              </p>
            </div>
          </div>
        </div>

        {/* File Upload */}
        {!importFile ? (
          <label className="block">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
              <FileJson className="h-12 w-12 mx-auto mb-3 text-slate-400" />
              <p className="text-slate-600 font-medium">Click to select export file</p>
              <p className="text-sm text-slate-400 mt-1">JSON files only</p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-4">
            {/* File Info */}
            <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileJson className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="font-medium text-emerald-800">{importFile.name}</p>
                  <p className="text-sm text-emerald-600">
                    {importPreview && `${Object.keys(importPreview.collections).length} collections`}
                    {importPreview?.exported_at && ` • Exported: ${new Date(importPreview.exported_at).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <button
                onClick={clearImport}
                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>

            {/* Preview */}
            {importPreview && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Collections in file:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {Object.entries(importPreview.collections).map(([name, docs]) => (
                    <div key={name} className="flex items-center gap-2 text-sm text-slate-600">
                      <CollectionIcon name={name} />
                      <span className="truncate">{name.replace('_', ' ')}</span>
                      <span className="text-slate-400">({Array.isArray(docs) ? docs.length : 0})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overwrite Toggle */}
            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={overwriteMode}
                onChange={(e) => setOverwriteMode(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <p className="font-medium text-slate-800">Overwrite Mode</p>
                <p className="text-sm text-slate-500">Replace existing data instead of merging</p>
              </div>
            </label>

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50"
            >
              {importing ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              {importing ? 'Importing...' : 'Import Database'}
            </button>

            {/* Import Results */}
            {importResults && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Import Results:
                </p>
                <div className="space-y-1">
                  {Object.entries(importResults).map(([name, result]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{name.replace('_', ' ')}</span>
                      <span className={`font-medium ${result.status === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {result.status === 'error' ? 'Error' : 
                         result.status === 'skipped' ? 'Skipped (empty)' :
                         result.inserted !== undefined ? `${result.inserted} inserted, ${result.updated || 0} updated` :
                         `${result.count || 0} processed`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Info className="h-5 w-5" />
          How to Transfer to Another Account
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-700">
          <li>Click "Export Database" above to download your data</li>
          <li>Clone this repository to your new hosting account</li>
          <li>Go to Admin → Database in the new deployment</li>
          <li>Upload the exported JSON file and click "Import Database"</li>
          <li>Your products, settings, and configurations will be restored</li>
        </ol>
        <p className="text-sm text-blue-600 mt-4">
          <strong>Note:</strong> User passwords are preserved during import. If importing users that already exist, 
          their existing passwords will be kept.
        </p>
      </div>
    </div>
  );
};
