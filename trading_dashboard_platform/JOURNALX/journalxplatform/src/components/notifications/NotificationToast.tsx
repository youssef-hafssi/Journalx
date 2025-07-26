import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, AlertTriangle, CheckCircle, XCircle, Megaphone, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NotificationService, type UserNotification } from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationToastProps {
  notification: UserNotification;
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
}

export function NotificationToast({ notification, onDismiss, onRead }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(15); // Auto-dismiss after 15 seconds

  const adminNotification = notification.notification;
  if (!adminNotification) return null;

  useEffect(() => {
    // Auto-dismiss timer for non-urgent notifications
    if (adminNotification.priority !== 'urgent') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleDismiss();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, []);

  const handleDismiss = async () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
    
    if (!notification.is_dismissed) {
      await NotificationService.dismissNotification(adminNotification.id);
    }
  };

  const handleRead = async () => {
    if (!notification.is_read) {
      await NotificationService.markAsRead(adminNotification.id);
      onRead(notification.id);
    }
  };

  const getIcon = () => {
    switch (adminNotification.type) {
      case 'info': return <Info className="h-6 w-6 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error': return <XCircle className="h-6 w-6 text-red-500" />;
      case 'announcement': return <Megaphone className="h-6 w-6 text-purple-500" />;
      default: return <Bell className="h-6 w-6 text-gray-500" />;
    }
  };

  const getBorderColor = () => {
    switch (adminNotification.type) {
      case 'info': return 'border-l-blue-500';
      case 'warning': return 'border-l-yellow-500';
      case 'success': return 'border-l-green-500';
      case 'error': return 'border-l-red-500';
      case 'announcement': return 'border-l-purple-500';
      default: return 'border-l-gray-500';
    }
  };

  const getPriorityColor = () => {
    switch (adminNotification.priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.3,
            y: -100,
            rotateX: -90
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            rotateX: 0,
            // Add a subtle pulse for urgent notifications
            ...(adminNotification.priority === 'urgent' && {
              boxShadow: [
                "0 0 0 0 rgba(59, 130, 246, 0.7)",
                "0 0 0 20px rgba(59, 130, 246, 0)",
                "0 0 0 0 rgba(59, 130, 246, 0)"
              ]
            })
          }}
          exit={{
            opacity: 0,
            scale: 0.3,
            y: -100,
            rotateX: -90
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            duration: 0.6,
            ...(adminNotification.priority === 'urgent' && {
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            })
          }}
          className="relative"
        >
          <Card className={`w-full border-l-4 ${getBorderColor()} shadow-2xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95`}>
            <CardContent className="p-8">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                      {adminNotification.title}
                    </h4>
                    <div className="flex items-center space-x-1">
                      <Badge className={`text-xs ${getPriorityColor()}`}>
                        {adminNotification.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={handleDismiss}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 leading-relaxed">
                    {adminNotification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                    <div className="flex items-center space-x-2">
                      {adminNotification.priority !== 'urgent' && (
                        <span className="text-xs text-gray-400">
                          {timeLeft}s
                        </span>
                      )}
                      {!notification.is_read && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={handleRead}
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface NotificationContainerProps {
  notifications: UserNotification[];
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
}

export function NotificationContainer({ notifications, onDismiss, onRead }: NotificationContainerProps) {
  console.log('🔔 NotificationContainer rendering with notifications:', notifications);

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
          />
        )}
      </AnimatePresence>

      {/* Notification container */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] space-y-4 w-[60vw] max-w-4xl min-w-96">
        <AnimatePresence>
          {notifications.map((notification) => (
            <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
            onRead={onRead}
          />
        ))}
      </AnimatePresence>
    </div>
    </>
  );
}
