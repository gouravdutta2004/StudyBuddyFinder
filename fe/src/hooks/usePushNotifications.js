import { useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

/**
 * Converts a URL-safe base64 VAPID public key to a Uint8Array
 * required by the Web Push API.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification.permission);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Push notifications are not supported by your browser.');
      return;
    }

    setLoading(true);
    try {
      // 1. Request notification permission from the user
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        toast.error('Notification permission denied. Enable it in browser settings.');
        setLoading(false);
        return;
      }

      // 2. Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 3. Get the VAPID public key from the backend
      const { data } = await api.get('/push/vapid-public-key');
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

      // 4. Create the push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // 5. Save the subscription on the backend
      await api.post('/push/subscribe', { subscription: subscription.toJSON() });

      setIsSubscribed(true);
      toast.success('🔔 Push notifications enabled!');
    } catch (err) {
      console.error('Push subscription failed:', err);
      toast.error('Failed to enable push notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await api.delete('/push/unsubscribe', { data: { endpoint: subscription.endpoint } });
          await subscription.unsubscribe();
        }
      }
      setIsSubscribed(false);
      toast.success('Push notifications disabled.');
    } catch (err) {
      console.error('Unsubscribe failed:', err);
      toast.error('Failed to disable push notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendTestPush = useCallback(async () => {
    try {
      await api.post('/push/test');
      toast.success('Test notification sent!');
    } catch (err) {
      toast.error('Failed to send test notification.');
    }
  }, []);

  /**
   * Call this once on app init (e.g., after login) to silently re-subscribe
   * if the user has already granted permission + we have a SW installed.
   */
  const autoSubscribeIfPermitted = useCallback(async () => {
    if (Notification.permission !== 'granted') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        // Already subscribed in this browser – just sync with backend
        await api.post('/push/subscribe', { subscription: existingSub.toJSON() });
        setIsSubscribed(true);
        return;
      }

      // No active subscription; get key and subscribe silently
      const { data } = await api.get('/push/vapid-public-key');
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      await api.post('/push/subscribe', { subscription: subscription.toJSON() });
      setIsSubscribed(true);
    } catch (err) {
      // Silent fail – user will get prompted manually if needed
    }
  }, []);

  return { permission, isSubscribed, loading, subscribe, unsubscribe, sendTestPush, autoSubscribeIfPermitted };
}
