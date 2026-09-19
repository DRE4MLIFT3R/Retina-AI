from PIL import Image
import matplotlib.pyplot as plt
from pathlib import Path

# Dataset folder
images_path = Path("dataset/train_images")

# Pehli image
image_file = next(images_path.glob("*.png"))

# Image open karo
image = Image.open(image_file)

print("Image:", image_file.name)
print("Image size:", image.size)
print("Image mode:", image.mode)

# Image display
plt.imshow(image)
plt.axis("off")
plt.show()