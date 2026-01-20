import * as Notifications from 'expo-notifications';
import NotificationService from './NotificationService';
import {
  notifyInvoiceCreatedToServer,
  notifyPaymentReceivedToServer,
  notifyClientAddedToServer,
} from './djangoIntegration';

/**
 * Utilities for integrating notifications with EasyAgent functions
 */

// Instancia del servicio de notificaciones
const notificationService = NotificationService.getInstance();

/**
 * Notificar cuando se crea una nueva factura
 */
export const notifyInvoiceCreated = async (
  invoiceData: {
    id: string;
    number: string;
    amount: number;
    clientName: string;
  }
) => {
  try {
    // Schedule immediate local notification
    await notificationService.scheduleLocalNotification(
      'New Invoice Created',
      `Invoice #${invoiceData.number} for $${invoiceData.amount} created for ${invoiceData.clientName}`,
      null, // Immediate
      {
        action: 'open_invoice',
        invoiceId: invoiceData.id,
        screen: `/home/InvoiceViewModal?invoiceId=${invoiceData.id}`
      }
    );

    // Also notify Django server
    try {
      await notifyInvoiceCreatedToServer({
        id: invoiceData.id,
        number: invoiceData.number,
        amount: invoiceData.amount,
        clientName: invoiceData.clientName,
      });
    } catch (error) {
      console.error('Error notifying server about invoice creation:', error);
    }

    console.log('Invoice creation notification scheduled');
  } catch (error) {
    console.error('Error notifying invoice creation:', error);
  }
};

/**
 * Notificar cuando se recibe un pago
 */
export const notifyPaymentReceived = async (
  paymentData: {
    id: string;
    amount: number;
    clientName: string;
    invoiceNumber: string;
  }
) => {
  try {
    await notificationService.scheduleLocalNotification(
      'Payment Received!',
      `${paymentData.clientName} paid $${paymentData.amount} for invoice #${paymentData.invoiceNumber}`,
      { seconds: 1 },
      {
        action: 'open_payment',
        paymentId: paymentData.id,
        screen: `/stripe/Payments`
      }
    );

    console.log('Payment notification scheduled');
  } catch (error) {
    console.error('Error notifying payment:', error);
  }
};

/**
 * Programar recordatorio de factura vencida
 */
export const scheduleInvoiceOverdueReminder = async (
  invoiceData: {
    id: string;
    number: string;
    amount: number;
    dueDate: Date;
    clientName: string;
  }
) => {
  try {
    // Programar recordatorio para la fecha de vencimiento a las 9:00 AM
    const reminderDate = new Date(invoiceData.dueDate);
    reminderDate.setHours(9, 0, 0, 0);

    const identifier = await notificationService.scheduleLocalNotification(
      'Invoice Overdue',
      `Invoice #${invoiceData.number} for ${invoiceData.clientName} for $${invoiceData.amount} is overdue today`,
      { date: reminderDate },
      {
        action: 'open_invoice',
        invoiceId: invoiceData.id,
        screen: `/home/InvoiceViewModal?invoiceId=${invoiceData.id}`
      }
    );

    console.log(`Overdue reminder scheduled for invoice ${invoiceData.number}:`, identifier);
    return identifier;
  } catch (error) {
    console.error('Error scheduling overdue reminder:', error);
    return null;
  }
};

/**
 * Programar recordatorio antes del vencimiento
 */
