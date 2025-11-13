const JUMP_BACK_URL_KEY = "__jump_back_url__";
let _inspectIntervalId = null;

// ----------------- private -----------------------

// save current page href for jump back
const __setJumpBackUrl = (href) => {
  sessionStorage.setItem(JUMP_BACK_URL_KEY, href);
};

let messageTimeoutId;

const __message = (message, type) => {
  $(".alert").remove();
  if (messageTimeoutId) {
    clearTimeout(messageTimeoutId);
  }
  const wrapper = document.createElement("div");
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible" role="alert">`,
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close alert-btn" data-bs-dismiss="alert" aria-label="Close"></button>',
    "</div>",
  ].join("");

  document.body.append(wrapper);

  messageTimeoutId = setTimeout(() => {
    $(".alert-btn").click();
  }, 3000);
};

/* function __queryUrlParams() {
  var urlParams = new URL(location.href).searchParams;
  if (urlParams.size) {
    // let appid = urlParams.get("appid");
    let channel = urlParams.get("channel");
    let uid = urlParams.get("uid");
    if (channel) {
      setOptionsToLocal({ channel });
      $("#channel").val(channel);
    }
    if (uid) {
      setOptionsToLocal({ uid });
      $("#uid").val(uid);
    }
  } else {
    const options = getOptionsFromLocal();
    const { appid, channel, certificate } = options;
    appid && $("#appid").val(appid);
    certificate && $("#certificate").val(certificate);
    channel && $("#channel").val(channel);
  }
} */

function __checkLocalOptions() {
  if (window.location.href != SETUP_PAGE_URL) {
    let options = getOptionsFromLocal();
    let res = __getEncryptFromUrl();
    if (res.encryptedId && res.encryptedSecret) {
      return;
    }
    if (!options.appid) {
      alert("Need to set up appID and appCertificate! Redirecting to setup page.");
      window.location.href = SETUP_PAGE_URL;
    }
  }
}

function __addAppInfoUI() {
  /*const options = getOptionsFromLocal();
  let appid = "";
  let certificate = "";
  const res = __getEncryptFromUrl();
  if (!res.encryptedId || !res.encryptedSecret) {
    appid = options.appid || "";
    certificate = options.certificate || "";
  } else {
    appid = "encryptedId";
    certificate = "encryptedSecret";
  } */
  let language = getLanguage();
  const href = window.location.href;
  let reg = /\/(\w+)\/index\.html$/;
  const result = href.match(reg) || [];
  let name = result[1];
  let target = {};
  for (let menu of MENU_LIST) {
    for (let item of menu.data) {
      if (item.name == name) {
        target = item;
        break;
      }
    }
  }
  let documentUrl = "";
  if (target) {
    if (language == "zh-CN" || language == "zh") {
      documentUrl = target.zhDocUrl;
    } else {
      documentUrl = target.enDocUrl;
    }
  }
  if (!documentUrl) {
    if (language == "zh-CN" || language == "zh") {
      documentUrl = "https://doc.shengwang.cn/doc/rtc/javascript/get-started/quick-start";
    } else {
      documentUrl =
        "https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web";
    }
  }
  //var $newElement = $(`<div class="pt-3" style="color:#54667a; font-size:14px;">
  //  <div>AppID: ${appid}</div> 
  // <div>AppCertificate: ${certificate}</div> 
  // </div>`);

  //$("#app-info").append($newElement);
  $(".btn-jump-setup").click(() => {
    const href = window.location.href;
    __setJumpBackUrl(href);
  });
}

function __checkExperienceTime() {
  if (AREA != "internal") {
    return;
  }
  const experience = sessionStorage.getItem("__experience");
  const language = getLanguage();

  if (!experience) {
    sessionStorage.setItem("__experience", true);
    let msg = "";
    if (language == "en") {
      msg =
        "【This website is a test product and is only for functional experience. Please do not use it for commercial purposes. The single use time should not exceed 20 minutes. If it expires, the experience will be automatically exited.】";
    } else {
      msg =
        "[This website is a test product for functional experience only, not for commercial use. Single session duration should not exceed 20 minutes, after which the experience will automatically exit. To comply with regulatory requirements, pornographic, abusive, violent, terrorist, and political content is strictly prohibited. Beware of telecom fraud, do not apply for loans or make online banking transfers during use! National anti-fraud hotline: 96110]";
    }
    alert(msg);
  }

  setTimeout(
    () => {
      let msg = "";
      if (language == "en") {
        msg =
          "【Your experience time has exceeded 20 minutes. Due to system restrictions, your experience has been automatically exited. If you have any questions or need further assistance, please contact technical support and we will solve the problem for you as soon as possible.】";
      } else {
        msg =
          "[Your experience time has exceeded 20 minutes. Due to system limitations, your experience has been automatically terminated. If you have any questions or need further assistance, please contact technical support and we will resolve the issue as soon as possible.]";
      }
      alert(msg);
      window.location.reload();
    },
    1000 * 60 * 20,
  );
}

function __ImageDataToBase64(imageData) {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);
  let dataURL = canvas.toDataURL();
  const arr = dataURL.split("base64,") || [];
  if (arr[1]) {
    return arr[1];
  }
  return arr[0];
}

