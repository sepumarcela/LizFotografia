
import { createHash } from "node:crypto";
import { requireAdmin, fail } from "../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  // Solo permite solicitudes POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Método no permitido.",
    });
  }

  try {
    // Verificar que el usuario esté autenticado y sea administrador
    await requireAdmin(req);

    // Variables de entorno de Cloudinary
    const {
      CLOUDINARY_CLOUD_NAME: cloud,
      CLOUDINARY_API_KEY: key,
      CLOUDINARY_API_SECRET: secret,
    } = process.env;

    const publicId = req.body?.publicId;

    if (!cloud || !key || !secret) {
      throw new Error("Faltan variables Cloudinary.");
    }

    // Carpetas autorizadas para eliminar fotografías
    const allowedPrefixes = [
      "liz-zapata/home/",
      "liz-zapata/about/",
      "liz-zapata/categories/producto/",
      "liz-zapata/categories/moda/",
      "liz-zapata/categories/gastronomica/",
      "liz-zapata/personal/",
      "liz-zapata/blog/",
      "liz-zapata/contact/",
    ];

    // Validar que la imagen pertenezca a una carpeta autorizada
    if (
      typeof publicId !== "string" ||
      !allowedPrefixes.some((prefix) =>
        publicId.startsWith(prefix)
      )
    ) {
      return res.status(400).json({
        error: "Imagen no válida.",
      });
    }

    // Generar marca de tiempo
    const timestamp = Math.floor(Date.now() / 1000);

    // Parámetros para firmar la solicitud
    const params = {
      invalidate: true,
      public_id: publicId,
      timestamp,
    };

    // Generar firma de seguridad para Cloudinary
    const raw = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");

    const signature = createHash("sha1")
      .update(raw + secret)
      .digest("hex");

    // Preparar solicitud de eliminación
    const body = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      invalidate: "true",
      api_key: key,
      signature,
    });

    // Solicitar eliminación de la imagen en Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud}/image/destroy`,
      {
        method: "POST",
        body,
      }
    );

    const result = await response.json();

    // Comprobar respuesta de Cloudinary
    if (
      !response.ok ||
      !["ok", "not found"].includes(result.result)
    ) {
      return res.status(502).json({
        error: "Cloudinary no pudo eliminar la imagen.",
      });
    }

    return res.status(200).json({
      success: true,
    });

  } catch (error) {
    return fail(res, error);
  }
}
