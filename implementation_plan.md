# Implementation Plan: Pre-Configured Rooms & Owner-Driven Room Allocation

Eliminate arbitrary room text input on student signup. Let PG Owners configure building blocks and rooms with a **Smart 10-Second Room Generator**, and give Owners full authority to allocate verified available rooms when approving student enrollment requests.

---

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decision**:
> 1. **Student Registration**: Students will NO LONGER enter or choose a room number during signup. They submit their Name, Email, Password, Phone, PG, and Join Passcode. Their room status starts as `Unassigned`.
> 2. **Owner Approval & Room Allotment**: When an Owner reviews a student's pending enrollment in `TenantModal`, the Owner selects an available room from a live dropdown (showing current occupancy e.g. `Room 101 (1/2 beds)`) and clicks **`[ ✓ Assign Room & Approve ]`**.
> 3. **Smart Room Manager**: Owners get a dedicated **Rooms Hub** to configure floors, blocks/wings, and room capacity using either an automated generator or custom room additions.

---

## Proposed Changes

### Backend (Data Model & Endpoints)

#### [MODIFY] [PG.js](file:///c:/Users/lucky/OneDrive/Documents/Assignment/server/src/models/PG.js)
- Add `rooms` subdocument array to `pgSchema`:
  - `roomNumber`: String (required, uppercase, trim)
  - `block`: String (optional, e.g. "Block A")
  - `floor`: Number (default: 1)
  - `capacity`: Number (default: 2 beds)

#### [MODIFY] [authController.js](file:///c:/Users/lucky/OneDrive/Documents/Assignment/server/src/controllers/authController.js)
- In `registerTenant`: Remove `roomNumber` from required payload validation. Default new student's `roomNumber` to `'Unassigned'`.

#### [MODIFY] [tenantController.js](file:///c:/Users/lucky/OneDrive/Documents/Assignment/server/src/controllers/tenantController.js)
- In `approveTenant`: Accept `assignedRoomNumber` in request body. Require room assignment before approving. Update student's `roomNumber` and save.
- In `getTenants`: Return room occupancy statistics alongside tenant listings.

#### [MODIFY] [pgController.js](file:///c:/Users/lucky/OneDrive/Documents/Assignment/server/src/controllers/pgController.js) & [pgRoutes.js](file:///c:/Users/lucky/OneDrive/Documents/Assignment/server/src/routes/pgRoutes.js)
- Add `getRooms`: returns all rooms with live occupancy counts and resident names.
- Add `generateRooms`: Bulk generator accepting `{ block, floors, roomsPerFloor, capacity }` to create clean room sequences (e.g. `101-105`, `201-205`, or `A-101` etc.) without manual typing.
- Add `addRoom`: Add single custom room.
- Add `deleteRoom`: Delete unoccupied room.

---

### Frontend (Client Experience)

#### [MODIFY] [api.js](file:///c:/Users/lucky/OneDrive/Documents/Assignment/client/src/services/api.js)
- Add `getRooms`, `generateRooms`, `addRoom`, `deleteRoom`.
- Update `approveTenant(id, { roomNumber })` to pass allocated room.

#### [MODIFY] [AuthPage.jsx](file:///c:/Users/lucky/OneDrive/Documents/Assignment/client/src/pages/AuthPage.jsx)
- Remove `Room Number` text field from the Student Sign Up form.
- Add a helpful notice: *"Room allocation will be assigned by PG management upon enrollment approval."*

#### [MODIFY] [TenantPendingBanner.jsx](file:///c:/Users/lucky/OneDrive/Documents/Assignment/client/src/components/TenantPendingBanner.jsx)
- Display *"Room: Awaiting Owner Allocation"* when `roomNumber === 'Unassigned'`.

#### [MODIFY] [TenantModal.jsx](file:///c:/Users/lucky/OneDrive/Documents/Assignment/client/src/components/TenantModal.jsx)
- In **Pending Approvals** tab:
  - Add room selector dropdown for each pending request showing available rooms and vacancies (e.g. `Room 101 (1/2 beds)`).
  - Update approve button to **`[ ✓ Allocate Room & Approve ]`**.
- Add a 4th tab: **`🏢 Room Manager`**:
  - Shows visual room cards with occupancy status (vacant, partially filled, full).
  - Includes **⚡ 10-Second Room Generator** for blocks/floors.
  - Allows manual room creation and bed capacity settings.

---

## Verification Plan

### Automated Tests
- Scripted registration of a student without room number -> verifies `roomNumber: 'Unassigned'`.
- Room generator execution -> verifies bulk creation of rooms in MongoDB.
- Owner approval with room allocation -> verifies student `inviteStatus: 'accepted'` and `roomNumber: '101'`.
- Vite build verification (`npm run build`).

### Manual Testing
- Open AuthPage on mobile/desktop: register student, confirm no room field requested.
- Open Dashboard as Owner: open Room Manager, generate rooms, approve student with room allocation, verify student account.
