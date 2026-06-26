## Folder Structure (`src`)

```text
src
├── navigation
│   ├── DriverSettingsStack.tsx
│   ├── DriverTabs.tsx
│   ├── PassengerSettingsStack.tsx
│   ├── PassengerTabs.tsx
│   ├── RootNavigator.tsx
│   └── types.ts
└── pages
    ├── auth
    │   ├── DriverSignUpBus.tsx
    │   ├── DriverSignUpDetails.tsx
    │   ├── Login.tsx
    │   ├── LoginScreen.tsx
    │   └── PassengerSignUp.tsx
    ├── driver
    │   ├── ActiveTrip.tsx
    │   ├── Community.tsx
    │   ├── Home.tsx
    │   └── Route.tsx
    ├── passenger
    │   ├── Home.tsx
    │   └── Track.tsx
    └── settings
        ├── EditLocations.tsx
        ├── EditProfile.tsx
        ├── NotificationPrefs.tsx
        ├── SettingsHome.tsx
        ├── ShiftTimes.tsx
        ├── TripHistory.tsx
        └── VehicleDetails.tsx

```

---

## File Descriptions

### 🗺️ Navigation (`navigation/`)

* **`types.ts`** - All route param type definitions for every navigator. Single source of truth for navigation types.
* **`RootNavigator.tsx`** - Top-level navigator. Reads auth state and decides whether to show auth screens, driver tabs, or passenger tabs.
* **`DriverTabs.tsx`** - Bottom tab navigator for drivers. 4 tabs: Home, Route, Community, Settings.
* **`PassengerTabs.tsx`** - Bottom tab navigator for passengers. 3 tabs: Home, Track, Settings.
* **`DriverSettingsStack.tsx`** - Stack navigator nested inside the driver Settings tab. Handles pushing sub-screens like Edit Profile, Vehicle Details, Shift Times.
* **`PassengerSettingsStack.tsx`** - Same as above but for passengers. Has Edit Locations instead of Vehicle Details and Shift Times.

### 🔐 Authentication (`pages/auth/`)

* **`Login.tsx`** - Email + password login form. On success, Firebase auth state change handles redirect automatically.
* **`PassengerSignUp.tsx`** - Passenger registration form. Collects name, phone, email, password. Creates Firebase auth user and writes to Firestore `users/` with `role: 'passenger'`.
* **`DriverSignUpDetails.tsx`** - Step 1 of driver registration. Collects personal details (name, phone, email, password).
* **`DriverSignUpBus.tsx`** - Step 2 of driver registration. Collects vehicle info (name, plate number, capacity). Creates the `buses/` document and `communities/` document in Firestore.

### 🚙 Driver Screens (`pages/driver/`)

* **`Home.tsx`** - Driver's main screen. Shows today's attendance summary for both shifts side by side. Lists confirmed passengers for the active shift. Start Trip button fixed at bottom.
* **`Route.tsx`** - Pre-trip map preview. Shows all confirmed stops plotted on map in optimised order with a stop list below. Becomes the entry point to `ActiveTrip`.
* **`Community.tsx`** - Manage the driver's community. Lists all members, shows the QR code invite, allows removing passengers.
* **`ActiveTrip.tsx`** - Full-screen navigation screen. Pushes above the tab navigator so bottom nav hides. Shows live map with stop markers, next passenger card, and Mark as Picked Up button.

### 🧑‍🤝‍🧑 Passenger Screens (`pages/passenger/`)

* **`Home.tsx`** - Passenger's main screen. Two attendance cards (morning and evening), each with a Present/Absent toggle and cutoff time. Shows confirmation timestamp after marking.
* **`Track.tsx`** - Live tracking screen. Shows driver's location on map, highlights passenger's own stop, displays ETA prominently. Shows empty state when no trip is active.

### ⚙️ Settings (`pages/settings/`)

* **`SettingsHome.tsx`** - Settings menu screen for both roles. Lists available options as tappable rows. Options shown differ by role (driver sees Vehicle Details and Shift Times; passenger sees Edit Locations).
* **`EditProfile.tsx`** - Shared by both roles. Edit name and phone number. Saves to Firestore `users/{uid}`.
* **`EditLocations.tsx`** - Passenger only. Set pickup and dropoff locations via map picker or address search. Saved per community.
* **`VehicleDetails.tsx`** - Driver only. Edit vehicle name, plate number, capacity. Saves to Firestore `buses/{busId}`.
* **`ShiftTimes.tsx`** - Driver only. Set morning and evening attendance cutoff times via time picker. Saves to the community document.
* **`NotificationPrefs.tsx`** - Both roles. Toggle individual notification types (attendance reminder, trip started, driver approaching, new passenger joined).
* **`TripHistory.tsx`** - Both roles. Shows past trips. Stub screen for now — displays "Coming soon". Full implementation deferred to a future sprint.

```

```
