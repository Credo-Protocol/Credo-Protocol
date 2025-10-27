/**
 * Credential Notifications Component
 * 
 * Shows alerts for:
 * - Revoked credentials
 * - Expiring credentials (within 30 days)
 * - Expired credentials
 * 
 * Implements best practices for keeping holders informed of credential status.
 */

import { useState, useEffect } from 'react';
import { useAirKit } from '@/hooks/useAirKit';
import { getUserCredentials } from '@/lib/credentialServices';
import { AlertTriangle, XCircle, Ban, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CredentialNotifications() {
  const { userAddress, isConnected } = useAirKit();
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    if (isConnected && userAddress) {
      loadNotifications();
      // Check every 5 minutes for updates
      const interval = setInterval(loadNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isConnected, userAddress]);

  const loadNotifications = async () => {
    try {
      const credentials = await getUserCredentials(userAddress);
      const alerts = [];

      credentials.forEach(cred => {
        // Revoked credentials
        if (cred.status === 'revoked') {
          alerts.push({
            id: `revoked-${cred.id}`,
            type: 'error',
            icon: <Ban className="w-5 h-5" />,
            title: 'Credential Revoked',
            message: `Your "${cred.bucket?.replace(/_/g, ' ')}" credential has been revoked. ${cred.revocationReason || 'Contact issuer for details.'}`,
            action: {
              label: 'Get New Credential',
              href: '/credentials?tab=marketplace'
            }
          });
        }
        // Expired credentials
        else if (cred.status === 'expired') {
          alerts.push({
            id: `expired-${cred.id}`,
            type: 'warning',
            icon: <XCircle className="w-5 h-5" />,
            title: 'Credential Expired',
            message: `Your "${cred.bucket?.replace(/_/g, ' ')}" credential has expired. Renew it to maintain your credit score.`,
            action: {
              label: 'Renew Credential',
              href: '/credentials?tab=marketplace'
            }
          });
        }
        // Expiring soon (within 30 days)
        else if (cred.expirationDate) {
          const now = Math.floor(Date.now() / 1000);
          const daysUntilExpiry = Math.floor((cred.expirationDate - now) / (24 * 60 * 60));
          
          if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
            alerts.push({
              id: `expiring-${cred.id}`,
              type: 'info',
              icon: <AlertTriangle className="w-5 h-5" />,
              title: 'Credential Expiring Soon',
              message: `Your "${cred.bucket?.replace(/_/g, ' ')}" credential expires in ${daysUntilExpiry} days.`,
              action: {
                label: 'View Details',
                href: '/credentials'
              }
            });
          }
        }
      });

      setNotifications(alerts);
    } catch (error) {
      console.error('Failed to load credential notifications:', error);
    }
  };

  const handleDismiss = (notificationId) => {
    setDismissed(prev => new Set([...prev, notificationId]));
  };

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-40 space-y-3 max-w-sm">
      {visibleNotifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border-2 shadow-lg backdrop-blur-sm animate-slide-in-right ${
            notification.type === 'error'
              ? 'bg-red-50 border-red-300'
              : notification.type === 'warning'
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-blue-50 border-blue-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 ${
                notification.type === 'error'
                  ? 'text-red-600'
                  : notification.type === 'warning'
                  ? 'text-yellow-600'
                  : 'text-blue-600'
              }`}
            >
              {notification.icon}
            </div>

            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
              <p className="text-xs text-black/70 mb-3">{notification.message}</p>

              {notification.action && (
                <Link href={notification.action.href}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                  >
                    {notification.action.label}
                  </Button>
                </Link>
              )}
            </div>

            <button
              onClick={() => handleDismiss(notification.id)}
              className="text-black/40 hover:text-black/70 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CredentialNotifications;

