import React, { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import {
  Instagram,
  Menu,
  X,
  Music2,
  BriefcaseBusiness,
  ArrowRight,
} from "lucide-react";

const navItems = [
  ["Inicio", "/"],
  ["Sobre mí", "/sobre-mi"],
  ["Categorías", "/categorias"],
  ["Personal", "/personal"],
  ["Blog", "/blog"],
  ["Servicios y contacto", "/contacto"],
];

function Logo({ compact = false }) {
  return (
    <span
      className={`brand-logo ${compact ? "brand-logo--compact" : ""}`}
      aria-label="Liz Zapata Fotógrafa"
    >
      <span>Liz</span>
      <span>
        Zapa<span className="brand-t">T</span>a
      </span>
      <small>Fotógrafa</small>
    </span>
  );
}

function Header({ home, onContact }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setHidden(false);
  }, [location.pathname]);

  useEffect(() => {
    if (home) return;
    let previous = window.scrollY;
    const onScroll = () => {
      const current = window.scrollY;
      setHidden(current > 120 && current > previous);
      if (current < 40) setHidden(false);
      previous = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [home]);

  return (
    <header
      className={`site-header ${home ? "site-header--hero" : "site-header--inner"} ${hidden ? "site-header--hidden" : ""}`}
    >
      <Link
        to="/admin"
        className="logo-admin-link"
        aria-label="Ingresar al perfil administrativo"
        title="Acceso administrativo"
      >
        <Logo />
      </Link>

      <button
        className="mobile-menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Abrir menú"
      >
        {menuOpen ? <X /> : <Menu />}
      </button>

      <nav className={`main-nav ${menuOpen ? "main-nav--open" : ""}`}>
        {navItems.map(([label, path]) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="social-links">
        <a
          href="https://www.instagram.com/liz.zapatafotografa/"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
        >
          <Instagram />
        </a>
        <a
          href="https://www.tiktok.com/"
          target="_blank"
          rel="noreferrer"
          aria-label="TikTok"
        >
          <Music2 />
        </a>
        <a
          href="https://www.behance.net/"
          target="_blank"
          rel="noreferrer"
          aria-label="Behance"
        >
          <BriefcaseBusiness />
        </a>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-links">
        <Link to="/sobre-mi">Sobre mí</Link>
        <Link to="/categorias">Portafolio</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/contacto">Contacto</Link>
      </div>
      <div className="footer-center">
        <Logo compact />
        <p>Medellín, Colombia.</p>
        <p>Cel: 300 223 7934</p>
        <p>fotografa@lizzapata.com</p>
      </div>
      <div className="footer-social">
        <a
          href="https://www.instagram.com/liz.zapatafotografa/"
          target="_blank"
          rel="noreferrer"
        >
          Instagram
        </a>
        <a href="https://www.tiktok.com/" target="_blank" rel="noreferrer">
          Tik Tok
        </a>
        <a href="https://www.behance.net/" target="_blank" rel="noreferrer">
          Behance
        </a>
      </div>
      <small className="copyright">
        Liz Zapata © All rights reserved, 2026.
      </small>
    </footer>
  );
}

function ContactModal({ open, onClose }) {
  useEffect(() => {
    const handler = () =>
      window.dispatchEvent(new Event("contact-open-request"));
    window.addEventListener("open-contact", handler);
    return () => window.removeEventListener("open-contact", handler);
  }, []);
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="contact-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
      >
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <X />
        </button>
        <div className="contact-photo photo-placeholder contact-photo-placeholder">
          LZ / FOTOGRAFÍA
        </div>
        <div className="contact-modal-content">
          <p className="eyebrow">HABLEMOS DE TU PROYECTO</p>
          <h2 id="contact-title">Servicios y contacto</h2>
          <p>
            Fotografía de producto, moda y gastronómica para marcas, proyectos e
            ideas.
          </p>
          <h3>Servicios</h3>
          <p>Producto · Moda · Gastronómica · Proyectos especiales</p>
          <h3>Contacto</h3>
          <p>+57 300 223 79 34</p>
          <p>fotografa@lizzapata.com</p>
          <a className="red-button" href="mailto:fotografa@lizzapata.com">
            ESCRÍBEME <ArrowRight size={17} />
          </a>
        </div>
      </section>
    </div>
  );
}

function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-overlay">
          <p className="hero-kicker">FOTOGRAFÍA QUE CUENTA HISTORIAS</p>
          <h1>
            Liz Zapata
            <br />
            Fotógrafa<span className="red-dot">.</span>
          </h1>
          <p className="hero-specialties">PRODUCTO / MODA / GASTRONÓMICA</p>
        </div>
        <div className="hero-scroll">DESLIZA PARA EXPLORAR ↓</div>
      </section>
      <section className="home-categories">
        <div className="ticker">
          <span>
            FOTOGRAFÍA QUE CUENTA HISTORIAS&nbsp; × &nbsp;FOTOGRAFÍA QUE CUENTA
            HISTORIAS&nbsp; × &nbsp;
          </span>
        </div>
        <div className="category-home-grid">
          <CategoryTile
            title="Producto"
            imageClass="product-scene"
            to="/categorias/producto"
          />
          <CategoryTile
            title="Moda"
            imageClass="fashion-scene"
            to="/categorias/moda"
          />
          <CategoryTile
            title="Gastronómica"
            imageClass="food-scene"
            to="/categorias/gastronomica"
          />
        </div>
      </section>
      <InstagramStrip />
    </>
  );
}

