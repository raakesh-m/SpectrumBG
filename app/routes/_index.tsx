import { useState, useEffect, useRef } from 'react';
import { ActionFunctionArgs, json } from '@remix-run/node';
import { Form as RemixForm, useActionData, useSubmit, useNavigation, Link } from '@remix-run/react';
import { 
  Card, 
  FormLayout, 
  Button, 
  Select,
  Banner,
  SkeletonBodyText,
  Spinner,
  Modal,
  TextContainer,
  ChoiceList
} from '@shopify/polaris';

// Define types for background and model options
type BackgroundOption = 'transparent' | 'white' | 'black' | 'gray' | 'studio-light' | 'studio-dark' | 'ai-generated';
type ModelOverlayOption = 'none' | 'model-standing' | 'model-wearing' | 'mannequin' | 'flat-lay';

// Define the action data type
type ActionData = {
  success: boolean;
  processedImageUrl?: string;
  error?: string;
  errorMessage?: string;
  isConnectionError?: boolean;
  processingMethod?: 'local' | 'api';
  backgroundType?: BackgroundOption;
  modelType?: ModelOverlayOption;
};

// Function to choose the appropriate background removal method
async function processImage(imageBase64: string, useLocalProcessing: boolean = true) {
  if (useLocalProcessing) {
    return useLocalBackgroundRemoval(imageBase64);
  } else {
    return useRemoveBgApi(imageBase64);
  }
}

// Function to use the local background removal endpoint with U-2-Net
async function useLocalBackgroundRemoval(imageBase64: string) {
  try {
    console.log('Using U-2-Net for background removal...');
    
    // First try to check if the server is running by calling the health endpoint
    try {
      console.log('Checking U-2-Net server health at http://localhost:5000/health...');
      const healthResponse = await fetch('http://localhost:5000/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!healthResponse.ok) {
        console.error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
        throw new Error(`U-2-Net server health check failed. Server might be starting up or has issues.`);
      } else {
        const healthData = await healthResponse.json();
        console.log('Server health check:', healthData);
        
        if (!healthData.model_loaded) {
          throw new Error(`U-2-Net model not loaded properly. Check server logs.`);
        }
      }
    } catch (healthError) {
      if (healthError instanceof Error) {
        if (healthError.message.includes('fetch') || healthError.message.includes('Failed to fetch')) {
          throw new Error(`Could not connect to U-2-Net server. Make sure it's running at http://localhost:5000. Try running 'python python_backend/simplified_u2net_server.py' in your terminal.`);
        }
        throw healthError;
      }
      throw new Error(`Could not connect to U-2-Net server: ${String(healthError)}`);
    }
    
    // Call the U-2-Net Flask API server with proper error handling
    let response;
    try {
      console.log('Connecting to U-2-Net server at http://localhost:5000...');
      response = await fetch('http://localhost:5000/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          image: imageBase64
        })
      });
      console.log(`Server response status: ${response.status} ${response.statusText}`);
    } catch (fetchError) {
      console.error("Connection error:", fetchError);
      throw new Error(`Could not connect to U-2-Net server. Make sure it's running at http://localhost:5000 by running 'python python_backend/simplified_u2net_server.py'.`);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => response.text());
      console.error("U-2-Net API Error:", errorData);
      
      if (typeof errorData === 'object' && errorData.error) {
        throw new Error(`U-2-Net API error: ${errorData.error}`);
      } else {
        throw new Error(`U-2-Net API error: ${response.status} ${response.statusText}`);
      }
    }
    
    // Process successful response
    const data = await response.json();
    console.log('Successfully received processed image from U-2-Net server');
    return data.processedImageUrl;
  } catch (error) {
    console.error('U-2-Net background removal error:', error);
    throw error;
  }
}

// Function to remove background using Remove.bg API (kept as fallback)
async function useRemoveBgApi(imageBase64: string) {
  try {
    // Get API key from environment variables
    const apiKey = process.env.REMOVE_BG_API_KEY || "YOUR_API_KEY";
    
    if (apiKey === "YOUR_API_KEY") {
      throw new Error("No API key provided. Please add your Remove.bg API key to the .env file.");
    }
    
    // Remove the data URL prefix for the API
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    // Create the request body as per Remove.bg API requirements
    const body = JSON.stringify({
      image_file_b64: base64Data,
      size: 'auto',
      format: 'png',
      type: 'product'  // Specify it's a product image for better results
    });
    
    // Make the API request with correct headers
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',  // Use JSON format for cleaner request
        'Accept': 'application/json'
      },
      body: body
    });
    
    // Handle API errors with appropriate messages
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Remove.bg API Error:", errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    // Process successful response
    const data = await response.json();
    return `data:image/png;base64,${data.data.result_b64}`;
  } catch (error) {
    console.error('Background removal error:', error);
    throw error; // Re-throw to handle in the action function
  }
}

