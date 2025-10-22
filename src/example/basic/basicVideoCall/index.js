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
var options = getOptionsFromLocal();
var curVideoProfile;

AgoraRTC.onAutoplayFailed = () => {
  alert("click to start autoplay!");
};

AgoraRTC.onMicrophoneChanged = async (changedDevice) => {
  // When plugging in a device, switch to a device that is newly plugged in.
  if (changedDevice.state === "ACTIVE") {
    localTracks.audioTrack.setDevice(changedDevice.device.deviceId);
    // Switch to an existing device when the current device is unplugged.
  } else if (changedDevice.device.label === localTracks.audioTrack.getTrackLabel()) {
    const oldMicrophones = await AgoraRTC.getMicrophones();
    oldMicrophones[0] && localTracks.audioTrack.setDevice(oldMicrophones[0].deviceId);
  }
};

AgoraRTC.onCameraChanged = async (changedDevice) => {
  // When plugging in a device, switch to a device that is newly plugged in.
  if (changedDevice.state === "ACTIVE") {
    localTracks.videoTrack.setDevice(changedDevice.device.deviceId);
    // Switch to an existing device when the current device is unplugged.
  } else if (changedDevice.device.label === localTracks.videoTrack.getTrackLabel()) {
    const oldCameras = await AgoraRTC.getCameras();
    oldCameras[0] && localTracks.videoTrack.setDevice(oldCameras[0].deviceId);
  }
};

$("#step-join").attr("disabled", true);
$("#step-publish").attr("disabled", true);
$("#step-subscribe").attr("disabled", true);
$("#step-leave").attr("disabled", true);
$("#remote-uid-select").val("");

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
    options.channel = $("#channel").val();
    options.uid = Number($("#uid").val());
    const token = $("#token").val();
    if (token) {
      options.token = token;
    } else {
      options.token = await agoraGetAppData(options);
    }
    await join();
    setOptionsToLocal(options);
    addSuccessIcon("#step-join");
    message.success("Join channel success!");
    $("#step-join").attr("disabled", true);
    $("#step-publish").attr("disabled", false);
    $("#step-subscribe").attr("disabled", false);
    $("#step-leave").attr("disabled", false);
    $("#mirror-check").attr("disabled", false);
  } catch (error) {
    if (error.code === 'CAN_NOT_GET_GATEWAY_SERVER') {
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
  agoraContentInspect(localTracks.videoTrack);
  // agora content inspect end ;
});

