
import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  House,
  UserRound,
  Images,
  Camera,
  BookOpen,
  Contact,
  LogOut,
  Save,
  Eye,
  ChevronRight,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Plus,
  Trash2,
  ImagePlus,
  GripVertical
} from "lucide-react";

import { login, logout, observeAuth } from "../firebase/auth";
import { db } from "../firebase/config";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  orderBy,
  query
} from "firebase/firestore";

import PhotoManager from "./PhotoManager.jsx";
import "./admin.css";

const sections = [
  {
    id: "home",
    label: "Inicio",
    icon: House,
    description: "Portada y presentación principal"
  },
  {
    id: "about",
    label: "Sobre mí",
    icon: UserRound,
    description: "Biografía y presentación profesional"
  },
  {
    id: "categories",
    label: "Categorías",
    icon: Images,
    description: "Presentación de las categorías fotográficas"
  },
  {
    id: "personal",
    label: "Personal",
    icon: Camera,
    description: "Proyectos y trabajos personales"
  },
  {
    id: "blog",
    label: "Blog",
    icon: BookOpen,
    description: "Artículos y publicaciones"
  },
  {
    id: "contact",
    label: "Servicios y contacto",
    icon: Contact,
    description: "Servicios y datos de contacto"
  },
  {
    id: "photos",
    label: "Fotografías",
    icon: Images,
    description: "Biblioteca y portafolio fotográfico"
  }
];

const initialContent = {
  home: {
    title: "Liz Zapata Fotógrafa",
    kicker: "FOTOGRAFÍA QUE CUENTA HISTORIAS",
    subtitle: "PRODUCTO / MODA / GASTRONÓMICA",
    description: "Presentación principal de la página de inicio."
  },

  about: {
    title: "Hola!",
    paragraph1: "Soy Liz Zapata, fotógrafa apasionada por contar historias a través de la imagen.",
    paragraph2: "Me especializo en fotografía de producto, moda y gastronómica, creando imágenes que conectan, comunican y resaltan la esencia de cada marca, proyecto o idea.",
    paragraph3: "Disfruto explorar la luz, los colores y los detalles, siempre buscando una mirada creativa y auténtica en cada toma."
  },

  categories: {
    title: "Categorías",
    description: "Explora mi trabajo a través de tres enfoques fotográficos: producto, moda y gastronómica. Cada categoría refleja mi forma de contar historias desde la luz, la composición y el detalle.",
    category1: "Producto",
    category2: "Moda",
    category3: "Gastronómica"
  },

  personal: {
    title: "Personal",
    description: "Proyectos fotográficos personales y experimentales donde exploro ideas, conceptos y narrativas visuales más libres.",
    project1Title: "Proyecto personal 01",
    project1Description: "Una exploración visual sobre la memoria, los espacios y los pequeños detalles que persisten en el tiempo.",
    project2Title: "Proyecto personal 02",
    project2Description: "Un proyecto íntimo que observa la luz como protagonista, creando atmósferas simples y cotidianas.",
    project3Title: "Proyecto personal 03",
    project3Description: "Una reflexión visual sobre la textura, la forma y la transformación de los materiales en imágenes."
  },

  blog: {
    title: "Blog",
    articles: [
      { id: "articulo-analogico", slug: "la-magia-del-analogico", title: "La magia del analógico", excerpt: "Un acercamiento a la fotografía análoga, sus procesos, texturas y la experiencia de fotografiar con tiempo y propósito.", body: "", coverUrl: "", status: "published", publishedAt: "" },
      { id: "articulo-gastronomia", slug: "fotografia-gastronomica", title: "Fotografía gastronómica", excerpt: "Claves para crear imágenes gastronómicas apetitosas, auténticas y con identidad.", body: "", coverUrl: "", status: "published", publishedAt: "" }
    ]
  },

  contact: {
    title: "Servicios y contacto",
    description: "Fotografía de producto, moda y gastronómica para marcas, proyectos e ideas que buscan destacar a través de la imagen.",
    services: "Producto\nModa\nGastronómica\nProyectos especiales",
    phone: "+57 300 223 79 34",
    website: "www.lizzapata.com",
    email: "fotografa@lizzapata.com"
  },

  photos: {}
};

