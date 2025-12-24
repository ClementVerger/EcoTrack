import React, { createContext, useContext, useState, useCallback } from 'react';

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

let notificationId = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

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

    // Auto-suppression après la durée spécifiée
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  // Supprimer une notification
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

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
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, notify }}>
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
