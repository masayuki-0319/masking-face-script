import { detectFacesFromImage } from "./cloud-vision-api";
import { maskFacesByEmojis } from "./mask-face-by-emoji";

const main = async (inputImagePath: string) => {
  const faces = await detectFacesFromImage(inputImagePath);
  maskFacesByEmojis({ inputImagePath, faces });
};

const validateArgs = () => {
  const inputImagePath = process.argv[2];

  if (!inputImagePath) {
    console.error("Error: 画像ファイルのパスを指定してください");
    process.exit(1);
  }

  return inputImagePath;
};

main(validateArgs());
