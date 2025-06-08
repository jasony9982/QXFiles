/**
 * NTHTTPUtil.js
 * JavaScript implementation of NTHTTPUtil
 */

function byteToHex(byte) {
  const hexDigits = '0123456789abcdef';
  return hexDigits[(byte >> 4) & 0xf] + hexDigits[byte & 0xf];
}

function longToHex(value) {
  let result = '';
  // 从最高字节到最低字节，依次转换为十六进制字符
  for (let i = 7; i >= 0; i--) {
    // 每次处理一个字节 (8位)
    const byte = (value >> (i * 8)) & 0xff;
    result += byteToHex(byte);
  }
  return result;
}

function get_X_B3_SpanId() {
  // 生成随机的64位整数 (范围从1到最大安全整数)
  const randomNumber = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
  return longToHex(randomNumber);
}

function get_X_B3_TraceId() {
  // 获取当前时间戳（毫秒）
  const timestamp = Date.now();
  return longToHex(timestamp);
}

function getFormatterTime() {
  const now = new Date();
  const month = now.getMonth() + 1;  // 月份（1-12）
  const day = now.getDate();         // 日（1-31）
  const hours = String(now.getHours()).padStart(2, '0');      // 时（两位数）
  const minutes = String(now.getMinutes()).padStart(2, '0');  // 分（两位数）
  const seconds = String(now.getSeconds()).padStart(2, '0');   // 秒（两位数）
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']; // 周X简写
  const weekday = weekdays[now.getDay()]; // 获取星期索引（0=周日）
  
  return `${month}月${day}日 周${weekday} ${hours}:${minutes}:${seconds}`;
}


const url = `https://ncc.popo.netease.com/api/bs-open/api/v1/door/open`;
const method = `POST`;
const headers = {
'Accept-Encoding' : `gzip, deflate, br`,
'X-B3-TraceId' : get_X_B3_TraceId(),
'Host' : `ncc.popo.netease.com`,
'deviceId' : `a82e641d8356fb9509621261db8ceced`,
'X-B3-SpanId' : get_X_B3_SpanId(),
'deviceType' : `3`,
'appVersion' : `4.15.0`,
'Connection' : `Keep-Alive`,
'nccClientIp' : `124.160.201.216`,
'Accept-Language' : `zh-CN`,
'User-Agent' : `popo ios 4.15.0`,
'Content-Type' : `application/json`,
'Accept' : `*/*`,
'deviceVersion' : `iOS 18.5`,
'Authorization' : `BDCD330323A22A748628B006ABC541CE6DCFBB8A97BC2970D6E8E48192387E4077E1439498E7B501507FC134FC3143D4D0D3AF79D66114FA`,
'clientLocalIp' : `100.102.107.153`,
'versionBuild' : `32573`,
'trulyClientIp' : `124.160.201.216`,
'macAddress' : `02:00:00:00:00:00`,
'Cookie' : `isVisitor=0`
};

const body = `{"id":"29862219","appType":9,"doorMac":"62084B786649727A6C","useDevice":"a82e641d8356fb9509621261db8ceced","platform":"IOS"}`;

const myRequest = {
    url: url,
    method: method,
    headers: headers,
    body: body
};
console.log("headers: " + JSON.stringify(headers) + "\n\n");
$task.fetch(myRequest).then(response => {
    console.log(response.statusCode + "\n\n" + response.body);
    $notify("🚀恭喜，出口打卡成功", "打卡时间：" + getFormatterTime()); 
    $done();
}, reason => {
    console.log(reason.error);
    $done();
});
