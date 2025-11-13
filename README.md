
# Agora Workshop Template

A streamlined workshop template built on top of Agora RTC Web SDK 4.x examples. It includes a redesigned Basic Video Call page and a simplified developer console for quick demos and hands-on workshops.

## Table of Contents
- Prerequisites
- Getting Started
- Usage (Basic Video Call)
- Try It Out (Customization)
- Troubleshooting
- Project Structure
- Useful References
- License

## Prerequisites
- Node.js (LTS recommended)
- npm or yarn

## Getting Started
1. Install dependencies:
   ```bash
   npm install \\ or yarn 
   ```
2. Copy and edit environment file
   ```bash
    cp .env.example .env
   ```
   - `AGORA_APPID=your_agora_appid` 
   - `AGORA_APPCERTIFICATE=your_agora_appcertificate` 
   - `AGORA_REST_KEY=your_agora_restfulkey` 
   - `AGORA_REST_SECRET=your_agora_restfulsecret` 
   - `GROQ_KEY=your_groq_key` 
   - `TTS_MINIMAX_KEY=your_tts_key`
   - `TTS_MINIMAX_GROUPID=your_tts_groupid`
   - `AVATAR_AKOOL_KEY=your_akool_key`

   If you have all the keys required, skip to <b>Step 7</b>

3. Set Up Agora Account:
   - Register or Login Agora Console: https://console.agora.io/
   - Create a new Project with "Testing Mode: APP ID".
   - Enable Conversational AI Engine.
   - Get the APP ID and save it for later use.
   - Generate a temporary token for channel "10000" in the console
   - Go Developer Toolkit → RESTful API and download the Key and Secret. 
   - Replace the Secret and Key in the code with the actual values in the .env file.
      - AGORA_APPID="your_agora_appid" 
      - AGORA_REST_KEY="your-restful-api-key"
      - AGORA_REST_SECRET="your-restful-api-secret"
      - AGORA_TOKEN="your token from the console"
4. Set Up LLM Account (Groq):
   - Register or Login Groq Console. https://console.groq.com/
   - Go to Groq console and generate a API key 
   - Replace the API key in the code with the actual values in the .env file.
      GROQ_KEY="your-llm-key"
5. Set Up TTS Account (Minimax):
   - Register or Login Minimax Console. https://www.minimax.io/platform/user-center/basic-information
   - Generate the API Key. https://www.minimax.io/platform/user-center/basic-information/interface-key
   - Replace the GroupID and Key in the code with the actual values in the .env file.
      TTS_MINIMAX_GROUPID="your-minimax-groupid"
      TTS_MINIMAX_KEY="your-tts-key"
6. Set Up Avatar Account (Akool):
   - Register or Login Akool Console.https://akool.com/ (A test key will be provided in the workshop.)
   - Replace Key in the code with the actual value in the .env file.
      AVATAR_AKOOL_KEY="your-akool-secret"
   - Pick an Avatar ID from Akool Console. (A test avatar ID will be provided in the workshop.) (in index.js)
      avatar_id="your-avatar-ID"
7. Start the local server:
   ```bash
   npm run dev  \\ or yarn dev
   ```
   - The terminal prints a URL like `http://localhost:${actualPort}/example/basic/basicVideoCall/index.html`.
   - Optional: set a fixed port (macOS/Linux): `PORT=3001 npm run dev`
8. Open the app:
   - Visit the printed URL.

## Usage (Basic Video Call)
- Step 0: RTC Configuration — set Channel, User ID, and Token (optional)
- Step 1: Create AgoraRTC Client — click "Create Client"
- Step 2: Join Channel — click "Join Channel"
- Step 3: Create Track & Publish — click "Create Tracks and Publish"
- Step 4: Subscribe & Play — pick a remote UID (if available), then subscribe and play
- Step 5: Click "Leave Channel" when finished


## Try It Out (Customization)
1. Customize the Agent Voice
   - Integrate your preferred TTS provider and voice configuration.
2. Customize the Avatar
   - Integrate your preferred Avatar provider and avatar configuration.
3. Customize the LLM
   - Integrate your preferred LLM provider and prompt configuration.   
4. Customize the UI & Styles
   - Edit `src/example/basic/basicVideoCall/index.html` to change overlay text (e.g., the welcome title), layout, or logo.
   - Update CSS for the remote/local video containers (e.g., sizing, positioning, object-fit) to match your desired look.

## Troubleshooting
- Video doesn’t fill the big window:
  - Check the remote container sizing in `src/example/basic/basicVideoCall/index.html` and ensure `object-fit: cover` is applied to the video/canvas elements.
- No remote video appears:
  - Confirm the remote user is publishing and the channel name matches.
  - Use "Subscribe & Play" after a remote UID is available.
- Token errors:
  - Ensure token generation parameters (appid, channel, uid) match your configuration and that the token hasn’t expired.
- Camera/microphone not working:
  - Allow browser permissions for camera/mic.
  - Check device selection and availability.
- Dynamic port confusion:
  - The dev server chooses a free port automatically. Set a fixed port with `PORT=3001 npm run dev` if needed.

## Notes: Browser & Autoplay
- Use a modern browser (latest Chrome, Edge, Safari, or Firefox).
- Autoplay restrictions may prevent immediate playback. If video doesn’t start, click the page or an action button to resume.

## Project Structure (key parts)
- `src/assets`: static assets (logos, CSS/JS vendor files)
- `src/common`: shared styles and utilities
- `src/example/basic`: Basic Video Call page (HTML/JS)
- `src/i18n`: language packs and loader
- `scripts/server.js`: simple static server (prints a dynamic port on start)

## Useful References
- https://docs.agora.io/en/conversational-ai/get-started/quickstart
- https://docs.agora.io/en/conversational-ai/models/avatar/akool

## License
ISC


