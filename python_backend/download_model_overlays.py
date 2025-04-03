#!/usr/bin/env python
"""
Download model overlay images for customization
This script downloads transparent model overlay images to be used with the product customizer.
"""

import os
import requests
import shutil
from PIL import Image
from io import BytesIO
import logging
import sys

# Set up logging to console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('download-models')

# Create necessary directories
def setup_directories():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(base_dir, "assets")
    models_dir = os.path.join(assets_dir, "models")
    
    # Create directories if they don't exist
    if not os.path.exists(assets_dir):
        os.makedirs(assets_dir)
        logger.info(f"Created assets directory: {assets_dir}")
    
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        logger.info(f"Created models directory: {models_dir}")
    else:
        logger.info(f"Models directory already exists: {models_dir}")
    
    return models_dir

# URLs for model overlays (these should be transparent PNG images)
MODEL_OVERLAYS = {
    "model-standing": "https://i.imgur.com/KfQnbwF.png",  # Silhouette of standing person
    "mannequin": "https://i.imgur.com/KR3YnUF.png",       # Mannequin silhouette
    "flat-lay": "https://i.imgur.com/UXjYsLd.png",        # Flat surface
}

def download_image(url, output_path):
    """Download an image from a URL and save it to the output path"""
    try:
        logger.info(f"Downloading {url}")
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            # Save the image
            with open(output_path, 'wb') as f:
                response.raw.decode_content = True
                shutil.copyfileobj(response.raw, f)
            logger.info(f"Successfully downloaded to {output_path}")
            
            # Verify the image has transparency
            try:
                with Image.open(output_path) as img:
                    # Check if image has an alpha channel
                    if img.mode != 'RGBA':
                        logger.warning(f"Image doesn't have transparency: {output_path}")
                        # Convert to RGBA
                        img = img.convert('RGBA')
                        img.save(output_path)
                        logger.info(f"Converted image to RGBA format")
                    
                    # Resize for better performance
                    max_size = (800, 1200)
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    # Save the resized image
                    img.save(output_path)
                    logger.info(f"Resized image to max dimensions {max_size}")
            except Exception as img_error:
                logger.error(f"Error processing image {output_path}: {img_error}")
                # Continue even if processing fails
                
            return True
        else:
            logger.error(f"Failed to download {url}: Status code {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Error downloading {url}: {e}")
        return False

def main():
    """Main function to download all model overlay images"""
    print("Starting model overlay image download...")
    models_dir = setup_directories()
    
    successful_downloads = 0
    total_downloads = len(MODEL_OVERLAYS)
    
    logger.info(f"Will download {total_downloads} model overlay images to {models_dir}")
    
    for name, url in MODEL_OVERLAYS.items():
        output_path = os.path.join(models_dir, f"{name}.png")
        
        # Skip if file already exists
        if os.path.exists(output_path):
            logger.info(f"File already exists: {output_path}")
            successful_downloads += 1
            continue
            
        if download_image(url, output_path):
            successful_downloads += 1
    
    logger.info(f"Downloaded {successful_downloads}/{total_downloads} model overlay images")
    
    # List the downloaded files
    model_files = os.listdir(models_dir)
    logger.info(f"Files in models directory: {model_files}")
    
    return 0

if __name__ == "__main__":
    try:
        main()
        print("Download script completed successfully!")
    except Exception as e:
        logger.error(f"Error in main execution: {e}")
        print(f"Error: {e}")
        sys.exit(1) 