import os
import sys
import base64
import io
from PIL import Image
import numpy as np
import torch
from torch.autograd import Variable
import torchvision.transforms as transforms
from flask import Flask, request, jsonify, render_template_string, Response
from flask_cors import CORS
import logging
import argparse
import json
import random
import time
import torch.nn.functional as F

# Initialize Flask app and configure CORS
app = Flask(__name__)
# Enable CORS for all routes and all origins
CORS(app, resources={r"/*": {"origins": "*"}})

# Enable logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('u2net-server')

# Set up command line arguments parser
parser = argparse.ArgumentParser(description='U-2-Net Background Removal Server')
parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to run the server on')
parser.add_argument('--port', type=int, default=5000, help='Port to run the server on')
parser.add_argument('--debug', action='store_true', help='Run in debug mode')
parser.add_argument('--model', type=str, default='u2net', choices=['u2net', 'u2net_portrait'], 
                    help='Model to use for background removal')
args = parser.parse_args()

# Set production environment
PRODUCTION = os.environ.get('FLASK_ENV', 'production') == 'production'
if PRODUCTION:
    logger.info("Running in PRODUCTION mode")
else:
    logger.info("Running in DEVELOPMENT mode")

# Get current directory
current_dir = os.getcwd()
logger.info(f"Current working directory: {current_dir}")

# No longer need to add U-2-Net directory to path since we have local copies
# u2net_path = os.path.join(current_dir, 'U-2-Net-master')
# logger.info(f"Adding to path: {u2net_path}")
# sys.path.append(u2net_path)

try:
    # Import from local copies in python_backend
    from model import U2NET
    from data_loader import RescaleT, ToTensorLab
    logger.info("Successfully imported U-2-Net modules")
except ImportError as e:
    logger.error(f"Error importing U-2-Net modules: {e}")
    logger.error("Make sure you have installed all dependencies:")
    logger.error("pip install torch torchvision matplotlib scikit-image")
    sys.exit(1)

# Custom transform function that doesn't rely on the U-2-Net data_loader
class CustomRescale:
    def __init__(self, output_size):
        self.output_size = output_size
        
    def __call__(self, image):
        # Convert PIL image to numpy array
        img = np.array(image)
        
        # Resize to output_size
        img = Image.fromarray(img).resize((self.output_size, self.output_size), Image.BILINEAR)
        img = np.array(img)
        
        # Normalize to [0,1]
        img = img.astype(np.float32) / 255.0
        
        # Add normalization as in ToTensorLab
        if img.shape[2] == 3:  # RGB
            tmp_img = np.zeros((img.shape[0], img.shape[1], 3))
            tmp_img[:,:,0] = (img[:,:,0] - 0.485) / 0.229
            tmp_img[:,:,1] = (img[:,:,1] - 0.456) / 0.224
            tmp_img[:,:,2] = (img[:,:,2] - 0.406) / 0.225
        else:  # Grayscale or other
            tmp_img = np.zeros((img.shape[0], img.shape[1], 3))
            tmp_img[:,:,0] = (img[:,:,0] - 0.485) / 0.229
            tmp_img[:,:,1] = (img[:,:,0] - 0.485) / 0.229
            tmp_img[:,:,2] = (img[:,:,0] - 0.485) / 0.229
            
        # Convert to tensor format (channel first)
        tmp_img = tmp_img.transpose((2, 0, 1))
        
        # Convert to torch tensor
        tensor = torch.from_numpy(tmp_img).float()
        
        return tensor

def load_model(model_name='u2net'):
    model_dir = os.path.join(current_dir, 'saved_models', model_name, model_name + '.pth')
    
    logger.info(f"Loading {model_name} from {model_dir}")
    
    # Check if model exists
    if not os.path.exists(model_dir):
        logger.error(f"ERROR: Model file not found at {model_dir}")
        return None
    
    # Create model
    net = U2NET(3, 1)
    
    try:
        if torch.cuda.is_available():
            net.load_state_dict(torch.load(model_dir))
            net.cuda()
            net.eval()
            logger.info("Model loaded on CUDA")
        else:
            net.load_state_dict(torch.load(model_dir, map_location='cpu'))
            net.eval()
            logger.info("Model loaded on CPU")
        
        return net
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return None

def norm_pred(d):
    ma = torch.max(d)
    mi = torch.min(d)
    dn = (d-mi)/(ma-mi)
    return dn

def process_image(net, image):
    if net is None:
        raise ValueError("Model not loaded properly")
    
    logger.info(f"Processing image: {image.size}x{image.mode}")
    
    # Convert image to RGB if not already
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Apply custom transforms (resize and normalize)
    transform = CustomRescale(320)
    tensor = transform(image).unsqueeze(0)  # Add batch dimension
    
    # Move to GPU if available
    if torch.cuda.is_available():
        tensor = tensor.cuda()
    
    # Create variable for model
    inputs_test = Variable(tensor)
    
    # Forward pass
    with torch.no_grad():
        d1, d2, d3, d4, d5, d6, d7 = net(inputs_test)
    
    # Normalize prediction
    pred = d1[:, 0, :, :]
    pred = norm_pred(pred)
    
    # Convert to numpy
    predict = pred.squeeze()
    predict_np = predict.cpu().data.numpy()
    
    # Create mask image
    mask = Image.fromarray((predict_np * 255).astype(np.uint8))
    mask = mask.resize((image.width, image.height), Image.BILINEAR)
    
    # Create transparent result image
    result = Image.new('RGBA', (image.width, image.height), (0, 0, 0, 0))
    
    # Convert original to RGBA
    image = image.convert('RGBA')
    
    # Apply the mask
    mask_np = np.array(mask)
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = image.getpixel((x, y))
            if mask_np[y, x] > 100:  # Threshold
                result.putpixel((x, y), (r, g, b, 255))
    
    return result

