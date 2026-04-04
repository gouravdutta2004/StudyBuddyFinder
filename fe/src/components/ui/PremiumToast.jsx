/**
 * PremiumToast – Rich glassmorphic notification cards
 * Drop-in replacements for react-hot-toast.
 *
 * Usage:
 *   import { showNotification } from '../components/ui/PremiumToast';
 *   showNotification('message', { type: 'message', meta: {...} });
 */
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

/* ── Design tokens ─────────────────────────────────── */
const FONT = "'Plus Jakarta Sans','Inter',system-ui,sans-serif";

const THEMES = {
  success: {
    bg: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))',
    border: 'rgba(16,185,129,0.35)',
    accent: '#10b981',
    glow: '0 8px 32px rgba(16,185,129,0.22)',
    icon: '✅',
  },
  error: {
    bg: 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(185,28,28,0.08))',
    border: 'rgba(239,68,68,0.35)',
    accent: '#ef4444',
    glow: '0 8px 32px rgba(239,68,68,0.22)',
    icon: '❌',
  },
  warning: {
    bg: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(180,83,9,0.08))',
    border: 'rgba(245,158,11,0.35)',
    accent: '#f59e0b',
    glow: '0 8px 32px rgba(245,158,11,0.22)',
    icon: '⚠️',
  },
  info: {
    bg: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(79,70,229,0.08))',
    border: 'rgba(99,102,241,0.35)',
    accent: '#6366f1',
    glow: '0 8px 32px rgba(99,102,241,0.22)',
    icon: 'ℹ️',
  },
  message: {
    bg: 'linear-gradient(135deg,rgba(56,189,248,0.12),rgba(14,165,233,0.08))',
    border: 'rgba(56,189,248,0.3)',
    accent: '#38bdf8',
    glow: '0 8px 32px rgba(56,189,248,0.18)',
    icon: '💬',
  },
  quest: {
    bg: 'linear-gradient(135deg,rgba(167,139,250,0.15),rgba(124,58,237,0.1))',
    border: 'rgba(167,139,250,0.4)',
    accent: '#a78bfa',
    glow: '0 8px 32px rgba(167,139,250,0.3)',
    icon: '🏆',
  },
  sos: {
    bg: 'linear-gradient(135deg,rgba(239,68,68,0.15),rgba(127,29,29,0.1))',
    border: 'rgba(239,68,68,0.5)',
    accent: '#ef4444',
    glow: '0 8px 32px rgba(239,68,68,0.35)',
    icon: '🚨',
  },
  sos_success: {
    bg: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.1))',
    border: 'rgba(16,185,129,0.4)',
    accent: '#10b981',
    glow: '0 8px 32px rgba(16,185,129,0.3)',
    icon: '🚀',
  },
  notification: {
    bg: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(30,41,59,0.12))',
    border: 'rgba(255,255,255,0.1)',
    accent: '#818cf8',
    glow: '0 8px 24px rgba(99,102,241,0.15)',
    icon: '🔔',
  },
};