function CategoryTile({ title, imageClass, to }) {
  return (
    <Link to={to} className={`category-tile ${imageClass}`}>
      <span>{title}</span>
    </Link>
  );
}

function InstagramStrip() {
  return (
    <section className="instagram-strip">
      <div className="instagram-heading">
        <Instagram />
        <strong>liz.zapatafotografa</strong>
        <a
          href="https://www.instagram.com/liz.zapatafotografa/"
          target="_blank"
          rel="noreferrer"
        >
          VER EN INSTAGRAM ↗
        </a>
      </div>
      <div className="instagram-placeholder-grid">
        {[
          "product-scene",
          "fashion-scene",
          "food-scene",
          "film-scene",
          "portrait-scene",
        ].map((c, i) => (
          <div key={i} className={`insta-placeholder ${c}`} />
        ))}
      </div>
    </section>
  );
}

function InnerIntro({ title, children }) {
  return (
    <div className="inner-intro">
      <h1>{title}</h1>
      <div>{children}</div>
    </div>
  );
}

function About() {
  return (
    <main className="page-content">
      <section className="about-layout">
        <div className="portrait-placeholder photo-placeholder">
          FOTOGRAFÍA DE LIZ
        </div>
        <div className="about-copy">
          <h1 className="script-heading">Hola!</h1>
          <p>
            Soy Liz Zapata, fotógrafa apasionada por contar historias a través
            de la imagen.
          </p>
          <p>
            Me especializo en fotografía de producto, moda y gastronómica,
            creando imágenes que conectan, comunican y resaltan la esencia de
            cada marca, proyecto o idea.
          </p>
          <p>
            Disfruto explorar la luz, los colores y los detalles, siempre
            buscando una mirada creativa y auténtica en cada toma.
          </p>
          <button
            className="script-heading talk-link"
            onClick={() => window.dispatchEvent(new Event("open-contact"))}
          >
            Hablemos
          </button>
        </div>
      </section>
      <div className="wide-banner photo-placeholder">
        FOTOGRAFÍA QUE CUENTA HISTORIAS
      </div>
    </main>
  );
}

const categoryData = [
  ["Producto", "product-scene", "/categorias/producto"],
  ["Moda", "fashion-scene", "/categorias/moda"],
  ["Gastronómica", "food-scene", "/categorias/gastronomica"],
  ["Todas las categorías", "film-scene", "/categorias/todas"],
];

