AgoraRTC.enableLogUpload();

var client;
var localTracks = {
  videoTrack: null,
  audioTrack: null,
};
var currentMic = null;
var currentCam = null;
var mics = [];
var cams = [];
var remoteUsers = {};
//var options = getOptionsFromLocal();
var options = {};
var curVideoProfile;
var agoraConvoTaskID = "";

// All keys
// WARNING: Testing purposes only. Do NOT expose your RESTful API Key and Secret in production environment.
let agora_AppID = null;
let agora_Token = null; // 
let llm_Aws_Bedrock_Key = null;
let tts_Minimax_Key = null;
let tts_Minimax_GroupID = null;
let avatar_Akool_Key = null;
let openai_Key = null;
let groq_Key = null;

// load safe config from server endpoint
async function loadClientConfig() {
  try {
    const res = await fetch("/config");
    if (!res.ok) throw new Error("Failed to fetch /config");
    const cfg = await res.json();
    agora_AppID = cfg.AGORA_APPID || null;
    agora_Token = cfg.AGORA_TOKEN || null;
    // only set safe values client-side; do not set secrets here
    if (agora_AppID) options.appid = agora_AppID;
    llm_Aws_Bedrock_Key = cfg.LLM_AWS_BEDROCK_KEY || null;
    openai_Key = cfg.OPENAI_KEY || null;
    groq_Key = cfg.GROQ_KEY || null;

    tts_Minimax_Key = cfg.TTS_MINIMAX_KEY || null;
    tts_Minimax_GroupID = cfg.TTS_MINIMAX_GROUPID || null;
    avatar_Akool_Key = cfg.AVATAR_AKOOL_KEY || null;

    options.token = cfg.AGORA_TOKEN || null;
   
    const inputElement = document.getElementById('token');
    inputElement.value = options.token;

    console.log("Client config loaded");
  } catch (e) {
    message.error("Missing or invalid client config; see console for details.");
    console.warn("Could not load client config:", e);
  }
}

loadClientConfig();

AgoraRTC.onAutoplayFailed = () => {
  alert("click to start autoplay!");
};

AgoraRTC.onMicrophoneChanged = async (changedDevice) => {
  // When plugging in a device, switch to a device that is newly plugged in.
  if (changedDevice.state === "ACTIVE") {
    localTracks.audioTrack.setDevice(changedDevice.device.deviceId);
    // Switch to an existing device when the current device is unplugged.
  } else if (
    changedDevice.device.label === localTracks.audioTrack.getTrackLabel()
  ) {
    const oldMicrophones = await AgoraRTC.getMicrophones();
    oldMicrophones[0] &&
      localTracks.audioTrack.setDevice(oldMicrophones[0].deviceId);
  }
};

AgoraRTC.onCameraChanged = async (changedDevice) => {
  // When plugging in a device, switch to a device that is newly plugged in.
  if (changedDevice.state === "ACTIVE") {
    localTracks.videoTrack.setDevice(changedDevice.device.deviceId);
    // Switch to an existing device when the current device is unplugged.
  } else if (
    changedDevice.device.label === localTracks.videoTrack.getTrackLabel()
  ) {
    const oldCameras = await AgoraRTC.getCameras();
    oldCameras[0] && localTracks.videoTrack.setDevice(oldCameras[0].deviceId);
  }
};

$("#step-join").attr("disabled", true);
$("#step-publish").attr("disabled", true);
$("#step-subscribe").attr("disabled", true);
$("#step-leave").attr("disabled", true);

$(".mic-list").change(function (e) {
  switchMicrophone(this.value);
});

$(".cam-list").change(function (e) {
  switchCamera(this.value);
});

$("#step-create").click(function (e) {
  createClient();
  addSuccessIcon("#step-create");
  message.success("Create client success!");
  $("#step-create").attr("disabled", true);
  $("#step-join").attr("disabled", false);
});