# Dictionary of background preset colors
BACKGROUND_PRESETS = {
    'white': (255, 255, 255, 255),
    'black': (0, 0, 0, 255),
}

# Get the directory paths
current_dir = os.path.dirname(os.path.abspath(__file__))

def apply_background(image, background_type):
    """Apply a background to a transparent image"""
    if background_type == 'transparent':
        return image
    
    # Get image dimensions
    width, height = image.size
    
    # Create the background
    if background_type in ['white', 'black']:
        # Solid color background
        background = Image.new('RGBA', (width, height), BACKGROUND_PRESETS[background_type])
    else:
        # Default to white if unknown
        background = Image.new('RGBA', (width, height), (255, 255, 255, 255))
    
    # Paste the transparent image on top of the background
    composite = background.copy()
    composite.paste(image, (0, 0), image)
    
    return composite

# Add the required endpoints
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify server status"""
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'model_loaded': net is not None if 'net' in globals() else False
    })

@app.route('/', methods=['GET'])
def index():
    """Root endpoint with API information"""
    return jsonify({
        'name': 'Deep Learning Product Customizer API',
        'version': '1.0.0',
        'description': 'API for background removal and image customization',
        'endpoints': {
            '/': 'This API information',
            '/health': 'Health check endpoint',
            '/remove-background': 'Remove background from an image (POST)',
            '/customize-product': 'Apply customizations to an image (POST)'
        },
        'status': 'running'
    })

@app.route('/remove-background', methods=['POST'])
def remove_background():
    """Remove background from an image and return with transparent background"""
    if request.method == 'POST':
        try:
            # Get the image from the request
            data = request.json
            if not data or 'image' not in data:
                return jsonify({'success': False, 'error': 'No image provided'}), 400
            
            # Decode base64 image
            image_data = data['image']
            if image_data.startswith('data:image'):
                # Remove the data:image/jpeg;base64, prefix
                image_data = image_data.split(',')[1]
            
            # Decode the base64 string
            image_bytes = base64.b64decode(image_data)
            
            # Open the image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Process the image
            logger.info("Processing image for background removal...")
            result = process_image(net, image)
            
            # Save the result to a buffer
            buffer = io.BytesIO()
            result.save(buffer, format="PNG")
            buffer.seek(0)
            
            # Encode the buffer as base64
            img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return jsonify({
                'success': True,
                'processedImageUrl': f"data:image/png;base64,{img_str}"
            })
            
        except Exception as e:
            logger.error(f"Error removing background: {str(e)}")
            return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/customize-product', methods=['POST'])
def customize_product():
    """Apply customizations to an image (background color)"""
    if request.method == 'POST':
        try:
            # Get the image and background type from the request
            data = request.json
            if not data or 'image' not in data:
                return jsonify({'success': False, 'error': 'No image provided'}), 400
            
            # Get background type (default to transparent)
            # Check for both parameter names
            background_type = None
            if 'background' in data:
                background_type = data['background']
            elif 'backgroundType' in data:
                background_type = data['backgroundType']
            else:
                background_type = 'transparent'
                
            logger.info(f"Received background type: {background_type}")
            
            # Log all keys in the request for debugging
            logger.info(f"Request data keys: {list(data.keys())}")
            
            # Decode base64 image
            image_data = data['image']
            if image_data.startswith('data:image'):
                # Remove the data:image/jpeg;base64, prefix
                image_data = image_data.split(',')[1]
            
            # Decode the base64 string
            image_bytes = base64.b64decode(image_data)
            
            # Open the image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Apply background
            logger.info(f"Applying {background_type} background...")
            result = apply_background(image, background_type)
            
            # Save the result to a buffer
            buffer = io.BytesIO()
            result.save(buffer, format="PNG")
            buffer.seek(0)
            
            # Encode the buffer as base64
            img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return jsonify({
                'success': True,
                'processedImageUrl': f"data:image/png;base64,{img_str}",
                'backgroundType': background_type
            })
            
        except Exception as e:
            logger.error(f"Error customizing product: {str(e)}")
            return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    logger.info(f"Loading {args.model} model...")
    net = load_model(args.model)
    if net is None:
        logger.error("Failed to load model. Exiting.")
        sys.exit(1)
    
    logger.info("Model loaded successfully!")
    logger.info(f"Starting Flask server on http://{args.host}:{args.port}")
    
    # Set up caching and compression for production
    if PRODUCTION:
        from flask_compress import Compress
        Compress(app)
        
    app.run(host=args.host, port=args.port, debug=args.debug, threaded=True) 