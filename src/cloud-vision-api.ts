import { ImageAnnotatorClient, protos } from "@google-cloud/vision";
import { google } from "@google-cloud/vision/build/protos/protos";

// サービスアカウントキーへのパスを指定
// Google Cloud Platformで作成したサービスアカウントキーのJSONファイルへのパス
const keyFilename = "./google-service-account-key.json";

// Vision APIクライアントを初期化
const visionApiClient = new ImageAnnotatorClient({ keyFilename });

/**
 * 画像から顔を検出し、顔の座標情報を返す関数
 * @param imagePath - 解析する画像ファイルのパス
 * @returns 検出された顔の頂点座標の配列（各顔につき4つの頂点座標を持つ）
 */
async function detectFacesFromImage(
  imagePath: string
): Promise<google.cloud.vision.v1.IVertex[][]> {
  try {
    // Vision APIで顔検出を実行
    // result[0]には検出結果が含まれる
    const [result] = await visionApiClient.faceDetection({
      image: {
        source: { filename: imagePath },
      },
      features: [
        {
          maxResults: 100,
          type: protos.google.cloud.vision.v1.Feature.Type.FACE_DETECTION,
        },
      ],
    });
    const faceAnnotations = result.faceAnnotations;

    // 顔が検出されなかった場合はエラーを投げる
    if (!faceAnnotations || faceAnnotations.length === 0) {
      throw new Error("No faces detected");
    }

    // 検出された各顔のboundingPoly（境界ボックス）の頂点座標を抽出
    // IVertexは{x: number, y: number}の形式で座標を表す
    const faces = faceAnnotations.reduce<google.cloud.vision.v1.IVertex[][]>(
      (faceVertices, faceAnnotation) => {
        // 頂点座標が不完全な場合（座標値が欠落している場合）はスキップ
        if (
          !faceAnnotation.boundingPoly?.vertices ||
          faceAnnotation.boundingPoly.vertices.some(
            (vertice) => !vertice.x || !vertice.y
          )
        )
          return faceVertices;

        // 有効な頂点座標を持つ顔の情報を配列に追加
        return [...faceVertices, faceAnnotation.boundingPoly.vertices];
      },
      []
    );

    // デバッグ用に検出された顔の座標情報をコンソールに出力
    console.log("Faces:", JSON.stringify(faces, null, 2));

    return faces;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to detect faces from image");
  }
}

export { detectFacesFromImage };
