
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
  ArrowLeft
} from "lucide-react";

import { login, logout, observeAuth } from "../firebase/auth";
import { db } from "../firebase/config";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
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
    article1Title: "La magia del analógico",
    article1Description: "Un acercamiento a la fotografía análoga, sus procesos, texturas y la experiencia de fotografiar con tiempo y propósito.",
    article2Title: "Fotografía gastronómica",
    article2Description: "Claves para crear imágenes gastronómicas apetitosas, auténticas y con identidad."
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
        const saved = snapshot.exists()
          ? snapshot.data()
          : {};

        if (!cancelled) {
          setContent({
            ...defaults,
            ...saved
          });
        }

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
