import torch
import torch.nn as nn

from torchvision.models import efficientnet_b0

from PIL import Image
from torchvision import transforms

from pathlib import Path
import numpy as np
import cv2


# =========================
# Configuration
# =========================

NUM_CLASSES = 5

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR
    / "models"
    / "best_efficientnet_b0.pth"
)

OUTPUT_DIR = BASE_DIR / "models"
OUTPUT_DIR.mkdir(exist_ok=True)


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


# =========================
# Image Transform
# =========================

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# =========================
# Load Model
# =========================

print("Loading EfficientNet-B0...")

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

print("Model loaded successfully!")
print("Device:", DEVICE)


# =========================
# Prediction + Grad-CAM
# =========================

def predict_image(image: Image.Image):

    image = image.convert("RGB")

    # Prepare image
    input_tensor = transform(
        image
    ).unsqueeze(0).to(DEVICE)

    # Grad-CAM target layer
    target_layer = model.features[-1]

    activations = None
    gradients = None

    # Forward hook
    def forward_hook(module, input, output):

        nonlocal activations

        activations = output

    # Backward hook
    def backward_hook(module, grad_input, grad_output):

        nonlocal gradients

        gradients = grad_output[0]

    forward_handle = target_layer.register_forward_hook(
        forward_hook
    )

    backward_handle = target_layer.register_full_backward_hook(
        backward_hook
    )

    # Enable gradients
    model.zero_grad()

    outputs = model(
        input_tensor
    )

    probabilities = torch.softmax(
        outputs,
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

    # Backpropagate predicted class
    score = outputs[
        0,
        predicted_class
    ]

    score.backward()

    # Remove hooks
    forward_handle.remove()
    backward_handle.remove()

    # =========================
    # Generate Grad-CAM
    # =========================

    grads = gradients[0]
    acts = activations[0]

    # Global average pooling of gradients
    weights = grads.mean(
        dim=(1, 2)
    )

    # Weighted feature maps
    cam = torch.zeros(
        acts.shape[1:],
        device=DEVICE
    )

    for i, weight in enumerate(weights):

        cam += weight * acts[i]

    # ReLU
    cam = torch.relu(cam)

    # Move to CPU
    cam = cam.detach().cpu().numpy()

    # Normalize
    if cam.max() != 0:

        cam = (
            cam - cam.min()
        ) / (
            cam.max() - cam.min()
        )

    # Resize heatmap to original image size
    original_image = np.array(
        image
    )

    height, width = original_image.shape[:2]

    cam = cv2.resize(
        cam,
        (width, height)
    )

    # Convert heatmap
    heatmap = np.uint8(
        255 * cam
    )

    heatmap = cv2.applyColorMap(
        heatmap,
        cv2.COLORMAP_JET
    )

    # RGB → BGR
    original_bgr = cv2.cvtColor(
        original_image,
        cv2.COLOR_RGB2BGR
    )

    # Overlay
    overlay = cv2.addWeighted(
        original_bgr,
        0.6,
        heatmap,
        0.4,
        0
    )

    # Save heatmap
    output_path = (
        OUTPUT_DIR
        / "latest_gradcam.png"
    )

    cv2.imwrite(
        str(output_path),
        overlay
    )

    return {
        "class_id": predicted_class,

        "class_name": CLASS_NAMES[
            predicted_class
        ],

        "confidence": round(
            confidence * 100,
            2
        ),

        "gradcam_path": str(
            output_path
        )
    }