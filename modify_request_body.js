/**
 * 自动开门脚本 - 监听特定请求并触发开门操作
 */

// =========== 工具函数 ===========
/**
 * 字节转十六进制
 * @param {number} byte - 字节值
 * @returns {string} 十六进制字符串
 */
function byteToHex(byte) {
  const hexDigits = '0123456789abcdef';
  return hexDigits[(byte >> 4) & 0xf] + hexDigits[byte & 0xf];
}

/**
 * 长整型数值转十六进制字符串
 * @param {number} value - 长整型数值
 * @returns {string} 十六进制字符串
 */
function longToHex(value) {
  let result = '';
  for (let i = 7; i >= 0; i--) {
    const byte = (value >> (i * 8)) & 0xff;
    result += byteToHex(byte);
  }
  return result;
}

// =========== 请求头工具函数 ===========
/**
 * 生成请求头 X-B3-SpanId
 * @returns {string} SpanId 值
 */
function get_X_B3_SpanId() {
  const randomNumber = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
  return longToHex(randomNumber);
}

/**
 * 生成请求头 X-B3-TraceId
 * @returns {string} TraceId 值
 */
function get_X_B3_TraceId() {
  const timestamp = Date.now();
  return longToHex(timestamp);
}

// =========== 时间格式化 ===========
/**
 * 获取格式化的当前时间
 * @returns {string} 格式化的时间字符串，如 "6月19日 周四 12:30:45"
 */
function getFormatterTime() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekday = weekdays[now.getDay()];

  return `${month}月${day}日 周${weekday} ${hours}:${minutes}:${seconds}`;
}

// =========== 门禁配置 ===========
const DOOR_CONFIG = {
  URL: 'https://ncc.popo.netease.com/api/bs-open/api/v1/door/open',
  ENTRANCE: {
    TYPE: 1,
    MAC: '620831307848774D4D',
    NAME: '入口'
  },
  EXIT: {
    TYPE: 2,
    MAC: '62084B786649727A6C',
    NAME: '出口'
  },
  DEVICE_ID: 'a82e641d8356fb9509621261db8ceced',
  USER_ID: '29862219',
  DEFAULT_HEADERS: {
    'Accept-Encoding': 'gzip, deflate, br',
    'Host': 'ncc.popo.netease.com',
    'deviceType': '3',
    'appVersion': '4.15.0',
    'Connection': 'Keep-Alive',
    'nccClientIp': '124.160.201.216',
    'Accept-Language': 'zh-CN',
    'User-Agent': 'popo ios 4.15.0',
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'deviceVersion': 'iOS 18.5',
    'Authorization': 'BDCD330323A22A748628B006ABC541CE6DCFBB8A97BC2970D6E8E48192387E4077E1439498E7B501507FC134FC3143D4D0D3AF79D66114FA',
    'clientLocalIp': '100.102.107.153',
    'versionBuild': '32573',
    'trulyClientIp': '124.160.201.216',
    'macAddress': '02:00:00:00:00:00',
    'Cookie': 'isVisitor=0'
  }
};

// =========== 主函数 ===========
/**
 * 主函数 - 处理响应并触发开门操作
 */
function main() {
  // 解析原始响应
  let body = $response.body;

  try {
    let obj = JSON.parse(body);

    // 检查响应状态是否符合触发条件
    if (obj.status === 1) {
      handleSuccessResponse(obj, body);
    } else {
      $done({ body });
    }
  } catch (e) {
    console.log("脚本执行出错: " + e);
    $done({ body });
  }
}

/**
 * 处理成功的响应
 * @param {Object} responseObj - 解析后的响应对象
 * @param {string} originalBody - 原始响应体
 */
function handleSuccessResponse(responseObj, originalBody) {
  // 识别门类型
  const requestUrl = $request.url;
  const doorType = identifyDoorType(requestUrl);

  if (doorType === 0) {
    $done({ originalBody });
    return;
  }

  // 获取存储的请求头
  const mergedHeaders = getSavedHeaders();

  // 发送开门请求
  sendOpenDoorRequest(doorType, mergedHeaders, responseObj, requestUrl, originalBody);
}

