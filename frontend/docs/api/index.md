# API 文档

Vue Blog 提供了完整的 RESTful API，支持所有核心功能的操作。

## 基础信息

### 基础 URL
```
开发环境: http://localhost:3000/api
生产环境: https://api.yourdomain.com/api
```

### 认证方式
API 使用 JWT (JSON Web Token) 进行身份认证。

```http
Authorization: Bearer <your-jwt-token>
```

### 响应格式
所有 API 响应都遵循统一的格式：

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2023-12-01T10:00:00Z"
}
```

## HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 422 | 请求参数验证失败 |
| 500 | 服务器内部错误 |

## 分页

支持分页的 API 使用以下参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 10 | 每页数量 |
| sort | string | created_at | 排序字段 |
| order | string | desc | 排序方向 (asc/desc) |

分页响应格式：
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 搜索和过滤

### 搜索参数
| 参数 | 类型 | 说明 |
|------|------|------|
| q | string | 搜索关键词 |
| category | string | 分类筛选 |
| tags | string | 标签筛选 (逗号分隔) |
| author | string | 作者筛选 |
| status | string | 状态筛选 |

### 日期范围
| 参数 | 类型 | 说明 |
|------|------|------|
| start_date | string | 开始日期 (YYYY-MM-DD) |
| end_date | string | 结束日期 (YYYY-MM-DD) |

## 文件上传

文件上传使用 `multipart/form-data` 格式：

```http
POST /api/upload
Content-Type: multipart/form-data

file: <binary-data>
type: avatar|article|attachment
```

响应：
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/uploads/avatar/123.jpg",
    "filename": "avatar.jpg",
    "size": 102400,
    "type": "image/jpeg"
  }
}
```

## 限流

API 实施了限流策略：

| 类型 | 限制 |
|------|------|
| 匿名用户 | 100 请求/小时 |
| 认证用户 | 1000 请求/小时 |
| 管理员 | 5000 请求/小时 |

限流响应头：
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## WebSocket 连接

实时功能使用 WebSocket 连接：

```javascript
const ws = new WebSocket('ws://localhost:3000/ws')

// 认证
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your-jwt-token'
}))

// 订阅事件
ws.send(JSON.stringify({
  type: 'subscribe',
  events: ['comment', 'like', 'notification']
}))
```

## API 版本控制

API 支持版本控制，通过 URL 路径或请求头指定版本：

```http
# URL 路径方式
GET /api/v1/articles

# 请求头方式
GET /api/articles
Accept: application/vnd.api+json;version=1
```

## 缓存策略

API 响应包含缓存相关的 HTTP 头：

```http
Cache-Control: public, max-age=3600
ETag: "abc123"
Last-Modified: Wed, 01 Dec 2023 10:00:00 GMT
```

客户端可以使用条件请求：

```http
GET /api/articles/1
If-None-Match: "abc123"
If-Modified-Since: Wed, 01 Dec 2023 10:00:00 GMT
```

## 批量操作

支持批量操作的 API：

```http
POST /api/articles/batch
Content-Type: application/json

{
  "action": "delete",
  "ids": [1, 2, 3, 4, 5]
}
```

## 导出功能

支持数据导出：

```http
GET /api/articles/export?format=csv&start_date=2023-01-01&end_date=2023-12-31
Accept: text/csv
```

支持的格式：
- CSV
- JSON
- Excel (xlsx)

## 健康检查

系统提供健康检查端点：

```http
GET /health
```

响应：
```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T10:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "storage": "healthy"
  },
  "version": "1.0.0"
}