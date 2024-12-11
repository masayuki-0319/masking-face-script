import { Canvas, loadImage } from "skia-canvas";
import fs from "fs";

import { google } from "@google-cloud/vision/build/protos/protos";

// 顔マスキング用の絵文字
const emojis = ["😊", "😎", "😍", "🤔", "😄"];

async function maskFacesByEmojis({
  inputImagePath,
  faces,
}: {
  inputImagePath: string;
  faces: google.cloud.vision.v1.IVertex[][];
}) {
  try {
    if (!faces || faces.length === 0) {
      console.log("No faces detected");
      return;
    }

    const image = await loadImage(inputImagePath);

    // マスキング後も元画像と同じサイズを維持するため、同じ幅・高さでCanvasを作成する。
    const canvas = new Canvas(image.width, image.height);
    const ctx = canvas.getContext("2d");

    // 元の画像を描画する。
    ctx.drawImage(image, 0, 0, image.width, image.height);

    // 顔の位置に対して絵文字でマスキングする。
    faces.forEach((face, index) => {
      const { x, y, faceWidth, faceHeight } = extractFaceLocation(face);

      const emoji = emojis[index % emojis.length];

      ctx.font = `${faceWidth}px "Apple Color Emoji"`;
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, x + faceWidth / 2, y + faceHeight / 2);
    });

    const buffer = await canvas.toBuffer("jpeg");
    fs.writeFileSync(`${inputImagePath.split(".")[0]}-masked.jpg`, buffer);
  } catch (error) {
    console.error("Error processing image:", error);
  }
}

function extractFaceLocation(face: google.cloud.vision.v1.IVertex[]): {
  x: number;
  y: number;
  faceWidth: number;
  faceHeight: number;
} {
  /*
   * Vision APIから返される顔の座標から、描画に必要な情報を抽出します。
   * - X, Y座標の最小値が顔の左上の起点
   * - 幅と高さは、それぞれX, Y座標の最大値と最小値の差分から計算
   */
  const x = Math.min(...face.map((v) => v.x || 0));
  const y = Math.min(...face.map((v) => v.y || 0));
  const faceWidth = Math.max(...face.map((v) => v.x || 0)) - x;
  const faceHeight = Math.max(...face.map((v) => v.y || 0)) - y;

  return {
    x,
    y,
    faceWidth,
    faceHeight,
  };
}

export { maskFacesByEmojis };
