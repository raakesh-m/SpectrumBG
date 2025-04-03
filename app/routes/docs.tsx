import { useState } from 'react';
import { Link } from '@remix-run/react';

export default function DocsPage() {
  // Add mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Modern Gradient Header */}
      <header className="gradient-bg text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1 items-center">
              <Link to="/" className="flex items-center">
                <div className="h-10 w-10 relative overflow-hidden rounded-full border-2 border-white">
                  <img className="h-full w-full object-cover" src="/images/logo-small.svg" alt="AI Product Customizer" />
                </div>
                <span className="ml-3 text-xl font-extrabold tracking-tight">AI Product Customizer</span>
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-base font-medium text-white opacity-80 hover:opacity-100 hover:border-b-2 hover:border-white py-1 transition-all">
                App
              </Link>
              <Link to="/docs" className="text-base font-medium text-white border-b-2 border-white py-1">
                Documentation
              </Link>
            </nav>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="bg-primary-darkest rounded-md p-2 inline-flex items-center justify-center text-white hover:text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Open menu</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
              <a 
                href="https://github.com/raakesh-m/aiprod" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-primary-darkest bg-accent hover:bg-white"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub
              </a>
            </div>
          </div>
          
          {/* Mobile menu, show/hide based on menu state */}
          {mobileMenuOpen && (
            <div className="md:hidden py-2 px-4 bg-primary-dark rounded-b-lg shadow-lg animate-fadeIn">
              <div className="pt-2 pb-4 space-y-1">
                <Link 
                  to="/" 
                  className="block pl-3 pr-4 py-2 text-base font-medium text-white hover:bg-primary-darkest rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  App
                </Link>
                <Link 
                  to="/docs" 
                  className="block pl-3 pr-4 py-2 text-base font-medium text-white hover:bg-primary-darkest rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Documentation
                </Link>
                <a 
                  href="https://github.com/raakesh-m/aiprod" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-white hover:bg-primary-darkest rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    GitHub
                  </span>
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-primary-darkest pb-12 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
              Documentation
            </h1>
            <p className="max-w-3xl mx-auto text-base sm:text-xl text-accent mb-6">
              Learn how to use the AI-Enhanced Product Customizer to transform your product images.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow bg-accent bg-opacity-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-2">
            {/* Getting Started */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-primary bg-opacity-10">
                    <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="ml-4 text-xl font-bold text-primary-darkest">Getting Started</h2>
                </div>
                <div className="mt-6 prose prose-indigo">
                  <ol className="list-decimal list-inside space-y-4">
                    <li className="flex flex-col">
                      <span className="font-medium">Clone the repository from GitHub</span>
                      <code className="mt-2 px-2 py-1 bg-gray-100 rounded-md text-sm block">
                        git clone https://github.com/yourusername/ai-product-customizer.git
                      </code>
                    </li>
                    <li className="flex flex-col">
                      <span className="font-medium">Install dependencies</span>
                      <code className="mt-2 px-2 py-1 bg-gray-100 rounded-md text-sm block">
                        npm install
                      </code>
                    </li>
                    <li className="flex flex-col">
                      <span className="font-medium">Set up the U-2-Net server</span>
                      <code className="mt-2 px-2 py-1 bg-gray-100 rounded-md text-sm block">
                        python_backend/setup_u2net.bat
                      </code>
                    </li>
                    <li className="flex flex-col">
                      <span className="font-medium">Start the application</span>
                      <code className="mt-2 px-2 py-1 bg-gray-100 rounded-md text-sm block">
                        start_app.bat
                      </code>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Using the App */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-accent bg-opacity-80">
                    <svg className="h-6 w-6 text-primary-darkest" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="ml-4 text-xl font-bold text-primary-darkest">Using the App</h2>
                </div>
                <div className="mt-6 prose prose-indigo">
                  <ol className="list-decimal list-inside space-y-4">
                    <li className="flex flex-col">
                      <span className="font-medium">Upload a product image</span>
                      <p className="mt-1 text-sm text-gray-500">
                        Click on the upload area or drag and drop an image file.
                      </p>
                    </li>
                    <li className="flex flex-col">
                      <span className="font-medium">Choose a processing method</span>
                      <div className="mt-1 text-sm text-gray-500 space-y-2">
                        <div className="flex items-start">
                          <span className="font-bold mr-2">•</span>
                          <div>
                            <p className="font-medium">U-2-Net:</p>
                            <p>Local processing using a deep learning model</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <span className="font-bold mr-2">•</span>
                          <div>
                            <p className="font-medium">Remove.bg API:</p>
                            <p>Cloud-based processing (requires API key)</p>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li className="flex flex-col">
                      <span className="font-medium">Process the image</span>
                      <p className="mt-1 text-sm text-gray-500">
                        Click "Apply AI Background Removal" to process the image.
                      </p>
                    </li>
                    <li className="flex flex-col">
                      <span className="font-medium">Download or use the image</span>
                      <p className="mt-1 text-sm text-gray-500">
                        Use the buttons to download the transparent PNG or integrate with your store.
                      </p>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* U-2-Net Info */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-primary-dark bg-opacity-30">
                    <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                    </svg>
                  </div>
                  <h2 className="ml-4 text-xl font-bold text-primary-darkest">U-2-Net Deep Learning</h2>
                </div>
                <div className="mt-6 prose prose-indigo">
                  <p>
                    U-2-Net is a state-of-the-art deep learning model for salient object detection. It uses a nested U-structure architecture to capture fine details and complex structures in images.
                  </p>
                  
                  <div className="mt-4 bg-white border-2 border-primary rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-primary-darkest">Key Features</h3>
                    <ul className="mt-2 list-disc list-inside text-sm text-gray-800 space-y-1">
                      <li>High-precision object detection</li>
                      <li>Preserves fine details like hair and fur</li>
                      <li>Works offline without internet connection</li>
                      <li>Open-source implementation</li>
                    </ul>
                  </div>
                  
                  <div className="mt-6">
                    <a 
                      href="https://github.com/xuebinqin/U-2-Net" 
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn more about U-2-Net
                      <svg className="ml-2 -mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Remove.bg API */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-accent bg-opacity-50">
                    <svg className="h-6 w-6 text-primary-darkest" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <h2 className="ml-4 text-xl font-bold text-primary-darkest">Remove.bg API</h2>
                </div>
                <div className="mt-6 prose prose-indigo">
                  <p>
                    The Remove.bg API provides cloud-based background removal as an alternative to local processing. 
                    It's fast and reliable but requires an API key for full functionality.
                  </p>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-base font-medium text-primary-darkest">Setup Instructions</h3>
                    <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-3">
                      <li className="flex flex-col">
                        <span>Sign up for an account at <a href="https://www.remove.bg/api" className="text-primary hover:text-primary-dark font-medium" target="_blank" rel="noopener noreferrer">Remove.bg</a></span>
                      </li>
                      <li className="flex flex-col">
                        <span>Obtain an API key from your account dashboard</span>
                      </li>
                      <li className="flex flex-col">
                        <span>Create a <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">.env</code> file in the project root with your key:</span>
                        <div className="mt-2 bg-primary-darkest rounded-md p-2 overflow-x-auto">
                          <pre className="text-sm text-white"><code>REMOVE_BG_API_KEY=your_api_key_here</code></pre>
                        </div>
                      </li>
                    </ol>
                  </div>
                  
                  <div className="mt-4 flex flex-col sm:flex-row sm:space-x-4">
                    <div className="bg-accent bg-opacity-30 rounded-md p-3 mb-2 sm:mb-0">
                      <p className="text-xs text-primary-darkest font-medium">Free tier: 50 API calls/month</p>
                    </div>
                    <div className="bg-primary bg-opacity-10 rounded-md p-3">
                      <p className="text-xs text-primary-dark font-medium">Paid plans available for more volume</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-primary-darkest text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center">
                <img className="h-10 w-10" src="/images/logo-small.svg" alt="AI Product Customizer" />
                <span className="ml-3 text-xl font-bold">AI Product Customizer</span>
              </div>
              <p className="mt-4 text-accent text-sm">
                Enhance your product photography with state-of-the-art AI technology.
                Remove backgrounds, apply enhancements, and transform your catalog.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">Resources</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/docs" className="text-accent hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <a href="https://github.com/xuebinqin/U-2-Net" className="text-accent hover:text-white transition-colors">
                    U-2-Net
                  </a>
                </li>
                <li>
                  <a href="https://www.remove.bg/" className="text-accent hover:text-white transition-colors">
                    Remove.bg
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">Connect</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="https://github.com/raakesh-m/aiprod" className="text-accent hover:text-white transition-colors flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-primary-dark pt-8">
            <p className="text-accent text-sm text-center">
              &copy; {new Date().getFullYear()} AI Product Customizer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 