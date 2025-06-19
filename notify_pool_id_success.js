/**
 * 自动开门脚本 - 监听特定请求并触发开门操作
 */

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

function get_X_B3_SpanId() {
  const randomNumber = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
  return longToHex(randomNumber);
}

function get_X_B3_TraceId() {
  const timestamp = Date.now();
  return longToHex(timestamp);
}

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

// 解析原始响应
let body = $response.body;

try {
  let obj = JSON.parse(body);

  // 检查是否符合触发条件
  if (obj.status === 1) {
    // 发送通知
    $notify("轮询ID获取成功", "", `ID: ${obj.data}`);
    console.log("成功获取轮询ID: " + obj.data);
    // 获取当前请求的URL
    const requestUrl = $request.url;
    console.log("当前请求URL: " + requestUrl);
    let doorType = 0
    if (requestUrl.indexOf('bluetoothMac=620831307848774D4D') !== -1) {
      doorType = 1; // 入口
    } else if (requestUrl.indexOf('bluetoothMac=620831307848774D4C') !== -1) {
      doorType = 2; // 出口
    }
    if (doorType === 0) {
      $done({ body });
      return;
    }
    // 加载存储的headers
    const savedHeaders = $prefs.valueForKey("saved_ncc_api_headers");
    let mergedHeaders = {};
    if (savedHeaders) {
      try {
        mergedHeaders = JSON.parse(savedHeaders);
        console.log("已加载存储的headers:", mergedHeaders);
      } catch (e) {
        console.log("解析存储的headers失败:", e);
      }
    }

    // 构建开门请求
    const url = `https://ncc.popo.netease.com/api/bs-open/api/v1/door/open`;
    const method = `POST`;
    const headers = {
      'Accept-Encoding': `gzip, deflate, br`,
      'X-B3-TraceId': get_X_B3_TraceId(),
      'Host': `ncc.popo.netease.com`,
      'deviceId': `a82e641d8356fb9509621261db8ceced`,
      'X-B3-SpanId': get_X_B3_SpanId(),
      'deviceType': `3`,
      'appVersion': `4.15.0`,
      'Connection': `Keep-Alive`,
      'nccClientIp': `124.160.201.216`,
      'Accept-Language': `zh-CN`,
      'User-Agent': `popo ios 4.15.0`,
      'Content-Type': `application/json`,
      'Accept': `*/*`,
      'deviceVersion': `iOS 18.5`,
      'Authorization': `BDCD330323A22A748628B006ABC541CE6DCFBB8A97BC2970D6E8E48192387E4077E1439498E7B501507FC134FC3143D4D0D3AF79D66114FA`,
      'clientLocalIp': `100.102.107.153`,
      'versionBuild': `32573`,
      'trulyClientIp': `124.160.201.216`,
      'macAddress': `02:00:00:00:00:00`,
      'Cookie': `isVisitor=0`,
      ...mergedHeaders
    };

    let requestBody = `{"id":"29862219","appType":9,"doorMac":"620831307848774D4D","useDevice":"a82e641d8356fb9509621261db8ceced","platform":"IOS"}`;
    if (doorType === 2) {
      requestBody = `{"id":"29862219","appType":9,"doorMac":"62084B786649727A6C","useDevice":"a82e641d8356fb9509621261db8ceced","platform":"IOS"}`;
    }

    const doorRequest = {
      url: url,
      method: method,
      headers: headers,
      body: requestBody
    };

    console.log("准备发送开门请求，headers: " + JSON.stringify(headers));

    // 发送开门请求
    $task.fetch(doorRequest).then(response => {
      console.log("开门请求响应: " + response.status + "\n\n" + response.body);
      if (doorType === 1) {
        $notify("🚀恭喜，入口打卡成功", "打卡时间：" + getFormatterTime(), "");
      } else {
        $notify("🚀恭喜，出口打卡成功", "打卡时间：" + getFormatterTime(), "");
      }
    }, reason => {
      console.log("开门请求失败: " + reason.error);
      $notify("⚠️打卡失败", "网络请求错误", reason.error);
    });
  }

  // 不修改原始响应
  $done({ body });
} catch (e) {
  console.log("脚本执行出错: " + e);
  $done({ body });
}
