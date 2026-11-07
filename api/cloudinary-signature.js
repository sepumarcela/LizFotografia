import { createHash } from "node:crypto";
import {
  getApps,
  initializeApp,
  cert,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Carpetas autorizadas para almacenar las fotografías de Liz Zapata
const allowedFolders = [
  "liz-zapata/home",
  "liz-zapata/instagram",
  "liz-zapata/about",
  "liz-zapata/categories/producto",
  "liz-zapata/categories/moda",
  "liz-zapata/categories/gastronomica",
  "liz-zapata/personal",
  "liz-zapata/blog",
  "liz-zapata/contact",
];

// Inicializar Firebase Admin
function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  ).trim();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Faltan credenciales de Firebase Admin.");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

// Función principal de Vercel
export default async function handler(req, res) {
  // Solo permitir solicitudes POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido.",
    });
  }

  try {
    // Verificar configuración de Cloudinary
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Faltan credenciales de Cloudinary.");
    }

    // Obtener token de Firebase enviado desde el frontend
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "No autorizado. Token no proporcionado.",
      });
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Token de autenticación inválido.",
      });
    }

    // Verificar identidad del usuario
    const firebaseAdmin = getFirebaseAdmin();
    const decodedToken = await getAuth(firebaseAdmin).verifyIdToken(token);

    // Validar que sea el administrador autorizado
    const adminUid = process.env.FIREBASE_ADMIN_UID;

    if (!adminUid || decodedToken.uid !== adminUid) {
      return res.status(403).json({
        error: "No tienes permisos para realizar esta acción.",
      });
    }

    // Recibir carpeta solicitada
    const { folder } = req.body || {};

    // Validar que la carpeta esté autorizada
    if (!folder || !allowedFolders.includes(folder)) {
      return res.status(400).json({
        error: "La carpeta solicitada no está autorizada.",
      });
    }

    // Generar marca de tiempo
    const timestamp = Math.floor(Date.now() / 1000);

    // Parámetros que se firmarán para Cloudinary
    const paramsToSign = {
      folder,
      timestamp,
    };

    // Ordenar parámetros alfabéticamente
    const signatureString = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&");

    // Generar firma SHA-1
    const signature = createHash("sha1")
      .update(signatureString + apiSecret)
      .digest("hex");

    // Responder al frontend
    return res.status(200).json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    });
  } catch (error) {
    console.error("Error generando firma de Cloudinary:", error);

    return res.status(500).json({
      error: "No fue posible generar la firma de carga.",
    });
  }
}