const fieldLabels = {
  title: "Título principal",
  kicker: "Texto superior",
  subtitle: "Subtítulo",
  description: "Descripción",
  paragraph1: "Párrafo 1",
  paragraph2: "Párrafo 2",
  paragraph3: "Párrafo 3",
  category1: "Categoría 1",
  category2: "Categoría 2",
  category3: "Categoría 3",
  project1Title: "Proyecto 1 · Título",
  project1Description: "Proyecto 1 · Descripción",
  project2Title: "Proyecto 2 · Título",
  project2Description: "Proyecto 2 · Descripción",
  project3Title: "Proyecto 3 · Título",
  project3Description: "Proyecto 3 · Descripción",
  article1Title: "Artículo 1 · Título",
  article1Description: "Artículo 1 · Descripción",
  article2Title: "Artículo 2 · Título",
  article2Description: "Artículo 2 · Descripción",
  services: "Servicios (uno por línea)",
  phone: "Teléfono",
  website: "Sitio web",
  email: "Correo electrónico"
};

function getFriendlyError(error) {
  if (error?.code === "permission-denied") {
    return "Firebase bloqueó el acceso a Firestore. Debemos configurar las reglas de seguridad antes de guardar.";
  }

  if (error?.code === "unavailable") {
    return "No hay conexión con Firebase. Revisa tu conexión e inténtalo de nuevo.";
  }

  return "No se pudo completar la operación. Revisa la consola para conocer el detalle.";
}

function makeSlug(value) {
  return (value || "articulo-nuevo")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "articulo-nuevo";
}

