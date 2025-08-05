'use client';

import React, { useState, useCallback } from 'react';

export interface CSVImporterProps {
  onImport: (data: any[]) => void;
  onCancel: () => void;
  expectedColumns: string[];
  className?: string;
}

interface ImportStep {
  id: number;
  title: string;
  description: string;
}

const IMPORT_STEPS: ImportStep[] = [
  { id: 1, title: 'Subir archivo', description: 'Selecciona tu archivo CSV' },
  { id: 2, title: 'Mapear columnas', description: 'Relaciona las columnas con los campos' },
  { id: 3, title: 'Vista previa', description: 'Revisa los datos antes de importar' },
  { id: 4, title: 'Confirmar', description: 'Finaliza la importación' }
];

export function CSVImporter({ 
  onImport, 
  onCancel, 
  expectedColumns, 
  className = '' 
}: CSVImporterProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      setCsvData(rows);
      setIsProcessing(false);
      setCurrentStep(2);
    };
    reader.readAsText(uploadedFile);
  }, []);

  const handleColumnMapping = useCallback((csvColumn: string, expectedColumn: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [expectedColumn]: csvColumn
    }));
  }, []);

  const generatePreview = useCallback(() => {
    if (csvData.length === 0) return;

    const headers = csvData[0];
    const dataRows = csvData.slice(1, 6); // Preview first 5 rows

    const preview = dataRows.map(row => {
      const item: any = {};
      expectedColumns.forEach(expectedCol => {
        const csvCol = columnMapping[expectedCol];
        const csvIndex = headers.indexOf(csvCol);
        item[expectedCol] = csvIndex >= 0 ? row[csvIndex] : '';
      });
      return item;
    });

    setPreviewData(preview);
    setCurrentStep(3);
  }, [csvData, columnMapping, expectedColumns]);

  const handleConfirmImport = useCallback(() => {
    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      const headers = csvData[0];
      const dataRows = csvData.slice(1);

      const finalData = dataRows.map(row => {
        const item: any = {};
        expectedColumns.forEach(expectedCol => {
          const csvCol = columnMapping[expectedCol];
          const csvIndex = headers.indexOf(csvCol);
          item[expectedCol] = csvIndex >= 0 ? row[csvIndex] : '';
        });
        return item;
      });

      onImport(finalData);
      setIsProcessing(false);
    }, 1500);
  }, [csvData, columnMapping, expectedColumns, onImport]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Haz clic para subir tu archivo CSV</p>
                  <p className="text-xs text-slate-500">O arrastra y suelta aquí</p>
                </div>
              </label>
            </div>
            {isProcessing && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-slate-600">Procesando archivo...</span>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-900 mb-3">Mapear columnas</h4>
              <div className="space-y-3">
                {expectedColumns.map(expectedCol => (
                  <div key={expectedCol} className="flex items-center space-x-3">
                    <div className="w-32 text-sm font-medium text-slate-700">
                      {expectedCol}
                    </div>
                    <select
                      value={columnMapping[expectedCol] || ''}
                      onChange={(e) => handleColumnMapping(e.target.value, expectedCol)}
                      className="flex-1 rounded-md border-slate-300 text-sm"
                    >
                      <option value="">Seleccionar columna...</option>
                      {csvData[0]?.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Anterior
              </button>
              <button
                onClick={generatePreview}
                disabled={Object.keys(columnMapping).length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-900 mb-3">Vista previa (primeras 5 filas)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      {expectedColumns.map(col => (
                        <th key={col} className="text-left py-2 px-3 font-medium text-slate-700">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        {expectedColumns.map(col => (
                          <td key={col} className="py-2 px-3 text-slate-600">
                            {row[col] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-slate-900 mb-2">¿Confirmar importación?</h4>
              <p className="text-sm text-slate-600 mb-6">
                Se importarán {csvData.length - 1} registros. Esta acción no se puede deshacer.
              </p>
            </div>
            
            {isProcessing ? (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-slate-600">Importando datos...</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center space-x-3">
                <button
                  onClick={onCancel}
                  className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Importar
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${className}`}>
      {/* Header with steps */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-900">Importar CSV</h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Steps indicator */}
        <div className="mt-4">
          <div className="flex items-center space-x-4">
            {IMPORT_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                  ${currentStep >= step.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-600'
                  }
                `}>
                  {step.id}
                </div>
                <div className="ml-2 hidden sm:block">
                  <p className="text-xs font-medium text-slate-900">{step.title}</p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
                {index < IMPORT_STEPS.length - 1 && (
                  <div className={`
                    w-8 h-0.5 mx-4
                    ${currentStep > step.id ? 'bg-blue-600' : 'bg-slate-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="px-6 py-6">
        {renderStepContent()}
      </div>
    </div>
  );
}