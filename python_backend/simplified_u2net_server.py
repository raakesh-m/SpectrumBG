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
        
        <h4>Response:</h4>
        <pre>
{
  "success": true,
  "processedImageUrl": "data:image/png;base64,iVBORw0KGgo..."
}
        </pre>
    </div>
    
    <h2>Usage Example</h2>
    <pre>
fetch('http://localhost:5000/remove-background', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
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
            "/remove-background": "Remove background from image"
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