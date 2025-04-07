# Background Removal Tool

A modern web application for removing backgrounds from images using deep learning technology.

## Features

- Remove backgrounds from images with high precision
- Choose between transparent, white, or black backgrounds
- Simple drag-and-drop interface
- Local processing (no cloud services needed)
- High-quality edge detection using semantic segmentation

## Setup Instructions

### Frontend Setup

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

### Python Backend Setup

```bash
# Navigate to backend directory
cd python_backend

# Install required packages
pip install -r requirements.txt

# Download the model (one-time setup)
python download_models.py

# Start the backend server
python simplified_u2net_server.py
```

Once both services are running:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Background Options

- **Transparent**: Perfect for layering in design software
- **White**: Ideal for e-commerce product photos
- **Black**: Creates dramatic effect for special use cases

## Troubleshooting

### Backend Connection Issues
If you see "Could not connect to server" errors:
- Ensure the Python backend is running on port 5000
- Check that all Python dependencies are installed
- Verify there are no other services using port 5000

### Image Processing Tips
For best results:
- Use images with clear contrast between subject and background
- Optimal image size: 1000x1000 to 2500x2500 pixels
- Ensure adequate lighting in original photos

## License

MIT 