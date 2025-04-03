# Product Customization Tool with AI Background Removal

> **Warning**: This code was lovingly crafted (and slightly panicked over) in 3-hour. Proceed with caution and a sense of humor! 😅 If you find any bugs, please submit an issue (or better yet, a pull request with a fix!).

## Tech Stack

### Frontend
- **Framework**: [Remix](https://remix.run/) - React-based web framework
- **Styling**: TailwindCSS
- **State Management**: React Hooks & Context
- **Image Processing**: Client-side base64 handling

### Backend
- **Server**: Python Flask API
- **Image Processing**: 
  - U-2-Net deep learning model for background removal
  - PIL (Python Imaging Library) for image manipulation
- **Model Overlays**: Custom generated silhouettes with transparency
- **Studio Backgrounds**: Real studio background images

## Features
- AI-powered background removal using U-2-Net
- Multiple customization options:
  - Different background types (transparent, white, black, studio-light, studio-dark)
  - Model overlays (standing model, mannequin, flat-lay)
- Easy-to-use interface with drag and drop support
- Preview functionality

## Getting Started

### Prerequisites
- Node.js (v14+)
- Python 3.8+
- Pytorch

### Installation

1. Clone this repository
2. Install frontend dependencies:
```
npm install
```

3. Install backend dependencies:
```
cd python_backend
pip install -r requirements.txt
```

4. Run the setup scripts to download background images and generate model overlays:
```
python download_studio_backgrounds.py
python generate_model_overlays.py
```

### Running the Application

1. Start the Python backend:
```
cd python_backend
python simplified_u2net_server.py
```

2. Start the frontend development server:
```
npm run dev
```

3. Open your browser and navigate to http://localhost:3000

## How It Works

The application uses a two-step process:
1. Background removal using either local U-2-Net deep learning or the remove.bg API
2. Customization by applying studio backgrounds and model overlays

For the U-2-Net (local) processing option, all processing is done on your machine. The remove.bg API option requires an API key.

## License
MIT

## Updates

- **Local U-2-Net Integration**: The application now includes a fully integrated U-2-Net model implementation directly in the `python_backend` folder.
- **Simplified Project Structure**: Removed external dependencies and unnecessary files for a cleaner, more maintainable codebase.
- **Improved Error Handling**: Enhanced error detection and user guidance, especially for server connection issues.
- **Better User Experience**: UI improvements with better contrast and consistent styling.
- **Mobile Enhancements**: Responsive design optimized for mobile devices with touch-friendly controls.
- **Shopify Integration**: Full deployment guide for Shopify stores.

## Setup Prerequisites

- Node.js 16+ and npm
- Python 3.7+
- Git

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/raakesh-m/aiprod.git
   cd aiprod
   ```

2. Install JavaScript dependencies:
   ```
   npm install
   ```

3. Install Python dependencies and download model weights:
   ```
   cd python_backend
   pip install -r requirements.txt
   python download_models.py
   cd ..
   ```

## Running the Application

### Development Mode

You'll need to run both the frontend and backend in separate terminal windows:

**Terminal 1: Start the U-2-Net backend server**
```
cd python_backend
python simplified_u2net_server.py
```

**Terminal 2: Start the Remix frontend**
```
npm run dev
```

### Production Mode

For a production environment:

**Terminal 1: Start the U-2-Net backend server**
```
cd python_backend
# Set environment variable (Windows)
set FLASK_ENV=production
# Or for Unix/Linux/Mac
# export FLASK_ENV=production
python simplified_u2net_server.py
```

**Terminal 2: Build and start the Remix frontend**
```
npm run build
npm run start
```

## Shopify Deployment

For detailed instructions on deploying this application to Shopify, please see the [Shopify Deployment Guide](SHOPIFY_DEPLOYMENT.md).

## How to Use

1. Open your browser and navigate to http://localhost:3000
2. Upload an image using the upload button
3. Select a processing method:
   - **Local Processing**: Uses the U-2-Net model running on your computer
   - **API Processing**: Uses Remove.bg API (requires API key)
4. View and download the processed image with the background removed

## API Keys (Optional)

env example 
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=http://localhost:3000
REMOVE_BG_API_KEY=your_remove_bg_api_key

For the Remove.bg API method, you'll need to:
1. Sign up at [Remove.bg](https://www.remove.bg/api)
2. Get your API key
3. Create a `.env` file in the project root based on `.env.example`
4. Add your API key: `REMOVE_BG_API_KEY=your_api_key_here`

## Project Structure

```
product-customizer/
├── app/                      # Remix frontend application
│   ├── components/           # UI components
│   │   ├── _index.tsx        # Main application page
│   │   ├── docs.tsx          # Documentation page
│   │   └── ...
│   └── ...
├── python_backend/           # U-2-Net server implementation
│   ├── model/                # U-2-Net model definition
│   │   ├── __init__.py       # Model exports
│   │   └── u2net.py          # U-2-Net model architecture
│   ├── data_loader.py        # Data loading utilities
│   ├── simplified_u2net_server.py # Flask server for U-2-Net
│   ├── download_models.py    # Script to download model weights
│   └── saved_models/         # Pre-trained model weights (downloaded during setup)
│       ├── u2net/            # U-2-Net model weights
│       └── u2net_portrait/   # U-2-Net portrait model weights
├── public/                   # Static assets
├── .env.example              # Template for environment variables
├── Procfile                  # Heroku deployment configuration
├── SHOPIFY_DEPLOYMENT.md     # Shopify deployment guide
└── package.json              # Project dependencies
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Developed by [Raakesh M](https://github.com/raakesh-m) 