function BlogEditor({ content, updateField, onSave, saving, loading, notice, onReset }) {
  const [blogPhotos, setBlogPhotos] = useState([]);
  const articles = Array.isArray(content.articles) ? content.articles : [];

  useEffect(() => {
    let active = true;
    async function loadPhotos() {
      try {
        const snap = await getDocs(query(collection(db, "siteImages"), orderBy("createdAt", "desc")));
        if (active) setBlogPhotos(snap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((photo) => photo.category === "blog"));
      } catch (error) {
        console.error("No se pudieron cargar las portadas del Blog:", error);
      }
    }
    loadPhotos();
    return () => { active = false; };
  }, []);

  function updateArticle(index, field, value) {
    const next = articles.map((article, i) => i === index ? { ...article, [field]: value, ...(field === "title" ? { slug: makeSlug(value) } : {}) } : article);
    updateField("articles", next);
  }

  function addArticle() {
    updateField("articles", [...articles, {
      id: `article-${Date.now()}`, slug: `articulo-${articles.length + 1}`,
      title: "Nuevo artículo", excerpt: "", body: "", coverUrl: "",
      status: "draft", publishedAt: new Date().toISOString().slice(0, 10)
    }]);
  }

  function removeArticle(index) {
    if (!window.confirm("¿Eliminar este artículo? Esta acción se aplicará al guardar los cambios.")) return;
    updateField("articles", articles.filter((_, i) => i !== index));
  }

  return (
    <form className="admin-editor-card blog-admin-editor" onSubmit={onSave}>
      <div className="admin-card-heading">
        <div><h3>Administrar publicaciones</h3><p>Crea artículos completos y publícalos en el sitio.</p></div>
        <span className="admin-section-tag">Blog</span>
      </div>
      <label className="admin-field blog-main-title"><span>Título principal</span><input value={content.title || "Blog"} onChange={(e) => updateField("title", e.target.value)} /></label>
      <div className="blog-admin-toolbar"><div><strong>{articles.length} publicaciones</strong><p>Los borradores no aparecen en el sitio público.</p></div><button type="button" className="admin-add-article" onClick={addArticle}><Plus size={17}/> Agregar artículo</button></div>
      {loading ? <div className="admin-loading-inline">Cargando contenido...</div> : articles.map((article, index) => (
        <section className="blog-admin-article" key={article.id || index}>
          <header><div><span className="blog-admin-number">{String(index + 1).padStart(2, "0")}</span><h4>{article.title || "Artículo sin título"}</h4></div><button type="button" className="blog-remove-article" onClick={() => removeArticle(index)} aria-label="Eliminar artículo"><Trash2 size={17}/> Eliminar</button></header>
          <div className="blog-admin-fields">
            <label className="admin-field"><span>Título del artículo</span><input value={article.title || ""} onChange={(e) => updateArticle(index, "title", e.target.value)} required /></label>
            <label className="admin-field"><span>Fecha de publicación</span><input type="date" value={article.publishedAt || ""} onChange={(e) => updateArticle(index, "publishedAt", e.target.value)} /></label>
            <label className="admin-field blog-wide"><span>Resumen / introducción</span><textarea rows="3" value={article.excerpt || ""} onChange={(e) => updateArticle(index, "excerpt", e.target.value)} placeholder="Un texto breve para presentar el artículo..." /></label>
            <label className="admin-field blog-wide"><span>Contenido completo</span><textarea className="blog-body-input" rows="12" value={article.body || ""} onChange={(e) => updateArticle(index, "body", e.target.value)} placeholder="Escribe aquí el artículo completo. Separa los párrafos con una línea en blanco." /></label>
            <label className="admin-field"><span>Fotografía de portada</span><select value={article.coverUrl || ""} onChange={(e) => updateArticle(index, "coverUrl", e.target.value)}><option value="">Seleccionar fotografía del Blog</option>{blogPhotos.map((photo) => <option key={photo.id} value={photo.url}>{photo.name || photo.description || `Fotografía ${photo.id.slice(0, 6)}`}</option>)}</select></label>
            <label className="admin-field"><span>Estado</span><select value={article.status || "draft"} onChange={(e) => updateArticle(index, "status", e.target.value)}><option value="draft">Borrador</option><option value="published">Publicado</option></select></label>
          </div>
          {article.coverUrl && <div className="blog-cover-preview"><img src={article.coverUrl} alt="Vista previa de portada"/><span>Vista previa de portada</span></div>}
        </section>
      ))}
      {notice && <div className={`admin-notice ${notice.type}`}>{notice.text}</div>}
      <div className="admin-editor-actions"><button className="admin-secondary-button" type="button" onClick={onReset}><ArrowLeft size={16}/> Restaurar valores iniciales</button><button className="admin-save-button" type="submit" disabled={saving || loading}><Save size={17}/>{saving ? "Guardando..." : "Guardar cambios"}</button></div>
    </form>
  );
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [content, setContent] = useState(initialContent.home);
  const [loadingContent, setLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const active = useMemo(
    () =>
      sections.find(
        (section) => section.id === activeSection
      ) || sections[0],
    [activeSection]
  );

  useEffect(() => {
    const unsubscribe = observeAuth((currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    // La sección de fotografías tiene su propio gestor.
    if (activeSection === "photos") {
      setContent({});
      setNotice(null);
      setLoadingContent(false);
      return;
    }

    let cancelled = false;

    async function loadSection() {
      setLoadingContent(true);
      setNotice(null);

      try {
        const snapshot = await getDoc(
          doc(db, "siteContent", activeSection)
        );

        const defaults = initialContent[activeSection];
        const saved = snapshot.exists() ? snapshot.data() : {};
        let nextContent = { ...defaults, ...saved };

        // Migra los dos artículos del formato anterior sin borrar sus textos.
        if (activeSection === "blog" && !Array.isArray(saved.articles)) {
          nextContent.articles = [
            {
              id: "articulo-analogico",
              slug: "la-magia-del-analogico",
              title: saved.article1Title || defaults.articles[0].title,
              excerpt: saved.article1Description || defaults.articles[0].excerpt,
              body: "",
              coverUrl: "",
              status: "published",
              publishedAt: ""
            },
            {
              id: "articulo-gastronomia",
              slug: "fotografia-gastronomica",
              title: saved.article2Title || defaults.articles[1].title,
              excerpt: saved.article2Description || defaults.articles[1].excerpt,
              body: "",
              coverUrl: "",
              status: "published",
              publishedAt: ""
            }
          ];
        }

        if (!cancelled) setContent(nextContent);

      } catch (error) {
        console.error("Error cargando contenido:", error);

        if (!cancelled) {
          setContent(initialContent[activeSection]);
          setNotice({
            type: "error",
            text: getFriendlyError(error)
          });
        }

      } finally {
        if (!cancelled) {
          setLoadingContent(false);
        }
      }
    }

    loadSection();

    return () => {
      cancelled = true;
    };
  }, [user, activeSection]);

  async function handleLogin(event) {
    event.preventDefault();

    setLoggingIn(true);
    setNotice(null);

    const result = await login(email, password);

    if (!result.success) {
      const messages = {
        "auth/invalid-credential":
          "Correo o contraseña incorrectos.",
        "auth/too-many-requests":
          "Demasiados intentos. Espera unos minutos.",
        "auth/network-request-failed":
          "No se pudo conectar. Revisa tu conexión."
      };

      setNotice({
        type: "error",
        text:
          messages[result.error] ||
          "No fue posible iniciar sesión."
      });
    }

    setLoggingIn(false);
  }

  function updateField(field, value) {
    setContent((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveSection(event) {
    event.preventDefault();

    setSaving(true);
    setNotice(null);

    try {
      await setDoc(
        doc(db, "siteContent", activeSection),
        {
          ...content,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid
        },
        { merge: true }
      );

      setNotice({
        type: "success",
        text: "Cambios guardados en Firestore."
      });

    } catch (error) {
      console.error("Error guardando contenido:", error);

      setNotice({
        type: "error",
        text: getFriendlyError(error)
      });

    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    const result = await logout();

    if (!result.success) {
      setNotice({
        type: "error",
        text: "No se pudo cerrar la sesión."
      });
    }
  }

  if (!authReady) {
    return (
      <main className="admin-loading">
        <LoaderCircle className="spin" />
        Comprobando sesión...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="admin-page">
        <form
          className="admin-login"
          onSubmit={handleLogin}
        >
          <span
            className="brand-logo brand-logo--compact admin-brand"
            aria-label="Liz Zapata Fotógrafa"
          >
            <span>Liz</span>
            <span>
              Zapa<span className="brand-t">T</span>a
            </span>
          </span>

          <p className="eyebrow">ÁREA PRIVADA</p>

          <h1>Administración</h1>

          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="username"
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              required
            />
          </label>

          <button
            className="red-button"
            disabled={loggingIn}
          >
            {loggingIn ? "INGRESANDO..." : "INGRESAR"}
          </button>

          {notice && (
            <p className={`admin-notice ${notice.type}`}>
              {notice.text}
            </p>
          )}

          <a href="/">Volver al sitio</a>
        </form>
      </main>
    );
  }

  const Icon = active.icon;

  const fields = Object.keys(
    initialContent[activeSection] || {}
  );

  return (
    <main className="admin-shell">

      <aside className="admin-sidebar">

        <a
          href="/"
          className="admin-sidebar-brand"
          aria-label="Volver al sitio"
        >
          <span className="admin-brand-name">
            Liz Zapata
          </span>

          <span className="admin-brand-caption">
            PANEL DE ADMINISTRACIÓN
          </span>
        </a>

        <div className="admin-sidebar-label">
          CONTENIDO DEL SITIO
        </div>

        <nav className="admin-side-nav">
          {sections.map((section) => {
            const SectionIcon = section.icon;

            return (
              <button
                type="button"
                key={section.id}
                className={`admin-nav-item ${
                  activeSection === section.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveSection(section.id)
                }
              >
                <SectionIcon size={18} />

                <span>{section.label}</span>

                <ChevronRight
                  size={15}
                  className="admin-nav-chevron"
                />
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">

          <div className="admin-user">
            <div className="admin-user-avatar">
              {(user.email || "L")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>Administradora</strong>
              <small>{user.email}</small>
            </div>
          </div>

          <button
            className="admin-logout"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>

        </div>
      </aside>

      <section className="admin-main">

        <header className="admin-topbar">
          <div>
            <span className="admin-breadcrumb">
              ADMINISTRACIÓN / CONTENIDO
            </span>

            <h1>Panel de contenido</h1>
          </div>

          <a
            className="admin-view-site"
            href="/"
            target="_blank"
            rel="noreferrer"
          >
            <Eye size={17} />
            Ver sitio público
          </a>
        </header>

        <div className="admin-content-wrap">

          <div className="admin-welcome">
            <div>
              <span className="admin-eyebrow">
                GESTIÓN DEL SITIO WEB
              </span>

              <h2>Hola, Liz.</h2>

              <p>
                Administra los textos y fotografías
                de tu sitio desde un solo lugar.
              </p>
            </div>

            <LayoutDashboard
              size={42}
              strokeWidth={1.2}
            />
          </div>

          <div className="admin-section-heading">

            <div className="admin-section-icon">
              <Icon size={22} />
            </div>

            <div>
              <h2>{active.label}</h2>
              <p>{active.description}</p>
            </div>

          </div>

          {activeSection === "photos" ? (

            <PhotoManager />

          ) : activeSection === "blog" ? (

            <BlogEditor
              content={content}
              updateField={updateField}
              onSave={saveSection}
              saving={saving}
              loading={loadingContent}
              notice={notice}
              onReset={() => setContent(initialContent.blog)}
            />

          ) : (

            <form
              className="admin-editor-card"
              onSubmit={saveSection}
            >

              <div className="admin-card-heading">
                <div>
                  <h3>Editar contenido</h3>
                  <p>
                    Los cambios se guardan en la base
                    de datos de Firebase.
                  </p>
                </div>

                <span className="admin-section-tag">
                  {active.label}
                </span>
              </div>

              {loadingContent ? (

                <div className="admin-loading-inline">
                  <LoaderCircle className="spin" />
                  Cargando contenido...
                </div>

              ) : (

                <div className="admin-fields-grid">
                  {fields.map((field) => {
                    const multiline =
                      /description|paragraph|services/i.test(
                        field
                      );

                    return (
                      <label
                        className={`admin-field ${
                          multiline ? "wide" : ""
                        }`}
                        key={field}
                      >
                        <span>
                          {fieldLabels[field] || field}
                        </span>

                        {multiline ? (

                          <textarea
                            rows={
                              field === "services" ? 5 : 3
                            }
                            value={content[field] ?? ""}
                            onChange={(event) =>
                              updateField(
                                field,
                                event.target.value
                              )
                            }
                          />

                        ) : (

                          <input
                            type="text"
                            value={content[field] ?? ""}
                            onChange={(event) =>
                              updateField(
                                field,
                                event.target.value
                              )
                            }
                          />

                        )}
                      </label>
                    );
                  })}
                </div>

              )}

              {notice && (
                <div
                  className={`admin-notice ${notice.type}`}
                >
                  {notice.type === "success" ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <AlertCircle size={17} />
                  )}

                  {notice.text}
                </div>
              )}

              <div className="admin-editor-actions">

                <button
                  className="admin-secondary-button"
                  type="button"
                  onClick={() =>
                    setContent(initialContent[activeSection])
                  }
                >
                  <ArrowLeft size={16} />
                  Restaurar valores iniciales
                </button>

                <button
                  className="admin-save-button"
                  type="submit"
                  disabled={saving || loadingContent}
                >
                  <Save size={17} />

                  {saving
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>

              </div>

            </form>

          )}

          {activeSection !== "photos" && (
            <p className="admin-footnote">
              Los cambios de texto se guardan en Firebase
              y se reflejan en el sitio público.
            </p>
          )}

        </div>
      </section>
    </main>
  );
}
