# Video Conferencing App (Test Repo)
A testing repo for a video conferencing application with in-session recording.
Supports up to 5 peers per room, screen sharing, and private chat.

# Main Functionality
- Recording per peer (each clip is separate)
- Handles dynamic join/leave during a call
- Screen sharing recording
- Private chat per room

# Note: 
- Right now only per-peer recording is implemented.
- Post-processing with FFmpeg (merging + layout per room) will be added later.

# Tech Stack
- Mediasoup (SFU)
- FFmpeg (recording)
- Next.js
- Node.js + Express

# Setup
- Clone the repo
- Create .env:
  - server : ANNOUNCED_IP= your IPV4
  - client : NEXT_PUBLIC_SERVER_URL=http://localhost:8080
- Build client:
  - cd client
  - npm install
  - npm run build
- Build server:
  - cd server
  - npm install
  - npm run build
- Run (Dev Mode)
  - Client:
    - cd client
    - npm run dev
  - Server:
    - cd server
    - npm run dev