function __genUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function __getEncryptFromUrl() {
  let encryptedId = "";
  let encryptedSecret = "";
  var urlParams = new URL(location.href).searchParams;
  if (urlParams.size) {
    encryptedId = urlParams.get("encryptedId");
    encryptedSecret = urlParams.get("encryptedSecret");
  }
  return { encryptedId, encryptedSecret };
}

// ---------------------- public ----------------------------
const message = {
  success: (message) => __message(message, "success"),
  error: (message) => __message(message, "danger"),
  warning: (message) => __message(message, "warning"),
  info: (message) => __message(message, "info"),
};

function deepCopy(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  let clone = Array.isArray(obj) ? [] : {};

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepCopy(obj[key]);
    }
  }

  return clone;
}

function setOptionsToLocal(option) {
  const res = __getEncryptFromUrl();
  if (res.encryptedId && res.encryptedSecret) {
    return;
  }
  option = deepCopy(option);
  if (option.token) {
    option.token = "";
  }
  let localOptions = getOptionsFromLocal();
  option = { ...localOptions, ...option };
  localStorage.setItem("__options", JSON.stringify(option));
}

//function getOptionsFromLocal() {
//  return JSON.parse(localStorage.getItem("__options")) || {};
//}

function getLanguage() {
  const DEFAULT_LANGUAGE = "en";
 // const options = getOptionsFromLocal();

 // if (options && options.language) {
 //   return options.language;
 // }

  if (navigator.language) {
    if (navigator.language == "zh-CN" || navigator.language == "zh") {
      return navigator.language;
    }
  }

  return DEFAULT_LANGUAGE;
}

function escapeHTML(unsafeText) {
  const elem = document.createElement("div");
  elem.innerText = unsafeText;
  return elem.innerHTML;
}

function addSuccessIcon(query) {
  let node = $(query)[0];
  var element = $(`
    <div class="success-svg" style="display: flex;align-items:center;margin-left:5px">
    <svg class="ft-green-tick" xmlns="http://www.w3.org/2000/svg" height="15" width="15"
      viewBox="0 0 48 48" aria-hidden="true">
      <circle class="circle" fill="#5bb543" cx="24" cy="24" r="22"></circle>
      <path class="tick" fill="none" stroke="#FFF" stroke-width="6" stroke-linecap="round"
        stroke-linejoin="round" stroke-miterlimit="10" d="M14 27l5.917 4.917L34 17"></path>
    </svg>
  </div>
  `);

  if (!node.querySelector(".success-svg")) {
    node.append(element[0]);
  }
}

function removeAllIcons() {
  let nodes = $(".success-svg");
  nodes.each((index, item) => {
    item.remove();
  });
}

function getJumpBackUrl() {
  let href = sessionStorage.getItem(JUMP_BACK_URL_KEY);
  if (href) {
    sessionStorage.removeItem(JUMP_BACK_URL_KEY);
  } else {
    href = `${ORIGIN_URL}/example/basic/basicVideoCall/index.html`;
  }

  return href;
}

// ---------------------- agora ----------------------------

// The token used in the demo is solely for testing purposes; 
// users are required to deploy their own token server to obtain the service.

async function agoraGetAppData(config) {
  const { uid, channel } = config;
  const { appid, certificate } = getOptionsFromLocal();
  const res = __getEncryptFromUrl();
  let encryptedId = res.encryptedId;
  let encryptedSecret = res.encryptedSecret;
  let data = {};
  let url = "";
  if (encryptedId && encryptedSecret) {
    url = `${BASE_URL}/v1/webdemo/encrypted/token`;
    data = {
      channelName: channel,
      encryptedId,
      encryptedSecret,
      traceId: __genUUID(),
      src: "webdemo",
    };
  } else {
    if (!certificate) {
      return null;
    }
    url = `${BASE_URL}/v2/token/generate`;
    data = {
      appId: appid,
      appCertificate: certificate,
      channelName: channel,
      expire: 7200,
      src: "web",
      types: [1, 2],
      uid: uid,
    };
  }
  let resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  resp = (await resp.json()) || {};
  if (resp.code != 0) {
    const msg="Generate token error, please check your appid and appcertificate parameters"
    message.error(msg);
    throw Error(msg);
  }
  const respData = resp?.data || {};
  if (respData.appid) {
    config.appid = respData.appid;
  }
  return respData.token;
}

async function agoraGetProjects() {
  url = `${BASE_URL}/v1/webdemo/projects`;
  const v = JSON.parse(localStorage.getItem(SSO_DATA_KEY));
  if (!v.access_token) {
    throw new Error("access_token is empty");
  }
  let resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      access_token: v.access_token,
    }),
  });
  resp = (await resp.json()) || {};
  if (resp.code == 138) {
    throw new Error("access_token is invalid, please login again");
  }

  if (resp.code != 0) {
    message.error(resp.msg);
    throw Error(resp.msg);
  }
  return resp.data;
}

/* function generateRandomString(length) {

  const options = getOptionsFromLocal();
  if (options.channel && options.channel.length === length) {
    return options.channel;
  }
  
  // const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const characters = '0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  setOptionsToLocal({channel: result});
  
} */

// ---------------------- agora ----------------------------

// exec functions
// __queryUrlParams();
// __checkLocalOptions();
__addAppInfoUI();
__checkExperienceTime();
// generateRandomString(6);


$(() => {
})