import torch
import torch.nn as nn
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights


# Number of diabetic retinopathy classes
NUM_CLASSES = 5


# Load pretrained EfficientNet-B0
weights = EfficientNet_B0_Weights.DEFAULT

model = efficientnet_b0(weights=weights)


# Replace the final classifier
in_features = model.classifier[1].in_features

model.classifier[1] = nn.Linear(
    in_features,
    NUM_CLASSES
)


# Select device
device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


# Move model to GPU
model = model.to(device)


# Print information
print("======================================")
print("EfficientNet Model")
print("======================================")

print("Device:", device)

print("Model:", model)

print("\nFinal classifier:")
print(model.classifier)

print("\nNumber of output classes:", NUM_CLASSES)