// Function to apply a colored background
function applyBackground(transparentImageUrl: string, backgroundColor: string) {
  // In a real implementation, this would composite the transparent image onto a colored background
  // For simplicity in this demo, we're just returning the transparent image
  return transparentImageUrl;
}

export const action = async ({ 
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData();

  const imageBase64 = formData.get('imageBase64')?.toString() || '';
  const processingMethod = formData.get('processingMethod')?.toString() as 'local' | 'api' || 'local';
  const backgroundType = formData.get('backgroundType')?.toString() as BackgroundOption || 'transparent';
  const modelType = formData.get('modelType')?.toString() as ModelOverlayOption || 'none';
  
  console.log('Processing method:', processingMethod);
  console.log('Background type:', backgroundType);
  console.log('Model type:', modelType);
  
  try {
    let processedImageUrl;
    
    if (processingMethod === 'local') {
      try {
        // First, use the existing endpoint to remove background
        console.log('Using remove-background endpoint...');
        
        // Check if the server is running
        try {
          console.log('Checking U-2-Net server health at http://localhost:5000/health...');
          const healthResponse = await fetch('http://localhost:5000/health', {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (!healthResponse.ok) {
            console.error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
            throw new Error(`U-2-Net server health check failed. Server might be starting up or has issues.`);
          }
        } catch (healthError) {
          if (healthError instanceof Error) {
            if (healthError.message.includes('fetch') || healthError.message.includes('Failed to fetch')) {
              throw new Error(`Could not connect to U-2-Net server. Make sure it's running at http://localhost:5000. Try running 'python python_backend/simplified_u2net_server.py' in your terminal.`);
            }
            throw healthError;
          }
          throw new Error(`Could not connect to U-2-Net server: ${String(healthError)}`);
        }
        
        // Use traditional background removal endpoint
        const response = await fetch('http://localhost:5000/remove-background', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageBase64
          })
        });
        
        if (!response.ok) {
          throw new Error(`Background removal failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.processedImageUrl) {
          processedImageUrl = result.processedImageUrl;
          
          // If customization is requested, add it in a second step
          if ((backgroundType !== 'transparent' || (modelType && modelType !== 'none')) && result.processedImageUrl) {
            try {
              console.log('Applying customization using customize-product endpoint...');
              const customizeResponse = await fetch('http://localhost:5000/customize-product', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  image: processedImageUrl,
                  backgroundType,
                  modelType: modelType === 'none' ? null : modelType
                })
              });
              
              if (!customizeResponse.ok) {
                console.error(`Customization failed: ${customizeResponse.status} ${customizeResponse.statusText}`);
                // Continue with just the background-removed image
              } else {
                const customizeResult = await customizeResponse.json();
                if (customizeResult.success && customizeResult.processedImageUrl) {
                  processedImageUrl = customizeResult.processedImageUrl;
                }
              }
            } catch (customizeError) {
              console.error('Customization error:', customizeError);
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
            error.message.includes('Could not connect to U-2-Net server') ||
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
    } else {
      // API processing would go here
      try {
        processedImageUrl = await useRemoveBgApi(imageBase64);
      } catch (error) {
        console.error('API error details:', error);
        
        let errorMessage = 'Failed to remove background';
        
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        return json<ActionData>({ 
          success: false, 
          error: errorMessage,
          errorMessage,
          processingMethod
        });
      }
    }
    
    return json<ActionData>({
      success: true,
      processedImageUrl,
      processingMethod,
      backgroundType,
      modelType
    });
  } catch (error) {
    console.error('Unknown error:', error);
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
          Learn how to use the AI-Enhanced Product Customizer to transform your product images.
        </p>
      </div>
      <div className="mt-3">
        <Link
          to="/docs"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
  const [processingMethod, setProcessingMethod] = useState<'local' | 'api'>('local');

  // Add state for customization options
  const [backgroundType, setBackgroundType] = useState<BackgroundOption>('transparent');
  const [modelType, setModelType] = useState<ModelOverlayOption>('none');
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
    // If using remove.bg API, disable customization options
    if (processingMethod === 'api') {
      setCustomizationDisabled(true);
      setBackgroundType('transparent');
      setModelType('none');
    } else {
      setCustomizationDisabled(false);
    }
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
      link.download = 'enhanced-product.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle "Use in Store" button click
  const handleUseInStore = () => {
    setModalContent('Your enhanced image has been processed and is ready to be used in your store. In a production environment, this would connect to your e-commerce platform API.');
    setModalOpen(true);
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
        },
        body: JSON.stringify({
          image: actionData.processedImageUrl,
          backgroundType,
          modelType: modelType === 'none' ? null : modelType
        })
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
      console.error('Customization error:', error);
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
              <Link to="/" className="text-base font-medium text-white border-b-2 border-white py-1">
                App
              </Link>
              <Link to="/docs" className="text-base font-medium text-white opacity-80 hover:opacity-100 hover:border-b-2 hover:border-white py-1 transition-all">
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
              Transform Product Images with AI
            </h1>
            <p className="max-w-3xl mx-auto text-base sm:text-xl text-accent mb-10">
              Use advanced machine learning to automatically remove backgrounds and enhance your product photos.
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#upload-section" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-darkest bg-accent hover:bg-white transition-colors">
                Get Started
                <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
              <Link to="/docs" className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-colors">
                Learn More
                <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-grow bg-accent bg-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div id="upload-section" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-primary-light p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="ml-4 text-xl font-bold text-gray-800">Upload Your Product</h2>
                  </div>
                  
                  <RemixForm method="post" className="mt-6 space-y-6" encType="multipart/form-data">
                    {/* File upload area */}
                    <div 
                      className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${dragActive ? 'border-primary-dark bg-accent bg-opacity-10' : 'border-gray-300'} border-dashed rounded-md relative overflow-hidden cursor-pointer`}
                      onDragOver={handleDrag}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="space-y-4 text-center">
                        {previewUrl ? (
                          <div className="relative h-48 w-full flex justify-center">
                            <img
                              src={previewUrl}
                              alt="Selected product"
                              className="object-contain h-full"
                            />
                            <button
                              type="button"
                              className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-full hover:bg-primary-dark"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the file dialog when removing image
                                setPreviewUrl(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <>
                            <svg className="mx-auto h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <div className="text-sm text-gray-600">
                              <span className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark">
                                Upload a file
                              </span>
                              <p className="pl-1">or drag and drop</p>
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
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Hidden field to store the base64 image data */}
                    <input 
                      type="hidden"
                      name="imageBase64"
                      value={previewUrl || ''}
                    />

                    {/* Processing Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Processing Method</label>
                      <select
                        name="processingMethod"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg"
                        defaultValue="local"
                        onChange={(e) => setProcessingMethod(e.target.value as 'local' | 'api')}
                      >
                        <option value="local">U-2-Net (Simple Local AI)</option>
                        <option value="api">Remove.bg API (Cloud)</option>
                      </select>
                      <p className="mt-1 text-sm text-gray-500">
                        {processingMethod === 'local' ? 
                          'Uses local AI processing. No API key required.' : 
                          'Uses cloud-based processing. Requires API key in .env file.'}
                      </p>
                    </div>

                    {/* ADDED: Customization Options */}
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">
                        Customization Options
                        {customizationDisabled && (
                          <span className="ml-2 text-sm text-red-500">
                            (Disabled when using Remove.bg API)
                          </span>
                        )}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Background options */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
                          <select
                            name="backgroundType"
                            value={backgroundType}
                            onChange={(e) => setBackgroundType(e.target.value as BackgroundOption)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg"
                            disabled={customizationDisabled}
                          >
                            <optgroup label="Basic">
                              <option value="transparent">Transparent (No Background)</option>
                              <option value="white">White</option>
                              <option value="black">Black</option>
                              <option value="gray">Light Gray</option>
                            </optgroup>
                            <optgroup label="Studio">
                              <option value="studio-light">Studio Light</option>
                              <option value="studio-dark">Studio Dark</option>
                            </optgroup>
                            <optgroup label="AI Generated">
                              <option value="ai-generated">AI Generated Background</option>
                            </optgroup>
                          </select>
                        </div>
                        
                        {/* Model overlay options */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Model Overlay</label>
                          <select
                            name="modelType"
                            value={modelType}
                            onChange={(e) => setModelType(e.target.value as ModelOverlayOption)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg"
                            disabled={customizationDisabled}
                          >
                            <option value="none">None</option>
                            <option value="model-standing">Model (Standing)</option>
                            <option value="mannequin">Mannequin</option>
                            <option value="flat-lay">Flat Lay</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button - Updated text */}
                    <div>
                      <button
                        type="submit"
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${!previewUrl ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'} transition-colors`}
                        disabled={!previewUrl}
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>Process & Customize Image</>
                        )}
                      </button>
                    </div>
                  </RemixForm>
                </div>
              </div>
              
              {/* Features Section */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Advanced Features</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">Intelligent Background Removal</p>
                        <p className="mt-1 text-xs text-gray-500">Automatically detects and removes backgrounds with precision</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">High-Quality Results</p>
                        <p className="mt-1 text-xs text-gray-500">Preserves edges and fine details like hair and fur</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">Transparent PNG Output</p>
                        <p className="mt-1 text-xs text-gray-500">Download images with transparent backgrounds for versatile use</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="space-y-6">
              {previewUrl ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-secondary-light p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <h2 className="ml-4 text-xl font-bold text-gray-800">Original Image</h2>
                    </div>
                    
                    <div className="mt-6 bg-gray-50 border rounded-lg overflow-hidden shadow-sm">
                      <img
                        src={previewUrl}
                        alt="Original"
                        className="w-full h-auto object-contain max-h-80 sm:max-h-96"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-gray-200 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <h2 className="ml-4 text-xl font-bold text-gray-800">Preview Area</h2>
                    </div>
                    
                    <div className="mt-6 bg-gray-50 border border-dashed rounded-lg p-10 flex items-center justify-center">
                      <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-4 text-gray-500">Upload an image to see it here</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isProcessing ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-100 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <h2 className="ml-4 text-xl font-bold text-gray-800">Processing...</h2>
                    </div>
                    
                    <div className="mt-6 bg-gray-50 border rounded-lg p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded-lg"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded-lg"></div>
                        <div className="h-48 bg-gray-200 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : actionData?.processedImageUrl && customizedImageUrl && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-light p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <h2 className="ml-4 text-xl font-bold text-gray-800">Customized Product</h2>
                    </div>
                    
                    <div className="mt-6">
                      <div className="bg-gray-50 rounded-lg border overflow-hidden">
                        <div className="relative p-2">
                          <img 
                            src={customizedImageUrl} 
                            alt="Customized product" 
                            className="w-full h-auto object-contain max-h-96"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = customizedImageUrl;
                            link.download = 'customized-product.png';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Customized
                        </button>
                        <button 
                          onClick={handleUseInStore}
                          className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Use in Store
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-red-100 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="ml-4 text-xl font-bold text-gray-800">
                        {actionData?.isConnectionError ? "U-2-Net Server Not Connected" : "Processing Error"}
                      </h2>
                    </div>
                    
                    <div className="mt-6 bg-red-50 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            {actionData?.isConnectionError ? "Connection Error" : "Processing Failed"}
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{errorMessage}</p>
                            
                            {actionData?.isConnectionError && (
                              <div className="mt-4 border-t border-red-200 pt-4 space-y-2">
                                <p className="font-medium">To fix this issue:</p>
                                <ol className="list-decimal list-inside space-y-1 text-xs">
                                  <li>Make sure the U-2-Net server is running</li>
                                  <li>Run <code className="px-1 py-0.5 bg-red-100 rounded font-mono">python python_backend/simplified_u2net_server.py</code> in your terminal</li>
                                  <li>Wait for the server to start (it may take a moment to load the model)</li>
                                  <li>Try uploading and processing your image again</li>
                                </ol>
                              </div>
                            )}
                            
                            {!actionData?.isConnectionError && actionData?.processingMethod === 'api' && (
                              <div className="mt-4 border-t border-red-200 pt-4 space-y-2">
                                <p className="font-medium">To use the Remove.bg API:</p>
                                <ol className="list-decimal list-inside space-y-1 text-xs">
                                  <li>Sign up at <a href="https://www.remove.bg/api" className="text-red-800 underline" target="_blank" rel="noopener noreferrer">Remove.bg</a> to get an API key</li>
                                  <li>Add your key to the <code className="px-1 py-0.5 bg-red-100 rounded font-mono">.env</code> file</li>
                                  <li>Or try using the U-2-Net local processing option instead</li>
                                </ol>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
      
      {/* Modal for Use in Store action */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Store Integration"
      >
        <Modal.Section>
          <TextContainer>
            <p>{modalContent}</p>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </div>
  );
} 