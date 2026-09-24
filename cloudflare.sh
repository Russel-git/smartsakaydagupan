#!/bin/bash

# Cloudflare Tunnel setup for SmartSakay Dagupan
# This script starts three HTTP2 tunnels for the backend, admin UI, and commuter UI.
# Make sure you have cloudflared installed (npm package) or the binary available.

# Backend (Node/Express) listening on port 5000
npx -y cloudflared tunnel --protocol http2 --url http://localhost:5000 &
# Admin frontend (Vercel preview) listening on port 3001
npx -y cloudflared tunnel --protocol http2 --url http://localhost:3001 &
# Commuter frontend (Vercel preview) listening on port 8081
npx -y cloudflared tunnel --protocol http2 --http-host-header localhost:8081 --url http://localhost:8081 &

wait
