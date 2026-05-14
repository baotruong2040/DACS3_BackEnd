# Flow.md

Tài liệu này mô tả luồng hoạt động hiện tại của backend, vai trò của từng nhóm file, và những chức năng đã được triển khai.

## 1. Luồng tổng quát

Luồng request của hệ thống đi theo thứ tự:

`Client -> src/app.js -> routes -> middleware -> controllers -> services/db -> response`

1. `src/app.js` khởi tạo Express, gắn CORS, JSON parser, logger, health check, router chính, handler 404 và handler lỗi.
2. `src/routes/index.js` gom tất cả router theo domain.
3. Mỗi router gắn middleware xác thực, phân quyền, validate request trước khi vào controller.
4. Controller xử lý business logic, gọi DB hoặc service.
5. `src/db/query.js` và `src/db/pool.js` là lớp truy cập MySQL.
6. `src/utils/response.js` trả về JSON theo envelope thống nhất.

---

## 2. Vai trò từng file / thư mục chính

### `src/app.js`
File khởi tạo ứng dụng Express.

Đang làm:
- `cors()`
- `express.json()`
- `morgan("dev")`
- `app.set("trust proxy", true)` để dựng URL đúng sau proxy/HTTPS
- serve static `/uploads`
- route `GET /health`
- mount `/api`
- gắn `notFoundHandler`
- gắn `errorHandler`

### `src/server.js`
File chạy server thực tế.

Đang làm:
- gọi `initializeFirebase()`
- kiểm tra kết nối DB bằng `SELECT 1`
- `app.listen(...)`
- bắt `SIGINT` và `SIGTERM`
- đóng pool khi shutdown

### `src/routes/`
Chứa router theo domain.

- `index.js`: gom toàn bộ router con
- `authRoutes.js`: đăng ký / đăng nhập
- `catalogRoutes.js`: sản phẩm, danh mục
- `ordersRoutes.js`: đơn hàng
- `notificationsRoutes.js`: thông báo
- `usersRoutes.js`: quản lý staff/user
- `reportsRoutes.js`: báo cáo

### `src/controllers/`
Chứa business logic chính.

- `authController.js`: register, login
- `catalogController.js`: list/get/create/update product, list/create category
- `ordersController.js`: tạo đơn, xem đơn, đổi trạng thái đơn
- `notificationsController.js`: list notification, đánh dấu đã đọc
- `usersController.js`: list staff, tạo staff, cập nhật user
- `reportsController.js`: báo cáo doanh thu, top sản phẩm

### `src/services/`
Chứa logic hỗ trợ dùng lại.

- `authService.js`: hash password, verify password, ký JWT
- `notificationService.js`: tạo notification, gửi thông báo cho staff
- `fcmService.js`: khởi tạo Firebase và gửi push kiểu fire-and-forget
- `publicUrl.js`: tạo URL tuyệt đối cho ảnh đã upload

### `src/middleware/`
Chứa các lớp xử lý trước/sau controller.

- `authenticate.js`: đọc Bearer token, verify JWT, gắn `req.user`
- `authorize.js`: kiểm tra role tối thiểu
- `validate.js`: parse body/params/query bằng Zod
- `uploadImage.js`: nhận file `image` từ `multipart/form-data`, lưu vào `uploads/`
- `errorHandler.js`: format lỗi operational và lỗi hệ thống
- `notFound.js`: trả 404 cho route không tồn tại

### `src/validators/`
Chứa schema Zod cho request.

- `authValidator.js`
- `catalogValidator.js`
- `orderValidator.js`
- `notificationValidator.js`
- `reportValidator.js`
- `userValidator.js`

### `src/db/`
Lớp truy cập dữ liệu MySQL.

- `pool.js`: tạo connection pool
- `query.js`: `executeQuery()` và `withTransaction()`
- `migrations/001_init.sql`: schema hiện tại

### `src/utils/`
Các helper dùng chung.

- `response.js`: `successResponse()` và `errorResponse()`
- `appError.js`: chuẩn lỗi nghiệp vụ
- `asyncHandler.js`: bọc async controller
- `logger.js`: log info/warn/error

### `src/constants/`
Hằng số nghiệp vụ.

- `roles.js`: `CUSTOMER`, `STAFF`, `ADMIN`
- `orderStatus.js`: trạng thái đơn và transition hợp lệ

---

## 3. Các chức năng hiện có

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Catalog
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `GET /api/categories`
- `POST /api/categories`

### Orders
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PUT /api/orders/:id/status`

### Notifications
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`

