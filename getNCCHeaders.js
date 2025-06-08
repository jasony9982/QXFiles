const headerKey = "saved_ncc_api_headers";

// 获取并存储headers
const headersToSave = {
    // 选择需要存储的特定header，避免存储敏感信息
    "Authorization": $request.headers["Authorization"],
    "clientLocalIp": $request.headers["clientLocalIp"],
    // 添加其他需要保存的header
    "nccClientIp": $request.headers["nccClientIp"],
    "clientLocalIp": $request.headers["clientLocalIp"],
    "trulyClientIp": $request.headers["trulyClientIp"]
};

// 持久化存储
$persistentStore.write(JSON.stringify(headersToSave), headerKey);

// 继续原始请求
$done({});