/**
 * 识别门类型
 * @param {string} url - 请求URL
 * @returns {number} 门类型：1-入口，2-出口，0-未知
 */
function identifyDoorType(url) {
  if (url.indexOf(`bluetoothMac=${DOOR_CONFIG.ENTRANCE.MAC}`) !== -1) {
    return DOOR_CONFIG.ENTRANCE.TYPE;
  } else if (url.indexOf(`bluetoothMac=${DOOR_CONFIG.EXIT.MAC}`) !== -1) {
    return DOOR_CONFIG.EXIT.TYPE;
  }
  return 0;
}

/**
 * 获取已保存的请求头
 * @returns {Object} 合并后的请求头对象
 */
function getSavedHeaders() {
  const savedHeaders = $prefs.valueForKey("saved_ncc_api_headers");
  let mergedHeaders = {};

  if (savedHeaders) {
    try {
      mergedHeaders = JSON.parse(savedHeaders);
    } catch (e) {
      // 解析错误时使用空对象
    }
  }

  return mergedHeaders;
}

/**
 * 构建并发送开门请求
 * @param {number} doorType - 门类型
 * @param {Object} mergedHeaders - 合并的请求头
 * @param {Object} responseObj - 响应对象
 * @param {string} requestUrl - 原始请求URL
 * @param {string} originalBody - 原��响应体
 */
function sendOpenDoorRequest(doorType, mergedHeaders, responseObj, requestUrl, originalBody) {
  // 构建请求头
  const headers = {
    ...DOOR_CONFIG.DEFAULT_HEADERS,
    'X-B3-TraceId': get_X_B3_TraceId(),
    'deviceId': DOOR_CONFIG.DEVICE_ID,
    'X-B3-SpanId': get_X_B3_SpanId(),
    ...mergedHeaders
  };

  // 构建请求体
  const doorMac = doorType === DOOR_CONFIG.ENTRANCE.TYPE ?
    DOOR_CONFIG.ENTRANCE.MAC : DOOR_CONFIG.EXIT.MAC;

  const requestBody = JSON.stringify({
    id: DOOR_CONFIG.USER_ID,
    appType: 9,
    doorMac: doorMac,
    useDevice: DOOR_CONFIG.DEVICE_ID,
    platform: "IOS"
  });

  // 创建请求对象
  const doorRequest = {
    url: DOOR_CONFIG.URL,
    method: 'POST',
    headers: headers,
    body: requestBody
  };

  // 发送请求并处理响应
  $task.fetch(doorRequest).then(
    response => handleOpenDoorSuccess(response, doorType, responseObj, requestUrl, originalBody),
    reason => handleOpenDoorFailure(reason, originalBody)
  );
}

/**
 * 处理开门请求成功
 * @param {Object} response - 开门请求响应
 * @param {number} doorType - 门类型
 * @param {Object} responseObj - 原始响应对象
 * @param {string} requestUrl - 原始请求URL
 * @param {string} originalBody - 原始响应体
 */
function handleOpenDoorSuccess(response, doorType, responseObj, requestUrl, originalBody) {
  console.log("开门请求响应: " + response.body);

  const doorName = doorType === DOOR_CONFIG.ENTRANCE.TYPE ?
    DOOR_CONFIG.ENTRANCE.NAME : DOOR_CONFIG.EXIT.NAME;

  $notify(
    `🚀恭喜，${doorName}打卡成功`,
    "打卡时间：" + getFormatterTime(),
    `轮询Id:${responseObj.data} \n请求URL: ${requestUrl}`
  );

  $done({ body: originalBody });
}

/**
 * 处理开门请求失败
 * @param {Object} reason - 失败原因
 * @param {string} originalBody - 原始响应体
 */
function handleOpenDoorFailure(reason, originalBody) {
  console.log("开门请求失败: " + reason.error);
  $notify("⚠️打卡失败", "网络请求错误", reason.error);
  $done({ body: originalBody });
}

// 执行主函数
main();
