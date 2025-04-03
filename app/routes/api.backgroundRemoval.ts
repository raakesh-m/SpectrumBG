import { ActionFunctionArgs, json } from '@remix-run/node';
import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';

type BackgroundRemovalResponse = {
  success: boolean;
  processedImageUrl?: string;
  error?: string;
};

/**
 * Removes the background from an image using local processing
 * This implementation uses a more advanced color detection approach with edge detection
 */
async function removeBackgroundLocally(imageBase64: string): Promise<string> {
  try {
    // Remove the data URL prefix
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Load the image using Canvas for analysis
    const image = await loadImage(imageBuffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the original image
    ctx.drawImage(image, 0, 0);
    
    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;
    
    // Create a new canvas for edge detection
    const edgeCanvas = createCanvas(width, height);
    const edgeCtx = edgeCanvas.getContext('2d');
    edgeCtx.drawImage(image, 0, 0);
    const edgeData = edgeCtx.getImageData(0, 0, width, height);
    const edgePixels = edgeData.data;
    
    // Apply a simple edge detection filter by finding large color differences between pixels
    const edges = new Uint8Array(width * height);
    const threshold = 30; // Threshold for edge detection
    
    // Horizontal edge detection
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width - 1; x++) {
        const pos = (y * width + x) * 4;
        const nextPos = pos + 4; // Next pixel
        
        const rDiff = Math.abs(data[pos] - data[nextPos]);
        const gDiff = Math.abs(data[pos + 1] - data[nextPos + 1]);
        const bDiff = Math.abs(data[pos + 2] - data[nextPos + 2]);
        
        if (rDiff > threshold || gDiff > threshold || bDiff > threshold) {
          edges[y * width + x] = 255; // Mark as edge
        }
      }
    }
    
    // Vertical edge detection
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height - 1; y++) {
        const pos = (y * width + x) * 4;
        const nextPos = ((y + 1) * width + x) * 4; // Next row
        
        const rDiff = Math.abs(data[pos] - data[nextPos]);
        const gDiff = Math.abs(data[pos + 1] - data[nextPos + 1]);
        const bDiff = Math.abs(data[pos + 2] - data[nextPos + 2]);
        
        if (rDiff > threshold || gDiff > threshold || bDiff > threshold) {
          edges[y * width + x] = 255; // Mark as edge
        }
      }
    }
    
    // Define edge proximity - how far from an edge a pixel can be to be considered "inside" the object
    const edgeProximity = 10;
    
    // Function to check if a point is near an edge
    const isNearEdge = (x: number, y: number): boolean => {
      for (let dy = -edgeProximity; dy <= edgeProximity; dy++) {
        for (let dx = -edgeProximity; dx <= edgeProximity; dx++) {
          const checkX = x + dx;
          const checkY = y + dy;
          if (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
            if (edges[checkY * width + checkX] === 255) {
              return true;
            }
          }
        }
      }
      return false;
    };

    // Get the dominant background color by sampling the edges of the image
    // This assumes the background is generally around the edges of the image
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    
    // Sample the top, bottom, left, and right edges
    for (let x = 0; x < width; x++) {
      // Top row
      const topPos = x * 4;
      rSum += data[topPos];
      gSum += data[topPos + 1];
      bSum += data[topPos + 2];
      
      // Bottom row
      const bottomPos = ((height - 1) * width + x) * 4;
      rSum += data[bottomPos];
      gSum += data[bottomPos + 1];
      bSum += data[bottomPos + 2];
      
      count += 2;
    }
    
    for (let y = 0; y < height; y++) {
      // Left column
      const leftPos = (y * width) * 4;
      rSum += data[leftPos];
      gSum += data[leftPos + 1];
      bSum += data[leftPos + 2];
      
      // Right column
      const rightPos = (y * width + width - 1) * 4;
      rSum += data[rightPos];
      gSum += data[rightPos + 1];
      bSum += data[rightPos + 2];
      
      count += 2;
    }
    
    // Calculate average color
    const avgR = Math.round(rSum / count);
    const avgG = Math.round(gSum / count);
    const avgB = Math.round(bSum / count);
    
    console.log(`Detected background color: RGB(${avgR}, ${avgG}, ${avgB})`);
    
    // Color similarity threshold - how close to the background color a pixel needs to be
    const colorThreshold = 35;
    
    // Create a mask for transparent background using both color similarity and edge detection
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pos = (y * width + x) * 4;
        const r = data[pos];
        const g = data[pos + 1];
        const b = data[pos + 2];
        
        // Calculate color similarity to background
        const rDiff = Math.abs(r - avgR);
        const gDiff = Math.abs(g - avgG);
        const bDiff = Math.abs(b - avgB);
        const colorSimilarity = (rDiff + gDiff + bDiff) / 3;
        
        // If the color is similar to background AND not near an edge, make transparent
        if (colorSimilarity < colorThreshold && !isNearEdge(x, y)) {
          data[pos + 3] = 0; // Set alpha to transparent
        }
      }
    }
    
    // Put the processed image data back
    ctx.putImageData(imageData, 0, 0);
    
    // Convert to PNG with transparency
    const transparentPng = canvas.toBuffer('image/png');
    
    // Now use sharp for additional processing and optimization
    const optimizedImage = await sharp(transparentPng)
      .png({ quality: 90 })
      .toBuffer();
    
    // Return as base64 data URL
    return `data:image/png;base64,${optimizedImage.toString('base64')}`;
  } catch (error) {
    console.error('Local background removal error:', error);
    throw new Error('Failed to process image locally');
  }
}

/**
 * API route handler for background removal
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const imageBase64 = formData.get('image')?.toString();
  const background = formData.get('background')?.toString() || 'studio-light';
  
  if (!imageBase64) {
    return json<BackgroundRemovalResponse>({ 
      success: false,
      error: "No image provided"
    }, { status: 400 });
  }
  
  try {
    console.log('Processing image with local background removal...');
    
    // Process the image locally
    const processedImageUrl = await removeBackgroundLocally(imageBase64);
    
    console.log('Local processing complete');
    
    return json<BackgroundRemovalResponse>({
      success: true,
      processedImageUrl
    });
  } catch (error) {
    console.error('Local processing error:', error);
    
    // Return a helpful error
    return json<BackgroundRemovalResponse>({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during local processing'
    }, { status: 500 });
  }
} 