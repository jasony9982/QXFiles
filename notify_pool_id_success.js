/**
 * 自动开门脚本 - 监听特定请求并触发开门操作
 */

// 工具函数
function byteToHex(byte) {
  const hexDigits = '0123456789abcdef';
  return hexDigits[(byte >> 4) & 0xf] + hexDigits[byte & 0xf];
}

function longToHex(value) {
  let result = '';
  for (let i = 7; i >= 0; i--) {
    const byte = (value >> (i * 8)) & 0xff;
    result += byteToHex(byte);
  }
  return result;
}

function generateTraceId() {
  return longToHex(Date.now());
}

function generateSpanId() {
  return longToHex(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1);
}

function getFormattedTime() {
  const now = new Date();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${now.getMonth() + 1}月${now.getDate()}日 周${weekdays[now.getDay()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

// 开门请求构建
function buildDoorRequest(doorType, mergedHeaders) {
  const doorMac = doorType === 1 ? '620831307848774D4D' : '62084B786649727A6C';
  return {
    url: 'https://ncc.popo.netease.com/api/bs-open/api/v1/door/open',
    method: 'POST',
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
      'X-B3-TraceId': generateTraceId(),
      'X-B3-SpanId': generateSpanId(),
      'Host': 'ncc.popo.netease.com',
      'deviceId': 'a82e641d8356fb9509621261db8ceced',
      'deviceType': '3',
      'appVersion': '4.15.0',
      'Connection': 'Keep-Alive',
      'Authorization': 'BDCD330323A22A748628B006ABC541CE6DCFBB8A97BC2970D6E8E48192387E4077E1439498E7B501507FC134FC3143D4D0D3AF79D66114FA',
      'Content-Type': 'application/json',
      ...mergedHeaders
    },
    body: JSON.stringify({
      id: '29862219',
      appType: 9,
      doorMac,
      useDevice: 'a82e641d8356fb9509621261db8ceced',
      platform: 'IOS'
    })
  };
}

// 轮询开门状态
function pollDoorStatus(pollId, headers, doneBody, attempts = 0, maxAttempts = 3) {
  if (attempts >= maxAttempts) {
    console.log('轮询次数已达最大限制，停止轮询');
    $notify('⚠️打卡失败', '轮询开门状态超时', '请检查设备状态');
    $done({ body: doneBody });
    return;
  }

  const request = {
    url: `https://api-smartoffice.netease.com/api-applet/ac/device/door/pollOpenStatus/${pollId}`,
    method: 'GET',
    headers
  };

  $task.fetch(request).then(response => {
    const statusObj = JSON.parse(response.body);
    if (statusObj.status === 1) {
      console.log('开门成功');
      $notify('🚀恭喜，开门成功', `轮询Id:${pollId}`, `开门时间: ${getFormattedTime()}`);
      $done({ body: doneBody });
    } else {
      console.log('开门失败，继续轮询');
      setTimeout(() => pollDoorStatus(pollId, headers, doneBody, attempts + 1, maxAttempts), 1500);
    }
  }).catch(error => {
    console.log('轮询请求失败:', error);
    $notify('⚠️开门请求发送失败', '网络请求错误', error.message);
    $done({ body: doneBody });
  });
}

// 主逻辑
try {
  const body = $response.body;
  const headers = $response.headers;
  const obj = JSON.parse(body);

  if (obj.status === 1) {
    const requestUrl = $request.url;
    const doorType = requestUrl.includes('bluetoothMac=620831307848774D4D') ? 1 : requestUrl.includes('bluetoothMac=62084B786649727A6C') ? 2 : 0;

    if (doorType === 0) {
      $done({ body });
      return;
    }

    const savedHeaders = $prefs.valueForKey('saved_ncc_api_headers');
    const mergedHeaders = savedHeaders ? JSON.parse(savedHeaders) : {};

    const doorRequest = buildDoorRequest(doorType, mergedHeaders);

    $task.fetch(doorRequest).then(response => {
      console.log('开门请求响应:', response.body);
      const notificationTitle = doorType === 1 ? '🚀恭喜，入口开门请求发送成功' : '🚀恭喜，出口开门请求成功';
      $notify(notificationTitle, '', `轮询Id:${obj.data} \n请求URL: ${requestUrl}`);
      pollDoorStatus(obj.data, headers, body);
    }).catch(error => {
      console.log('开门请求失败:', error.message);
      $notify('⚠️开门请求发送失败', '网络请求错误', error.message);
      $done({ body });
    });
  } else {
    $done({ body });
  }
} catch (error) {
  console.error('解析响应失败:', error.message);
  $notify('⚠️打卡失败', '解析响应错误', error.message);
  $done({ body });
}