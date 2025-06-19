// 获取响应体
let body = $response.body;

try {
  // 解析JSON响应
  let obj = JSON.parse(body);
  
  // 检查status值是否为1
  if (obj.status === 1) {
    // 发送通知
    $notify("🚀 API请求成功", "获取轮询id 成功", `ID: ${obj.data}`);
  }
  
  // 不修改响应内容，原样返回
  $done({body});
} catch (e) {
  console.log("解析响应失败: " + e);
  // 出错时也不修改响应
  $done({body});
}
