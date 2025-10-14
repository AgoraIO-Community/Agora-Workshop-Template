const ENV = "dev"; // dev, test, prod
const AREA = "internal"; // internal, external
const EXTERNAL_DEMO_PATH = "api-examples-external"; // external demo path
const INTERNAL_DEMO_PATH = "api-examples-internal"; // internal demo path
const SSO_DATA_KEY = "agora_sso_data";
const ORIGIN_URL = __calcOriginUrl();
const SETUP_PAGE_URL = `${ORIGIN_URL}/index.html`; // setup page url
let REDIRECT_URI = ""; // sso redirect uri
let BASE_URL = ""; // request base url
let channel_link = "https://doc.shengwang.cn/doc/rtc/javascript/basic-features/join-leave-channel#%E5%8A%A0%E5%85%A5%E9%A2%91%E9%81%93";
let appCertificateLink = "https://doc.shengwang.cn/doc/rtc/javascript/get-started/enable-service#%E8%8E%B7%E5%8F%96-app-%E8%AF%81%E4%B9%A6";
let appIdLink = "https://doc.shengwang.cn/doc/rtc/javascript/get-started/enable-service#%E8%8E%B7%E5%8F%96-app-id";
let proxyLink = "https://doc.shengwang.cn/doc/rtc/javascript/basic-features/firewall#%E4%BA%91%E4%BB%A3%E7%90%86%E6%96%B9%E6%A1%88";

switch (ENV) {
  case "dev":
    BASE_URL = "https://service-staging.agora.io/toolbox";
    REDIRECT_URI = "http://localhost:3001/sso/index.html";
    break;
  case "test":
    BASE_URL = "https://service-staging.agora.io/toolbox";
    REDIRECT_URI =
      "https://fullapp.oss-cn-beijing.aliyuncs.com/api-examples-internal/sso/index.html";
    break;
  case "prod":
    BASE_URL = "https://service.agora.io/toolbox";
    REDIRECT_URI = `${origin}/sso/index.html`;
    break;
}

/**
 *  name: menu name => zh/en text => /${name}/index.html
 */
let MENU_LIST = [
  {
    name: "settingMenu",
    data: [
      {
        name: "initializeSettings",
        url: `${ORIGIN_URL}/index.html`,
      },
    ],
  },
  {
    name: "basicMenu",
    data: [
      {
        name: "basicVideoCall",
        url: `${ORIGIN_URL}/example/basic/basicVideoCall/index.html`,
        zhDocUrl: "https://doc.shengwang.cn/doc/rtc/javascript/get-started/quick-start",
        enDocUrl: "https://docs.agora.io/en/video-calling/overview/product-overview?platform=android",
        githubUrl:
          "https://github.com/AgoraIO/API-Examples-Web/tree/main/src/example/basic/basicVideoCall",
      },
    ],
  },
];

if (AREA == "external") {
  channel_link = "https://docs.agora.io/en/voice-calling/reference/glossary?platform=android#channel";
  appCertificateLink = "https://docs.agora.io/en/voice-calling/reference/glossary?platform=android#app-certificate";
  appIdLink = "https://docs.agora.io/en/voice-calling/reference/glossary?platform=android#app-id";
  proxyLink = "https://docs.agora.io/en/voice-calling/reference/glossary?platform=android#-2";

  // hide pushStreamToCDN item in othersMenu
  const othersMenuIndex = MENU_LIST.findIndex((item) => item.name == "othersMenu");
  MENU_LIST[othersMenuIndex].data = MENU_LIST[othersMenuIndex].data.filter((item) => item.name !== "pushStreamToCDN");
  // add stt case
  MENU_LIST[othersMenuIndex].data.push({
    name: "stt",
    url: `https://stt-demo.agora.io/`,
    zhDocUrl: "",
    enDocUrl: "",
    githubUrl: "",
  });
}

function __calcOriginUrl() {
  let { origin, href } = window.location;
  if (origin == "file://") {
    // open local file
    let reg = /file\S+\/src/g;
    return href.match(reg)[0];
  } else {
    switch (ENV) {
      case "dev":
        return origin;
      case "test":
        let TEST_PREFIX = AREA == "internal" ? INTERNAL_DEMO_PATH : EXTERNAL_DEMO_PATH;
        return `${origin}/${TEST_PREFIX}`;
      case "prod":
        return origin;
      default:
        return origin;
    }
  }
}
