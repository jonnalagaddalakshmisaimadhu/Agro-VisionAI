import torch
import sys
from pathlib import Path

# Add paths
models_dir = Path('server/models')
sys.path.append(str(models_dir))

try:
    from CNN import CNN
    print("CNN imported successfully.")
    
    model_path = models_dir / 'plant_disease_model.pt'
    print(f"Loading model from {model_path}...")
    
    checkpoint = torch.load(model_path, map_location='cpu')
    print(f"Loaded checkpoint type: {type(checkpoint)}")
    
    if isinstance(checkpoint, dict):
        print(f"Keys in checkpoint: {checkpoint.keys()}")
        # Check for state_dict
        state_dict = checkpoint.get('state_dict', checkpoint)
        
        model = CNN(39)
        try:
            model.load_state_dict(state_dict)
            print("SUCCESS: State dict loaded into CNN(39)!")
        except Exception as e:
            print(f"LOAD ERROR: {e}")
            # Try to see shape of keys
            for k, v in list(state_dict.items())[:2]:
                print(f"Key {k} has shape {v.shape}")
    else:
        print("Checkpoint is not a dict!")
        
except Exception as e:
    print(f"GENERAL ERROR: {e}")
