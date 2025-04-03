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

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
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

app = Flask(__name__)
# Configure CORS for production
if PRODUCTION:
    # In production, be more restrictive with CORS
    CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://your-domain.com"]}})
else:
    # In development, allow all origins
    CORS(app)

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
    'gray': (220, 220, 220, 255),
}

# Get the directory paths
current_dir = os.path.dirname(os.path.abspath(__file__))
BACKGROUNDS_DIR = os.path.join(current_dir, "assets", "backgrounds")
MODELS_DIR = os.path.join(current_dir, "assets", "models")

# Dictionary of model overlay templates
MODEL_OVERLAY_TEMPLATES = {
    'model-standing': 'model-standing.png',
    'mannequin': 'mannequin.png',
    'flat-lay': 'flat-lay.png',
}

# Check if we have real studio backgrounds
def get_available_backgrounds():
    backgrounds = {}
    
    # Check for studio light backgrounds
    studio_light_backgrounds = [f for f in os.listdir(BACKGROUNDS_DIR) if f.startswith('studio-light-') and f.endswith('.jpg')]
    if studio_light_backgrounds:
        backgrounds['studio-light'] = studio_light_backgrounds
    
    # Check for studio dark backgrounds
    studio_dark_backgrounds = [f for f in os.listdir(BACKGROUNDS_DIR) if f.startswith('studio-dark-') and f.endswith('.jpg')]
    if studio_dark_backgrounds:
        backgrounds['studio-dark'] = studio_dark_backgrounds
    
    return backgrounds

# Check if we have real model overlay images
def get_available_model_overlays():
    available_models = {}
    
    for model_name, model_file in MODEL_OVERLAY_TEMPLATES.items():
        model_path = os.path.join(MODELS_DIR, model_file)
        if os.path.exists(model_path):
            available_models[model_name] = model_path
            
    return available_models

# Dictionary to store available backgrounds and models
try:
    AVAILABLE_BACKGROUNDS = get_available_backgrounds()
    logger.info(f"Found background images: {AVAILABLE_BACKGROUNDS}")
    
    AVAILABLE_MODELS = get_available_model_overlays()
    logger.info(f"Found model overlay images: {list(AVAILABLE_MODELS.keys())}")
except Exception as e:
    logger.warning(f"Could not load assets: {e}")
    AVAILABLE_BACKGROUNDS = {}
    AVAILABLE_MODELS = {}

