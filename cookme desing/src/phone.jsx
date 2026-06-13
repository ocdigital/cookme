// Frame mobile simplificado — sem barra do sistema iOS específica,
// apenas uma "status bar" neutra que funciona bem em iOS + Android.
// Usa status-bar estilo iOS 26 (pills pequenas no topo), home-indicator inferior.

const CMPhone = ({ children, w = 390, h = 780, style = {} }) => (
  <div style={{
    width: w, height: h, borderRadius: 42, overflow: 'hidden',
    background: T.ink[50], position: 'relative',
    boxShadow: '0 30px 60px rgba(58,42,20,.15), 0 0 0 1px rgba(58,42,20,.08)',
    fontFamily: font.sans, WebkitFontSmoothing: 'antialiased',
    display: 'flex', flexDirection: 'column',
    ...style,
  }}>
    {/* Status bar */}
    <div style={{
      height: 48, padding: '0 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'relative', zIndex: 3, flexShrink: 0,
    }}>
      <span style={{
        fontFamily: '-apple-system, system-ui', fontWeight: 600,
        fontSize: 15, color: T.ink[900],
      }}>9:41</span>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
        width: 100, height: 28, borderRadius: 18, background: T.ink[900],
      }}/>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: T.ink[900] }}>
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx=".5" fill="currentColor"/><rect x="4.5" y="5" width="3" height="6" rx=".5" fill="currentColor"/><rect x="9" y="3" width="3" height="8" rx=".5" fill="currentColor"/><rect x="13.5" y="0" width="3" height="11" rx=".5" fill="currentColor"/></svg>
        <svg width="16" height="11" viewBox="0 0 16 11"><path d="M8 3c2 0 3.8.8 5.1 2l1-1C12.5 2.5 10.4 1.5 8 1.5S3.5 2.5 1.9 4l1 1C4.2 3.8 6 3 8 3zM8 6c1.2 0 2.3.5 3.1 1.3l1-1C11 5.3 9.6 4.7 8 4.7s-3 .6-4.1 1.6l1 1C5.7 6.5 6.8 6 8 6z" fill="currentColor"/><circle cx="8" cy="9.5" r="1.3" fill="currentColor"/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12"><rect x=".5" y=".5" width="21" height="11" rx="3" stroke="currentColor" strokeOpacity=".35" fill="none"/><rect x="2" y="2" width="15" height="8" rx="1.5" fill="currentColor"/><path d="M23 4v4c.7-.3 1.3-1 1.3-2s-.6-1.7-1.3-2z" fill="currentColor" opacity=".4"/></svg>
      </div>
    </div>

    {/* Conteúdo scrollável */}
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {children}
    </div>

    {/* Home indicator */}
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      paddingBottom: 8, pointerEvents: 'none', zIndex: 30,
    }}>
      <div style={{ width: 128, height: 5, borderRadius: 3, background: T.ink[900], opacity: .85 }}/>
    </div>
  </div>
);

Object.assign(window, { CMPhone });
