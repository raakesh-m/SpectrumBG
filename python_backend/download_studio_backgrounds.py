#!/usr/bin/env python
"""
Download studio background images for customization
This script downloads high-quality studio background images for product customization.
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
logger = logging.getLogger('download-backgrounds')

# Create necessary directories
def setup_directories():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(base_dir, "assets")
    backgrounds_dir = os.path.join(assets_dir, "backgrounds")
    
    # Create directories if they don't exist
    if not os.path.exists(assets_dir):
        os.makedirs(assets_dir)
        logger.info(f"Created assets directory: {assets_dir}")
    
    if not os.path.exists(backgrounds_dir):
        os.makedirs(backgrounds_dir)
        logger.info(f"Created backgrounds directory: {backgrounds_dir}")
    else:
        logger.info(f"Backgrounds directory already exists: {backgrounds_dir}")
    
    return backgrounds_dir

# URLs for studio backgrounds
STUDIO_BACKGROUNDS = {
    "studio-light-1": "https://images.unsplash.com/photo-1508615070457-7baeba4003ab?q=80&w=1000&auto=format&fit=crop",
    "studio-light-2": "https://images.unsplash.com/photo-1557682233-43e671455dfa?q=80&w=1000&auto=format&fit=crop",
    "studio-light-3": "https://images.unsplash.com/photo-1557682250-f4a5a50bded7?q=80&w=1000&auto=format&fit=crop",
    "studio-dark-1": "https://images.unsplash.com/photo-1557682204-7a17d8161a88?q=80&w=1000&auto=format&fit=crop",
    "studio-dark-2": "https://images.unsplash.com/photo-1557682204-e53932fe5fe0?q=80&w=1000&auto=format&fit=crop",
    "studio-dark-3": "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?q=80&w=1000&auto=format&fit=crop",
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
            
            # Open and resize the image for better performance
            try:
                with Image.open(output_path) as img:
                    # Resize to a reasonable size while maintaining aspect ratio
                    max_size = (1200, 1200)
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    # Save the resized image
                    img.save(output_path)
                    logger.info(f"Resized image to max dimensions {max_size}")
            except Exception as resize_error:
                logger.error(f"Error resizing image {output_path}: {resize_error}")
                # Continue even if resizing fails
                
            return True
        else:
            logger.error(f"Failed to download {url}: Status code {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Error downloading {url}: {e}")
        return False

def main():
    """Main function to download all background images"""
    print("Starting background image download...")
    backgrounds_dir = setup_directories()
    
    successful_downloads = 0
    total_downloads = len(STUDIO_BACKGROUNDS)
    
    logger.info(f"Will download {total_downloads} background images to {backgrounds_dir}")
    
    for name, url in STUDIO_BACKGROUNDS.items():
        output_path = os.path.join(backgrounds_dir, f"{name}.jpg")
        
        # Skip if file already exists
        if os.path.exists(output_path):
            logger.info(f"File already exists: {output_path}")
            successful_downloads += 1
            continue
            
        if download_image(url, output_path):
            successful_downloads += 1
    
    logger.info(f"Downloaded {successful_downloads}/{total_downloads} background images")
    
    # List the downloaded files
    background_files = os.listdir(backgrounds_dir)
    logger.info(f"Files in backgrounds directory: {background_files}")
    
    return 0

if __name__ == "__main__":
    try:
        main()
        print("Download script completed successfully!")
    except Exception as e:
        logger.error(f"Error in main execution: {e}")
        print(f"Error: {e}")
        sys.exit(1) 