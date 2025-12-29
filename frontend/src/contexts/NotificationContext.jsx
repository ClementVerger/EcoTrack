import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import api from '../services/api';

const NotificationContext = createContext(null);

// Types de notifications
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  REWARD: 'reward',      // Pour les récompenses génériques
  BADGE: 'badge',        // Pour les badges obtenus
  LEVEL_UP: 'level_up',  // Pour les montées de niveau
  POINTS: 'points',      // Pour les points gagnés
};

// Générer un ID de session unique pour le tracking
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

let notificationId = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const sessionIdRef = useRef(generateSessionId());

  // Fonction pour tracker les événements analytics (non bloquant)
  const trackAnalytics = useCallback((eventType, eventData = {}) => {
    api.post('/analytics/track', {
      eventType,
      eventData,
      sessionId: sessionIdRef.current,
    }).catch(() => {
      // Silencieux en cas d'erreur pour ne pas impacter l'UX
    });
  }, []);

  // Ajouter une notification
  const addNotification = useCallback((notification) => {
    const id = ++notificationId;
    const newNotification = {
      id,
      type: NOTIFICATION_TYPES.INFO,
      duration: 5000, // 5 secondes par défaut
      ...notification,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Tracker l'affichage de la notification si c'est une récompense
    const rewardTypes = [NOTIFICATION_TYPES.POINTS, NOTIFICATION_TYPES.BADGE, NOTIFICATION_TYPES.LEVEL_UP, NOTIFICATION_TYPES.REWARD];
    if (rewardTypes.includes(newNotification.type)) {
      trackAnalytics('notification_displayed', {
        notificationType: newNotification.type,
        title: newNotification.title,
        message: newNotification.message,
      });
    }

    // Auto-suppression après la durée spécifiée
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [trackAnalytics]);

  // Supprimer une notification (fermée manuellement ou auto)
  const removeNotification = useCallback((id, wasClicked = false) => {
    setNotifications((prev) => {
      const notification = prev.find(n => n.id === id);
      if (notification) {
        const rewardTypes = [NOTIFICATION_TYPES.POINTS, NOTIFICATION_TYPES.BADGE, NOTIFICATION_TYPES.LEVEL_UP, NOTIFICATION_TYPES.REWARD];
        if (rewardTypes.includes(notification.type)) {
          trackAnalytics(wasClicked ? 'notification_clicked' : 'notification_dismissed', {
            notificationType: notification.type,
            title: notification.title,
          });
        }
      }
      return prev.filter((n) => n.id !== id);
    });
  }, [trackAnalytics]);

  // Raccourcis pour les types courants
  const notify = {
    success: (message, options = {}) =>
      addNotification({ type: NOTIFICATION_TYPES.SUCCESS, message, ...options }),
    
    error: (message, options = {}) =>
      addNotification({ type: NOTIFICATION_TYPES.ERROR, message, duration: 7000, ...options }),
    
    warning: (message, options = {}) =>
      addNotification({ type: NOTIFICATION_TYPES.WARNING, message, ...options }),
    
    info: (message, options = {}) =>
      addNotification({ type: NOTIFICATION_TYPES.INFO, message, ...options }),

    // Notification de points gagnés
    points: (amount, reason = '') =>
      addNotification({
        type: NOTIFICATION_TYPES.POINTS,
        message: `+${amount} points${reason ? ` - ${reason}` : ''}`,
        title: 'Points gagnés !',
        icon: '⭐',
        duration: 4000,
      }),

    // Notification de badge obtenu
    badge: (badgeName, badgeDescription = '') =>
      addNotification({
        type: NOTIFICATION_TYPES.BADGE,
        message: badgeDescription || `Vous avez débloqué le badge "${badgeName}"`,
        title: 'Nouveau badge !',
        badgeName,
        icon: '🏆',
        duration: 6000,
      }),

    // Notification de montée de niveau
    levelUp: (newLevel, levelName = '') =>
      addNotification({
        type: NOTIFICATION_TYPES.LEVEL_UP,
        message: levelName ? `Vous êtes maintenant "${levelName}"` : `Vous avez atteint le niveau ${newLevel}`,
        title: 'Niveau supérieur !',
        level: newLevel,
        icon: '🎉',
        duration: 6000,
      }),

    // Notification de récompense générique (peut combiner plusieurs)
    reward: (rewards) => {
      const { points, badges = [], levelUp } = rewards;
      
      // Afficher chaque récompense séparément pour plus d'impact
      if (points) {
        notify.points(points, 'Signalement validé');
      }
      
      badges.forEach((badge) => {
        setTimeout(() => {
          notify.badge(badge.name, badge.description);
        }, 500); // Délai pour éviter l'empilement instantané
      });

      if (levelUp) {
        setTimeout(() => {
          notify.levelUp(levelUp.level, levelUp.name);
        }, badges.length * 500 + 500);
      }
    },
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, notify, trackAnalytics }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