def generate_background(width, height, style='gradient'):
    """Generate a synthetic background based on the requested style"""
    background = Image.new('RGBA', (width, height), (255, 255, 255, 255))
    
    if style == 'gradient':
        # Create a gradient background (top to bottom)
        from PIL import ImageDraw
        draw = ImageDraw.Draw(background)
        
        # Choose some random gradient colors
        colors = [
            (245, 245, 245), (235, 235, 235), (225, 225, 225), 
            (215, 215, 215), (205, 205, 205), (195, 195, 195)
        ]
        
        color1 = random.choice(colors)
        color2 = random.choice(colors)
        
        for y in range(height):
            # Calculate gradient color at this y position
            r = int(color1[0] + (color2[0] - color1[0]) * (y / height))
            g = int(color1[1] + (color2[1] - color1[1]) * (y / height))
            b = int(color1[2] + (color2[2] - color1[2]) * (y / height))
            
            draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    elif style == 'studio-light':
        # Create a radial gradient like a studio backdrop
        from PIL import ImageDraw, ImageFilter
        draw = ImageDraw.Draw(background)
        
        # Draw a white background
        draw.rectangle([(0, 0), (width, height)], fill=(255, 255, 255))
        
        # Create a radial gradient
        center_x, center_y = width // 2, height // 2
        max_radius = max(width, height)
        
        for r in range(0, max_radius, 2):
            # Calculate gradient value based on distance from center
            gray_value = max(230, 255 - (r * 25 // max_radius))
            
            # Draw a circle with decreasing brightness
            draw.ellipse(
                [(center_x - r, center_y - r), (center_x + r, center_y + r)],
                outline=(gray_value, gray_value, gray_value)
            )
        
        # Blur the image for smoother gradient
        background = background.filter(ImageFilter.GaussianBlur(radius=10))
    
    elif style == 'studio-dark':
        # Create a dark radial gradient
        from PIL import ImageDraw, ImageFilter
        draw = ImageDraw.Draw(background)
        
        # Draw a dark background
        draw.rectangle([(0, 0), (width, height)], fill=(30, 30, 30))
        
        # Create a radial gradient
        center_x, center_y = width // 2, height // 2
        max_radius = max(width, height)
        
        for r in range(0, max_radius, 2):
            # Calculate gradient value based on distance from center
            gray_value = max(20, 50 - (r * 30 // max_radius))
            
            # Draw a circle with decreasing brightness
            draw.ellipse(
                [(center_x - r, center_y - r), (center_x + r, center_y + r)],
                outline=(gray_value, gray_value, gray_value)
            )
        
        # Blur the image for smoother gradient
        background = background.filter(ImageFilter.GaussianBlur(radius=10))
    
    return background

def apply_background(image, background_type):
    """Apply a background to a transparent image"""
    if background_type == 'transparent':
        return image
    
    # Get image dimensions
    width, height = image.size
    
    # Create the background
    if background_type in ['white', 'black', 'gray']:
        # Solid color background
        background = Image.new('RGBA', (width, height), BACKGROUND_PRESETS[background_type])
    
    elif background_type in ['studio-light', 'studio-dark']:
        # Check if we have real studio backgrounds available
        if background_type in AVAILABLE_BACKGROUNDS and AVAILABLE_BACKGROUNDS[background_type]:
            # Use a real studio background image
            try:
                # Select a random background from the available ones
                bg_filename = random.choice(AVAILABLE_BACKGROUNDS[background_type])
                bg_path = os.path.join(BACKGROUNDS_DIR, bg_filename)
                logger.info(f"Using real background image: {bg_path}")
                
                # Open and resize the background image
                background = Image.open(bg_path).convert('RGBA')
                background = background.resize((width, height), Image.Resampling.LANCZOS)
            except Exception as e:
                logger.error(f"Error using real background, falling back to generated: {e}")
                # Fall back to generated background
                background = generate_background(width, height, style=background_type)
        else:
            # Generate a studio backdrop
            logger.info(f"No real backgrounds found for {background_type}, using generated")
            background = generate_background(width, height, style=background_type)
    
    elif background_type == 'ai-generated':
        # In a real app, you'd call an AI model to generate a background
        # For now, we'll just create a gradient as a placeholder
        background = generate_background(width, height, style='gradient')
    
    else:
        # Default to white if unknown
        background = Image.new('RGBA', (width, height), (255, 255, 255, 255))
    
    # Paste the transparent image on top of the background
    composite = background.copy()
    composite.paste(image, (0, 0), image)
    
    return composite

def apply_model_overlay(product_image, model_type):
    """Apply product to a model image template"""
    width, height = product_image.size
    
    # Check if we have a real model overlay image
    if model_type in AVAILABLE_MODELS:
        try:
            # Load the model overlay image
            model_path = AVAILABLE_MODELS[model_type]
            logger.info(f"Using real model overlay: {model_path}")
            
            model_image = Image.open(model_path).convert('RGBA')
            
            # Resize the model image to fit the product
            orig_width, orig_height = model_image.size
            scale_factor = min(width * 1.5 / orig_width, height * 2.5 / orig_height)
            new_width = int(orig_width * scale_factor)
            new_height = int(orig_height * scale_factor)
            
            model_image = model_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Create a new composite image large enough to fit both
            composite_width = max(width, new_width)
            composite_height = max(height, new_height)
            composite = Image.new('RGBA', (composite_width, composite_height), (0, 0, 0, 0))
            
            # Position the model in the center
            model_x = (composite_width - new_width) // 2
            model_y = (composite_height - new_height) // 2
            composite.paste(model_image, (model_x, model_y), model_image)
            
            # Determine where to place the product on the model
            if model_type == 'model-standing':
                # Place product on the chest for standing model
                product_x = (composite_width - width) // 2
                product_y = model_y + (new_height // 4)  
            elif model_type == 'mannequin':
                # Place product on the chest for mannequin
                product_x = (composite_width - width) // 2
                product_y = model_y + (new_height // 4)
            elif model_type == 'flat-lay':
                # Center the product for flat-lay
                product_x = (composite_width - width) // 2
                product_y = (composite_height - height) // 2
            else:
                # Default placement (center)
                product_x = (composite_width - width) // 2
                product_y = (composite_height - height) // 2
                
            # Paste the product onto the model
            composite.paste(product_image, (product_x, product_y), product_image)
            
            return composite
            
        except Exception as e:
            logger.error(f"Error using real model overlay, falling back to generated: {e}")
            # Fall back to generated model
    
    # If no real model image available or loading failed, use the generated placeholder
    logger.info(f"No real model overlay found for {model_type}, using generated")
    
    # Create a simulated model image - in production you'd load real model images
    model_image = Image.new('RGBA', (width, height * 2), (0, 0, 0, 0))
    
    # Draw a simplified model silhouette
    from PIL import ImageDraw
    draw = ImageDraw.Draw(model_image)
    
    if model_type == 'model-standing':
        # Simple standing human silhouette
        center_x = width // 2
        head_y = height // 4
        
        # Draw head
        head_radius = width // 8
        draw.ellipse(
            [(center_x - head_radius, head_y - head_radius), 
             (center_x + head_radius, head_y + head_radius)],
            fill=(200, 200, 200, 255)
        )
        
        # Draw body
        draw.rectangle(
            [(center_x - width//6, head_y + head_radius), 
             (center_x + width//6, head_y + head_radius + height//2)],
            fill=(180, 180, 180, 255)
        )
        
        # Draw legs
        draw.rectangle(
            [(center_x - width//6, head_y + head_radius + height//2), 
             (center_x - width//16, head_y + head_radius + height)],
            fill=(180, 180, 180, 255)
        )
        draw.rectangle(
            [(center_x + width//16, head_y + head_radius + height//2), 
             (center_x + width//6, head_y + head_radius + height)],
            fill=(180, 180, 180, 255)
        )
        
        # Position for the product (chest area)
        product_x = center_x - (product_image.width // 2)
        product_y = head_y + head_radius + height//10
        
    elif model_type == 'mannequin':
        # Simple mannequin silhouette
        center_x = width // 2
        top_y = height // 6
        
        # Draw mannequin head
        head_radius = width // 10
        draw.ellipse(
            [(center_x - head_radius, top_y - head_radius), 
             (center_x + head_radius, top_y + head_radius)],
            fill=(220, 220, 220, 255)
        )
        
        # Draw mannequin body
        draw.rectangle(
            [(center_x - width//5, top_y + head_radius), 
             (center_x + width//5, top_y + head_radius + height//1.5)],
            fill=(230, 230, 230, 255)
        )
        
        # Position for the product (chest area)
        product_x = center_x - (product_image.width // 2)
        product_y = top_y + head_radius + height//10
        
    elif model_type == 'flat-lay':
        # For flat-lay, just center the product
        product_x = (width - product_image.width) // 2
        product_y = (height - product_image.height) // 2
        
    else:  # default
        # Generic model placeholder
        center_x = width // 2
        top_y = height // 6
        
        # Draw simplified model
        draw.rectangle(
            [(center_x - width//4, top_y), 
             (center_x + width//4, top_y + height//1.2)],
            fill=(200, 200, 200, 255)
        )
        
        # Position for the product (center)
        product_x = center_x - (product_image.width // 2)
        product_y = top_y + height//6
    
    # Paste the product onto the model
    model_image.paste(product_image, (product_x, product_y), product_image)
    
    return model_image

# Simple HTML template for the home page
HOME_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>U-2-Net Background Removal API</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        h2 {
            color: #444;
            margin-top: 30px;
        }
        code {
            background: #f4f4f4;
            padding: 3px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
        pre {
            background: #f4f4f4;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
        .endpoint {
            margin: 20px 0;
            padding: 10px;
            border-left: 4px solid #ddd;
        }
        .method {
            font-weight: bold;
            color: #07c;
        }
    </style>
</head>
<body>
    <h1>U-2-Net Background Removal API</h1>
    
    <div>
        <p>Status: <strong>Running</strong></p>
        <p><a href="/health">Check API health</a></p>
    </div>
    
    <h2>API Endpoints</h2>
    
    <div class="endpoint">
        <h3><span class="method">GET</span> /health</h3>
        <p>Check if the server is operational.</p>
        <p><a href="/health">Try it</a></p>
    </div>
    
    <div class="endpoint">
        <h3><span class="method">POST</span> /remove-background</h3>
        <p>Remove background from an image.</p>
        <h4>Request Body (JSON):</h4>
        <pre>
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
        </pre>
    </div>
    
    <div class="endpoint">
        <h3><span class="method">POST</span> /customize-product</h3>
        <p>Apply background and model overlay to a transparent image.</p>
        <h4>Request Body (JSON):</h4>
        <pre>
{
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "backgroundType": "studio-light",
  "modelType": "model-standing"
}
        </pre>
    </div>
    
    <div class="endpoint">
        <h3><span class="method">POST</span> /process-and-customize</h3>
        <p>Remove background and apply customization in a single step.</p>
        <h4>Request Body (JSON):</h4>
        <pre>
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "backgroundType": "studio-light",
  "modelType": "model-standing"
}
        </pre>
    </div>
    
    <div class="endpoint">
        <h3><span class="method">GET</span> /customization-options</h3>
        <p>Get available background and model options.</p>
        <p><a href="/customization-options">Try it</a></p>
    </div>
    
    <h2>Usage Example</h2>
    <pre>
fetch('http://localhost:5000/process-and-customize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    backgroundType: "studio-light",
    modelType: "model-standing"
  })
})
.then(response => response.json())
.then(data => console.log(data));
    </pre>
</body>
</html>
'''

@app.route('/', methods=['GET'])
def index():
    logger.debug("Root endpoint called")
    return Response(HOME_TEMPLATE, mimetype='text/html')

@app.route('/api', methods=['GET'])
def api_index():
    logger.debug("API index endpoint called")
    return jsonify({
        "service": "U-2-Net Background Removal API",
        "status": "running",
        "endpoints": {
            "/health": "Check if server is operational",
            "/remove-background": "Remove background from image",
            "/customize-product": "Apply background and model overlay to a transparent image",
            "/customization-options": "Get available background and model options"
        }
    })

@app.route('/health', methods=['GET'])
def health():
    logger.debug("Health endpoint called")
    return jsonify({
        "status": "ok",
        "model_loaded": net is not None,
        "pytorch_version": torch.__version__,
        "cuda_available": torch.cuda.is_available()
    })

@app.route('/remove-background', methods=['POST'])
def remove_background():
    try:
        logger.info(f"Received request: {request.method} {request.path}")
        
        if not request.is_json:
            logger.warning("Request is not JSON")
            return jsonify({"error": "Expected JSON data"}), 400
        
        data = request.json
        
        if not data or 'image' not in data:
            logger.warning("No image in request")
            return jsonify({"error": "No image provided"}), 400
        
        # Get base64 image
        image_data = data['image']
        if image_data.startswith('data:image'):
            # Remove the prefix
            image_data = image_data.split(',')[1]
        
        # Decode image
        try:
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            logger.info(f"Decoded image: {image.format} {image.size}x{image.mode}")
        except Exception as e:
            logger.error(f"Error decoding image: {e}")
            return jsonify({"error": f"Invalid image data: {str(e)}"}), 400
        
        # Process image
        try:
            result = process_image(net, image)
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return jsonify({"success": False, "error": str(e)}), 500
        
        # Convert result to base64
        buffered = io.BytesIO()
        result.save(buffered, format="PNG")
        result_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        logger.info("Successfully processed image")
        return jsonify({
            "success": True,
            "processedImageUrl": f"data:image/png;base64,{result_base64}"
        })
    
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

# New endpoint for product customization
@app.route('/customize-product', methods=['POST'])
def customize_product():
    try:
        logger.info(f"Received customize request: {request.method} {request.path}")
        
        if not request.is_json:
            logger.warning("Request is not JSON")
            return jsonify({"error": "Expected JSON data"}), 400
        
        data = request.json
        
        if not data or 'image' not in data:
            logger.warning("No image in request")
            return jsonify({"error": "No image provided"}), 400
        
        # Get base64 image
        image_data = data['image']
        if image_data.startswith('data:image'):
            # Remove the prefix
            image_type = image_data.split(';')[0].split('/')[1]
            image_data = image_data.split(',')[1]
        
        # Decode image
        try:
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            logger.info(f"Decoded image: {image.format} {image.size}x{image.mode}")
            
            # Convert to RGBA if not already
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
        except Exception as e:
            logger.error(f"Error decoding image: {e}")
            return jsonify({"error": f"Invalid image data: {str(e)}"}), 400
        
        # Get customization options
        background_type = data.get('backgroundType', 'transparent')
        model_type = data.get('modelType', None)
        
        logger.info(f"Customizing with background: {background_type}, model: {model_type}")
        
        # Process the image based on options
        try:
            # First step: Apply background if requested
            if background_type and background_type != 'transparent':
                image = apply_background(image, background_type)
                logger.info(f"Applied background: {background_type}")
            
            # Second step: Apply model overlay if requested
            if model_type and model_type in MODEL_OVERLAY_TEMPLATES:
                image = apply_model_overlay(image, model_type)
                logger.info(f"Applied model overlay: {model_type}")
            
        except Exception as e:
            logger.error(f"Error customizing image: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return jsonify({"success": False, "error": str(e)}), 500
        
        # Convert result to base64
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        result_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        logger.info("Successfully customized image")
        
        # Return the customized image
        return jsonify({
            "success": True,
            "processedImageUrl": f"data:image/png;base64,{result_base64}",
            "backgroundType": background_type,
            "modelType": model_type
        })
    
    except Exception as e:
        logger.error(f"Unexpected error in customize-product: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

# New combined endpoint for one-step processing
@app.route('/process-and-customize', methods=['POST'])
def process_and_customize():
    try:
        logger.info(f"Received combined processing request: {request.method} {request.path}")
        
        if not request.is_json:
            logger.warning("Request is not JSON")
            return jsonify({"error": "Expected JSON data"}), 400
        
        data = request.json
        
        if not data or 'image' not in data:
            logger.warning("No image in request")
            return jsonify({"error": "No image provided"}), 400
        
        # Get base64 image
        image_data = data['image']
        if image_data.startswith('data:image'):
            # Remove the prefix
            image_type = image_data.split(';')[0].split('/')[1]
            image_data = image_data.split(',')[1]
        
        # Get customization options
        background_type = data.get('backgroundType', 'transparent')
        model_type = data.get('modelType', None)
        
        logger.info(f"Processing with background: {background_type}, model: {model_type}")
        
        # Step 1: Decode image
        try:
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            logger.info(f"Decoded image: {image.format} {image.size}x{image.mode}")
        except Exception as e:
            logger.error(f"Error decoding image: {e}")
            return jsonify({"error": f"Invalid image data: {str(e)}"}), 400
        
        # Step 2: Process image (remove background)
        try:
            transparent_image = process_image(net, image)
            logger.info("Background removal successful")
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return jsonify({"success": False, "error": str(e)}), 500
        
        # Step 3: Apply customization if needed
        result_image = transparent_image
        
        try:
            # Apply background if requested
            if background_type and background_type != 'transparent':
                result_image = apply_background(transparent_image, background_type)
                logger.info(f"Applied background: {background_type}")
            
            # Apply model overlay if requested
            if model_type and model_type in MODEL_OVERLAY_TEMPLATES:
                result_image = apply_model_overlay(result_image, model_type)
                logger.info(f"Applied model overlay: {model_type}")
                
        except Exception as e:
            logger.error(f"Error during customization: {e}")
            import traceback
            logger.error(traceback.format_exc())
            # Continue with just the background-removed image if customization fails
            result_image = transparent_image
        
        # Convert result to base64
        buffered = io.BytesIO()
        result_image.save(buffered, format="PNG")
        result_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        logger.info("Successfully processed and customized image")
        
        # Return the processed image
        return jsonify({
            "success": True,
            "processedImageUrl": f"data:image/png;base64,{result_base64}",
            "backgroundType": background_type,
            "modelType": model_type
        })
    
    except Exception as e:
        logger.error(f"Unexpected error in process-and-customize: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

# Add an endpoint to list available backgrounds and models
@app.route('/customization-options', methods=['GET'])
def get_customization_options():
    try:
        # Check for available real backgrounds
        studio_light_available = 'studio-light' in AVAILABLE_BACKGROUNDS and len(AVAILABLE_BACKGROUNDS['studio-light']) > 0
        studio_dark_available = 'studio-dark' in AVAILABLE_BACKGROUNDS and len(AVAILABLE_BACKGROUNDS['studio-dark']) > 0
        
        # Get available model overlays
        available_models = list(AVAILABLE_MODELS.keys())
        if not available_models:
            # Fall back to template keys if no real images
            available_models = list(MODEL_OVERLAY_TEMPLATES.keys())
        
        # Build the response
        response = {
            "success": True,
            "backgrounds": {
                "solid": ["transparent", "white", "black", "gray"],
                "studio": [],
                "ai": ["ai-generated"]
            },
            "models": available_models
        }
        
        # Add available studio backgrounds
        studio_backgrounds = []
        if studio_light_available:
            studio_backgrounds.append("studio-light")
        if studio_dark_available:
            studio_backgrounds.append("studio-dark")
            
        if studio_backgrounds:
            response["backgrounds"]["studio"] = studio_backgrounds
        
        logger.info(f"Available customization options: {response}")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error retrieving customization options: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

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