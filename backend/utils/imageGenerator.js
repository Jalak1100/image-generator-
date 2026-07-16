export function buildStyledPrompt(prompt, style) {
  const trimmedPrompt = prompt.trim();
  const normalizedStyle = (style || 'Realistic').toString();

  switch (normalizedStyle) {
    case 'Cartoon':
      return `Cartoon illustration, ${trimmedPrompt}, vibrant playful colors, bold outlines`;
    case 'Anime':
      return `Anime style, ${trimmedPrompt}, detailed anime artwork, cinematic lighting`;
    case '3D':
      return `3D render, ${trimmedPrompt}, high quality 3D model, photorealistic render`;
    default:
      return `Photorealistic, ${trimmedPrompt}, ultra detailed realistic image`;
  }
}

export function mapAspectRatioToDimensions(aspectRatio) {
  switch (aspectRatio) {
    case '4:3':
      return { width: 1024, height: 768 };
    case '3:4':
      return { width: 768, height: 1024 };
    case '16:9':
      return { width: 1280, height: 720 };
    case '9:16':
      return { width: 720, height: 1280 };
    default:
      return { width: 1024, height: 1024 };
  }
}
