const headerKey = "saved_ncc_api_headers";
const timestampKey = "ncc_headers_save_time";

// 获取上一次保存的时间戳
const lastSaveTime = $prefs.valueForKey(timestampKey);
const currentTime = Date.now();
// 十分钟的毫秒数
const TEN_MINUTES = 10 * 60 * 1000;

// 检查是否需要保存
let needToSave = true;
if (lastSaveTime) {
    const lastSaveTimeNum = parseInt(lastSaveTime);
    // 如果上次保存时间在10分钟内，不再保存
    if (currentTime - lastSaveTimeNum < TEN_MINUTES) {
        needToSave = false;
    }
}

if (needToSave) {
    // 获取并存储headers
    const headersToSave = {
        // 选择需要存储的特定header，避免存储敏感信息
        "Authorization": $request.headers["Authorization"],
        "clientLocalIp": $request.headers["clientLocalIp"],
        "nccClientIp": $request.headers["nccClientIp"],
        "trulyClientIp": $request.headers["trulyClientIp"],
        "saveTime": currentTime // 保存时间戳，方便调试
    };

    // 持久化存储
    $prefs.setValueForKey(JSON.stringify(headersToSave), headerKey);
    // 保存当前时间戳
    $prefs.setValueForKey(currentTime.toString(), timestampKey);

    $notify("🚀恭喜，已保存NCC API Headers");
}

// 继续原始请求
$done({});
