# 云开发配置指南（HTTP 方案）

纯文本无法直接放进二维码让微信扫一扫展示。本项目采用 **HTTP 网页链接**：

```
输入文字 → saveContent 存云数据库 → 二维码内容为 HTTPS 链接
微信扫码 → 打开网页 → getContent 展示文字
```

---

## 一、开通云开发

环境 ID：`cloudbase-d3gvp0ik1820edd8d`（已写入 `config/cloud.js`）

> HTTP 访问服务需要**付费版**云开发套餐。免费版会报 `OperationDenied.FreePackageDenied`，需先升级套餐。

## 二、创建数据库

集合名：**`qr_contents`**，权限：**所有用户不可读写**

## 三、部署云函数

在微信开发者工具中，右键 **上传并部署：云端安装依赖**：

| 云函数 | 作用 |
|--------|------|
| **saveContent** | 保存文字到数据库 |
| **getContent** | 读取文字并返回 HTML 网页 |

## 四、配置 HTTP 访问服务（关键）

1. 打开 [云开发控制台](https://console.cloud.tencent.com/tcb) 或开发者工具 → 云开发控制台
2. 选择环境 `cloudbase-d3gvp0ik1820edd8d`
3. 左侧 **HTTP 访问服务**
4. 若无默认域名，先 **开通默认域名**
5. **新建** → 关联资源选 **云函数 getContent** → 路径 `/getContent` → 方法 **GET**
6. 复制 HTTP 地址，例如：
   ```
   https://xxxx.service.tcloudbase.com/getContent
   ```

## 五、填写 config/cloud.js

```javascript
module.exports = {
  envId: 'cloudbase-d3gvp0ik1820edd8d',
  contentBaseUrl: 'https://你的地址/getContent'  // 不含 ?id=
}
```

## 六、验证

1. 浏览器访问：`https://你的地址/getContent?id=某条记录id`
2. 小程序输入文字 → 生成二维码 → 应显示**方形 QR**
3. 微信扫一扫 → 打开网页显示文字

---

## 常见问题

**Q: 提示请配置 contentBaseUrl**  
A: 完成第四步，把 HTTP 地址填入 `config/cloud.js`

**Q: 报错 `HTTPSERVICE_NONACTIVATED` / HTTPService is not activated**  
A: **HTTP 访问服务总开关未开启**。按顺序操作：

1. 打开 [云开发控制台](https://console.cloud.tencent.com/tcb) → 环境 `cloudbase-d3gvp0ik1820edd8d`
2. 左侧 **HTTP 访问服务**（或 **HTTP 网关**）
3. 页面顶部找到 **全局开关** → **开启**
4. 开启后再 **新建路由**：关联 `getContent`，路径 `/getContent`，方法 GET
5. 若开启时报 `FreePackageDenied`，需先升级云开发为**付费套餐**

**Q: 控制台报 FreePackageDenied，无法配置 HTTP**  
A: 需升级云开发为付费套餐后才能使用 HTTP 访问服务

**Q: 报错 `Cannot find module 'wx-server-sdk'` (-504002)**  
A: 右键云函数 → **上传并部署：云端安装依赖**

**Q: saveContent 报错 errCode -1**  
A: 重新部署 saveContent，并确认已创建 `qr_contents` 集合

**Q: 扫码 404**  
A: 检查 `contentBaseUrl` 是否与控制台一致；`getContent` 是否已部署

**Q: 扫码收款码合并/名片，页面显示 JSON 或纯文本**  
A: 云端 **getContent 云函数未更新**。请在微信开发者工具中：  
`cloudfunctions/getContent` → 右键 → **上传并部署：云端安装依赖**  
部署成功后重新扫码（无需重新生成二维码），页面应显示收款码图片或名片信息。

**Q: 输入网址还要走云端吗？**  
A: 不会。以 `http://` 或 `https://` 开头的内容直接生成网址二维码。
