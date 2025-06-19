

// 生成-50到-99之间的随机signal值
function getRandomSignal() {
  return -Math.floor(Math.random() * 50) - 50 // 生成-50到-99之间的随机整数
}

function modifyRequestBody() {
  try {
      // 解析原始请求体
      const requestData = JSON.parse($request.body)
      
      console.log('原始请求体: ' + $request.body)
      
      // 要确保存在的两个特定蓝牙MAC记录，signal将动态生成
      const requiredMacs = [
          '620831307848774D4D',
          '62084B786649727A6C'
      ]

      let hasMJ = false

      
      // 检查这两条记录是否已存在
      // 先创建一个蓝牙MAC地址集合用于快速查找
      const existingMacs = new Set()
      const macIndexMap = {} // 存储MAC地址对应的索引
      
      if (requestData.bluetoothMacList && Array.isArray(requestData.bluetoothMacList)) {
          requestData.bluetoothMacList.forEach((item, index) => {
              if (item && item.bluetoothMac) {
                  if (item.bluetoothMac.startsWith('6208')) {
                      hasMJ = true
                  }
                  existingMacs.add(item.bluetoothMac)
                  macIndexMap[item.bluetoothMac] = index
              }
          })
      } else {
          // 如果原始请求没有蓝牙列表，创建一个
          requestData.bluetoothMacList = []
      }

      if (!hasMJ) {//没有门禁的情况下 才新增
          // 处理必需的记录
          for (const mac of requiredMacs) {
              if (!existingMacs.has(mac)) {
                  // 如果不存在，添加带有随机signal值的新记录
                  const newRecord = {
                      'bluetoothMac': mac,
                      'signal': getRandomSignal()
                  }
                  requestData.bluetoothMacList.push(newRecord)
                  console.log('添加记录: ' + JSON.stringify(newRecord))
              }
          }
      }

      
      // 将修改后的数据转换回字符串
      const newBody = JSON.stringify(requestData)
      console.log('修改后的请求体: ' + newBody)
      $notify('🚀恭喜，修改蓝牙数据成功')
      // 返回修改后的请求体
      $done({body: newBody})
  } catch (e) {
      console.log('处理请求体时出错: ' + e.message)
      $notify('❎插入蓝牙数据失败')
      // 出错时不修改请求
      $done({})
  }
}

// 执行函数
modifyRequestBody()
