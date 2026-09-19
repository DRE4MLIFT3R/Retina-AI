import torch
import torch.nn as nn

from torchvision.models import efficientnet_b0

from PIL import Image
from torchvision import transforms

import numpy as np
import cv2

from pathlib import Path


# ======================================
# Configuration
# ======================================

NUM_CLASSES = 5

MODEL_PATH = "models/best_efficientnet_b0.pth"

IMAGE_PATH = "dataset/train_images/000c1434d8d7.png"

OUTPUT_PATH = "models/gradcam_result.png"

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


CLASS_NAMES = [
    "No DR",
    "Mild",
    "Moderate",
    "Severe",
    "Proliferative DR"
]


# ======================================
# Load Model
# ======================================

print("======================================")
print("Loading Best Model")
print("======================================")

model = efficientnet_b0(
    weights=None
)

in_features = model.classifier[1].in_features

model.classifier[1] = nn.Linear(
    in_features,
    NUM_CLASSES
)


checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

model = model.to(DEVICE)

model.eval()

print("Model: EfficientNet-B0")
print("Device:", DEVICE)


# ======================================
# Image Transform
# ======================================

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ======================================
# Load Image
# ======================================

print("\n======================================")
print("Loading Image")
print("======================================")

image = Image.open(
    IMAGE_PATH
).convert("RGB")

original_image = np.array(image)

input_tensor = transform(
    image
).unsqueeze(0).to(DEVICE)

print("Image:", IMAGE_PATH)


# ======================================
# Grad-CAM Variables
# ======================================

activations = None
gradients = None


# ======================================
# Forward Hook
# ======================================

def forward_hook(
    module,
    input,
    output
):

    global activations

    activations = output


# ======================================
# Backward Hook
# ======================================

def backward_hook(
    module,
    grad_input,
    grad_output
):

    global gradients

    gradients = grad_output[0]


# ======================================
# Target Layer
# ======================================

target_layer = model.features[-1]

forward_handle = target_layer.register_forward_hook(
    forward_hook
)

backward_handle = target_layer.register_full_backward_hook(
    backward_hook
)


# ======================================
# Forward Pass
# ======================================

print("\n======================================")
print("Generating Prediction")
print("======================================")

model.zero_grad()

output = model(
    input_tensor
)

probabilities = torch.softmax(
    output,
    dim=1
)

predicted_class = torch.argmax(
    probabilities,
    dim=1
).item()

confidence = probabilities[
    0,
    predicted_class
].item()


print(
    "Predicted Class:",
    CLASS_NAMES[predicted_class]
)

print(
    f"Confidence: {confidence * 100:.2f}%"
)


# ======================================
# Backward Pass
# ======================================

score = output[
    0,
    predicted_class
]

score.backward()


# ======================================
# Generate Grad-CAM
# ======================================

print("\n======================================")
print("Generating Grad-CAM")
print("======================================")


activation = activations[0]

gradient = gradients[0]


# Global Average Pooling of gradients

weights = gradient.mean(
    dim=(1, 2)
)


# Weighted combination

cam = torch.zeros(
    activation.shape[1:],
    device=DEVICE
)


for i in range(
    activation.shape[0]
):

    cam += (
        weights[i]
        * activation[i]
    )


# ReLU

cam = torch.relu(
    cam
)


# Normalize

cam -= cam.min()

cam /= (
    cam.max()
    + 1e-8
)


# Convert to NumPy

cam = cam.detach().cpu().numpy()


# ======================================
# Resize Heatmap
# ======================================

heatmap = cv2.resize(
    cam,
    (
        original_image.shape[1],
        original_image.shape[0]
    )
)


heatmap = np.uint8(
    255 * heatmap
)


# ======================================
# Apply Color Map
# ======================================

heatmap = cv2.applyColorMap(
    heatmap,
    cv2.COLORMAP_JET
)


# Convert RGB → BGR

original_bgr = cv2.cvtColor(
    original_image,
    cv2.COLOR_RGB2BGR
)


# ======================================
# Overlay
# ======================================

overlay = cv2.addWeighted(
    original_bgr,
    0.6,
    heatmap,
    0.4,
    0
)


# ======================================
# Add Prediction Text
# ======================================

text = (
    f"{CLASS_NAMES[predicted_class]} "
    f"({confidence * 100:.1f}%)"
)

cv2.putText(
    overlay,
    text,
    (20, 40),
    cv2.FONT_HERSHEY_SIMPLEX,
    1,
    (255, 255, 255),
    2,
    cv2.LINE_AA
)


# ======================================
# Save Result
# ======================================

Path(
    OUTPUT_PATH
).parent.mkdir(
    exist_ok=True
)

cv2.imwrite(
    OUTPUT_PATH,
    overlay
)


# Remove hooks

forward_handle.remove()
backward_handle.remove()


print("\n======================================")
print("Grad-CAM Complete!")
print("======================================")

print(
    "Result saved to:"
)

print(
    OUTPUT_PATH
)