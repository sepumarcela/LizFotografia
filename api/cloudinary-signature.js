
import { createHash } from "node:crypto";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const allowedFolders = [
  "liz-zapata/home",
  "liz-zapata/about",
  "liz-zapata/categories/producto",
  "liz-zapata/categories/moda",
  "liz-zapata/categories/gastronomica",
  "liz-zapata/personal",
  "liz-zapata/blog",
  "liz-zapata/contact"
];

function getFirebaseAdmin() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Faltan credenciales de Firebase Admin.");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey })
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: "Sesión no autorizada." });
    }

    const app = getFirebaseAdmin();
    const decodedToken = await getAuth(app).verifyIdToken(token);

    if (decodedToken.uid !== process.env.FIREBASE_ADMIN_UID) {
      return res.status(403).json({ error: "No tienes permiso para cargar imágenes." });
    }

    const { folder } = req.body || {};

    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({ error: "Carpeta de destino no permitida." });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Faltan credenciales de Cloudinary.");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `folder=${folder}&timestamp=${timestamp}`;

    const signature = createHash("sha1")
      .update(stringToSign + apiSecret)
      .digest("hex");

    return res.status(200).json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature
    });
  } catch (error) {
    console.error("Error generando firma de Cloudinary:", error);
    return res.status(401).json({
      error: "No fue posible autorizar la carga de imágenes."
    });
  }
}
