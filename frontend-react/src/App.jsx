import { useState } from 'react';
import axios from 'axios';
import { Search, UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';

const API_ENDPOINT = import.meta.env.VITE_API_URL || "https://your-api-gateway-url.amazonaws.com/v1";
const API_KEY = import.meta.env.VITE_API_KEY || "1anI1JHNZtaFEwxoG8UEn7exdCvdsRT02NljyLuq";

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'upload'

  // Upload state
  const [file, setFile] = useState(null);
  const [customLabels, setCustomLabels] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    // Check if placeholder is still being used
    if (API_ENDPOINT.includes("your-api-gateway-url")) {
      alert("Please configure your VITE_API_URL in the .env.local file first!");
      return;
    }

    setIsSearching(true);
    setResults([]);
    try {
      // Modern replacement for apigClient.searchGet
      const response = await axios.get(`${API_ENDPOINT}/search`, {
        params: { q: query },
        headers: { 'x-api-key': API_KEY }
      });

      let backendData = response.data;
      if (backendData.body && typeof backendData.body === "string") {
        backendData = JSON.parse(backendData.body);
      }

      if (backendData.results && Array.isArray(backendData.results)) {
        setResults(backendData.results);
      } else {
        alert("No results returned.");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert(error.message || "Search failed. Check your API configuration or network tab.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    // Check if placeholder is still being used
    if (API_ENDPOINT.includes("your-api-gateway-url")) {
      alert("Please configure your VITE_API_URL in the .env.local file first!");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = file.name;
      const fileType = file.type;
      
      // Wrap FileReader in a Promise so we can await it
      const base64Body = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target.result.split(',')[1] || event.target.result);
        };
        reader.onerror = (error) => reject(error);
        if (fileType.includes('image')) {
           reader.readAsDataURL(file);
        } else {
           reject(new Error("Please select a valid image file."));
        }
      });

      await axios.put(`${API_ENDPOINT}/upload/vritika-ai-photo-vault-bucket/${fileName}`, base64Body, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': fileType,
          'x-amz-meta-customlabels': customLabels
        }
      });
      
      alert("Photo uploaded successfully!");
      setFile(null);
      setCustomLabels('');

    } catch (error) {
      console.error("Upload error:", error);
      alert(error.message || "Upload failed. Check your API configuration or network tab.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <ImageIcon className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">AI Photo Vault</h1>
          </div>
          <nav className="flex gap-4">
            <button 
              onClick={() => setActiveTab('search')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'search' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Search
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'upload' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Upload
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'search' ? (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Find your memories instantly.
              </h2>
              <p className="text-lg text-slate-500">
                Search using natural language. Try saying <span className="font-medium text-indigo-600">"show me photos of dogs"</span> or <span className="font-medium text-indigo-600">"trees and cars"</span>.
              </p>
            </div>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
              <div className="relative flex items-center shadow-sm rounded-full overflow-hidden border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-shadow">
                <div className="pl-4 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What are you looking for?"
                  className="block w-full py-4 pl-3 pr-4 text-base focus:outline-none bg-transparent"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="mr-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Search
                </button>
              </div>
            </form>

            {/* Results */}
            {results.length > 0 && (
              <div className="pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-semibold mb-6">Found {results.length} photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {results.map((item, idx) => {
                    const imgUrl = item.url ? item.url : `https://${item.bucket}.s3.amazonaws.com/${item.objectKey}`;
                    return (
                      <div key={idx} className="group relative aspect-square bg-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                        <img 
                          src={imgUrl} 
                          alt="Search Result" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                           <div className="flex flex-wrap gap-1">
                             {item.labels && item.labels.map(l => (
                               <span key={l} className="text-[10px] uppercase tracking-wider font-semibold bg-white/20 text-white px-2 py-1 rounded-md backdrop-blur-sm">
                                 {l}
                               </span>
                             ))}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Upload to Vault
              </h2>
              <p className="text-slate-500">
                Our AI will automatically detect objects and index them for future searches.
              </p>
            </div>

            <form onSubmit={handleUpload} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Select Image</label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-10 h-10 mb-3 text-slate-400" />
                      <p className="mb-2 text-sm text-slate-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      {file && <p className="text-xs font-medium text-indigo-600 mt-2">{file.name}</p>}
                    </div>
                    <input 
                      id="dropzone-file" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="customLabels" className="block text-sm font-medium text-slate-700">
                  Custom Tags (Optional)
                </label>
                <input
                  type="text"
                  id="customLabels"
                  value={customLabels}
                  onChange={(e) => setCustomLabels(e.target.value)}
                  placeholder="e.g. vacation, summer, new york"
                  className="block w-full rounded-lg border-slate-300 py-3 px-4 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 border"
                />
                <p className="text-xs text-slate-500">Comma-separated tags to help you find this photo later.</p>
              </div>

              <button
                type="submit"
                disabled={!file || isUploading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload Photo'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
