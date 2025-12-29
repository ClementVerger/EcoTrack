import React from "react";
import {
  useNotification,
  NOTIFICATION_TYPES,
} from "../../contexts/NotificationContext";
import "../../styles/RewardNotification.css";

// Configuration des styles par type
const TYPE_CONFIG = {
  [NOTIFICATION_TYPES.SUCCESS]: {
    className: "notification--success",
    defaultIcon: "✓",
  },
  [NOTIFICATION_TYPES.ERROR]: {
    className: "notification--error",
    defaultIcon: "✕",
  },
  [NOTIFICATION_TYPES.WARNING]: {
    className: "notification--warning",
    defaultIcon: "⚠",
  },
  [NOTIFICATION_TYPES.INFO]: {
    className: "notification--info",
    defaultIcon: "ℹ",
  },
  [NOTIFICATION_TYPES.POINTS]: {
    className: "notification--points",
    defaultIcon: "⭐",
  },
  [NOTIFICATION_TYPES.BADGE]: {
    className: "notification--badge",
    defaultIcon: "🏆",
  },
  [NOTIFICATION_TYPES.LEVEL_UP]: {
    className: "notification--level-up",
    defaultIcon: "🎉",
  },
  [NOTIFICATION_TYPES.REWARD]: {
    className: "notification--reward",
    defaultIcon: "🎁",
  },
};

function NotificationItem({ notification, onClose }) {
  const config =
    TYPE_CONFIG[notification.type] || TYPE_CONFIG[NOTIFICATION_TYPES.INFO];
  const icon = notification.icon || config.defaultIcon;

  const isRewardType = [
    NOTIFICATION_TYPES.POINTS,
    NOTIFICATION_TYPES.BADGE,
    NOTIFICATION_TYPES.LEVEL_UP,
    NOTIFICATION_TYPES.REWARD,
  ].includes(notification.type);

  return (
    <div
      className={`notification ${config.className} ${isRewardType ? "notification--reward-type" : ""}`}
    >
      <div className="notification__icon-container">
        <span className="notification__icon">{icon}</span>
        {isRewardType && <div className="notification__icon-glow" />}
      </div>

      <div className="notification__content">
        {notification.title && (
          <h4 className="notification__title">{notification.title}</h4>
        )}
        <p className="notification__message">{notification.message}</p>
      </div>

      <button
        className="notification__close"
        onClick={() => onClose(notification.id)}
        aria-label="Fermer"
      >
        ×
      </button>

      {notification.duration > 0 && (
        <div
          className="notification__progress"
          style={{ animationDuration: `${notification.duration}ms` }}
        />
      )}
    </div>
  );
}

export default function RewardNotification() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
}
