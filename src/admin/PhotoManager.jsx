
import React, { useEffect, useRef, useState } from "react";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { auth, db } from "../firebase/config";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import "./photo-manager.css";

const categories = [
  ["home", "Inicio"],
  ["producto", "Producto"],
  ["moda", "Moda"],
  ["gastronomica", "Gastronómica"],
  ["personal", "Personal"],
  ["sobre-mi", "Sobre mí"],
  ["blog", "Blog"],
];

const folderByCategory = {
  home: "liz-zapata/home",
  producto: "liz-zapata/categories/producto",
  moda: "liz-zapata/categories/moda",
  gastronomica: "liz-zapata/categories/gastronomica",
  personal: "liz-zapata/personal",
  "sobre-mi": "liz-zapata/about",
  blog: "liz-zapata/blog",
};

export default function PhotoManager() {
  const fileRef = useRef(null);

  const [images, setImages] = useState([]);
  const [category, setCategory] = useState("producto");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function getToken() {
    if (!auth.currentUser) {
      throw new Error("La sesión terminó. Ingresa nuevamente.");
    }

    return auth.currentUser.getIdToken();
  }

  async function refresh() {
    setLoading(true);

    try {
      const snap = await getDocs(
        query(
          collection(db, "siteImages"),
          orderBy("createdAt", "desc")
        )
      );

      setImages(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    } catch (error) {
      console.error(error);
      setMessage(
        "No se pudo leer siteImages. Revisa las reglas de Firestore."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function upload(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const invalidFile = files.some(
      (file) =>
        !file.type.startsWith("image/") ||
        file.size > 25 * 1024 * 1024
    );

    if (invalidFile) {
      setMessage("Solo se permiten imágenes de máximo 25 MB.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const idToken = await getToken();
      const folder = folderByCategory[category];

      if (!folder) {
        throw new Error("La categoría seleccionada no es válida.");
      }

      // Solicitar firma segura al servidor
      const signedRes = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folder }),
      });

      const signed = await signedRes.json();

      if (!signedRes.ok) {
        throw new Error(
          signed.error || "No se pudo preparar la carga."
        );
      }

      // Cargar fotografías en Cloudinary
      for (const file of files) {
        const form = new FormData();

        form.append("file", file);
        form.append("api_key", signed.apiKey);
        form.append("timestamp", String(signed.timestamp));
        form.append("folder", signed.folder);
        form.append("signature", signed.signature);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
          {
            method: "POST",
            body: form,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error?.message ||
              "Cloudinary rechazó la imagen."
          );
        }

        // Guardar información de la fotografía en Firestore
        await addDoc(collection(db, "siteImages"), {
          title:
            title.trim() ||
            file.name.replace(/\.[^.]+$/, ""),
          category,
          url: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
          format: data.format,
          bytes: data.bytes,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser.uid,
        });
      }

      setTitle("");
      setMessage(
        `${files.length} fotografía(s) cargada(s) correctamente.`
      );

      await refresh();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al cargar las fotografías.");
    } finally {
      setUploading(false);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  async function remove(item) {
    const confirmed = window.confirm(
      `¿Eliminar "${item.title || "esta fotografía"}"?`
    );

    if (!confirmed) return;

    try {
      const idToken = await getToken();

      // Eliminar fotografía de Cloudinary
      const response = await fetch("/api/cloudinary-delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicId: item.publicId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "No se pudo eliminar la fotografía."
        );
      }

      // Eliminar registro de Firestore
      await deleteDoc(doc(db, "siteImages", item.id));

      setImages((current) =>
        current.filter((image) => image.id !== item.id)
      );

      setMessage("Fotografía eliminada correctamente.");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al eliminar.");
    }
  }

  return (
    <section className="photo-manager">
      <div className="photo-upload-card">
        <div className="photo-manager-heading">
          <div>
            <span className="admin-eyebrow">
              BIBLIOTECA VISUAL
            </span>

            <h3>Gestionar fotografías</h3>

            <p>
              Archivos en Cloudinary; información en Firebase.
            </p>
          </div>

          <ImageIcon size={34} />
        </div>

        <div className="photo-form-grid">
          <label>
            Sección o categoría

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              {categories.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nombre / descripción (opcional)

            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Ej. Campaña primavera"
            />
          </label>
        </div>

        <input
          ref={fileRef}
          className="photo-file-input"
          type="file"
          accept="image/*"
          multiple
          onChange={upload}
        />

        <button
          className="photo-upload-button"
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <LoaderCircle className="spin" />
          ) : (
            <Upload />
          )}

          {uploading
            ? "CARGANDO..."
            : "SELECCIONAR FOTOGRAFÍAS"}
        </button>

        <small className="photo-help">
          Selección múltiple · máximo 25 MB por imagen.
        </small>

        {message && (
          <p className="photo-message">{message}</p>
        )}
      </div>

      <div className="photo-library-heading">
        <div>
          <h3>Fotografías cargadas</h3>
          <p>{images.length} archivo(s)</p>
        </div>

        <button
          className="photo-refresh"
          type="button"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="photo-empty">
          <LoaderCircle className="spin" />
          Cargando...
        </div>
      ) : images.length === 0 ? (
        <div className="photo-empty">
          <ImageIcon />
          <p>Aún no hay fotografías cargadas.</p>
        </div>
      ) : (
        <div className="photo-grid">
          {images.map((item) => (
            <article className="photo-card" key={item.id}>
              <img
                src={item.url}
                alt={item.title || "Fotografía"}
                loading="lazy"
              />

              <div className="photo-card-info">
                <strong>
                  {item.title || "Sin título"}
                </strong>

                <span>
                  {categories.find(
                    (category) => category[0] === item.category
                  )?.[1] || item.category}
                </span>

                <button
                  type="button"
                  onClick={() => remove(item)}
                >
                  <Trash2 size={15} />
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
