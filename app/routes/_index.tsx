import { useState, useEffect, useRef } from 'react';
import { ActionFunctionArgs, json } from '@remix-run/node';
import { Form as RemixForm, useActionData, useSubmit, useNavigation, Link } from '@remix-run/react';
import Button from '~/components/Button';
import Card from '~/components/Card';
import Header from '~/components/Header';
import Footer from '~/components/Footer';

// Define types for background options
type BackgroundOption = 'transparent' | 'white' | 'black';

// Define the action data type
type ActionData = {
  success: boolean;
  processedImageUrl?: string;
  error?: string;
  errorMessage?: string;
  isConnectionError?: boolean;
  processingMethod?: 'local';
  backgroundType?: BackgroundOption;
};

// Function to use the local background removal endpoint with deep learning
async function useLocalBackgroundRemoval(imageBase64: string) {
  try {
    // Check if the server is running by calling the health endpoint
    try {
      const healthResponse = await fetch('http://localhost:5000/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!healthResponse.ok) {
        throw new Error(`Server health check failed. Server might be starting up or has issues.`);
      } else {
        const healthData = await healthResponse.json();
        
        if (!healthData.model_loaded) {
          throw new Error(`Deep learning model not loaded properly. Check server logs.`);
        }
      }
    } catch (healthError) {
      if (healthError instanceof Error) {
        if (healthError.message.includes('fetch') || healthError.message.includes('Failed to fetch')) {
          throw new Error(`Could not connect to server. Make sure it's running at http://localhost:5000. Try running 'python python_backend/simplified_u2net_server.py' in your terminal.`);
        }
        throw healthError;
      }
      throw new Error(`Could not connect to server: ${String(healthError)}`);
    }
    
    // Call the Flask API server with proper error handling
    let response;
    try {
      response = await fetch('http://localhost:5000/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          image: imageBase64
        })
      }).catch(error => {
        console.error('Fetch error:', error);
        throw new Error(`Failed to connect to the background removal service: ${error.message}`);
      });
    } catch (fetchError) {
      throw new Error(`Could not connect to server. Make sure it's running at http://localhost:5000 by running 'python python_backend/simplified_u2net_server.py'.`);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => response.text());
      
      if (typeof errorData === 'object' && errorData.error) {
        throw new Error(`API error: ${errorData.error}`);
      } else {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }
    
    // Process successful response
    const data = await response.json();
    return data.processedImageUrl;
  } catch (error) {
    throw error;
  }
}

// Function to use the local customize product endpoint
async function useLocalProductCustomization(imageBase64: string, background: string) {
  try {
    // Check if the server is running by calling the health endpoint
    try {
      const healthResponse = await fetch('http://localhost:5000/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!healthResponse.ok) {
        throw new Error(`Server health check failed. Server might be starting up or has issues.`);
      } else {
        const healthData = await healthResponse.json();
        
        if (!healthData.model_loaded) {
          throw new Error(`Deep learning model not loaded properly. Check server logs.`);
        }
      }
    } catch (healthError) {
      if (healthError instanceof Error) {
        if (healthError.message.includes('fetch') || healthError.message.includes('Failed to fetch')) {
          throw new Error(`Could not connect to server. Make sure it's running at http://localhost:5000. Try running 'python python_backend/simplified_u2net_server.py' in your terminal.`);
        }
        throw healthError;
      }
      throw new Error(`Could not connect to server: ${String(healthError)}`);
    }
    
    // Call the Flask API server
    let response;
    try {
      response = await fetch('http://localhost:5000/customize-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          image: imageBase64,
          background: background
        })
      });
    } catch (fetchError) {
      throw new Error(`Could not connect to server. Make sure it's running at http://localhost:5000 by running 'python python_backend/simplified_u2net_server.py'.`);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => response.text());
      
      if (typeof errorData === 'object' && errorData.error) {
        throw new Error(`API error: ${errorData.error}`);
      } else {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }
    
    // Process successful response
    const data = await response.json();
    return data.processedImageUrl;
  } catch (error) {
    throw error;
  }
}