/* ── Base card wrapper ─────────────────────────────── */
function Card({ t, theme: themeKey, icon, title, subtitle, description, body, footer, actions, onDismiss, maxWidth = 380 }) {
  const theme = THEMES[themeKey] || THEMES.info;
  const customIcon = icon || theme.icon;

  return (
    <div style={{
      fontFamily: FONT,
      width: maxWidth,
      maxWidth: '95vw',
      background: 'rgba(10,15,28,0.96)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: `1px solid ${theme.border}`,
      borderRadius: 18,
      boxShadow: theme.glow + ', 0 2px 0 rgba(255,255,255,0.05) inset',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
      }} />

      {/* Ambient glow orb */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 120, height: 120, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.accent}1A, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ padding: '14px 16px 14px', position: 'relative' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: body || description ? 10 : 0 }}>
          {/* Icon bubble */}
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: `${theme.accent}1A`,
            border: `1px solid ${theme.accent}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.15rem',
          }}>
            {customIcon}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'rgba(255,255,255,0.95)', marginBottom: subtitle ? 2 : 0, lineHeight: 1.3 }}>
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{ fontSize: '0.75rem', color: theme.accent, fontWeight: 700, letterSpacing: 0.3 }}>
                {subtitle}
              </div>
            )}
          </div>

          {/* Dismiss X */}
          {(onDismiss !== false) && (
            <button
              onClick={() => { toast.dismiss(t?.id); onDismiss?.(); }}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, width: 26, height: 26, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Description */}
        {description && (
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: body ? 10 : 0, paddingLeft: 50 }}>
            {description}
          </div>
        )}

        {/* Custom body */}
        {body}

        {/* Footer note */}
        {footer && (
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 8, paddingLeft: 50, fontStyle: 'italic' }}>
            {footer}
          </div>
        )}

        {/* Action buttons */}
        {actions && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingLeft: 50 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Pill button helper ────────────────────────────── */
function Btn({ label, onClick, primary, accent = '#6366f1', danger }) {
  const bg = danger ? '#ef4444' : primary ? accent : 'rgba(255,255,255,0.06)';
  const color = primary || danger ? '#fff' : 'rgba(255,255,255,0.65)';
  const border = primary || danger ? 'none' : '1px solid rgba(255,255,255,0.12)';
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '8px 0', background: bg, border, borderRadius: 10,
      color, fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
      fontFamily: FONT, transition: 'opacity 0.15s', letterSpacing: 0.3,
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {label}
    </button>
  );
}

/* ══ Toast functions (call these instead of toast.success etc.) ══ */

/** Generic success */
export function notifySuccess(title, description, opts = {}) {
  return toast.custom(
    (t) => <Card t={t} theme="success" title={title} description={description} {...opts.cardProps} />,
    { duration: opts.duration || 4000, ...opts }
  );
}

/** Generic error */
export function notifyError(title, description, opts = {}) {
  return toast.custom(
    (t) => <Card t={t} theme="error" title={title} description={description} {...opts.cardProps} />,
    { duration: opts.duration || 5000, ...opts }
  );
}

/** Generic info */
export function notifyInfo(title, description, opts = {}) {
  return toast.custom(
    (t) => <Card t={t} theme="info" title={title} description={description} {...opts.cardProps} />,
    { duration: opts.duration || 4000, ...opts }
  );
}

/** Generic warning */
export function notifyWarning(title, description, opts = {}) {
  return toast.custom(
    (t) => <Card t={t} theme="warning" title={title} description={description} {...opts.cardProps} />,
    { duration: opts.duration || 5000, ...opts }
  );
}

/** New message from someone */
export function notifyNewMessage({ senderName, senderAvatar, preview, onClick }) {
  return toast.custom(
    (t) => (
      <Card t={t} theme="message"
        icon={
          <div style={{ position: 'relative' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(56,189,248,0.5)' }}>
              {senderAvatar
                ? <img src={senderAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : <div style={{ width: '100%', height: '100%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.9rem' }}>{senderName?.[0]}</div>
              }
            </div>
            <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid #0a0f1c' }} />
          </div>
        }
        title={senderName}
        subtitle="Sent you a message"
        description={preview?.slice(0, 80) + (preview?.length > 80 ? '…' : '')}
        footer="Click to open conversation"
        actions={
          <>
            <Btn label="Open Chat" primary accent="#38bdf8" onClick={() => { toast.dismiss(t.id); onClick?.(); }} />
            <Btn label="Dismiss" onClick={() => toast.dismiss(t.id)} />
          </>
        }
        onDismiss={false}
      />
    ),
    { duration: 6000 }
  );
}

/** Quest / Achievement completed */
export function notifyQuestCompleted({ questName, xp, badge }) {
  return toast.custom(
    (t) => (
      <Card t={t} theme="quest"
        icon="🏆"
        title="Quest Completed!"
        subtitle={`+${xp} XP earned`}
        body={
          <div style={{ paddingLeft: 50 }}>
            <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 10, padding: '8px 12px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Achievement Unlocked</div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'white' }}>{questName}</div>
              {badge && <div style={{ marginTop: 4, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>🎖️ {badge}</div>}
            </div>
          </div>
        }
        footer="Visit your Gamification dashboard to see all quests"
      />
    ),
    { duration: 7000 }
  );
}

/** General bell notification */
export function notifyGeneral(message, meta = {}) {
  const descriptions = {
    connection_request: 'wants to connect with you and study together.',
    connection_accepted: 'accepted your connection request!',
    session_reminder: 'Your study session is starting soon.',
    contract_proposed: 'proposed an accountability contract with you.',
    contract_accepted: 'accepted your accountability contract!',
    rating_received: 'rated your study session.',
    badge_earned: 'You earned a new badge!',
  };

  const icons = {
    connection_request: '🤝',
    connection_accepted: '✅',
    session_reminder: '⏰',
    contract_proposed: '📋',
    contract_accepted: '🎯',
    rating_received: '⭐',
    badge_earned: '🏅',
  };

  const enrichedDesc = meta.type ? descriptions[meta.type] : null;
  const icon = meta.type ? icons[meta.type] : '🔔';

  return toast.custom(
    (t) => (
      <Card t={t} theme="notification"
        icon={icon}
        title={meta.actor || 'StudyBuddy'}
        subtitle={enrichedDesc || message}
        description={enrichedDesc ? message : null}
        footer={meta.type === 'connection_request' ? 'Visit Matches to accept or decline' : null}
      />
    ),
    { duration: 5000 }
  );
}

/** SOS incoming — with action buttons */
export function notifySOSIncoming({ payload, socket, userName, onDismiss }) {
  return toast.custom(
    (t) => (
      <Card t={t} theme="sos"
        icon="🚨"
        title="SOS Beacon Incoming!"
        subtitle={`${payload.userName} needs immediate help`}
        body={
          <div style={{ paddingLeft: 50 }}>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 }}>📚 Subject</div>
                  <div style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>{payload.subject}</div>
                </div>
                {payload.topic && (
                  <div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 }}>🤔 They're stuck on</div>
                    <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.75)', fontSize: '0.84rem', fontStyle: 'italic' }}>"{payload.topic}"</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        }
        footer="Accepting will open an emergency 1-on-1 study room"
        actions={
          <>
            <Btn label="✋ Accept & Help" primary danger
              onClick={() => {
                socket.emit('accept_sos', { callerId: payload.userId, helperName: userName });
                toast.dismiss(t.id);
              }}
            />
            <Btn label="Decline"
              onClick={() => { toast.dismiss(t.id); onDismiss?.(); }}
            />
          </>
        }
        onDismiss={false}
      />
    ),
    { duration: 20000 }
  );
}

/** SOS broadcast result (caller perspective) */
export function notifySOSBroadcast({ count }) {
  if (count === 0) {
    return toast.custom(
      (t) => (
        <Card t={t} theme="warning"
          icon="📡"
          title="SOS Deployed"
          subtitle="Searching for available experts…"
          description="No matching subject experts are online right now, but your SOS has been broadcast to all online users."
          footer="Stay on the platform — someone may respond shortly"
        />
      ),
      { duration: 7000 }
    );
  }
  return toast.custom(
    (t) => (
      <Card t={t} theme="sos"
        icon="📡"
        title="SOS Beacon Deployed!"
        subtitle={`Pinging ${count} expert${count > 1 ? 's' : ''}…`}
        description={`Your emergency request has been sent to ${count} online expert${count > 1 ? 's' : ''}. Stand by for a response.`}
        footer="You'll be redirected automatically when someone accepts"
      />
    ),
    { duration: 7000 }
  );
}

/** SOS no experts at all online */
export function notifySOSNoExperts() {
  return toast.custom(
    (t) => (
      <Card t={t} theme="warning"
        icon="😔"
        title="No Experts Online"
        subtitle="SOS could not be delivered"
        description="There are no other users online right now. Try again in a few minutes or post in the Sessions page."
        footer="Tip: Online hours are typically 8 AM – midnight"
      />
    ),
    { duration: 7000 }
  );
}

/** SOS accepted (both caller and helper) */
export function notifySOSAccepted({ helperName, isHelper }) {
  const title = isHelper ? 'SOS Accepted!' : 'Expert Incoming!';
  const subtitle = isHelper
    ? 'You\'re being routed to the emergency room'
    : `${helperName || 'An expert'} accepted your SOS`;
  const description = isHelper
    ? 'Get ready — the student needs your help. The emergency study room is launching now.'
    : `${helperName || 'An expert'} is on their way! Your emergency study room is launching in 2 seconds.`;
  return toast.custom(
    (t) => (
      <Card t={t} theme="sos_success"
        icon="🚀"
        title={title}
        subtitle={subtitle}
        description={description}
        footer="Launching emergency 1-on-1 study room…"
        onDismiss={false}
      />
    ),
    { duration: 4500 }
  );
}

/** SOS server error */
export function notifySOSError({ message }) {
  return toast.custom(
    (t) => (
      <Card t={t} theme="error"
        icon="⚡"
        title="SOS System Error"
        subtitle="Something went wrong"
        description={`The SOS request failed: ${message}. Please try again.`}
      />
    ),
    { duration: 6000 }
  );
}
