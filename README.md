# DocChat Appointment Booking System

A real-time appointment booking system using a FastAPI WebSocket backend and a React frontend, integrated with Twilio WhatsApp for confirmation and cancellation.

## Overview

DocChat is a medical appointment booking application that allows users to:

- Interact with an AI-powered chatbot to book appointments with doctors based on symptoms.
- Receive booking details via WhatsApp, with options to confirm or cancel appointments by replying.
- View today’s appointments via a REST API endpoint (admin feature).

The backend is built with FastAPI, uses SQLAlchemy for database management, and integrates Google’s Gemini LLM for doctor selection. The frontend is a React-based chat interface communicating over WebSocket.

## Features

- **Chatbot**: Guides users through booking (name, phone, address, date, symptoms).
- **Doctor Selection**: AI-driven selection based on symptoms and availability.
- **WhatsApp Integration**: Sends booking details with confirmation/cancellation options.
- **WebSocket**: Real-time chat between frontend and backend.
- **REST API**: Endpoints for health checks, manual confirmation, and today’s appointments.
- **Database**: Stores appointments with confirmation and visit status.

## Prerequisites

- **Python 3.9+**: For the backend.
- **Node.js 16+**: For the frontend.
- **Twilio Account**: For WhatsApp messaging (Account SID, Auth Token, WhatsApp-enabled number).
- **Google API Key**: For Gemini LLM integration.
- **Database**: SQLite (default) or another SQLAlchemy-supported DB.

## Setup

### Backend

1. **Clone the Repository**:

### Frontend

1. **Navigate to client**:

   ```bash
   cd ../frontend
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Run the Frontend**:

   ```bash
   npm start
   ```

   Opens at http://localhost:3000.

### Database

The backend auto-creates tables (Base.metadata.create_all) in SQLite by default. However, when using PostgreSQL, ensure the database is properly initialized. With Docker, PostgreSQL is pre-configured.

## Running with Docker

To run the backend with Docker, use the `docker-compose.yml` file located in the `server` directory.

1. **Navigate to the server directory**:

   ```bash
   cd server
   ```

2. **Run Docker Compose**:

   ```bash
   docker compose up --build
   ```

This will start the FastAPI backend, PostgreSQL database, and PgAdmin for database management.

## Usage

Follow the chatbot prompts, receive appointment details via WhatsApp, and confirm/cancel appointments by replying.



