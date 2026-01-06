# 🎲 Loto: Family Multiplayer Bingo

A modern, polished, and chaotic implementation of the classic European Loto game. Built with Next.js, Socket.io, and TailwindCSS.

![Loto Game](public/og-image.jpg)

## ✨ Features

### 🎮 Gameplay
*   **Multiplayer**: Real-time Host vs Players via WebSockets.
*   **Host Mode**: Dedicated controls to call numbers, manage lobby, and pause game.
*   **Sabotage System**: Spice up the game!
    *   ❄️ **Freeze**: Stop a player from marking for 5s.
    *   🐙 **Ink Splat**: Cover their screen in ink.
    *   🌀 **Chaos Shuffle**: Scramble their ENTIRE board (barrrels included!).
*   **Crazy Mode**: Cards shuffle automatically on every correct mark!

### 🏆 Competition
*   **Live Leaderboard**: Track who is the Loto Champion.
*   **Scoring**: Points for winning (1000), Flats (100-300), and First-Claim bonuses.
*   **Medals**: Gold, Silver, Bronze rankings.

### 🎨 Polish & Accessibility
*   **"Grandma-friendly" UI**: Huge, extra-bold numbers for maximum readability.
*   **Juicy Visuals**: Screen shake, stamping animations, partial effects.
*   **Battery Saver**: Optimized rendering for long family sessions.
*   **Responsive**: Works on Phones, Tablets, and Laptops.

## 🚀 Getting Started

1.  **Install**: `npm install`
2.  **Run**: `npm run dev`
3.  **Play**: Open `http://localhost:3000`
    *   One device acts as **Host**.
    *   Others join via **Room Code**.

## 🛠️ Tech Stack
*   **Frontend**: Next.js 15, React, TailwindCSS, Framer Motion (ish)
*   **Backend**: Custom Node.js Server (Socket.io)
*   **Deployment**: Ready for Render.com

---
*Created for Family Game Night 2026*
