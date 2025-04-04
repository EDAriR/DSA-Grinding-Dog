-- 建立 message_images 表（如果不存在）
CREATE TABLE IF NOT EXISTS message_images (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- 圖片主鍵
    message_id     VARCHAR(50) NOT NULL,                        -- 來源訊息ID
    name           VARCHAR(255) NOT NULL,                       -- 檔名或命名標籤
    extension      VARCHAR(10)  NOT NULL,                       -- 圖片副檔名（例如 jpg, png）
    image_data     BYTEA,                                       -- 圖片二進位資料
    path           VARCHAR(255),                                -- 圖片實體路徑（含副檔名）
    image_set_id   VARCHAR(100),                                -- LINE 原始圖片組合 ID
    image_index    INT,                                         -- 圖片在組合中的序號（1~total）
    image_total    INT,                                         -- 該圖片組合的總數
    tags           JSONB                                        -- 任意標籤
);

-- 為表添加註釋
COMMENT ON TABLE message_images IS 'LINE 圖片訊息用圖片表';

-- 為每個欄位添加註釋
COMMENT ON COLUMN message_images.id            IS '圖片主鍵 ID（UUID）';
COMMENT ON COLUMN message_images.message_id    IS '來源 LINE 訊息 ID';
COMMENT ON COLUMN message_images.name          IS '圖片名稱';
COMMENT ON COLUMN message_images.extension     IS '圖片副檔名（jpg, png 等）';
COMMENT ON COLUMN message_images.image_data    IS '圖片二進位資料';
COMMENT ON COLUMN message_images.path          IS '圖片儲存路徑（含副檔名）';
COMMENT ON COLUMN message_images.image_set_id  IS 'LINE 圖片組合 ID';
COMMENT ON COLUMN message_images.image_index   IS '圖片在該組合中的索引';
COMMENT ON COLUMN message_images.image_total   IS '該組圖片的總數';
COMMENT ON COLUMN message_images.tags          IS '圖片標籤（JSON 格式）';
