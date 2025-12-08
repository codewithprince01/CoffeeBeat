import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import toast from 'react-hot-toast'

// Get base URL from environment or use default
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

class WebSocketService {
  constructor() {
    this.client = null
    this.connected = false
    this.subscriptions = new Map()
  }

  connect(token) {
    if (this.connected) {
      return Promise.resolve()
    }

    // Ensure we use the correct protocol/path for WebSocket
    // Remove /api if present in BASE_URL as /ws is usually at root
    const cleanBaseUrl = BASE_URL.replace(/\/api$/, '');
    const wsUrl = `${cleanBaseUrl}/ws`;

    console.log('🔌 Connecting to WebSocket at:', wsUrl);

    return new Promise((resolve, reject) => {
      const socket = new SockJS(wsUrl)

      this.client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          // console.log('WebSocket Debug:', str)
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      })

      this.client.onConnect = (frame) => {
        console.log('Connected to WebSocket:', frame)
        this.connected = true
        resolve()
      }

      this.client.onStompError = (frame) => {
        console.error('WebSocket Error:', frame)
        this.connected = false
        reject(frame.headers['message'])
      }

      this.client.onDisconnect = () => {
        console.log('Disconnected from WebSocket')
        this.connected = false
        this.subscriptions.clear()
      }

      this.client.activate()
    })
  }

  disconnect() {
    if (this.client && this.connected) {
      this.client.deactivate()
      this.connected = false
      this.subscriptions.clear()
    }
  }

  subscribe(destination, callback) {
    if (!this.connected) {
      console.warn('WebSocket not connected. Cannot subscribe to:', destination)
      return null
    }

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body)
        callback(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
        callback(message.body)
      }
    })

    this.subscriptions.set(destination, subscription)
    return subscription
  }

  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(destination)
    }
  }

  subscribeToAdminNotifications(callback) {
    return this.subscribe('/topic/admin/notifications', (data) => {
      this.handleNotification(data)
      if (callback) callback(data)
    })
  }

  subscribeToOrderUpdates(orderId, callback) {
    return this.subscribe(`/topic/orders/${orderId}`, (data) => {
      this.handleNotification(data)
      if (callback) callback(data)
    })
  }

  // Subscribe to ALL order updates (creation and status changes)
  subscribeToAllOrders(callback) {
    return this.subscribe('/topic/orders', (data) => {
      this.handleNotification(data)
      if (callback) callback(data)
    })
  }

  subscribeToUserNotifications(userId, callback) {
    return this.subscribe(`/queue/user/${userId}/notifications`, (data) => {
      this.handleNotification(data)
      if (callback) callback(data)
    })
  }

  subscribeToChefNotifications(chefId, callback) {
    return this.subscribe(`/queue/chef/${chefId}/notifications`, (data) => {
      this.handleNotification(data)
      if (callback) callback(data)
    })
  }

  subscribeToWaiterNotifications(waiterId, callback) {
    return this.subscribe(`/queue/waiter/${waiterId}/notifications`, (data) => {
      this.handleNotification(data)
      if (callback) callback(data)
    })
  }

  subscribeToNewOrders(callback) {
    return this.subscribeToAllOrders(callback);
  }

  subscribeToNewBookings(callback) {
    return this.subscribe('/topic/bookings/new', (data) => {
      this.handleNotification(data)
      if (callback) callback(data)
    })
  }

  subscribeToAnalytics(callback) {
    return this.subscribe('/topic/admin/analytics', (data) => {
      if (callback) callback(data)
    })
  }

  handleNotification(data) {
    const { type, message } = data

    switch (type) {
      case 'NEW_ORDER':
        toast.success(`New order received: ${message}`)
        break
      case 'ORDER_STATUS_UPDATE':
        toast(`Order update: ${message}`, {
          icon: '📋',
        })
        break
      case 'NEW_BOOKING':
        toast.success(`New booking: ${message}`)
        break
      case 'BOOKING_STATUS_UPDATE':
        toast(`Booking update: ${message}`, {
          icon: '📅',
        })
        break
      default:
        toast(message)
    }
  }

  send(destination, body) {
    if (!this.connected) {
      console.warn('WebSocket not connected. Cannot send message to:', destination)
      return
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    })
  }

  isConnected() {
    return this.connected
  }
}

// Create singleton instance
export const websocketService = new WebSocketService()

export default websocketService
