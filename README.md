# ParkSpot

A full-stack, real-time parking platform that lets drivers share and claim open parking spots on a live satellite map. When someone is leaving a spot, they drop a pin; every connected user sees it appear instantly and can claim it before it expires.


<!-- Add a screenshot here, e.g. ![ParkSpot map view](docs/screenshot.png) -->

---

## Features

- **Live, real-time map.** New and claimed spots are broadcast to every connected user over WebSockets (Socket.io), so the map and spot list stay in sync without refreshing.
- **"I'm Leaving" and Click Mode.** Share a spot by clicking its location on the map with Click Mode on.
- **Claim a spot.** Any user can claim an available spot; it is removed for everyone immediately.
- **Automatic expiry.** Each shared spot expires after 5 minutes, with a countdown timer in the spot list, so stale spots never pile up.
- **Satellite imagery.** An interactive Leaflet map with high-resolution Esri satellite tiles makes it easy to identify parking in dense areas.
- **User accounts.** Register and log in with email and password. Passwords are hashed with bcrypt, and sessions use JSON Web Tokens (JWT).
- **User stats and reputation.** Tracks spots shared, spots claimed, and a reputation score for each user.
- **AI photo verification.** Users can upload a photo of a spot, and a TensorFlow.js (COCO-SSD) object-detection model checks it on the server.
- **Analytics endpoint.** Aggregated usage data and spot history are available through an API route.
- **Toast notifications.** Pop-up messages confirm actions such as spots added, claimed, or expired.
- **Demo mode.** On server start, 8 mock spots are generated so the app is easy to demo.

---

<img width="1407" height="817" alt="Screenshot 2026-10-14 at 5 57 52 PM" src="https://github.com/user-attachments/assets/a5eab0b7-c857-417c-bc49-172141f9386a" />
<img width="1510" height="893" alt="Screenshot 2026-10-14 at 5 47 01 PM" src="https://github.com/user-attachments/assets/aa6f8d88-6baa-4669-825e-2ba283f0cacd" />
<img width="1404" height="811" alt="Screenshot 2026-10-14 at 5 58 36 PM" src="https://github.com/user-attachments/assets/bc275deb-d45a-4256-85bf-f3f65d2710a0" />




## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React, Leaflet, Socket.io, CSS, HTML |
| **Backend** | Node.js, Express, Socket.io |
| **Database** | SQLite |
| **Authentication** | JSON Web Tokens, bcrypt |
| **AI / ML** | TensorFlow.js for Node (`@tensorflow/tfjs-node`), COCO-SSD (`@tensorflow-models/coco-ssd`) |
| **Mapping** | Leaflet with Esri World Imagery |

### How each piece is used

- **React** renders the map, spot list, controls, login screen, and toast notifications as components (`Map`, `SpotList`, `Controls`, `Auth`, `Toast`).
- **Leaflet / React Leaflet** displays the interactive satellite map and spot markers.
- **Socket.io** carries real-time events between the server and every client (`initialSpots`, `addSpot`, `spotAdded`, `claimSpot`, `spotRemoved`).
- **Express** exposes the REST API for registration, login, user profiles, spots, analytics, and photo verification.
- **SQLite** stores users, active spots, and spot history in a local `parkspot.db` file.
- **JWT and bcrypt** handle secure sign-in: passwords are hashed before storage, and a signed token identifies the user after login.
- **Multer** accepts photo uploads and saves them to the `uploads/` folder, which the server serves statically.
- **TensorFlow.js with COCO-SSD** analyzes uploaded photos on the server to verify that they show a valid parking spot.

---


```

**1. Start the client**

```bash
cd client
npm install
npm start
```

The app opens at **http://localhost:3000**.

> The server only accepts Socket.io connections from `http://localhost:3000`, so keep the client on port 3000.

### Using the app

1. Register an account or log in.
2. Turn on **Click Mode**, then click the map to place a spot, or press **I'm Leaving** to share one.
3. Open the **Spots** panel to see active spots and their countdown timers.
4. Press **Claim** on a spot to take it. It disappears for all users right away.

---

## API Reference

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/register` | Create an account (`email`, `password`, `name`); returns a JWT |
| `POST` | `/api/login` | Log in; returns a JWT and user stats |
| `GET` | `/api/user/:id` | Get a user's profile |
| `GET` | `/api/spots` | List active spots |
| `POST` | `/api/verify-photo` | Upload a photo (`photo` field) for AI verification |
| `GET` | `/api/analytics` | Usage analytics and spot history |

### Socket.io events

| Event | Direction | Purpose |
| --- | --- | --- |
| `initialSpots` | server to client | Sends all active spots to a newly connected user |
| `addSpot` | client to server | A user shares a new spot |
| `spotAdded` | server to all clients | Broadcasts a new spot |
| `claimSpot` | client to server | A user claims a spot |
| `spotRemoved` | server to all clients | A spot was claimed or expired |

---

---

## Future Improvements

- Deploy the app to the cloud with a hosted database
- Use device geolocation to center the map and show nearby spots
- Add push notifications for spots near the user
- Add automated tests for the API and Socket.io events

---
