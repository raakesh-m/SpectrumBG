import os
import sys
import gdown

def download_models():
    print("Downloading U-2-Net models...")
    
    # Get current directory
    current_dir = os.getcwd()
    print(f"Current working directory: {current_dir}")
    
    # Create directories
    os.makedirs(os.path.join(current_dir, 'saved_models', 'u2net'), exist_ok=True)
    os.makedirs(os.path.join(current_dir, 'saved_models', 'u2net_portrait'), exist_ok=True)
    
    # Download u2net model
    u2net_path = os.path.join(current_dir, 'saved_models', 'u2net', 'u2net.pth')
    if os.path.exists(u2net_path):
        print(f"U2NET model already exists at {u2net_path}")
    else:
        print(f"Downloading U2NET model to {u2net_path}")
        gdown.download(
            'https://drive.google.com/uc?id=1ao1ovG1Qtx4b7EoskHXmi2E9rp5CHLcZ',
            u2net_path,
            quiet=False
        )
    
    # Download u2net_portrait model
    u2net_portrait_path = os.path.join(current_dir, 'saved_models', 'u2net_portrait', 'u2net_portrait.pth')
    if os.path.exists(u2net_portrait_path):
        print(f"U2NET Portrait model already exists at {u2net_portrait_path}")
    else:
        print(f"Downloading U2NET Portrait model to {u2net_portrait_path}")
        gdown.download(
            'https://drive.google.com/uc?id=1IG3HdpcRiDoWNookbncQjeaPN28t90yW',
            u2net_portrait_path,
            quiet=False
        )
    
    # Verify models were downloaded
    if os.path.exists(u2net_path):
        print(f"U2NET model successfully downloaded. Size: {os.path.getsize(u2net_path) / (1024*1024):.2f} MB")
    else:
        print(f"ERROR: U2NET model download failed!")
    
    if os.path.exists(u2net_portrait_path):
        print(f"U2NET Portrait model successfully downloaded. Size: {os.path.getsize(u2net_portrait_path) / (1024*1024):.2f} MB")
    else:
        print(f"ERROR: U2NET Portrait model download failed!")

if __name__ == "__main__":
    download_models() 