function Categories() {
  return (
    <main className="page-content">
      <InnerIntro title="Categorías">
        Explora mi trabajo a través de tres enfoques fotográficos: producto,
        moda y gastronómica. Cada categoría refleja mi forma de contar historias
        desde la luz, la composición y el detalle.
      </InnerIntro>
      <div className="categories-grid">
        {categoryData.map(([title, image, to]) => (
          <CategoryTile key={title} title={title} imageClass={image} to={to} />
        ))}
      </div>
    </main>
  );
}

function CategoryDetail() {
  const { pathname } = useLocation();
  const key = pathname.split("/").pop();
  const title =
    key === "producto"
      ? "Producto"
      : key === "moda"
        ? "Moda"
        : key === "gastronomica"
          ? "Gastronómica"
          : "Todas las categorías";
  return (
    <main className="page-content">
      <InnerIntro title={title}>
        Una selección de fotografías que exploran la identidad, la luz y los
        detalles de cada proyecto.
      </InnerIntro>
      <div className="photo-gallery">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className={`gallery-photo photo-placeholder gallery-${i % 4}`}
          >
            FOTOGRAFÍA {i + 1}
          </div>
        ))}
      </div>
    </main>
  );
}

const projects = [
  [
    "Proyecto personal 01",
    "Una exploración visual sobre la memoria, los espacios y los pequeños detalles que persisten en el tiempo.",
    "flower-scene",
  ],
  [
    "Proyecto personal 02",
    "Un proyecto íntimo que observa la luz como protagonista, creando atmósferas simples y cotidianas.",
    "film-scene",
  ],
  [
    "Proyecto personal 03",
    "Una reflexión visual sobre la textura, la forma y la transformación de los materiales en imágenes.",
    "texture-scene",
  ],
];