export const action = async ({ 
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData();

  const imageBase64 = formData.get('imageBase64')?.toString() || '';
  const processingMethod = 'local'; // Always use local processing
  const backgroundType = formData.get('backgroundType')?.toString() as BackgroundOption || 'transparent';
  
  try {
    let processedImageUrl;
    
    // Always use local processing
    try {
      // First, use the existing endpoint to remove background
      
      // Check if the server is running
      try {
        const healthResponse = await fetch('http://localhost:5000/health', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!healthResponse.ok) {
          throw new Error(`Server health check failed. Server might be starting up or has issues.`);
        }
      } catch (healthError) {
        if (healthError instanceof Error) {
          if (healthError.message.includes('fetch') || healthError.message.includes('Failed to fetch')) {
            throw new Error(`Could not connect to server. Make sure it's running at http://localhost:5000. Try running 'python python_backend/simplified_u2net_server.py' in your terminal.`);
          }
          throw healthError;
        }
        throw new Error(`Could not connect to server: ${String(healthError)}`);
      }
      
      // Use traditional background removal endpoint
      const response = await fetch('http://localhost:5000/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          image: imageBase64
        })
      }).catch(error => {
        console.error('Fetch error:', error);
        throw new Error(`Failed to connect to the background removal service: ${error.message}`);
      });
      
      if (!response.ok) {
        throw new Error(`Background removal failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.processedImageUrl) {
        processedImageUrl = result.processedImageUrl;
        
        // If customization is requested, add it in a second step
        if (backgroundType !== 'transparent' && result.processedImageUrl) {
          try {
            const customizeResponse = await fetch('http://localhost:5000/customize-product', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                image: processedImageUrl,
                background: backgroundType
              })
            }).catch(error => {
              console.error('Fetch error in customization:', error);
              // Continue with just the background-removed image without throwing an error
              return null;
            });
            
            if (!customizeResponse || !customizeResponse.ok) {
              // Continue with just the background-removed image
            } else {
              const customizeResult = await customizeResponse.json();
              if (customizeResult.success && customizeResult.processedImageUrl) {
                processedImageUrl = customizeResult.processedImageUrl;
              }
            }
          } catch (customizeError) {
            // If customization fails, continue with just the background-removed image
          }
        }
      } else {
        throw new Error(result.error || 'Unknown error during processing');
      }
    } catch (error) {
      console.error('Processing error details:', error);
      
      let isConnectionError = false;
      let errorMessage = 'Unknown error occurred during processing';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for common connection error patterns
        if (
          error.message.includes('Could not connect to Deep Learning server') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('health check failed') ||
          error.message.includes('ECONNREFUSED')
        ) {
          isConnectionError = true;
        }
      }
      
      return json<ActionData>({
        success: false,
        error: errorMessage,
        errorMessage,
        isConnectionError,
        processingMethod
      });
    }
    
    return json<ActionData>({
      success: true,
      processedImageUrl,
      processingMethod,
      backgroundType
    });
  } catch (error) {
    return json<ActionData>({
      success: false,
      error: 'An unexpected error occurred during processing',
      processingMethod
    });
  }
};

// Component for the documentation section
function DocumentationSection() {
  return (
    <div className="p-4 bg-white rounded-lg shadow my-6">
      <div className="flex items-center mb-4">
        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary bg-opacity-10 mr-3">
          <svg className="h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-primary-darkest">Documentation</h3>
      </div>
      <div className="prose prose-sm max-w-none mb-4">
        <p className="text-gray-800 font-medium">
          Learn how to use the Deep Learning-Enhanced Product Customizer to transform your product images.
        </p>
      </div>
      <div className="mt-3">
        <Link
          to="/docs"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md shadow-sm text-white bg-primary-800 hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          View Documentation
          <svg className="ml-2 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default function Index() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isProcessing = navigation.state === 'submitting';
  const submit = useSubmit();
  
  const [image, setImage] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [background, setBackground] = useState('studio-light');
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [processingMethod, setProcessingMethod] = useState<'local'>('local');

  // Add state for customization options
  const [backgroundType, setBackgroundType] = useState<BackgroundOption>('transparent');
  const [showCustomizationOptions, setShowCustomizationOptions] = useState(false);
  const [customizedImageUrl, setCustomizedImageUrl] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizationDisabled, setCustomizationDisabled] = useState(false);

  // Reset processing state when we get action data
  useEffect(() => {
    if (actionData) {
      const errorMsg = actionData?.errorMessage || actionData?.error || null;
      setErrorMessage(errorMsg);
    }
  }, [actionData]);

  // Add effect to reset customization options when processingMethod changes
  useEffect(() => {
    // We don't need to disable customization at all
    setCustomizationDisabled(false);
  }, [processingMethod]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleFileSelect = (file: File | null | undefined) => {
    if (!file) return;
    
    // Reset any error messages
    setErrorMessage(null);
    
    // Validate image file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image is too large. Maximum size is 10MB.");
      return;
    }
    
    // Validate file type
    if (!file.type.includes('image/')) {
      setErrorMessage("Selected file is not an image.");
      return;
    }
    
    setImage(file);
    
    // Read the file as a data URL
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImageBase64(base64);
      setPreviewUrl(base64);
    };
    reader.onerror = () => {
      setErrorMessage("Error reading the file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const backgrounds = [
    { label: 'Studio Light', value: 'studio-light' },
    { label: 'Outdoor', value: 'outdoor' },
    { label: 'Dark Mode', value: 'dark-mode' },
  ];

  const handleSubmit = () => {
    if (!image || !imageBase64) return;
    
    setErrorMessage(null);
    
    const formData = new FormData();
    formData.append('background', background);
    formData.append('image', imageBase64);
    formData.append('processingMethod', processingMethod);
    
    submit(formData, { method: 'post' });
  };

  // Handle download button click
  const handleDownload = () => {
    if (actionData?.processedImageUrl) {
      const link = document.createElement('a');
      link.href = actionData.processedImageUrl;
      link.download = 'SpectrumBg.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // New function to customize the product
  const handleCustomizeProduct = async () => {
    if (!actionData?.processedImageUrl) return;
    
    setIsCustomizing(true);
    
    try {
      const response = await fetch('http://localhost:5000/customize-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          image: actionData.processedImageUrl,
          background: backgroundType
        })
      }).catch(error => {
        console.error('Fetch error:', error);
        throw new Error(`Failed to connect to customization service: ${error.message}`);
      });
      
      if (!response.ok) {
        throw new Error(`Customization failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.processedImageUrl) {
        setCustomizedImageUrl(result.processedImageUrl);
      } else {
        throw new Error(result.error || 'Unknown error during customization');
      }
    } catch (error) {
      // Show error message to user
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to customize product');
      }
    } finally {
      setIsCustomizing(false);
    }
  };

  useEffect(() => {
    if (actionData?.success && actionData?.processedImageUrl) {
      // When processing is complete and successful, set the customized image URL
      setCustomizedImageUrl(actionData.processedImageUrl);
    }
  }, [actionData]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />

      {/* Hero Section with 3D Elements */}
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-primary-100 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-secondary-200 opacity-50 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 md:pt-20 md:pb-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 animate-fade-in">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6 border border-primary-100">
                <span className="flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                </span>
                Deep Learning Technology
                </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-neutral-900 leading-tight font-primary">
                <span className="text-neutral-900">Remove</span> <br className="hidden sm:block" />
                <span className="text-primary-600">Backgrounds</span> <br className="hidden sm:block" />
                <span className="text-neutral-900">with Deep Learning</span>
              </h1>
              
              <p className="mt-6 text-xl text-neutral-600 max-w-2xl">
                Transform your product images in seconds with our deep learning technology. Extract objects with precision for transparent backgrounds or solid colors with just a few clicks.
              </p>
              
              <div className="mt-10 flex flex-wrap gap-4">
                <a href="#upload-section" className="btn-primary inline-flex items-center shadow-lg text-white px-6 py-3 rounded-xl font-bold">
                  Start Creating
                  <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
                <Link to="/docs" className="btn-outline inline-flex items-center">
                  Read Documentation
                  <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
              </Link>
            </div>
            
              <div className="mt-10 grid grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-neutral-900">Precise Segmentation</h3>
                  <p className="mt-1 text-xs text-neutral-500">Clean edges with no artifacts</p>
            </div>
            
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 text-secondary-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path fillRule="evenodd" d="M3 9a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 9zm0 6.75a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                </svg>
            </div>
                  <h3 className="mt-3 text-sm font-semibold text-neutral-900">Background Options</h3>
                  <p className="mt-1 text-xs text-neutral-500">Transparent, white, or black</p>
          </div>
          
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary-100 text-tertiary-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                    </svg>
              </div>
                  <h3 className="mt-3 text-sm font-semibold text-neutral-900">Local Processing</h3>
                  <p className="mt-1 text-xs text-neutral-500">No cloud services needed</p>
            </div>
        </div>
            </div>
            
            {/* Hero Image */}
            <div className="order-1 lg:order-2 animate-float">
              <div className="relative w-full h-full flex justify-center">
                <div className="relative w-full max-w-lg">
                  {/* Image collage with sample results */}
                  <div className="absolute -right-4 -top-24 w-44 h-56 rounded-2xl overflow-hidden shadow-primary-lg transform rotate-3 animate-float">
                    <img src="/images/result-1.svg" alt="Deep learning enhanced product" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute left-4 top-12 w-56 h-72 rounded-2xl overflow-hidden shadow-primary-lg transform -rotate-6 animate-float-slow">
                    <img src="/images/result-2.svg" alt="Deep learning enhanced product" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -right-8 bottom-0 w-48 h-64 rounded-2xl overflow-hidden shadow-primary-lg transform rotate-6 animate-float">
                    <img src="/images/result-3.svg" alt="Deep learning enhanced product" className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Central card with product showcase */}
                  <div className="relative mx-auto h-96 w-72 rounded-2xl bg-white shadow-lg border border-neutral-100 animate-fade-in overflow-hidden">
                    {/* Background image grid */}
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-10">
                      <div className="bg-[url('https://images.unsplash.com/photo-1560343090-f0409e92791a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80')] bg-cover"></div>
                      <div className="bg-[url('https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80')] bg-cover"></div>
                      <div className="bg-[url('https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80')] bg-cover"></div>
                      <div className="bg-[url('https://images.unsplash.com/photo-1611930022073-84a47d27e4e6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80')] bg-cover"></div>
                    </div>
                    
                    {/* Logo and content */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 backdrop-blur-sm">
                      <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center mb-6 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                          <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                </svg>
            </div>
                      
                      <h3 className="text-2xl font-bold text-neutral-900 mb-3">SpectrumBG</h3>
                      
                      <p className="text-center text-neutral-700 mb-5">
                        Transform your product images with powerful deep learning technology
                      </p>
          </div>
        </div>
      </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="flex-grow bg-white">
        <div id="upload-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold font-primary text-neutral-900 mb-4">Remove Background from Any Image</h2>
            <p className="text-lg text-neutral-600">Upload your image and let our deep learning technology do the work. Get precise background removal with transparent, white, or black backgrounds in seconds.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Upload Panel */}
            <div className="lg:col-span-5 order-1">
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 shadow-soft-lg">
                <div className="flex items-center mb-6">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                  <h3 className="ml-3 text-xl font-semibold text-neutral-900">Upload Image</h3>
                  </div>
                  
                <RemixForm method="post" className="space-y-6" encType="multipart/form-data">
                  {/* File upload dropzone */}
                    <div 
                    className={`relative flex flex-col items-center justify-center h-64 border-2 ${
                      dragActive ? 'border-primary-400 bg-primary-50' : 'border-dashed border-neutral-300'
                    } rounded-xl cursor-pointer transition-colors overflow-hidden`}
                      onDragOver={handleDrag}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                            <img
                              src={previewUrl}
                              alt="Selected product"
                          className="object-contain h-full w-full"
                            />
                        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                            className="bg-white text-neutral-900 p-2 rounded-full hover:bg-neutral-100"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the file dialog when removing image
                                setPreviewUrl(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                        </div>
                          </div>
                        ) : (
                      <div className="flex flex-col items-center text-center p-6">
                        <div className="h-16 w-16 mb-4 rounded-full bg-primary-50 flex items-center justify-center text-primary-400">
                          <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                        </div>
                        <h4 className="text-base font-medium text-neutral-900 mb-1">
                          Drag & drop your image here
                        </h4>
                        <p className="text-sm text-neutral-500 mb-3">or click to browse files</p>
                        <span className="text-xs inline-flex items-center bg-white px-2.5 py-1 rounded-full border border-neutral-200 text-neutral-600">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1 text-primary-500">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                          </svg>
                          PNG, JPG, WEBP up to 10MB
                              </span>
                      </div>
                    )}
                              <input
                                id="file-upload"
                                name="file"
                                type="file"
                                className="sr-only"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                              />
                    </div>

                    {/* Hidden field to store the base64 image data */}
                    <input 
                      type="hidden"
                      name="imageBase64"
                      value={previewUrl || ''}
                    />

                  {/* Hidden field to store the backgroundType */}
                  <input 
                    type="hidden"
                            name="backgroundType"
                    value={backgroundType}
                  />
                  
                  {/* Error message */}
                  {errorMessage && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2 text-red-500">
                          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                        </svg>
                        {errorMessage}
                        </div>
                      </div>
                  )}
                  
                  {/* Options Section */}
                  <div className="space-y-4 pt-4 border-t border-neutral-200">
                    <h4 className="text-lg font-semibold text-neutral-900 pb-2">Background Options</h4>
                    
                    {/* Background Type Selector */}
                      <div>
                      <label htmlFor="backgroundType" className="block text-sm font-medium text-neutral-800 mb-2">
                        Background Color
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['transparent', 'white', 'black'].map((bg) => (
                          <div
                            key={bg}
                            onClick={() => setBackgroundType(bg as BackgroundOption)}
                            className={`
                              bg-option flex flex-col items-center p-3 rounded-lg border cursor-pointer
                              ${backgroundType === bg ? 'selected border-primary-600 bg-primary-50' : 'border-neutral-300 hover:border-primary-400'}
                            `}
                          >
                            <div className="h-12 w-full rounded mb-2 overflow-hidden border border-neutral-200">
                              {bg === 'transparent' && (
                                <div className="h-full w-full" style={{
                                  backgroundImage: `
                                    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                                    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                                    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                                    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                                  `,
                                  backgroundSize: '10px 10px',
                                  backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                                }}>
                                  <div className="flex items-center justify-center h-full w-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                      </div>
                    </div>
                              )}
                              {bg === 'white' && (
                                <div className="h-full w-full bg-white">
                                  <div className="flex items-center justify-center h-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      </div>
                              )}
                              {bg === 'black' && (
                                <div className="h-full w-full bg-black">
                                  <div className="flex items-center justify-center h-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      </div>
                              )}
                      </div>
                            <span className="text-sm font-semibold text-neutral-800 truncate">
                              {bg.charAt(0).toUpperCase() + bg.slice(1)}
                            </span>
                      </div>
                        ))}
                </div>
              </div>
            </div>

                  {/* Process Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={!imageBase64 || isProcessing}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!image || !imageBase64) return;
                        
                        setErrorMessage(null);
                        
                        // Create FormData object
                        const formData = new FormData();
                        
                        // Add required fields to FormData
                        formData.append('imageBase64', imageBase64);
                        formData.append('processingMethod', 'local');
                        formData.append('backgroundType', backgroundType);
                        
                        // Submit the form
                        submit(formData, { method: 'post' });
                      }}
                      className={`
                        w-full flex items-center justify-center px-5 py-4 border border-transparent text-lg font-semibold rounded-xl
                        ${!imageBase64 || isProcessing
                          ? 'btn-primary cursor-not-allowed'
                          : 'btn-outline hover:shadow-xl transition-all'}
                      `}
                    >
              {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                          <span className=" font-bold">Processing...</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2 ">
                            <path fillRule="evenodd" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                          </svg>
                          <span className=" font-bold">Process with Deep Learning</span>
                        </>
                      )}
                    </button>
                      </div>
                </RemixForm>
                    </div>
              {/* Floating result info card - only show after processing */}
              {actionData?.processedImageUrl && (
                <div className="mt-6 bg-white rounded-2xl p-6 max-w-[280px] shadow-lg border border-neutral-200">
                  <h4 className="text-lg font-bold text-neutral-900 mb-2">Processing Complete</h4>
                  <p className="text-sm text-neutral-700 mb-4">Your image has been successfully processed with deep learning.</p>
                  
                  <div className="flex flex-col space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Background</span>
                      <span className="font-semibold text-neutral-900 capitalize">{actionData?.backgroundType || backgroundType}</span>
                      </div>
                    </div>
                  </div>
              )}
                    </div>
                    
            {/* Results Panel */}
            <div className="lg:col-span-7 order-2">
              <div className="h-full">
                {actionData?.processedImageUrl ? (
                  <div className="space-y-6">
                    <div className="relative rounded-2xl overflow-hidden" style={{
                      backgroundImage: `
                        linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                        linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                        linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                      `,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}>
                      <div className="aspect-w-4 aspect-h-3 w-full max-h-[500px] flex items-center justify-center">
                        <img 
                          src={actionData.processedImageUrl} 
                          alt="Processed" 
                          className="max-w-full max-h-full object-contain" 
                          />
                        </div>
                      </div>
                      
                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button 
                        onClick={handleDownload}
                        className="w-full btn-primary inline-flex items-center justify-center rounded-xl font-bold py-3"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        Download Image
                        </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-12">
                    <div className="relative w-32 h-32 mb-6">
                      <div className="absolute -top-3 -right-3 w-24 h-24 bg-secondary-100 rounded-lg transform rotate-6 animate-float"></div>
                      <div className="absolute -bottom-2 -left-2 w-24 h-24 bg-primary-100 rounded-lg transform -rotate-3 animate-float-slow"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative h-20 w-20 rounded-xl bg-white flex items-center justify-center shadow-soft-lg z-10">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-primary-500">
                            <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" />
                          </svg>
                      </div>
                    </div>
                  </div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">Your enhanced product will appear here</h3>
                    <p className="text-center text-neutral-600 mb-6 max-w-md">
                      Upload your product image and click "Process with Deep Learning" to see the magic happen in seconds!
                    </p>
                    <div className="flex gap-4 text-sm text-neutral-500">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1.5 text-primary-400">
                          <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                        High quality
                </div>
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1.5 text-primary-400">
                          <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.06 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.75.75 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                        Secure processing
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1.5 text-primary-400">
                          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                          </svg>
                        Fast results
                        </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </main>

     

      <Footer />
      
      {/* Help Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      About This App
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        This application uses a deep learning model to remove backgrounds from product images.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Follow these steps to get started:
                      </p>
                      <ol className="list-decimal list-inside text-sm text-gray-500 mt-2">
                        <li>Upload an image using the file uploader or by dragging and dropping.</li>
                        <li>Wait for the deep learning model to process the image and remove the background.</li>
                        <li>Choose customization options if desired.</li>
                        <li>Download your processed image.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setModalOpen(false)}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 