$("#step-join").click(async function (e) {
  try {
    console.log("*** Join ****");
    options.channel = $("#channel").val();
    
    console.log("**** channel ***",options.channel);
    options.uid = Number($("#uid").val());
    const token = $("#token").val();
    if (token) {
      options.token = token;
    } else {
      //options.token = await agoraGetAppData(options);
    }
    await join();
    // setOptionsToLocal(options);
    addSuccessIcon("#step-join");
    message.success("Join channel success!");
    $("#step-join").attr("disabled", true);
    $("#step-publish").attr("disabled", false);
    $("#step-subscribe").attr("disabled", false);
    $("#step-leave").attr("disabled", false);
    $("#mirror-check").attr("disabled", false);
  } catch (error) {
    if (error.code === "CAN_NOT_GET_GATEWAY_SERVER") {
      return message.error("Token parameter error,please check your token.");
    }
    message.error(error.message);
    console.error(error);
  }
});

$("#step-publish").click(async function (e) {
  await createTrackAndPublish();
  addSuccessIcon("#step-publish");
  message.success("Create tracks and publish success!");
  initDevices();
  $("#step-publish").attr("disabled", true);
  $("#mirror-check").attr("disabled", true);
  // agora content inspect start
  // agoraContentInspect(localTracks.videoTrack);
  // agora content inspect end ;
});

$("#step-subscribe").click(function (e) {
  const uid = 10002; // hardcoded remote UID
  const user = remoteUsers[uid];
  if (!user) {
    return message.error(`User:${uid} not found!`);
  }
  const audioCheck = $("#audio-check").prop("checked");
  const videoCheck = $("#video-check").prop("checked");
  if (audioCheck) {
    subscribe(user, "audio");
  }
  if (videoCheck) {
    subscribe(user, "video");
  }
  addSuccessIcon("#step-subscribe");
  message.success("Subscribe and Play success!");
});

$("#step-leave").click(async function (e) {
  await leave();
  message.success("Leave channel success!");
  removeAllIcons();
  $("#local-player-name").text("");
  $("#join").attr("disabled", false);
  $("#leave").attr("disabled", true);
  $("#step-leave").attr("disabled", true);
  $("#step-join").attr("disabled", true);
  $("#step-publish").attr("disabled", true);
  $("#step-subscribe").attr("disabled", true);
  $("#mirror-check").attr("disabled", true);
  $("#step-create").attr("disabled", false);
  $("#remote-playerlist").html("");
  $("#remote-uid-select option:not([disabled])").remove();
  $("#remote-uid-select").val("");
});

function createClient() {
  // create Agora client
  client = AgoraRTC.createClient({
    mode: "rtc",
    codec: "vp8",
  });
}

async function createTrackAndPublish() {
  // create local audio and video tracks
  const tracks = await Promise.all([
    AgoraRTC.createMicrophoneAudioTrack({
      encoderConfig: "music_standard",
    }),
    AgoraRTC.createCameraVideoTrack(),
  ]);
  localTracks.audioTrack = tracks[0];
  localTracks.videoTrack = tracks[1];
  // play local video track
  localTracks.videoTrack.play("local-player", {
    mirror: $("#mirror-check").prop("checked"),
  });
  $("#local-player-name").text(`uid: ${options.uid}`);
  // publish local tracks to channel
  await client.publish(Object.values(localTracks));
}

/*
 * Join a channel, then create local video and audio tracks and publish them to the channel.
 */
async function join() {
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);
  client.on("user-left", handleUserLeft);

  // start Proxy if needed
  const mode = Number(options.proxyMode);
  if (mode != 0 && !isNaN(mode)) {
    client.startProxyServer(mode);
  }

  options.uid = await client.join(
    options.appid,
    options.channel,
    options.token || null,
    options.uid || null
  );
}

/*
 * Stop all local and remote tracks then leave the channel.
 */
async function leave() {
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if (track) {
      track.stop();
      track.close();
      localTracks[trackName] = undefined;
    }
  }
  // Remove remote users and player views.
  remoteUsers = {};
  // leave the channel
  await client.leave();
  await stopAgoraConvoAI();
}

/*
 * Add the local use to a remote channel.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to add.
 * @param {trackMediaType - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/itrack.html#trackmediatype | media type} to add.
 */
