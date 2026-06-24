import { useState } from "react";

// --------- DATA ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    color: "#E1306C",
    bg: "#1A0810",
    difficulty: "media",
    difficultyLabel: "Dificultad media",
    approval: "Aprobación en 1-2 semanas",
    clientNeeds: [
      { icon: "🏢", text: "Cuenta de empresa registrada en Meta (Facebook)" },
      { icon: "📱", text: "Crear una 'app' en Meta for Developers (gratuito)" },
      { icon: "--�", text: "Solicitar aprobación para acceder a métricas de terceros" },
    ],
    influencerNeeds: [
      { icon: "�-�", text: "Cambiar su cuenta personal a cuenta de Creator o Business (gratis, 2 min)" },
      { icon: "�-�", text: "Hacer clic en un link que vos le mandás y aceptar el acceso (1 min)" },
      { icon: "📊", text: "Tener al menos una publicación reciente en la cuenta" },
    ],
    steps: [
      { label: "Vos creás la app", detail: "Una sola vez. Entrás a developers.facebook.com y registrás tu herramienta." },
      { label: "Enviás el link al influencer", detail: "El sistema genera un link personalizado para cada uno." },
      { label: "El influencer acepta", detail: "Ve una pantalla de Instagram que dice qué información vas a ver. Toca 'Aceptar'." },
      { label: "Los datos fluyen", detail: "Alcance, impresiones, guardados, clics  -  todo disponible en tu dashboard." },
    ],
    costs: [
      { label: "App de Meta", amount: "Gratis" },
      { label: "API de métricas básicas", amount: "Gratis" },
      { label: "Límite de llamadas", amount: "200 por hora por token" },
    ],
    costColor: "#34D399",
    metrics: ["Alcance", "Impresiones", "Reproducciones", "Likes", "Comentarios", "Guardados", "Compartidos", "Clics en stories", "CTR"],
    caveat: "Las historias muestran métricas solo durante 24 hs. Después desaparecen, incluso para el dueño de la cuenta.",
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#2DD4BF",
    bg: "#061A19",
    difficulty: "alta",
    difficultyLabel: "Dificultad alta",
    approval: "Aprobación no garantizada",
    clientNeeds: [
      { icon: "🏢", text: "Registrarse como desarrollador en developers.tiktok.com" },
      { icon: "📋", text: "Aplicar al programa de Content Marketing Partners (proceso de selección)" },
      { icon: "-��", text: "Esperar aprobación  -  TikTok puede rechazar sin dar motivos" },
    ],
    influencerNeeds: [
      { icon: "�-�", text: "Hacer clic en el link de autorización y aceptar (igual que Instagram)" },
      { icon: "📈", text: "Tener cuenta con cierta actividad reciente (TikTok lo verifica)" },
    ],
    steps: [
      { label: "Aplicás como partner", detail: "TikTok revisa tu empresa, tu caso de uso, y decide si te da acceso." },
      { label: "Si te aprueban, configurás la app", detail: "Similar a Instagram, pero con más restricciones sobre qué datos podés ver." },
      { label: "El influencer autoriza", detail: "Mismo flujo  -  link, pantalla de TikTok, 'Aceptar'." },
      { label: "Datos disponibles (parcialmente)", detail: "TikTok no entrega todos los datos que entrega Instagram. Algunas métricas solo las ve el creador." },
    ],
    costs: [
      { label: "Programa de partners", amount: "Sin costo (requiere aprobación)" },
      { label: "API básica", amount: "Gratis con límites" },
      { label: "Datos completos", amount: "Solo vía herramientas como HypeAuditor" },
    ],
    costColor: "#FBBF24",
    metrics: ["Reproducciones", "Likes", "Comentarios", "Compartidos", "Guardados", "Alcance (parcial)"],
    caveat: "TikTok es la plataforma más restrictiva. Muchas agencias usan herramientas de terceros (HypeAuditor, Modash) en lugar de la API oficial.",
  },
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF4444",
    bg: "#1A0808",
    difficulty: "baja",
    difficultyLabel: "Dificultad baja",
    approval: "Aprobación automática",
    clientNeeds: [
      { icon: "📧", text: "Cuenta de Google (cualquier Gmail sirve)" },
      { icon: "�-�", text: "Crear credenciales en Google Cloud Console (gratuito, 10 min)" },
      { icon: "--�", text: "Activar YouTube Analytics API  -  se aprueba instantáneamente" },
    ],
    influencerNeeds: [
      { icon: "📧", text: "Iniciar sesión con su cuenta de Google y aceptar el acceso (1 min)" },
      { icon: "📺", text: "Tener canal de YouTube activo (no requiere mínimo de suscriptores)" },
    ],
    steps: [
      { label: "Configurás en Google Cloud", detail: "Creás un proyecto gratuito, activás la API. Se aprueba solo, sin revisión humana." },
      { label: "El influencer autoriza con Google", detail: "Ve la pantalla de login de Google. Acepta compartir datos de su canal." },
      { label: "Todo disponible", detail: "YouTube entrega los datos más completos de todas las plataformas." },
    ],
    costs: [
      { label: "Google Cloud Console", amount: "Gratis" },
      { label: "YouTube Analytics API", amount: "Gratis" },
      { label: "Sin límites prácticos", amount: "10.000 solicitudes/día" },
    ],
    costColor: "#34D399",
    metrics: ["Vistas", "Alcance", "Tiempo de visualización", "Likes", "Comentarios", "Compartidos", "Suscriptores ganados", "CTR en miniaturas"],
    caveat: "YouTube es la plataforma más generosa con los datos. Si el cliente tiene campañas con YouTubers, este es el camino más fácil.",
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    color: "#94A3B8",
    bg: "#111418",
    difficulty: "alta",
    difficultyLabel: "Muy costoso",
    approval: "Acceso inmediato (pagando)",
    clientNeeds: [
      { icon: "💳", text: "Tarjeta de crédito  -  el acceso útil para métricas cuesta desde USD 100/mes" },
      { icon: "🏢", text: "Cuenta de desarrollador en developer.twitter.com" },
      { icon: "📋", text: "Describir el caso de uso (aprobación manual)" },
    ],
    influencerNeeds: [
      { icon: "�-�", text: "Autorizar con OAuth como en las otras plataformas" },
      { icon: "�-�", text: "Cuenta activa (no se requiere verificación)" },
    ],
    steps: [
      { label: "Pagás el plan", detail: "El plan Basic (USD 100/mes) permite leer métricas propias. Para métricas de terceros necesitás Pro o Enterprise." },
      { label: "Configurás la app", detail: "Similar a las demás, pero cada llamada a la API tiene un costo asociado." },
      { label: "El influencer autoriza", detail: "Flujo OAuth estándar." },
      { label: "Datos disponibles con limitaciones", detail: "Impresiones, clics, engagement. El historial está limitado según el plan." },
    ],
    costs: [
      { label: "Plan Basic", amount: "USD 100/mes" },
      { label: "Plan Pro", amount: "USD 5.000/mes" },
      { label: "Plan Enterprise", amount: "USD 42.000/mes" },
    ],
    costColor: "#F87171",
    metrics: ["Impresiones", "Clics en el enlace", "Likes", "Reposts", "Respuestas", "CTR"],
    caveat: "Desde 2023 Elon Musk convirtió la API de Twitter en un servicio de pago. Para la mayoría de agencias, el costo no se justifica versus el volumen de campañas en X.",
  },
];

