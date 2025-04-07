import { useState } from 'react';
import { Link } from '@remix-run/react';
import Header from '~/components/Header';
import Footer from '~/components/Footer';

export default function DocsPage() {
  // Add mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Banner */}
      <div className="bg-primary-darkest pb-12 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-3">
              Documentation
            </h1>
            <p className="max-w-3xl mx-auto text-base sm:text-xl text-black mb-6">
              Learn how to use the Background Removal Tool to transform your images.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow bg-neutral-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto mt-12 mb-20 px-4">
            <h1 className="text-3xl font-extrabold text-primary-darkest mb-6">Background Removal Tool Documentation</h1>
            
            <div className="prose prose-lg max-w-none">
              <p>
                This tool helps you remove backgrounds from images with a single click.
                It uses deep learning technology to create clean, professional results perfect for product photos, profile pictures, or any image where you need a clean, isolated subject.
              </p>
              
              <h2 className="text-2xl font-bold text-primary-darkest mt-8">Features</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Background removal using local deep learning model</li>
                <li>Choose between transparent, white, or black backgrounds</li>
                <li>Simple drag-and-drop interface</li>
                <li>High-quality edge detection with semantic segmentation</li>
              </ul>
              
              <h2 className="text-2xl font-bold text-primary-darkest mt-8">How to Use</h2>
              
              <h3 className="text-xl font-semibold text-primary-darkest mt-6">Basic Steps</h3>
              <ol className="list-decimal pl-5 space-y-3">
                <li>Drag and drop your image into the upload area</li>
                <li>Select a background option (transparent, white, or black)</li>
                <li>Click "Process with Deep Learning" to process the image</li>
                <li>Download your edited image</li>
              </ol>

              <h3 className="text-xl font-semibold text-primary-darkest mt-6">Setting Up</h3>
              <p className="font-medium">Prerequisites:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Python 3.7+ installed on your computer</li>
                <li>The Python backend running locally</li>
              </ul>
              
              <p className="font-medium mt-3">Backend Setup:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <span>Install the required Python packages:</span>
                  <pre className="text-sm bg-gray-800 text-white p-3 rounded"><code>pip install -r python_backend/requirements.txt</code></pre>
                </li>
                <li>
                  <span>Download the model (one-time setup):</span>
                  <pre className="text-sm bg-gray-800 text-white p-3 rounded"><code>python python_backend/download_models.py</code></pre>
                </li>
                <li>
                  <span>Start the backend server:</span>
                  <pre className="text-sm bg-gray-800 text-white p-3 rounded"><code>python python_backend/simplified_u2net_server.py</code></pre>
                </li>
                <li>
                  <span>In your browser, go to http://localhost:3000</span>
                </li>
              </ol>

              <h2 className="text-2xl font-bold text-primary-darkest mt-8">Background Options</h2>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-bold text-lg mb-2">Transparent</h3>
                  <p className="text-sm">Removes the background completely, leaving transparency. Ideal for layering in design software.</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-bold text-lg mb-2">White</h3>
                  <p className="text-sm">Places your subject against a clean white background. Perfect for e-commerce product photos.</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-bold text-lg mb-2">Black</h3>
                  <p className="text-sm">Places your subject against a solid black background. Great for dramatic effect.</p>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-primary-darkest mt-8">Troubleshooting</h2>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Server Connection Error</h4>
                  <p>If you see "Could not connect to server":</p>
                  <ol className="list-decimal pl-5">
                    <li>Make sure the Python backend is running</li>
                    <li>Check that you've installed all requirements</li>
                    <li>Verify port 5000 is not in use by another application</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium">Image Quality Tips</h4>
                  <p>For best background removal results:</p>
                  <ol className="list-decimal pl-5">
                    <li>Use images with good lighting and clear contrast between subject and background</li>
                    <li>Try images with higher resolution (1000x1000 to 2500x2500 pixels work best)</li>
                    <li>Make sure your subject is clearly defined against the background</li>
                  </ol>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-primary-darkest mt-8">Technical Information</h2>
              
              <p>
                This application uses a deep learning semantic segmentation model for background removal. The model runs locally on your computer to ensure privacy and avoid cloud processing fees.
              </p>
              <p className="mt-2">
                No images are sent to external servers during processing. All computation happens on your local machine.
              </p>
            </div>
            
            <div className="mt-20 flex justify-center space-x-6 text-sm text-center">
              <Link to="/" className="text-primary-600 hover:text-primary-800 font-medium transition-colors">
                Back to App
              </Link>
              <a href="https://github.com/raakesh-m/SpectrumBG" className="text-primary-600 hover:text-primary-800 font-medium transition-colors" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 