### Users
- `GET /api/users`
- `POST /api/users/staff`
- `PUT /api/users/:id`

### Reports
- `GET /api/reports/revenue`
- `GET /api/reports/top-products`

### Health
- `GET /health`

---

## 4. Luồng xử lý từng nghiệp vụ chính

### Đăng ký / đăng nhập
1. Router nhận request.
2. `validate()` kiểm tra body bằng schema Zod.
3. Controller gọi `authService`.
4. Password được hash bằng bcrypt.
5. Login trả JWT, `user_id`, `role`.

### Tạo đơn hàng
1. `authenticate()` xác định customer.
2. `authorize(ROLES.CUSTOMER)` chặn role khác.
3. `validate()` kiểm tra danh sách items và địa chỉ.
4. Controller gom item trùng product.
5. Query sản phẩm từ DB, kiểm tra tồn tại và `is_available`.
6. Tính `total_amount` ở server.
7. `withTransaction()` tạo `orders` và `order_details`.
8. `notificationService` tạo thông báo cho staff.
9. `fcmService` gửi push không chặn HTTP response.

### Cập nhật trạng thái đơn
1. `authenticate()` + `authorize(ROLES.STAFF)`.
2. Validate `id` và `status`.
3. Kiểm tra đơn có tồn tại.
4. So sánh transition bằng `isValidStatusTransition()`.
5. Update DB.
6. Tạo notification cho customer.
7. Gửi push FCM fire-and-forget.

### Xem thông báo
1. `authenticate()`.
2. Query notification theo `req.user.id`.
3. Trả danh sách mới nhất trước.

### Báo cáo
1. `authenticate()` + `authorize(ROLES.ADMIN)`.
2. Validate query `period/from/to/limit`.
3. Query tổng hợp doanh thu hoặc top sản phẩm từ orders/order_details.

---

## 5. Quy ước quan trọng đang dùng

- Response luôn theo envelope:
  - `status`
  - `message`
  - `data`
- Controller async nên bọc bằng `asyncHandler()`.
- Lỗi nghiệp vụ nên throw `AppError`.
- SQL dùng query parameter, tránh nối chuỗi trực tiếp cho dữ liệu đầu vào.
- Các write nhiều bước nên dùng transaction.
- `orders` là nguồn sự thật của trạng thái đơn; `order_details` snapshot giá tại thời điểm đặt hàng.
- Firebase push là phụ trợ, không được làm chậm response.

---

## 6. Sequence chi tiết theo từng endpoint

### `GET /health`
1. Request đi vào `src/app.js`.
2. Express match route `app.get("/health", ...)`.
3. Không qua auth/validate/controller.
4. Handler trả ngay JSON envelope:
   - `status: "success"`
   - `message: "Service is healthy"`
   - `data: {}`

### `POST /api/auth/register`
1. Router: `src/routes/authRoutes.js`.
2. `validate({ body: registerSchema })` parse body bằng `src/validators/authValidator.js`.
3. `asyncHandler(register)` gọi `src/controllers/authController.js`.
4. `register()`:
   - đọc `username`, `password`, `full_name`, `email`, `phone`, `address`
   - gọi `executeQuery()` để kiểm tra username/email đã tồn tại chưa
   - nếu có thì throw `AppError(409)`
   - gọi `hashPassword()` trong `src/services/authService.js`
   - gọi `executeQuery()` để insert vào bảng `users`
5. Controller trả về `successResponse()` với `user_id` và `role`.

### `POST /api/auth/login`
1. Router: `src/routes/authRoutes.js`.
2. `validate({ body: loginSchema })`.
3. `asyncHandler(login)`.
4. `login()`:
   - query `users` bằng `executeQuery()` theo `username`
   - nếu không có user -> throw `AppError(401)`
   - gọi `verifyPassword()` để so sánh mật khẩu
   - nếu sai -> throw `AppError(401)`
   - gọi `signAccessToken()` để tạo JWT
5. Trả `successResponse()` với `token`, `user_id`, `role`.

### `GET /api/products`
1. Router: `src/routes/catalogRoutes.js`.
2. Không cần auth.
3. `asyncHandler(listProducts)`.
4. `listProducts()` gọi `executeQuery()` với `INNER JOIN categories`.
5. Chỉ lấy sản phẩm `p.is_available = TRUE`.
6. Trả `successResponse()` với danh sách sản phẩm.

