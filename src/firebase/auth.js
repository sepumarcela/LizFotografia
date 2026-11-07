
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth } from "./config";

// ======================================
// INICIAR SESIÓN DEL ADMINISTRADOR
// ======================================
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    return {
      success: true,
      user: userCredential.user,
      error: null,
    };
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    return {
      success: false,
      user: null,
      error: error.code,
    };
  }
};

// ======================================
// CERRAR SESIÓN
// ======================================
export const logout = async () => {
  try {
    await signOut(auth);

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error al cerrar sesión:", error);

    return {
      success: false,
      error: error.code,
    };
  }
};

// ======================================
// OBSERVAR ESTADO DE AUTENTICACIÓN
// ======================================
export const observeAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ======================================
// RECUPERAR CONTRASEÑA
// ======================================
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email.trim());

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error al recuperar contraseña:", error);

    return {
      success: false,
      error: error.code,
    };
  }
};
