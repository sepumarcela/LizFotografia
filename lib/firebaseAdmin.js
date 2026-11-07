import admin from "firebase-admin";
function firebaseAdmin() {
  if (admin.apps.length) return admin;
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL } = process.env;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !privateKey)
    throw new Error("Faltan variables Firebase Admin.");
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
  return admin;
}
export async function requireAdmin(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    const e = new Error("No autorizado.");
    e.status = 401;
    throw e;
  }
  const decoded = await firebaseAdmin().auth().verifyIdToken(auth.slice(7));
  if (
    !process.env.FIREBASE_ADMIN_UID ||
    decoded.uid !== process.env.FIREBASE_ADMIN_UID
  ) {
    const e = new Error("Sin permisos.");
    e.status = 403;
    throw e;
  }
}
export function fail(res, error) {
  console.error(error);
  return res
    .status(error.status || 500)
    .json({
      error: error.status ? error.message : "Error interno del servidor.",
    });
}