### `GET /api/products/:id`
1. Router: `catalogRoutes.js`.
2. `validate({ params: idParamSchema })` ép `id` về số nguyên dương.
3. `asyncHandler(getProductById)`.
4. `getProductById()`:
   - gọi `executeQuery()` join `products` + `categories`
   - chỉ lấy sản phẩm available
   - nếu không có row -> throw `AppError(404)`
5. Trả `successResponse()` với 1 sản phẩm.

### `POST /api/products`
1. Router: `catalogRoutes.js`.
2. `authenticate()` xác thực JWT.
3. `authorize(ROLES.ADMIN)` chặn role thấp hơn.
4. `uploadProductImage()` nhận file `image` nếu request là `multipart/form-data`.
5. `validate({ body: createProductSchema })`.
6. `asyncHandler(createProduct)`.
7. `createProduct()`:
   - lấy `category_id` từ body
   - gọi `executeQuery()` kiểm tra category có tồn tại không
   - nếu không có -> throw `AppError(404)`
   - nếu có upload file thì dùng `buildPublicUrl()` để đổi đường dẫn nội bộ thành URL public
   - gọi `executeQuery()` insert vào `products`
8. Trả `successResponse()` với `product_id`.

### `PUT /api/products/:id`
1. Router: `catalogRoutes.js`.
2. `authenticate()`.
3. `authorize(ROLES.ADMIN)`.
4. `uploadProductImage()` nhận file `image` nếu request là `multipart/form-data`.
5. `validate({ params: idParamSchema, body: updateProductSchema })`.
6. `asyncHandler(updateProduct)`.
7. `updateProduct()`:
   - kiểm tra product có tồn tại không bằng `executeQuery()`
   - nếu cập nhật `category_id` thì kiểm tra category tồn tại
   - build `SET field = ?` động từ các field trong body
   - nếu có upload file thì ghi đè `image_url` bằng URL public mới
   - gọi `executeQuery()` update `products`
8. Trả `successResponse()` với `product_id`.

### `GET /api/categories`
1. Router: `catalogRoutes.js`.
2. Không cần auth.
3. `asyncHandler(listCategories)`.
4. `listCategories()` query bảng `categories`.
5. Trả `successResponse()` với danh sách category.

### `POST /api/categories`
1. Router: `catalogRoutes.js`.
2. `authenticate()`.
3. `authorize(ROLES.ADMIN)`.
4. `uploadCategoryImage()` nhận file `image` nếu request là `multipart/form-data`.
5. `validate({ body: createCategorySchema })`.
6. `asyncHandler(createCategory)`.
7. `createCategory()`:
   - nếu có upload file thì dùng `buildPublicUrl()` để tạo URL public
   - insert vào `categories`
8. Trả `successResponse()` với `category_id`.

### `POST /api/orders`
1. Router: `src/routes/ordersRoutes.js`.
2. `authenticate()` lấy `req.user`.
3. `authorize(ROLES.CUSTOMER)` chỉ cho customer tạo đơn.
4. `validate({ body: createOrderSchema })`.
5. `asyncHandler(createOrder)`.
6. `createOrder()`:
   - đọc `req.user.id`, `delivery_address`, `items`
   - gọi `normalizeItems()` để gộp item trùng `product_id`
   - tạo danh sách `productIds`
   - gọi `executeQuery()` lấy `id`, `price`, `is_available` từ `products`
   - tạo `productMap` để tra nhanh
   - loop qua từng item:
     - nếu product không tồn tại -> throw `AppError(404)`
     - nếu `is_available = false` -> throw `AppError(400)`
   - tính `totalAmount`
   - gọi `withTransaction()`:
     - insert vào `orders`
     - lấy `insertId`
     - insert từng dòng vào `order_details` với `price_at_order`
     - gọi `notifyStaffNewOrder()` để tạo notification cho toàn bộ staff
   - sau transaction xong, gọi `fireAndForgetPush()` từ `src/services/fcmService.js`
7. Trả `successResponse()` với `order_id`, `total_amount`, `status`.

### `GET /api/orders`
1. Router: `ordersRoutes.js`.
2. `authenticate()`.
3. `authorize(ROLES.STAFF)` cho staff/admin theo rank.
4. `validate({ query: listOrdersQuerySchema })`.
5. `asyncHandler(listOrders)`.
6. `listOrders()`:
   - lấy `status`, `page`, `page_size`
   - tính `offset`
   - build `WHERE` nếu có `status`
   - query danh sách orders bằng `executeQuery()`
   - query `COUNT(*)` để lấy tổng số
7. Trả `successResponse()` với `items`, `page`, `page_size`, `total`.