function Personal() {
  return (
    <main className="page-content">
      <InnerIntro title="Personal">
        Proyectos fotográficos personales y experimentales donde exploro ideas,
        conceptos y narrativas visuales más libres.
      </InnerIntro>
      <div className="personal-list">
        {projects.map(([title, desc, scene]) => (
          <article className="personal-item" key={title}>
            <div className={`personal-image ${scene} photo-placeholder`} />
            <div>
              <h2>{title}</h2>
              <p>{desc}</p>
              <button className="yellow-button">
                VER PROYECTO <ArrowRight size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

const articles = [
  [
    "La magia del analógico",
    "Un acercamiento a la fotografía análoga, sus procesos, texturas y la experiencia de fotografiar con tiempo y propósito.",
    "film-scene",
  ],
  [
    "Fotografía gastronómica",
    "Claves para crear imágenes gastronómicas apetitosas, auténticas y con identidad.",
    "food-scene",
  ],
];

function Blog() {
  return (
    <main className="page-content">
      <div className="blog-grid">
        {articles.map(([title, desc, scene]) => (
          <article className="blog-card" key={title}>
            <div className={`blog-image ${scene} photo-placeholder`}>
              <h2>{title}</h2>
            </div>
            <p>{desc}</p>
            <p>
              En este artículo comparto ideas, procesos y referencias que forman
              parte de mi trabajo creativo.
            </p>
            <button className="yellow-button">
              LEER ARTÍCULO <ArrowRight size={16} />
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}

function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setMessage(
        "Sesión iniciada correctamente. El siguiente paso será construir el panel de administración.",
      );
    } catch (error) {
      console.error("Error al iniciar sesión con Firebase:", error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setMessage("Correo o contraseña incorrectos.");
      } else if (error.code === "auth/too-many-requests") {
        setMessage(
          "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
        );
      } else {
        setMessage(
          "No fue posible iniciar sesión. Verifica la conexión y la configuración de Firebase.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <form className="admin-login" onSubmit={signIn}>
        <Logo compact />
        <p className="eyebrow">ÁREA PRIVADA</p>
        <h1>Administración</h1>
        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="red-button" disabled={loading}>
          {loading ? "Ingresando..." : "INGRESAR"}
        </button>
        {message && <p className="form-message">{message}</p>}
        <Link to="/">Volver al sitio</Link>
      </form>
    </main>
  );
}

function ContactPage() {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    asunto: "",
    mensaje: "",
  });
  const [sent, setSent] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSent(false);
  }

  function submit(e) {
    e.preventDefault();
    const subject = encodeURIComponent(
      `Consulta web: ${form.asunto || "Servicios fotográficos"}`,
    );
    const body = encodeURIComponent(
      `Nombre: ${form.nombre}\nCorreo: ${form.correo}\nAsunto: ${form.asunto}\n\n${form.mensaje}`,
    );
    window.location.href = `mailto:fotografa@lizzapata.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <main className="page-content contact-page">
      <section className="contact-page-card">
        <div
          className="contact-page-photo"
          role="img"
          aria-label="Fotografía de cámara y rollo fotográfico"
        />
        <div className="contact-page-content">
          <div className="contact-page-intro">
            <h1>
              SERVICIOS
              <br />Y CONTACTO
            </h1>
            <span className="red-rule" />
            <p>
              Fotografía de producto, moda y gastronómica para marcas, proyectos
              y ideas que buscan destacar a través de la imagen.
            </p>
          </div>
          <div className="contact-columns">
            <div className="contact-details">
              <h2>SERVICIOS</h2>
              <ul>
                <li>Producto</li>
                <li>Moda</li>
                <li>Gastronómica</li>
                <li>Proyectos especiales</li>
              </ul>
              <h2 className="contact-talk-title">HABLEMOS</h2>
              <p>◉ &nbsp; +57 300 223 79 34</p>
              <p>◎ &nbsp; www.lizzapata.com</p>
              <p>✉ &nbsp; fotografa@lizzapata.com</p>
              <div className="contact-socials">
                <a
                  href="https://www.instagram.com/liz.zapatafotografa/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <Instagram />
                </a>
                <a
                  href="https://www.tiktok.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok"
                >
                  <Music2 />
                </a>
                <a
                  href="https://www.behance.net/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Behance"
                >
                  <BriefcaseBusiness />
                </a>
              </div>
            </div>
            <form className="contact-form" onSubmit={submit}>
              <h2>ESCRÍBEME</h2>
              <input
                aria-label="Nombre"
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => update("nombre", e.target.value)}
                required
              />
              <input
                aria-label="Correo electrónico"
                type="email"
                placeholder="Correo electrónico"
                value={form.correo}
                onChange={(e) => update("correo", e.target.value)}
                required
              />
              <select
                aria-label="Asunto"
                value={form.asunto}
                onChange={(e) => update("asunto", e.target.value)}
                required
              >
                <option value="" disabled>
                  Asunto
                </option>
                <option>Fotografía de producto</option>
                <option>Fotografía de moda</option>
                <option>Fotografía gastronómica</option>
                <option>Proyecto especial</option>
                <option>Otro</option>
              </select>
              <textarea
                aria-label="Mensaje"
                placeholder="Mensaje"
                rows="5"
                value={form.mensaje}
                onChange={(e) => update("mensaje", e.target.value)}
                required
              />
              <button className="red-button" type="submit">
                ENVIAR MENSAJE <ArrowRight size={18} />
              </button>
              {sent && (
                <p className="contact-form-note">
                  Se abrirá tu aplicación de correo para enviar el mensaje.
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const location = useLocation();
  const home = location.pathname === "/";
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const open = () => setContactOpen(true);
    window.addEventListener("contact-open-request", open);
    return () => window.removeEventListener("contact-open-request", open);
  }, []);

  return (
    <>
      <Header home={home} onContact={() => setContactOpen(true)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sobre-mi" element={<About />} />
        <Route path="/categorias" element={<Categories />} />
        <Route path="/categorias/:category" element={<CategoryDetail />} />
        <Route path="/personal" element={<Personal />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/admin" element={<AdminDashboard />} />{" "}
        <Route
          path="*"
          element={
            <main className="page-content">
              <h1>Página no encontrada</h1>
              <Link to="/">Volver al inicio</Link>
            </main>
          }
        />
      </Routes>
      {location.pathname !== "/admin" && <Footer />}
    </>
  );
}
