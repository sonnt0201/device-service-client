# Note Logi tại hiện trường

## Đơ và không chạy được ngay từ đầu:

- Do đóng của đột ngột, khi mở cửa hết cỡ thì chạy liên tục.

- Nguyên nhân do chùm dây đen quấn băng dính ở bản lề cửa (vặn hoặc tác động dây đen thì đơ).

## Device Service và Ncat tự dừng sau khi chạy được tầm 2 phút.

Trong trường hợp mở cửa hết cỡ, device gửi dữ liệu liên tục và bình thường:

- Sau khi chạy tầm 2 phút thì không đơ mà dừng, kết nối giữa device service và ncat bị mất.

- Chỉ cần bật lại Ncat là lại chạy bình thường (không cần chỉnh dây, cửa hay thiết bị)

## Thử mở app Logi để chạy

- Logi chạy bình thường, mở cửa hết cỡ thì chạy ổn, đóng cửa thì đơ (như đã trình bày ở trên)

- Em mở file log ra nhìn thì có vẻ sau vài phút thì device service và logi service cũng mất kết nối, nhưng tự động kết nối lại với nhau nên khi bật vòi bơm giao diện logi vẫn nhảy số bình thường