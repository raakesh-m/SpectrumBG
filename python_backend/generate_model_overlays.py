#!/usr/bin/env python
"""
Generate model overlay images for customization
This script creates transparent model overlay images to be used with the product customizer.
"""

import os
import logging
import sys
from PIL import Image, ImageDraw

# Set up logging to console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('generate-models')

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

def generate_model_standing(width=800, height=1200):
    """Generate a standing model silhouette"""
    image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Define colors
    body_color = (60, 60, 60, 220)
    outline_color = (30, 30, 30, 255)
    
    # Draw head
    center_x = width // 2
    head_y = height // 6
    head_radius = width // 12
    
    draw.ellipse(
        [(center_x - head_radius, head_y - head_radius), 
         (center_x + head_radius, head_y + head_radius)],
        fill=body_color, outline=outline_color, width=2
    )
    
    # Draw neck and shoulders
    neck_width = head_radius
    shoulder_width = width // 2.5
    shoulder_y = head_y + head_radius * 2
    
    # Neck
    draw.rectangle(
        [(center_x - neck_width//2, head_y + head_radius),
         (center_x + neck_width//2, shoulder_y)],
        fill=body_color, outline=outline_color, width=2
    )
    
    # Shoulders
    draw.rectangle(
        [(center_x - shoulder_width, shoulder_y),
         (center_x + shoulder_width, shoulder_y + height//20)],
        fill=body_color, outline=outline_color, width=2
    )
    
    # Draw torso
    waist_width = shoulder_width * 0.8
    waist_y = height // 2
    
    # Draw a trapezoid for the torso
    draw.polygon(
        [(center_x - shoulder_width, shoulder_y),
         (center_x + shoulder_width, shoulder_y),
         (center_x + waist_width, waist_y),
         (center_x - waist_width, waist_y)],
        fill=body_color, outline=outline_color, width=2
    )
    
    # Draw legs
    leg_width = waist_width // 2
    leg_inset = leg_width // 3
    leg_bottom = height - height//10
    
    # Left leg
    draw.polygon(
        [(center_x - waist_width, waist_y),
         (center_x - leg_inset, waist_y),
         (center_x - leg_inset - leg_width//4, leg_bottom),
         (center_x - waist_width - leg_width//4, leg_bottom)],
        fill=body_color, outline=outline_color, width=2
    )
    
    # Right leg
    draw.polygon(
        [(center_x + leg_inset, waist_y),
         (center_x + waist_width, waist_y),
         (center_x + waist_width + leg_width//4, leg_bottom),
         (center_x + leg_inset + leg_width//4, leg_bottom)],
        fill=body_color, outline=outline_color, width=2
    )
    
    # Draw arms
    arm_width = shoulder_width // 3
    arm_length = height // 2.5
    arm_y = shoulder_y + height//40
    
    # Left arm
    draw.polygon(
        [(center_x - shoulder_width, arm_y),
         (center_x - shoulder_width + arm_width, arm_y),
         (center_x - shoulder_width - arm_width//2, arm_y + arm_length),
         (center_x - shoulder_width - arm_width, arm_y + arm_length)],
        fill=body_color, outline=outline_color, width=2
    )
    
    # Right arm
    draw.polygon(
        [(center_x + shoulder_width - arm_width, arm_y),
         (center_x + shoulder_width, arm_y),
         (center_x + shoulder_width + arm_width, arm_y + arm_length),
         (center_x + shoulder_width + arm_width//2, arm_y + arm_length)],
        fill=body_color, outline=outline_color, width=2
    )
    
    return image

def generate_mannequin(width=800, height=1200):
    """Generate a mannequin silhouette"""
    image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Define colors
    body_color = (220, 220, 220, 220)
    outline_color = (180, 180, 180, 255)
    
    # Draw head
    center_x = width // 2
    head_y = height // 6
    head_radius = width // 14
    
    draw.ellipse(
        [(center_x - head_radius, head_y - head_radius), 
         (center_x + head_radius, head_y + head_radius)],
        fill=body_color, outline=outline_color, width=2
    )
    
    # Draw neck (pole)
    neck_width = head_radius // 2
    neck_height = head_radius * 2
    
    draw.rectangle(
        [(center_x - neck_width//2, head_y + head_radius),
         (center_x + neck_width//2, head_y + neck_height)],
        fill=body_color, outline=outline_color, width=2
    )
    
    # Draw torso
    shoulder_width = width // 3
    shoulder_y = head_y + neck_height
    waist_width = shoulder_width * 0.8
    waist_y = height // 2
    
    # Draw a trapezoid for the torso
    draw.polygon(
        [(center_x - shoulder_width, shoulder_y),
         (center_x + shoulder_width, shoulder_y),
         (center_x + waist_width, waist_y),
         (center_x - waist_width, waist_y)],
        fill=body_color, outline=outline_color, width=2
    )
    
    # Draw the stand
    stand_top_width = waist_width // 2
    stand_bottom_width = stand_top_width * 1.5
    stand_height = height // 4
    
    draw.polygon(
        [(center_x - stand_top_width, waist_y),
         (center_x + stand_top_width, waist_y),
         (center_x + stand_bottom_width, waist_y + stand_height),
         (center_x - stand_bottom_width, waist_y + stand_height)],
        fill=body_color, outline=outline_color, width=2
    )
    
    # Draw base
    base_height = height // 20
    base_width = stand_bottom_width * 1.5
    
    draw.rectangle(
        [(center_x - base_width, waist_y + stand_height),
         (center_x + base_width, waist_y + stand_height + base_height)],
        fill=body_color, outline=outline_color, width=2
    )
    
    # Draw arms/shoulder extensions - fixed to ensure x1 >= x0 and y1 >= y0
    arm_length = height // 4
    arm_width = shoulder_width // 6
    
    # Left arm - adjusted coordinates to ensure proper rectangle dimensions
    draw.rectangle(
        [(center_x - shoulder_width - arm_width, shoulder_y),
         (center_x - shoulder_width, shoulder_y + arm_length)],
        fill=body_color, outline=outline_color, width=2
    )
    
    # Right arm - adjusted coordinates to ensure proper rectangle dimensions
    draw.rectangle(
        [(center_x + shoulder_width, shoulder_y),
         (center_x + shoulder_width + arm_width, shoulder_y + arm_length)],
        fill=body_color, outline=outline_color, width=2
    )
    
    return image

def generate_flat_lay(width=800, height=800):
    """Generate a flat lay surface"""
    image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Define colors
    surface_color = (240, 240, 240, 180)
    edge_color = (220, 220, 220, 220)
    shadow_color = (50, 50, 50, 100)
    
    # Draw a surface rectangle with perspective
    surface_width = width * 0.8
    surface_height = height * 0.7
    surface_x = (width - surface_width) // 2
    surface_y = (height - surface_height) // 2
    
    # Draw shadow first
    shadow_offset = width // 40
    draw.rectangle(
        [(surface_x + shadow_offset, surface_y + shadow_offset),
         (surface_x + surface_width + shadow_offset, surface_y + surface_height + shadow_offset)],
        fill=shadow_color
    )
    
    # Draw main surface
    draw.rectangle(
        [(surface_x, surface_y),
         (surface_x + surface_width, surface_y + surface_height)],
        fill=surface_color, outline=edge_color, width=3
    )
    
    # Add subtle grid lines for a textured look
    line_spacing = width // 20
    line_color = (200, 200, 200, 40)
    
    # Vertical lines
    for x in range(int(surface_x), int(surface_x + surface_width), line_spacing):
        draw.line(
            [(x, surface_y), (x, surface_y + surface_height)],
            fill=line_color, width=1
        )
    
    # Horizontal lines
    for y in range(int(surface_y), int(surface_y + surface_height), line_spacing):
        draw.line(
            [(surface_x, y), (surface_x + surface_width, y)],
            fill=line_color, width=1
        )
    
    return image

def main():
    """Main function to generate all model overlay images"""
    print("Starting model overlay image generation...")
    models_dir = setup_directories()
    
    # Define the models to generate
    models = {
        "model-standing": generate_model_standing,
        "mannequin": generate_mannequin,
        "flat-lay": generate_flat_lay
    }
    
    successful_generations = 0
    
    for name, generator_func in models.items():
        output_path = os.path.join(models_dir, f"{name}.png")
        
        # Skip if file already exists
        if os.path.exists(output_path):
            logger.info(f"File already exists: {output_path}")
            successful_generations += 1
            continue
        
        try:
            # Generate the model image
            logger.info(f"Generating model: {name}")
            
            if name == "flat-lay":
                image = generator_func(800, 800)  # Square for flat lay
            else:
                image = generator_func(800, 1200)  # Portrait for human models
                
            # Save the image
            image.save(output_path)
            logger.info(f"Successfully generated and saved: {output_path}")
            successful_generations += 1
            
        except Exception as e:
            logger.error(f"Error generating {name}: {e}")
    
    logger.info(f"Generated {successful_generations}/{len(models)} model overlay images")
    
    # List the generated files
    model_files = os.listdir(models_dir)
    logger.info(f"Files in models directory: {model_files}")
    
    return 0

if __name__ == "__main__":
    try:
        main()
        print("Generation script completed successfully!")
    except Exception as e:
        logger.error(f"Error in main execution: {e}")
        print(f"Error: {e}")
        sys.exit(1) 