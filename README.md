# Azure Communication Services IVR Tester with LLM

This project is an automated testing tool for Interactive Voice Response (IVR) systems. It leverages **Azure Communication Services (ACS)** for call automation and **OpenAI's GPT-4** to intelligently interact with the IVR, simulating a real user.

## 🚀 Features

*   **Automated Calling**: Initiates outbound calls to target IVR phone numbers using ACS.
*   **Speech-to-Text**: Transcribes the IVR's voice prompts in real-time.
*   **AI-Driven Interaction**: Uses OpenAI (GPT-4) to analyze the IVR's prompt and determine the best course of action (e.g., navigating menus, answering questions).
*   **Multi-Modal Output**: Supports both DTMF (keypad presses) and Text-to-Speech (voice responses) for interacting with the IVR.
*   **Event-Driven Architecture**: Handles various call events (connected, disconnected, playback completion, etc.) robustly.

## 📋 Prerequisites

Before you begin, ensure you have the following:

1.  **Node.js**: Version 20 or higher is recommended.
2.  **Azure Communication Services Resource**:
    *   You need an ACS resource in your Azure subscription.
    *   Obtain the **Connection String** from the Azure Portal (under "Keys").
3.  **ACS Phone Number**:
    *   You need a phone number acquired through your ACS resource. This will be the "Source" number making the calls.
    *   Ensure the number has "Call" capabilities enabled.
4.  **OpenAI API Key**:
    *   An API key from OpenAI with access to GPT-4 (or GPT-3.5-turbo, though GPT-4 is recommended for better reasoning).
5.  **Publicly Accessible URL (for Callbacks)**:
    *   ACS needs to send webhook events to your running application.
    *   For local development, use a tool like **[ngrok](https://ngrok.com/)** to expose your local port (default 8080) to the internet.

## 🛠️ Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd ivr-tester
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Build the project**:
    ```bash
    npm run build
    ```

## ⚙️ Configuration

1.  Create a `.env` file in the root directory.
2.  Copy the following template and fill in your values:

    ```env
    # Azure Communication Services Connection String
    CONNECTION_STRING="endpoint=https://<your-resource>.communication.azure.com/;accesskey=<your-key>"

    # Public Callback URI (must end in /api/callbacks)
    # If using ngrok, this will look like: https://<random-id>.ngrok-free.app/api/callbacks
    CALLBACK_URI="https://<your-public-url>/api/callbacks"

    # Local port for the server
    PORT=8080

    # OpenAI API Key
    OPENAI_API_KEY="sk-..."

    # The ACS phone number making the call (Must be in E.164 format, e.g., +18005551234)
    SOURCE_PHONE_NUMBER="+18005551234"

    # The IVR phone number you want to test (Must be in E.164 format)
    TARGET_PHONE_NUMBER="+18005559876"
    ```

## 🏃 Usage

### 1. Start the Callback Tunnel (Local Dev)
If running locally, start ngrok to expose port 8080:
```bash
ngrok http 8080
```
Copy the https URL provided by ngrok (e.g., `https://a1b2c3d4.ngrok-free.app`) and update `CALLBACK_URI` in your `.env` file:
```env
CALLBACK_URI="https://a1b2c3d4.ngrok-free.app/api/callbacks"
```

### 2. Run the Application
You can run the application in development mode (using `ts-node`) or production mode.

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

### 3. Using the Dashboard
Once the application is running, you can access the web dashboard to trigger calls manually.

1.  Open your browser and navigate to `http://localhost:8080` (or the port defined in your `.env` file).
2.  Enter the **Target Phone Number** in E.164 format (e.g., `+18005559876`).
3.  Click **Start Call**.

The application will initiate the call and you can monitor the logs in your terminal.

### 4. Auto-Start (Optional)
If you have defined `TARGET_PHONE_NUMBER` in your `.env` file, the application will automatically initiate a call to that number immediately upon startup.

### 5. Execution Flow
Once a call is initiated (either via Dashboard or Auto-Start), the application will:
1.  Start a local Express server to listen for ACS events.
2.  Initiate an outbound call from `SOURCE_PHONE_NUMBER` to `TARGET_PHONE_NUMBER`.
3.  Upon connection (`CallConnected`), it starts listening to the audio.
4.  When speech is recognized (`RecognizeCompleted`), the text is sent to the LLM.
5.  The LLM decides an action:
    *   **DTMF**: Sends tones (e.g., press '1').
    *   **SPEAK**: Uses Text-to-Speech to reply.
    *   **WAIT**: Listens again if the prompt was incomplete.
    *   **HANGUP**: Ends the call.
6.  The loop continues until the call is ended or an error occurs.

## 🏗️ Architecture

*   **`src/index.ts`**: Entry point. Initializes the `CallManager`, `OpenAIClient`, and `IvrTester`.
*   **`src/server.ts`**: Express server setup to handle incoming CloudEvents from ACS.
*   **`src/acs/CallManager.ts`**: Wrapper around `@azure/communication-call-automation`. Handles call creation, media operations (play, recognize, cancel), and event parsing.
*   **`src/llm/OpenAIClient.ts`**: Wrapper around OpenAI API. Contains the prompt engineering logic to convert IVR transcripts into structured actions (JSON).
*   **`src/tester/IvrTester.ts`**: The "Brain" of the operation. It subscribes to `CallManager` events and orchestrates the flow: `Event -> Transcription -> LLM -> Action -> CallManager`.

## 🐛 Troubleshooting

*   **Call fails to start**:
    *   Check if `CONNECTION_STRING` is correct.
    *   Verify `SOURCE_PHONE_NUMBER` is acquired and assigned in your ACS resource.
    *   Ensure phone numbers are in E.164 format (e.g., `+1...`).

*   **No audio / Recognition fails**:
    *   Check `CALLBACK_URI` is reachable from the internet (test it in a browser or curl).
    *   Verify ACS has permissions to reach your endpoint.

*   **LLM Errors**:
    *   Check `OPENAI_API_KEY`.
    *   Review logs for JSON parsing errors if the model output is malformed.

## 📝 License

MIT
