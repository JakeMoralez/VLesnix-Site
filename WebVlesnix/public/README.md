<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Vlesnix Guard Web App

This is the web server for the Vlesnix Guard Discord bot.

## Run Locally

**Prerequisites:**  Node.js

1.  **Install dependencies:**
    Make sure you have a `package.json` file in your root directory. Then run the following command in your terminal:
    ```bash
    npm install
    ```

2.  **Configure environment variables:**
    Create a file named `.env` in the root directory and add the following variables. Replace the placeholder values with your actual credentials.

    ```env
    DISCORD_BOT_TOKEN=your_bot_token_here
    DISCORD_CLIENT_ID=your_client_id_here
    DISCORD_CLIENT_SECRET=your_client_secret_here
    SESSION_SECRET=a_long_random_string_for_sessions
    ```

3.  **Run the app:**
    ```bash
    node server.js
    ```
    Or if you are using the `package.json` provided:
    ```bash
    npm start
    ```
The server will be available at `http://localhost:3000`.
