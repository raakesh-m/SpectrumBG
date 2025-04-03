#!/usr/bin/env python
"""
Setup script for the customization features
This script checks that all necessary directories and dependencies are in place.
"""

import os
import sys
import importlib

def check_directory(path):
    """Check if a directory exists and create it if it doesn't"""
    if not os.path.exists(path):
        print(f"Creating directory: {path}")
        os.makedirs(path, exist_ok=True)
    else:
        print(f"Directory exists: {path}")

def check_dependencies():
    """Check if all required dependencies are installed"""
    dependencies = [
        "PIL", "flask", "flask_cors", "torch", "numpy", 
    ]
    
    for dep in dependencies:
        try:
            importlib.import_module(dep)
            print(f"√ {dep} is installed")
        except ImportError:
            print(f"× {dep} is NOT installed. Please run: pip install -r requirements.txt")
            return False
    return True

def main():
    """Main entry point"""
    print("Setting up customization features...")
    
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Check for required directories
    assets_dir = os.path.join(current_dir, "assets")
    backgrounds_dir = os.path.join(assets_dir, "backgrounds")
    models_dir = os.path.join(assets_dir, "models")
    
    check_directory(assets_dir)
    check_directory(backgrounds_dir)
    check_directory(models_dir)
    
    # Check dependencies
    if not check_dependencies():
        print("\nPlease install the required dependencies using:")
        print("pip install -r requirements.txt")
        return 1
    
    print("\nSetup complete! You're ready to use the customization features.")
    print("\nTo start the server:")
    print("python simplified_u2net_server.py")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 