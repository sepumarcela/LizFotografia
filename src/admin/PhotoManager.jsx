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
  updateDoc,
} from "firebase/firestore";
import "./photo-manager.css";

const categories = [
  ["home", "Inicio — portada principal"],
  ["instagram", "Franja de Instagram"],
  ["sobre-mi", "Sobre mí"],
  ["producto", "Categoría — Producto"],
  ["moda", "Categoría — Moda"],
  ["gastronomica", "Categoría — Gastronomía"],
  ["personal", "Personal"],
  ["blog", "Blog"],
  ["contact", "Servicios y contacto"],
];

const folderByCategory = {
  home: "liz-zapata/home",
  instagram: "liz-zapata/instagram",
  producto: "liz-zapata/categories/producto",
  moda: "liz-zapata/categories/moda",
  gastronomica: "liz-zapata/categories/gastronomica",
  personal: "liz-zapata/personal",
  "sobre-mi": "liz-zapata/about",
  blog: "liz-zapata/blog",
  contact: "liz-zapata/contact",
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export default function PhotoManager() {
  const fileRef = useRef(null);
  const replaceRef = useRef(null);
  const replacingItemRef = useRef(null);

  const [images, setImages] = useState([]);
  const [category, setCategory] = useState("home");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

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
        query(collection(db, "siteImages"), orderBy("createdAt", "desc"))
      );
      setImages(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (error) {
      console.error("Error leyendo siteImages:", error);
      setMessage("No se pudieron cargar las fotografías. Revisa las reglas de Firestore.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function validateFiles(files) {
    return files.every(
      (file) => file.type.startsWith("image/") && file.size <= MAX_FILE_SIZE
    );
  }

  async function getCloudinarySignature(folder) {
    const idToken = await getToken();
    const response = await fetch("/api/cloudinary-signature", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ folder }),
    });
    const signed = await response.json();
    if (!response.ok) {
      throw new Error(signed.error || "No se pudo preparar la carga.");
    }
    return signed;
  }

  async function uploadToCloudinary(file, folder) {
    const signed = await getCloudinarySignature(folder);
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", signed.apiKey);
    form.append("timestamp", String(signed.timestamp));
    form.append("folder", signed.folder);
    form.append("signature", signed.signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
      { method: "POST", body: form }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Cloudinary rechazó la imagen.");
    }
    return data;
  }

  async function deleteFromCloudinary(publicId) {
    if (!publicId) return;
    const idToken = await getToken();
    const response = await fetch("/api/cloudinary-delete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "No se pudo eliminar la imagen anterior de Cloudinary.");
    }
  }

  async function upload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    if (!validateFiles(files)) {
      setMessage("Selecciona únicamente imágenes de máximo 25 MB cada una.");
      event.target.value = "";
      return;
    }

    const folder = folderByCategory[category];
    if (!folder) {
      setMessage("La sección seleccionada no tiene una carpeta configurada.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setMessage("");
    let uploaded = 0;
    try {
      for (const file of files) {
        const data = await uploadToCloudinary(file, folder);
        await addDoc(collection(db, "siteImages"), {
          title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
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
        uploaded += 1;
      }
      setTitle("");
      setMessage(`${uploaded} fotografía(s) cargada(s) correctamente en ${categories.find(([value]) => value === category)?.[1] || category}.`);
      await refresh();
    } catch (error) {
      console.error("Error subiendo fotografías:", error);
      setMessage(uploaded ? `${uploaded} imagen(es) se guardaron. La siguiente carga falló: ${error.message}` : error.message || "Error al cargar las fotografías.");
      await refresh();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function chooseReplacement(item) {
    replacingItemRef.current = item;
    setMessage("");
    replaceRef.current?.click();
  }

  async function replaceImage(event) {
    const file = event.target.files?.[0];
    const item = replacingItemRef.current;
    event.target.value = "";
    replacingItemRef.current = null;
    if (!file || !item) return;
    if (!validateFiles([file])) {
      setMessage("Selecciona una imagen válida de máximo 25 MB.");
      return;
    }

    const folder = folderByCategory[item.category];
    if (!folder) {
      setMessage("No hay una carpeta configurada para esta sección.");
      return;
    }

    setUploading(true);
    setMessage(`Reemplazando «${item.title || "fotografía"}»...`);
    try {
      // Primero se carga la nueva imagen y se actualiza Firestore.
      // Solo después se elimina el archivo anterior de Cloudinary.
      const data = await uploadToCloudinary(file, folder);
      await updateDoc(doc(db, "siteImages", item.id), {
        title: item.title || file.name.replace(/\.[^.]+$/, ""),
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format,
        bytes: data.bytes,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid,
      });
      try {
        await deleteFromCloudinary(item.publicId);
      } catch (cleanupError) {
        console.warn("La imagen nueva quedó activa, pero no se pudo borrar la anterior:", cleanupError);
        setMessage("La fotografía se reemplazó. No se pudo borrar el archivo anterior de Cloudinary; revisaremos ese residuo después.");
        await refresh();
        return;
      }
      setMessage("Fotografía reemplazada correctamente.");
      await refresh();
    } catch (error) {
      console.error("Error reemplazando fotografía:", error);
      setMessage(error.message || "No se pudo reemplazar la fotografía.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(item) {
    const confirmed = window.confirm(`¿Eliminar «${item.title || "esta fotografía"}»? Esta acción también elimina el archivo de Cloudinary.`);
    if (!confirmed) return;

    setUploading(true);
    setMessage("");
    try {
      await deleteFromCloudinary(item.publicId);
      await deleteDoc(doc(db, "siteImages", item.id));
      setImages((current) => current.filter((image) => image.id !== item.id));
      setMessage("Fotografía eliminada correctamente.");
    } catch (error) {
      console.error("Error eliminando fotografía:", error);
      setMessage(error.message || "Error al eliminar la fotografía.");
    } finally {
      setUploading(false);
    }
  }

  const visibleImages = filter === "all"
    ? images
    : images.filter((item) => item.category === filter);

  return (
    <section className="photo-manager">
      <div className="photo-upload-card">
        <div className="photo-manager-heading">
          <div>
            <span className="admin-eyebrow">BIBLIOTECA VISUAL</span>
            <h3>Gestionar fotografías</h3>
            <p>Las imágenes se almacenan en Cloudinary y su información en Firebase.</p>
          </div>
          <ImageIcon size={34} />
        </div>

        <div className="photo-form-grid">
          <label>
            Sección del sitio
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Nombre / descripción (opcional)
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej. Retrato de portada"
            />
          </label>
        </div>

        <input ref={fileRef} className="photo-file-input" type="file" accept="image/*" multiple onChange={upload} />
        <input ref={replaceRef} className="photo-file-input" type="file" accept="image/*" onChange={replaceImage} />
        <button className="photo-upload-button" type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <LoaderCircle className="spin" /> : <Upload />}
          {uploading ? "PROCESANDO..." : "SUBIR FOTOGRAFÍAS"}
        </button>
        <small className="photo-help">Puedes seleccionar varias imágenes · máximo 25 MB por imagen. Para cambiar una existente, usa «Reemplazar» en su tarjeta.</small>
        {message && <p className="photo-message" role="status">{message}</p>}
      </div>

      <div className="photo-library-heading">
        <div>
          <h3>Fotografías del sitio</h3>
          <p>{visibleImages.length} de {images.length} archivo(s)</p>
        </div>
        <button className="photo-refresh" type="button" onClick={refresh} disabled={loading || uploading}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      <label className="photo-filter-label" style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 18px", flexWrap: "wrap" }}>
        Mostrar sección
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Todas las secciones</option>
          {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>

      {loading ? (
        <div className="photo-empty"><LoaderCircle className="spin" /> Cargando fotografías...</div>
      ) : visibleImages.length === 0 ? (
        <div className="photo-empty"><ImageIcon /><p>No hay fotografías en esta sección todavía.</p></div>
      ) : (
        <div className="photo-grid">
          {visibleImages.map((item) => (
            <article className="photo-card" key={item.id}>
              <img src={item.url} alt={item.title || "Fotografía"} loading="lazy" />
              <div className="photo-card-info">
                <strong>{item.title || "Sin título"}</strong>
                <span>{categories.find(([value]) => value === item.category)?.[1] || item.category}</span>
                <div className="photo-card-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  <button type="button" disabled={uploading} onClick={() => chooseReplacement(item)}>
                    <RefreshCw size={15} /> Reemplazar
                  </button>
                  <button type="button" disabled={uploading} onClick={() => remove(item)}>
                    <Trash2 size={15} /> Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