export const scheduleInvoiceReminderBeforeDue = async (
  invoiceData: {
    id: string;
    number: string;
    amount: number;
    dueDate: Date;
    clientName: string;
  },
  daysBefore: number = 1
) => {
  try {
    // Schedule reminder X days before due date
    const reminderDate = new Date(invoiceData.dueDate);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);
    reminderDate.setHours(10, 0, 0, 0); // 10:00 AM

    const identifier = await notificationService.scheduleLocalNotification(
      'Invoice Due Soon',
      `Invoice #${invoiceData.number} for ${invoiceData.clientName} is due ${daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`}`,
      { date: reminderDate },
      {
        action: 'open_invoice',
        invoiceId: invoiceData.id,
        screen: `/home/InvoiceViewModal?invoiceId=${invoiceData.id}`
      }
    );

    console.log(`Pre-due reminder scheduled for invoice ${invoiceData.number}:`, identifier);
    return identifier;
  } catch (error) {
    console.error('Error scheduling pre-due reminder:', error);
    return null;
  }
};

/**
 * Notificar cuando se añade un nuevo cliente
 */
export const notifyClientAdded = async (
  clientData: {
    id: string;
    name: string;
    email?: string;
  }
) => {
  try {
    await notificationService.scheduleLocalNotification(
      'Client Added',
      `${clientData.name} was added as a new client`,
      { seconds: 1 },
      {
        action: 'open_client',
        clientId: clientData.id,
        screen: `/clients/ClientDetails?clientId=${clientData.id}`
      }
    );

    console.log('Client added notification scheduled');
  } catch (error) {
    console.error('Error notifying client addition:', error);
  }
};

/**
 * Programar recordatorio personalizado
 */
export const scheduleCustomReminder = async (
  title: string,
  message: string,
  triggerDate: Date,
  data?: any
) => {
  try {
    const identifier = await notificationService.scheduleLocalNotification(
      title,
      message,
      { date: triggerDate },
      data
    );

    console.log('Custom reminder scheduled:', identifier);
    return identifier;
  } catch (error) {
    console.error('Error scheduling custom reminder:', error);
    return null;
  }
};

/**
 * Cancelar recordatorios de una factura específica
 */
export const cancelInvoiceReminders = async (invoiceId: string) => {
  try {
    const scheduledNotifications = await notificationService.getScheduledNotifications();
    
    for (const notification of scheduledNotifications) {
      const data = notification.content.data as any;
      if (data?.invoiceId === invoiceId) {
        await notificationService.cancelScheduledNotification(notification.identifier);
        console.log(`Cancelled notification ${notification.identifier} for invoice ${invoiceId}`);
      }
    }
  } catch (error) {
    console.error('Error cancelling invoice reminders:', error);
  }
};

/**
 * Programar recordatorio diario de revisión de facturas
 */
export const scheduleDailyInvoiceReview = async () => {
  try {
    // Programar recordatorio diario a las 8:00 AM
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(8, 0, 0, 0);
    
    // Si ya pasó las 8 AM hoy, programar para mañana
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const identifier = await notificationService.scheduleLocalNotification(
      'Daily Review',
      'Review your pending invoices and payments for the day',
      { 
        date: reminderTime,
        repeats: true 
      },
      {
        action: 'open_dashboard',
        screen: '/home'
      }
    );

    console.log('Daily review reminder scheduled:', identifier);
    return identifier;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return null;
  }
};

/**
 * Obtener resumen de notificaciones programadas
 */
export const getNotificationSummary = async () => {
  try {
    const notifications = await notificationService.getScheduledNotifications();
    
    const summary = {
      total: notifications.length,
      byType: {} as Record<string, number>,
      upcomingToday: 0,
      upcomingWeek: 0
    };

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    notifications.forEach(notification => {
      const data = notification.content.data as any;
      const type = data?.type || 'unknown';
      
      summary.byType[type] = (summary.byType[type] || 0) + 1;

      if (notification.trigger && 'date' in notification.trigger) {
        const triggerDate = new Date(notification.trigger.date as any);
        
        if (triggerDate.toDateString() === today.toDateString()) {
          summary.upcomingToday++;
        }
        
        if (triggerDate <= nextWeek) {
          summary.upcomingWeek++;
        }
      }
    });

    return summary;
  } catch (error) {
    console.error('Error getting notification summary:', error);
    return {
      total: 0,
      byType: {},
      upcomingToday: 0,
      upcomingWeek: 0
    };
  }
};

export default {
  notifyInvoiceCreated,
  notifyPaymentReceived,
  scheduleInvoiceOverdueReminder,
  scheduleInvoiceReminderBeforeDue,
  notifyClientAdded,
  scheduleCustomReminder,
  cancelInvoiceReminders,
  scheduleDailyInvoiceReview,
  getNotificationSummary,
};