async function subscribe(user, mediaType) {
  const uid = user.uid;
  // subscribe to a remote user
  await client.subscribe(user, mediaType);
  console.log("subscribe success");
  if (mediaType === "video") {
    if ($(`#player-${uid}`).length) {
      return;
    }
    const player = $(`
     <div id="player-wrapper-${uid}">
            <div id="player-${uid}" class="player">
                 <div class="remote-player-name">uid: ${uid}</div>
            </div>
     </div>
    `);
    $("#remote-playerlist").append(player);
    user.videoTrack.play(`player-${uid}`);
  }
  if (mediaType === "audio") {
    user.audioTrack.play();
  }
}

/*
 * Add a user who has subscribed to the live channel to the local interface.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to add.
 * @param {trackMediaType - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/itrack.html#trackmediatype | media type} to add.
 */
function handleUserPublished(user, mediaType) {
  const id = user.uid;
  remoteUsers[id] = user;
  if (!$(`#remote-option-${id}`).length) {
    $("#remote-uid-select").append(
      `<option value="${id}" id="remote-option-${id}">${id}</option>`
    );
    $("#remote-uid-select").val(id);
  }
}

/*
 * Remove the user specified from the channel in the local interface.
 *
 * @param  {string} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to remove.
 */
function handleUserUnpublished(user, mediaType) {
  if (mediaType === "video") {
    const id = user.uid;
    delete remoteUsers[id];
    $(`#player-wrapper-${id}`).remove();
    $(`#remote-option-${id}`).remove();
  }
}

/**
 * Remove the user who has left the channel from the local interface.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link hhttps://api-ref.agora.io/en/voice-sdk/web/4.x/interfaces/iagorartcremoteuser.html | remote user} who left.
 */

function handleUserLeft(user) {
  const id = user.uid;
  delete remoteUsers[id];
  $(`#player-wrapper-${id}`).remove();
  $(`#remote-option-${id}`).remove();
}

async function initDevices() {
  // get mics
  mics = await AgoraRTC.getMicrophones();
  $(".mic-list").empty();
  mics.forEach((mic) => {
    const value = mic.label.split(" ").join("");
    $(".mic-list").append(`<option value=${value}>${mic.label}</option>`);
  });

  const audioTrackLabel = localTracks.audioTrack.getTrackLabel();
  currentMic = mics.find((item) => item.label === audioTrackLabel);
  $(".mic-list").val(audioTrackLabel.split(" ").join(""));

  // get cameras
  cams = await AgoraRTC.getCameras();
  $(".cam-list").empty();
  cams.forEach((cam) => {
    const value = cam.label.split(" ").join("");
    $(".cam-list").append(`<option value=${value}>${cam.label}</option>`);
  });

  const videoTrackLabel = localTracks.videoTrack.getTrackLabel();
  currentCam = cams.find((item) => item.label === videoTrackLabel);
  $(".cam-list").val(videoTrackLabel.split(" ").join(""));
}

async function switchCamera(label) {
  currentCam = cams.find((cam) => cam.label.split(" ").join("") === label);
  // switch device of local video track.
  await localTracks.videoTrack.setDevice(currentCam.deviceId);
}

async function switchMicrophone(label) {
  currentMic = mics.find((mic) => mic.label.split(" ").join("") === label);
  // switch device of local audio track.
  await localTracks.audioTrack.setDevice(currentMic.deviceId);
}