const DIFFICULTY_CONFIG = {
  baja:  { color: "#34D399", bg: "#052E16", label: "Fácil" },
  media: { color: "#FBBF24", bg: "#1C1404", label: "Medio" },
  alta:  { color: "#F87171", bg: "#2D0A0A", label: "Difícil" },
};

// --------- COMPONENTS ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function DifficultyBadge({ level }) {
  const cfg = DIFFICULTY_CONFIG[level];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
      border: `1px solid ${cfg.color}30`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: cfg.color,
        boxShadow: `0 0 6px ${cfg.color}`,
      }} />
      {cfg.label}
    </span>
  );
}

function FlowDiagram({ platform, active }) {
  const nodes = [
    { icon: "📱", label: "Cuenta del\ninfluencer" },
    { icon: "�-�", label: "Toca el\nlink" },
    { icon: "--�", label: "Plataforma\nautoriza" },
    { icon: "📊", label: "Datos en\ntu dashboard" },
  ];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      padding: "20px", borderRadius: 12,
      background: platform.bg,
      border: `1px solid ${platform.color}20`,
      flexWrap: "wrap", justifyContent: "center",
    }}>
      {nodes.map((node, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            padding: "10px 14px",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: active ? `${platform.color}18` : "rgba(255,255,255,0.04)",
              border: `1px solid ${active ? platform.color + "40" : "rgba(255,255,255,0.08)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
              transition: "all 0.3s",
            }}>
              {node.icon}
            </div>
            <div style={{
              fontSize: 11, color: active ? "#94A3B8" : "#374151",
              textAlign: "center", lineHeight: 1.4,
              whiteSpace: "pre-line",
              transition: "color 0.3s",
            }}>
              {node.label}
            </div>
          </div>
          {i < nodes.length - 1 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 2,
              margin: "0 -4px", paddingBottom: 18,
            }}>
              {[0,1,2,3,4].map(j => (
                <div key={j} style={{
                  width: 4, height: 1.5, borderRadius: 1,
                  background: active ? platform.color : "#1E293B",
                  opacity: active ? 0.6 + j * 0.08 : 1,
                  transition: "background 0.3s",
                }} />
              ))}
              <div style={{
                fontSize: 12,
                color: active ? platform.color : "#1E293B",
                transition: "color 0.3s",
              }}>--�</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StepList({ steps, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: `${color}18`,
              border: `1.5px solid ${color}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color,
            }}>
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 1.5, flexGrow: 1, minHeight: 20,
                background: `${color}20`, margin: "3px 0",
              }} />
            )}
          </div>
          <div style={{ paddingBottom: i < steps.length - 1 ? 16 : 0, paddingTop: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0", marginBottom: 3 }}>
              {step.label}
            </div>
            <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
              {step.detail}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NeedsList({ items }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "10px 12px", borderRadius: 8,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
          <span style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.5 }}>{item.text}</span>
        </div>
      ))}
    </div>
  );
}