### `GET /api/orders/:id`
1. Router: `ordersRoutes.js`.
2. `authenticate()`.
3. `validate({ params: orderIdParamSchema })`.
4. `asyncHandler(getOrderById)`.
5. `getOrderById()`:
   - query bảng `orders` theo `id`
   - nếu không có -> throw `AppError(404)`
   - nếu user là `CUSTOMER` và `req.user.id !== order.user_id` -> throw `AppError(403)`
   - query `order_details` theo `order_id`
6. Trả `successResponse()` với order và `items`.

### `PUT /api/orders/:id/status`
1. Router: `ordersRoutes.js`.
2. `authenticate()`.
3. `authorize(ROLES.STAFF)`.
4. `validate({ params: orderIdParamSchema, body: updateOrderStatusSchema })`.
5. `asyncHandler(updateOrderStatus)`.
6. `updateOrderStatus()`:
   - query `orders` theo `id`
   - nếu không có -> throw `AppError(404)`
   - gọi `isValidStatusTransition(order.status, nextStatus)`
   - nếu sai -> throw `AppError(422)`
   - gọi `executeQuery()` để update status
   - gọi `createNotification()` để tạo notification cho customer
   - gọi `fireAndForgetPush()` để push thông báo
7. Trả `successResponse()` với `order_id` và `new_status`.

### `GET /api/notifications`
1. Router: `notificationsRoutes.js`.
2. `authenticate()`.
3. `asyncHandler(listNotifications)`.
4. `listNotifications()`:
   - query bảng `notifications` theo `req.user.id`
   - order theo `created_at DESC`
5. Trả `successResponse()` với danh sách notification.

### `PUT /api/notifications/:id/read`
1. Router: `notificationsRoutes.js`.
2. `authenticate()`.
3. `validate({ params: notificationIdParamSchema })`.
4. `asyncHandler(markNotificationRead)`.
5. `markNotificationRead()`:
   - query notification theo `id` và `user_id`
   - nếu không có -> throw `AppError(404)`
   - update `is_read = TRUE`
6. Trả `successResponse()` với `notification_id`, `is_read: true`.

### `GET /api/users`
1. Router: `usersRoutes.js`.
2. `authenticate()`.
3. `authorize(ROLES.ADMIN)`.
4. `asyncHandler(listStaff)`.
5. `listStaff()` query bảng `users` với `role = STAFF`.
6. Trả `successResponse()` với danh sách staff.

### `POST /api/users/staff`
1. Router: `usersRoutes.js`.
2. `authenticate()`.
3. `authorize(ROLES.ADMIN)`.
4. `validate({ body: createStaffSchema })`.
5. `asyncHandler(createStaff)`.
6. `createStaff()`:
   - kiểm tra username/email tồn tại chưa
   - hash password bằng `hashPassword()`
   - insert user với `role = STAFF`
7. Trả `successResponse()` với `user_id` và `role`.

### `PUT /api/users/:id`
1. Router: `usersRoutes.js`.
2. `authenticate()`.
3. `authorize(ROLES.ADMIN)`.
4. `validate({ params: userIdParamSchema, body: updateUserSchema })`.
5. `asyncHandler(updateUser)`.
6. `updateUser()`:
   - kiểm tra user tồn tại bằng `executeQuery()`
   - build `SET` động từ payload
   - gọi `executeQuery()` update `users`
7. Trả `successResponse()` với `user_id`.

### `GET /api/reports/revenue`
1. Router: `reportsRoutes.js`.
2. `authenticate()`.
3. `authorize(ROLES.ADMIN)`.
4. `validate({ query: revenueReportQuerySchema })`.
5. `asyncHandler(getRevenueReport)`.
6. `getRevenueReport()`:
   - xác định biểu thức group by qua `getGroupByExpr(period)`
   - query `orders`
   - nhóm theo ngày/tuần/tháng
   - loại đơn `CANCELLED`
7. Trả `successResponse()` với `items`.

### `GET /api/reports/top-products`
1. Router: `reportsRoutes.js`.
2. `authenticate()`.
3. `authorize(ROLES.ADMIN)`.
4. `validate({ query: topProductsQuerySchema })`.
5. `asyncHandler(getTopProductsReport)`.
6. `getTopProductsReport()`:
   - query join `order_details`, `orders`, `products`
   - tính `total_quantity` và `total_revenue`
   - loại đơn `CANCELLED`
   - giới hạn số dòng theo `limit`
7. Trả `successResponse()` với `items`.