$("#step-subscribe").click(function (e) {
  const uid = $("#remote-uid-select").val();
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
    options.uid || null,
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
    $("#remote-uid-select").append(`<option value="${id}" id="remote-option-${id}">${id}</option>`);
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

// Agora Convo AI functionality
$("#start-convo-ai").click(async function (e) {
  try {
    // Check if already joined the channel
    if (!client || !options.channel) {
      return message.error("Please join the channel first!");
    }
    
    // Call Agora Convo AI RESTful API
    const convoAIEndpoint = "https://api.agora.io/api/conversational-ai-agent/v2/projects/" + options.appid + "/join";
    
    
    // Build request data according to documentation
    const requestData = {
      name: options.channel,
      properties: {
      channel: options.channel,
      token: options.token,
      agent_rtc_uid: "10001", // AI agent user ID
      remote_rtc_uids: ["10000"], // List of remote user IDs to subscribe, use * to subscribe all users
      idle_timeout: 30, // Idle timeout in seconds
      enable_string_uid: false, // Whether to enable string UID
      advanced_features: {
        enable_aivad: false, // Enable intelligent interruption handling
        enable_mllm: false, // Enable multimodal large language model
        enable_rtm: false // Enable signaling service
      },
      asr: {
        language: "en-US", // Use English as primary language
        vendor: "ares", // ASR vendor
      },
      tts: {
        vendor: "minimax", 
        params: {
          group_id: "<your-minimax-groupid>",  // Minimax group ID, refer to https://www.minimax.io/platform/user-center/basic-information
          key: "<your-tts-key>", // Minimax TTS key, refer to https://www.minimax.io/platform/user-center/basic-information/interface-key
          model: "speech-01-turbo",
          voice_setting: {
          voice_id: "female-shaonv",
          speed: 1,
          vol: 1,
          pitch: 0,
          emotion: "happy"
          },
          audio_setting: {
          sample_rate: 16000
          }
        },
        skip_patterns: [3, 4] // Skip content in parentheses and square brackets
      },
      /* tts: {
        vendor: "elevenlabs", 
        params: {
          key: "<your-tts-key>", // Eleven Labs TTS key, refer to https://www.elevenlabs.io/account/api-keys
          model_id: "eleven_flash_v2_5",
          voice_id: "pNInz6obpgDQGcFmaJgB",
          sample_rate: 16000 // TTS vendor
        },
        skip_patterns: [3, 4] // Skip content in parentheses and square brackets
      }, */
      llm: {
        url: "https://api.openai.com/v1/chat/completions", // OpenAI callback URL
        api_key: "<your-llm-key>", // LLM authentication API key
        system_messages: [
          {
            role: "system",
            content: "You are a helpful chatbot."
          }
              ],
        max_history: 32,
        greeting_message: "Hello, how can I assist you",
        failure_message: "Please hold on a second.",
        params: {
          model: "gpt-4o-mini", // Model to use, refer to https://platform.openai.com/docs/models
        }
      },
      /* llm: {
        url: "https://api.groq.com/openai/v1/chat/completions", // Groq callback URL
        api_key: "<your-llm-key>", // LLM authentication API key, refer to https://console.groq.com/keys 
        system_messages: [
          {
            role: "system",
            content: "You are a helpful chatbot."
          }
              ],
        max_history: 32,
        greeting_message: "Hello, how can I assist you",
        failure_message: "Please hold on a second.",
        params: {
          model: "llama-3.1-8b-instant", // Model to use, refer to https://console.groq.com/docs/models
        }
      }, */
      avatar: {
        vendor: "akool",
        enable: true,
        params: {
          api_key: "<your-akool-secret>",
          agora_uid: "10002",
          // agora_token: "avatar_rtc_token",
          avatar_id: "dvp_Sean_agora" // Available Avatar IDs: dvp_Sean_agora, dvp_Alinna_emotionsit_agora, dvp_Emma_agora, dvp_Dave_agora
        }
      }
    }
  };
    
    // Send request to Agora Convo AI API
    // Use Restful API Key and Secret for authentication
    const apiKey = "<your-restful-api-key>"; // Replace with actual Restful API Key
    const apiSecret = "<your-restful-api-secret>"; // Replace with actual Restful API Secret
    
    // Check if API Key and Secret are set
    if (apiKey === "YOUR_RESTFUL_API_KEY" || apiSecret === "YOUR_RESTFUL_API_SECRET") {
      return message.error("Please set your Restful API Key and Secret in the code first!");
    }
    
    message.info("Starting Agora Convo AI...");
    
    const response = await fetch(convoAIEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(apiKey + ":" + apiSecret)
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error("Failed to start Convo AI: " + (errorData.message || response.statusText));
    }
    
    const responseData = await response.json();
    message.success("Agora Convo AI started successfully!");
    console.log("Convo AI started successfully:", responseData);
    
    // Disable button to prevent duplicate clicks
    $("#start-convo-ai").attr("disabled", true);
    setTimeout(() => {
      $("#start-convo-ai").attr("disabled", false);
    }, 5000); // Restore button after 5 seconds
    
  } catch (error) {
    // Check if it's an authentication error
    if (error.message && error.message.includes("Invalid authentication credentials")) {
      message.error("Authentication failed: Please ensure correct Restful API Key and Secret are set");
      console.error("Convo AI authentication error:", error);
    } else {
      message.error(error.message || "Error occurred while starting Convo AI");
      console.error("Convo AI error:", error);
    }
    
    // Restore button state
    $("#start-convo-ai").attr("disabled", false);
  }
});
