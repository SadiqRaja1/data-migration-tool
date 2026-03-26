import { useState } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:5000/api'

const Badge = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  )
}

const StatCard = ({ value, label, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    red: 'from-rose-500 to-rose-600',
    purple: 'from-violet-500 to-violet-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className={`text-3xl font-black bg-gradient-to-br ${colors[color]} bg-clip-text text-transparent`}>
        {value}
      </div>
      <div className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wide">{label}</div>
    </div>
  )
}

export default function App() {
  const [file, setFile] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)
  const [transformResult, setTransformResult] = useState(null)
  const [sqlResult, setSqlResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(1)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFileChange = (f) => {
    setFile(f)
    setUploadResult(null)
    setTransformResult(null)
    setSqlResult(null)
    setError(null)
    setActiveStep(1)
  }

  const sendFile = async (endpoint) => {
    if (!file) return setError('Please select a CSV file first')
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post(`${API}/${endpoint}`, formData)
      return res.data
    } catch {
      setError('Request failed. Make sure the backend is running on port 5000.')
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    const data = await sendFile('upload')
    if (data) { setUploadResult(data); setActiveStep(2) }
  }

  const handleTransform = async () => {
    const data = await sendFile('transform')
    if (data) { setTransformResult(data); setActiveStep(3) }
  }

  const handleExportSQL = async () => {
    const data = await sendFile('export/sql')
    if (data) { setSqlResult(data); setActiveStep(4) }
  }

  const handleDownloadJSON = async () => {
    const data = await sendFile('export/json')
    if (data) {
      const blob = new Blob([JSON.stringify(data.exported_data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'migrated_data.json'
      a.click()
    }
  }

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlResult.sql_statements.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.csv')) handleFileChange(dropped)
    else setError('Only CSV files are supported.')
  }

  const steps = ['Upload', 'Analyze', 'Transform', 'Export']

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans">

      {/* Top Nav */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h7" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">DataMigrate</span>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium border border-blue-100">v1.0</span>
        </div>
        <div className="text-xs text-gray-400 font-medium">CSV → JSON / SQL</div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 text-white px-6 py-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <h1 className="text-4xl font-black tracking-tight relative">Data Migration Tool</h1>
        <p className="text-blue-200 mt-3 text-sm max-w-md mx-auto relative">
          Upload messy CSV files, validate and clean data, then export as JSON or SQL — ready for any database.
        </p>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-2 mt-8 relative">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeStep > i + 1 ? 'bg-white text-blue-700' :
                activeStep === i + 1 ? 'bg-white/20 text-white border border-white/40' :
                'bg-white/10 text-blue-300'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                  activeStep > i + 1 ? 'bg-blue-600 text-white' : 'bg-white/20'
                }`}>
                  {activeStep > i + 1 ? '✓' : i + 1}
                </span>
                {step}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-6 h-px ${activeStep > i + 1 ? 'bg-white' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Upload Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-2 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">1</span>
            </div>
            <h2 className="font-bold text-gray-800">Upload CSV File</h2>
          </div>

          <div className="px-6 pb-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`mt-3 border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input
                id="fileInput"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              {file ? (
                <div>
                  <p className="font-semibold text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB — Click to change</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-600">Drop your CSV here or <span className="text-blue-600">browse</span></p>
                  <p className="text-xs text-gray-400 mt-1">Only .csv files supported</p>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="mt-4 w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analyzing...
                </span>
              ) : 'Analyze CSV'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Analysis Result */}
        {uploadResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-2 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <span className="text-emerald-600 font-bold text-sm">2</span>
              </div>
              <h2 className="font-bold text-gray-800">Analysis Result</h2>
              <Badge color="green">✓ Complete</Badge>
            </div>

            <div className="px-6 pb-6">
              <div className="grid grid-cols-3 gap-3 mt-3 mb-5">
                <StatCard value={uploadResult.total_rows} label="Total Rows" color="blue" />
                <StatCard value={uploadResult.columns.length} label="Columns" color="green" />
                <StatCard value={Object.keys(uploadResult.missing_values || {}).length} label="Issues Found" color="red" />
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Detected Columns</p>
                <div className="flex flex-wrap gap-2">
                  {uploadResult.columns.map(col => (
                    <Badge key={col} color="blue">{col} · {uploadResult.data_types[col]}</Badge>
                  ))}
                </div>
              </div>

              {Object.keys(uploadResult.missing_values || {}).length > 0 && (
                <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">⚠ Missing Values Detected</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(uploadResult.missing_values).map(([col, count]) => (
                      <Badge key={col} color="red">{col}: {count} missing</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Data Preview</p>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {uploadResult.columns.map(col => (
                          <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.preview.map((row, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          {uploadResult.columns.map(col => (
                            <td key={col} className={`px-4 py-2.5 ${row[col] === 'NULL' || row[col] === null ? 'text-red-400 italic text-xs' : 'text-gray-700'}`}>
                              {row[col] === null || row[col] === undefined ? 'NULL' : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-5">
                <button
                  onClick={handleTransform}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm"
                >
                  🧹 Clean & Transform
                </button>
                <button
                  onClick={handleExportSQL}
                  disabled={loading}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm"
                >
                  🗄 Export SQL
                </button>
                <button
                  onClick={handleDownloadJSON}
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm"
                >
                  ⬇ Download JSON
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transform Result */}
        {transformResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-2 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <span className="text-violet-600 font-bold text-sm">3</span>
              </div>
              <h2 className="font-bold text-gray-800">Transformed Data</h2>
              <Badge color="green">✓ Cleaned</Badge>
            </div>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-3 gap-3 mt-3">
                <StatCard value={transformResult.cleaned_rows} label="Clean Rows" color="green" />
                <StatCard value={transformResult.duplicates_removed} label="Duplicates Removed" color="red" />
                <StatCard value={transformResult.original_rows} label="Original Rows" color="blue" />
              </div>
              <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
                ✅ Missing values filled — numbers → <code className="bg-emerald-100 px-1 rounded">0</code>, text → <code className="bg-emerald-100 px-1 rounded">N/A</code>
              </div>
            </div>
          </div>
        )}

        {/* SQL Result */}
        {sqlResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">4</span>
                </div>
                <h2 className="font-bold text-gray-800">SQL Insert Statements</h2>
                <Badge color="blue">{sqlResult.total_rows} rows</Badge>
              </div>
              <button
                onClick={handleCopySQL}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                  copied ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-900 hover:bg-gray-700 text-white'
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy SQL'}
              </button>
            </div>
            <div className="px-6 pb-6">
              <p className="text-xs text-gray-400 mb-3">
                Table: <span className="font-semibold text-gray-600">{sqlResult.table_name}</span>
              </p>
              <div className="bg-gray-950 rounded-xl p-5 overflow-x-auto border border-gray-800">
                {sqlResult.sql_statements.map((sql, i) => (
                  <div key={i} className="font-mono text-xs mb-2 leading-relaxed">
                    <span className="text-violet-400">INSERT INTO </span>
                    <span className="text-blue-300">{sqlResult.table_name} </span>
                    <span className="text-gray-400">{sql.match(/\(.*?\)/)?.[0]} </span>
                    <span className="text-violet-400">VALUES </span>
                    <span className="text-emerald-300">{sql.match(/VALUES (.+);/)?.[1]};</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-300 pb-8">
          Built with Flask + React · Data Migration Tool
        </div>

      </div>
    </div>
  )
}