$("#start-convo-ai").click(async function (e) {
  try {
    if (!client || !options.channel)
      return message.error("Please join the channel first!");

    // Build request data according to documentation
    const requestData = {
      name: options.channel,
      properties: {
        channel: options.channel, // Agora Channel
        // token: agora_Token, // Agora token for ConvoAI Agent, not needed if app certificate is disabled
        agent_rtc_uid: "10001", // AI agent user ID
        remote_rtc_uids: ["10000"], // List of remote user IDs to subscribe, use * to subscribe all users
        idle_timeout: 30, // Idle timeout in seconds
        //enable_string_uid: false, // Whether to enable string UID
        advanced_features: {
          enable_aivad: true, // Enable intelligent interruption handling
          enable_mllm: false, // Enable multimodal large language model
          enable_rtm: false, // Enable signaling service
        },
        asr: {
          language: "en-US", // ASR language, e.g., "en-US", "ja-JP", "zh-CN"
          //vendor: "ares", // ASR vendor
        },
        llm: {
          url: "https://api.groq.com/openai/v1/chat/completions",
          api_key: groq_Key,
          system_messages: [
            {
              role: "system",
              content:
                "You are a helpful chat bot. Keep answers short and concise. Only output plain text responses, without any markdown, HTML tags, or emojis. Do not include any formatting symbols. This is a voice-to-voice service.", // Write your system prompt here (e.g. you are a tour guide, you are a math teacher, etc.)
            },
          ],
          greeting_message: "Hello, how are you?", // Do NOT set any greeting message
          failure_message: "Sorry, technical issues prevent me from responding right now.",
          //ignore_empty: true, // Whether to ignore empty user messages
          params: {
            model: "llama-3.3-70b-versatile"
          }
        },
        tts: {
          vendor: "minimax",
          params: {
            url: "wss://api.minimax.io/ws/v1/t2a_v2", // Minimax TTS WebSocket URL
            group_id: tts_Minimax_GroupID, // Minimax group ID, refer to https://www.minimax.io/platform/user-center/basic-information
            key: tts_Minimax_Key, // Minimax TTS key, refer to https://www.minimax.io/platform/user-center/basic-information
            model: "speech-2.6-turbo",
            voice_setting: {
              voice_id: "English_Lively_Male_11", // Select a voice you want https://www.minimax.io/audio/voices
              speed: 1,
              vol: 1,
              pitch: 0,
              emotion: "happy",
            },
            audio_setting: {
              sample_rate: 16000,
            },
          },
          skip_patterns: [3, 4], // Skip content in parentheses and square brackets
        },
        avatar: {
          vendor: "akool",
          enable: true,
          params: {
            api_key: avatar_Akool_Key,
            agora_uid: "10002",
            // agora_token: agora_Token,
            // agora_token: "avatar_rtc_token", // Optional: if Agora app certificate is enabled in the project, provide the token for the avatar here
            //avatar_id: "dvp_Sean_agora", // Available Avatar IDs: dvp_Sean_agora, dvp_Alinna_emotionsit_agora, dvp_Emma_agora, dvp_Dave_agora
            //avater_id: "water_animate_v2",
            avatar_id: "dvp_Sean_agora",
          },
        },
        parameters: { 
        //   data_channel: "rtm", // Agent data transmission through RTM channel or RTC data stream
        //   enable_error_messages: false  // Whether to enable error messages from the agent
        "silence_config" : {
                  "timeout_ms": 10000,
                  "action": "think",
                  "content": "continue conversation"
              } 
        }
      },
    };

    message.info("Starting Agora Convo AI (via server proxy)...");
    const response = await fetch("/api/convo-ai/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || response.statusText);
    }

    const responseData = await response.json();
    agoraConvoTaskID = responseData.agent_id;
    // try { localStorage.setItem("agoraConvoAgentId", agoraConvoTaskID); } catch (e){}

    message.success("Agora Convo AI started successfully!");
    console.log("Agora Convo AI started successfully! ", responseData);

    $("#start-convo-ai").attr("disabled", true);
  } catch (error) {
    message.error(error.message || "Error occurred while starting Convo AI");
    console.error("Convo AI error:", error);
    $("#start-convo-ai").attr("disabled", false);
  }
});

async function stopAgoraConvoAI() {
  try {
    const agentId = agoraConvoTaskID;
    // || localStorage.getItem("agoraConvoAgentId");
    if (!agentId) return message.error("No active agent ID to stop.");

    message.info("Stopping Agora Convo AI (via server proxy)...");
    const res = await fetch(`/api/convo-ai/agents/${agentId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }

    message.success("Agora Convo AI stopped successfully.");
    console.log("stopAgoraConvoAI success");
    agoraConvoTaskID = "";
    //localStorage.removeItem("agoraConvoAgentId");
    $("#start-convo-ai").attr("disabled", false);
  } catch (error) {
    message.error(error.message || "Failed to stop Agora Convo AI");
    console.error("stopAgoraConvoAI error:", error);
  } finally {
    $("#stop-convo-ai").attr("disabled", false);
  }
}
