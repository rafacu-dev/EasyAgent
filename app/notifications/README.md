# EasyAgent Notification System

A comprehensive push notification system for the EasyAgent mobile app using Expo Notifications and Django backend integration.

## 📁 File Structure

```
notifications/
├── README.md                           # This documentation
├── index.ts                            # Main exports
├── config.ts                           # Configuration and constants
├── NotificationService.ts              # Core notification service (singleton)
├── useNotifications.ts                 # React hook for notifications
├── NotificationProvider.tsx            # Context provider component
├── NotificationPreferencesScreen.tsx   # UI for user preferences
├── easyAgentNotifications.ts           # EasyAgent notification integration
├── notificationHelpers.ts              # Helper functions for triggers
└── djangoIntegration.ts                # DEPRECATED (invoice notifications)
```

## 🚀 Quick Start

### 1. Setup (Already Done)

The notification system is automatically initialized in `_layout.tsx`:

```tsx
<NotificationProvider>
  <Stack />
</NotificationProvider>
```

### 2. Usage in Components

#### Send Notifications After Actions

The system is already integrated into key app actions:

**Phone Number Purchase** (`buy-phone-number.tsx`):

```tsx
import { onPhoneNumberAdded } from "./notifications/notificationHelpers";

// After successful purchase
onPhoneNumberAdded({
  phoneNumber: "+1234567890",
  friendlyName: "Company Number",
});
```

**Agent Creation** (`agent-setup.tsx`):

```tsx
import { onAgentCreated } from "./notifications/notificationHelpers";

// After successful creation
onAgentCreated({
  agentName: "Alex",
  agentId: "agent_123",
});
```

**Agent Update** (`edit-agent.tsx`):

```tsx
import { onAgentUpdated } from "./notifications/notificationHelpers";

// After successful update
onAgentUpdated({
  agentName: "Alex",
  agentId: "agent_123",
});
```

**Appointment Scheduling** (`calendar.tsx`):

```tsx
import {
  onAppointmentScheduled,
  scheduleAppointmentReminder,
} from "./notifications/notificationHelpers";

// After successful creation
onAppointmentScheduled({
  appointmentId: 123,
  clientName: "John Doe",
  appointmentDate: "2026-01-25",
  appointmentTime: "14:00",
});

// Schedule reminder (1 hour before)
scheduleAppointmentReminder({
  appointmentId: 123,
  clientName: "John Doe",
  appointmentDate: "2026-01-25",
  appointmentTime: "14:00",
});
```

#### Access Notification State

```tsx
import { useNotifications } from "./notifications/useNotifications";

function MyComponent() {
  const { expoPushToken, notification, sendTokenToServer } = useNotifications();

  return <Text>Token: {expoPushToken}</Text>;
}
```

## 🔔 Notification Types

The system supports these notification types:

| Type                    | Description                      | Backend Endpoint                        |
| ----------------------- | -------------------------------- | --------------------------------------- |
| `call_completed`        | Sent when a call ends            | `/notifications/call/completed/`        |
| `appointment_scheduled` | Sent when appointment created    | `/notifications/appointment/scheduled/` |
| `agent_updated`         | Sent when agent is updated       | `/notifications/agent/updated/`         |
| `phone_number_added`    | Sent when phone number purchased | `/notifications/phone-number/added/`    |
| `system`                | System-wide notifications        | Backend only                            |

## 🎯 Backend Integration

### API Endpoints

**Send Notification:**

```typescript
POST /notifications/{type}/{action}/
Body: { title, body, data, user_id }
```

**Get/Update Preferences:**

```typescript
GET /notifications/preferences/
PATCH /notifications/preferences/
Body: { enabled, call_completed, appointment_scheduled, ... }
```

**Test Notification:**

```typescript
POST /notifications/test/
```

### Example Backend Call

```typescript
import { notifyCallCompleted } from "./notifications/easyAgentNotifications";

// Send notification to backend (backend handles push to device)
await notifyCallCompleted({
  callId: "call_123",
  duration: 120,
  from: "+1234567890",
});
```

## 🔧 Configuration

### Android Channels

Defined in `config.ts`:

- **default** - Default notifications (High priority, sound + vibration)
- **high-priority** - Urgent notifications (Max priority, sound + vibration)
- **low-priority** - Non-urgent notifications (Low priority, no sound)
- **reminder** - Scheduled reminders (High priority, sound)

### Notification Handler

Global handler in `NotificationService.ts`:

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

## 📱 User Preferences

Users can manage notification preferences in the app:

- Navigate to notification preferences screen
- Toggle each notification type on/off
- Send test notifications
- Preferences sync with backend

## 🛠️ Architecture

### Flow Diagram

```
User Action (e.g., buy phone)
    ↓
Helper Function (onPhoneNumberAdded)
    ↓
Backend API Call (/notifications/phone-number/added/)
    ↓
Django Backend (easyagent/views/notification_views.py)
    ↓
Push Notification to User's Device
    ↓
NotificationService receives notification
    ↓
useNotifications hook updates state
    ↓
UI updates / navigation
```

### Local Notifications

For scheduled reminders (like appointment reminders):

```
Helper Function (scheduleAppointmentReminder)
    ↓
NotificationService.scheduleNotification()
    ↓
Expo Notifications API
    ↓
Notification triggered at scheduled time
```

## 🔐 Permissions

Permissions are requested in `home.tsx` on first app launch:

1. Request notification permissions
2. Get Expo Push Token
3. Send token to backend
4. Backend stores token for user
5. Backend can now send push notifications

## 📝 Best Practices

1. **Always catch errors** when calling notification functions:

   ```typescript
   onPhoneNumberAdded(data).catch((err) =>
     console.error("Failed to send notification:", err)
   );
   ```

2. **Don't block UI** - Notification calls are async and don't need to block user actions

3. **Test thoroughly** - Use the test notification feature in preferences screen

4. **Check preferences** - Backend respects user preferences before sending

5. **Handle navigation** - NotificationProvider handles taps on notifications

## 🐛 Debugging

Enable debug logs:

```typescript
// In NotificationService.ts
console.log('[Notifications] Debug info:', ...);
```

Check Expo push notification status:

```bash
# Test push notification
curl -H "Content-Type: application/json" \
  -X POST "https://exp.host/--/api/v2/push/send" \
  -d '{
    "to": "ExponentPushToken[xxx]",
    "title": "Test",
    "body": "Test notification"
  }'
```

## 🔄 Migration from Old System

The old invoice-based notification system (`djangoIntegration.ts`) has been deprecated and replaced with EasyAgent-specific notifications. If you see references to invoice notifications, they should be updated to use the new system.

**Old (deprecated):**

```typescript
import { notifyInvoiceCreatedToServer } from "./djangoIntegration";
```

**New:**

```typescript
import { onPhoneNumberAdded } from "./notifications/notificationHelpers";
```

## 📚 Additional Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Push Notification Guide](https://docs.expo.dev/push-notifications/overview/)
- Django Backend: `backend/easyagent/views/notification_views.py`

## ✅ Current Integration Status

- ✅ Phone number purchases
- ✅ Agent creation
- ✅ Agent updates
- ✅ Appointment scheduling
- ✅ Appointment reminders
- ⚠️ Call completions (handled by backend automatically)
- ✅ Notification preferences UI
- ✅ Backend sync
- ✅ Test notifications