// --------- MAIN ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export default function Guide() {
  const [activePlatform, setActivePlatform] = useState("instagram");
  const [section, setSection] = useState("plataformas");

  const plat = PLATFORMS.find(p => p.id === activePlatform);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0D14",
      color: "#F1F5F9",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* ------ HERO ------ */}
      <div style={{
        padding: "40px 32px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(to bottom, #0D1117, #0A0D14)",
      }}>
        <div style={{
          display: "inline-block", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.12em", color: "#3B82F6",
          textTransform: "uppercase", marginBottom: 12,
          padding: "3px 10px", background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(59,130,246,0.2)", borderRadius: 4,
        }}>
          Guía para clientes
        </div>
        <h1 style={{
          fontSize: 30, fontWeight: 800, color: "#F8FAFC",
          margin: "0 0 10px", lineHeight: 1.2,
          letterSpacing: "-0.02em",
        }}>
          ¿Cómo se obtienen los datos<br />
          <span style={{ color: "#60A5FA" }}>de los influencers?</span>
        </h1>
        <p style={{ fontSize: 15, color: "#64748B", maxWidth: 560, lineHeight: 1.7, margin: 0 }}>
          Para medir el resultado real de una campaña, necesitamos que cada
          influencer nos dé permiso de ver sus estadísticas internas. Esta
          guía explica cómo funciona ese proceso, plataforma por plataforma.
        </p>
      </div>

      {/* ------ CONCEPT STRIP ------ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {[
          { icon: "�-�", title: "Datos privados vs. públicos", text: "Los likes y comentarios son públicos. Pero el alcance real, las impresiones y los clics solo los ve el dueño de la cuenta." },
          { icon: "�-�", title: "El influencer siempre decide", text: "Nada se accede sin su permiso explícito. Ellos ven exactamente qué información compartís y pueden revocar el acceso cuando quieran." },
          { icon: "�-�", title: "Una autorización por plataforma", text: "Si un influencer publica en Instagram y TikTok, necesita autorizar en cada una por separado." },
          { icon: "-��️", title: "Una sola vez por campaña", text: "Una vez que autorizó, los datos fluyen automáticamente. No hace falta pedirle nada más." },
        ].map((c, i) => (
          <div key={i} style={{
            padding: "20px 22px",
            borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", marginBottom: 5 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{c.text}</div>
          </div>
        ))}
      </div>

      {/* ------ SECTION TABS ------ */}
      <div style={{
        display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px", gap: 0,
        position: "sticky", top: 0,
        background: "#0A0D14", zIndex: 10,
      }}>
        {[
          { id: "plataformas", label: "Por plataforma" },
          { id: "costos",      label: "Costos" },
          { id: "recomendacion", label: "Recomendación" },
        ].map(t => (
          <button key={t.id} onClick={() => setSection(t.id)} style={{
            padding: "14px 18px", background: "transparent",
            border: "none", borderBottom: section === t.id
              ? "2px solid #60A5FA" : "2px solid transparent",
            color: section === t.id ? "#60A5FA" : "#475569",
            fontSize: 13, fontWeight: section === t.id ? 700 : 500,
            cursor: "pointer", transition: "all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 960, margin: "0 auto" }}>

        {/* -�--�- PLATAFORMAS -�--�- */}
        {section === "plataformas" && (
          <div>
            {/* Platform selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setActivePlatform(p.id)} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", borderRadius: 8,
                  background: activePlatform === p.id ? `${p.color}15` : "rgba(255,255,255,0.03)",
                  border: activePlatform === p.id
                    ? `1.5px solid ${p.color}50`
                    : "1.5px solid rgba(255,255,255,0.07)",
                  color: activePlatform === p.id ? p.color : "#475569",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}>
                  {p.name}
                  <DifficultyBadge level={p.difficulty} />
                </button>
              ))}
            </div>

            {/* Flow diagram */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#334155",
                letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10,
              }}>
                Cómo fluyen los datos
              </div>
              <FlowDiagram platform={plat} active />
            </div>

            {/* Two column: needs */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24,
            }}>
              <div style={{
                background: "#0F1623",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "18px",
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#334155",
                  letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14,
                }}>
                  Lo que necesitás vos (la agencia)
                </div>
                <NeedsList items={plat.clientNeeds} />
              </div>
              <div style={{
                background: "#0F1623",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "18px",
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#334155",
                  letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14,
                }}>
                  Lo que necesita el influencer
                </div>
                <NeedsList items={plat.influencerNeeds} />
              </div>
            </div>

            {/* Steps */}
            <div style={{
              background: "#0F1623",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, padding: "18px 20px", marginBottom: 16,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#334155",
                letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18,
              }}>
                Paso a paso
              </div>
              <StepList steps={plat.steps} color={plat.color} />
            </div>

            {/* Metrics + caveat */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{
                background: "#0F1623",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "18px",
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#334155",
                  letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12,
                }}>
                  Métricas disponibles
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {plat.metrics.map(m => (
                    <span key={m} style={{
                      fontSize: 11, padding: "3px 8px", borderRadius: 4,
                      background: `${plat.color}12`, color: plat.color,
                      border: `1px solid ${plat.color}25`,
                    }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{
                background: "#111018",
                border: "1px solid rgba(251,191,36,0.15)",
                borderRadius: 12, padding: "18px",
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#78350F",
                  letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10,
                }}>
                  -�� A tener en cuenta
                </div>
                <p style={{ fontSize: 13, color: "#92400E", lineHeight: 1.6, margin: 0 }}>
                  {plat.caveat}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* -�--�- COSTOS -�--�- */}
        {section === "costos" && (
          <div>
            <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24, lineHeight: 1.7 }}>
              El acceso a los datos de influencers tiene costos muy distintos
              según la plataforma. En la mayoría de los casos, la infraestructura
              técnica es gratuita  -  lo que se paga es el tiempo de configuración
              y, en algunos casos, herramientas de terceros.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PLATFORMS.map(p => (
                <div key={p.id} style={{
                  background: "#0F1623",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12, padding: "18px 20px",
                  display: "flex", alignItems: "center", gap: 20,
                  flexWrap: "wrap",
                }}>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: p.color, marginBottom: 3 }}>
                      {p.name}
                    </div>
                    <DifficultyBadge level={p.difficulty} />
                  </div>
                  <div style={{
                    flex: 1, display: "flex", gap: 8, flexWrap: "wrap",
                  }}>
                    {p.costs.map((c, i) => (
                      <div key={i} style={{
                        flex: 1, minWidth: 120,
                        padding: "10px 14px", borderRadius: 8,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}>
                        <div style={{ fontSize: 11, color: "#374151", marginBottom: 4 }}>{c.label}</div>
                        <div style={{
                          fontSize: 15, fontWeight: 700,
                          color: p.costColor,
                        }}>
                          {c.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Third party section */}
            <div style={{
              marginTop: 24,
              background: "rgba(96,165,250,0.05)",
              border: "1px solid rgba(96,165,250,0.15)",
              borderRadius: 12, padding: "20px 22px",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#60A5FA", marginBottom: 8 }}>
                Alternativa: herramientas de terceros
              </div>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: "0 0 14px" }}>
                En lugar de conectarse a cada API por separado, existen plataformas
                que ya hicieron todo el trabajo técnico. Vos pagás una suscripción
                mensual y consumís sus datos directamente.
              </p>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10,
              }}>
                {[
                  { name: "HypeAuditor", price: "Desde USD 399/mes", note: "Muy completo, cubre todas las plataformas" },
                  { name: "Modash",      price: "Desde USD 299/mes", note: "Buena relación precio/datos" },
                  { name: "influData",   price: "Desde USD 149/mes", note: "Opción más accesible" },
                ].map(t => (
                  <div key={t.name} style={{
                    padding: "12px 14px", borderRadius: 8,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", marginBottom: 3 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#3B82F6", fontWeight: 600, marginBottom: 4 }}>{t.price}</div>
                    <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.5 }}>{t.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -�--�- RECOMENDACIÓN -�--�- */}
        {section === "recomendacion" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Main rec */}
            <div style={{
              background: "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.02))",
              border: "1px solid rgba(52,211,153,0.2)",
              borderRadius: 12, padding: "24px",
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#059669",
                letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10,
              }}>
                --� Recomendación para empezar
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#F8FAFC", margin: "0 0 12px" }}>
                Google Sheets + carga manual de datos
              </h2>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, margin: 0 }}>
                Para el volumen actual de campañas, lo más eficiente es que el equipo
                cargue los datos de cada publicación en una planilla de Google Sheets
                y el dashboard los lea automáticamente. Las métricas que sí se pueden
                obtener por API (YouTube, Instagram básico) se agregan en una segunda
                etapa cuando el flujo ya esté validado.
              </p>
            </div>

            {/* When to go full API */}
            <div style={{
              background: "#0F1623",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, padding: "24px",
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#334155",
                letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16,
              }}>
                ¿Cuándo tiene sentido ir a APIs reales?
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { threshold: "Más de 20 campañas activas simultáneas", icon: "📊" },
                  { threshold: "Más de 100 influencers reportados por mes", icon: "👥" },
                  { threshold: "El cliente pide datos en tiempo real (no a fin de campaña)", icon: "-��" },
                  { threshold: "Se necesita automatizar la detección de publicaciones nuevas", icon: "�--" },
                ].map((r, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 14px", borderRadius: 8,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    fontSize: 13, color: "#64748B",
                  }}>
                    <span style={{ fontSize: 16 }}>{r.icon}</span>
                    {r.threshold}
                  </div>
                ))}
              </div>
            </div>

            {/* Path forward */}
            <div style={{
              background: "#0F1623",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, padding: "24px",
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#334155",
                letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16,
              }}>
                Hoja de ruta sugerida
              </div>
              <StepList color="#60A5FA" steps={[
                { label: "Etapa 1  -  Hoy", detail: "Dashboard con Google Sheets como fuente de datos. El equipo carga métricas manualmente por campaña. Setup: 1-2 días." },
                { label: "Etapa 2  -  En 1-2 meses", detail: "Conectar YouTube Analytics API e Instagram Graph API para las plataformas más simples. Reduce el trabajo manual en un 50%." },
                { label: "Etapa 3  -  En 6 meses", detail: "Evaluar herramienta de terceros (Modash o similar) o aprobación como Content Partner de TikTok, según el volumen de campañas." },
              ]} />
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
