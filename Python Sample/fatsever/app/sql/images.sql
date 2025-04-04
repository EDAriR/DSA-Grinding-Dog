-- 建立 message_images 表（如果不存在）
CREATE TABLE IF NOT EXISTS message_images (
    id             VARCHAR(50) PRIMARY KEY,              -- LINE 提供的圖片ID（對應 message.id）
    image_set_id   VARCHAR(100),                         -- 圖片集合ID（多圖時用）
    image_index    INT,                                  -- 該圖在集合中的順序
    image_total    INT,                                  -- 該集合總圖數
    name           VARCHAR(255),                         -- 檔名（可存為實體儲存的檔名）
    extension      VARCHAR(10) NOT NULL DEFAULT 'jpg',   -- 副檔名（通常為 jpg）
    path           VARCHAR(255),                         -- 儲存路徑
    downloaded     BOOLEAN DEFAULT FALSE,                -- 是否已下載
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- 建立時間
);

-- 表註釋
COMMENT ON TABLE message_images IS '來自 LINE 的圖片訊息表（多圖訊息可用 image_set_id 組合）';

-- 欄位註釋
COMMENT ON COLUMN message_images.id           IS 'LINE 提供的 message.id，作為圖片唯一識別 ID';
COMMENT ON COLUMN message_images.image_set_id IS '圖片集合ID（多張圖為一組）';
COMMENT ON COLUMN message_images.image_index  IS '該圖片在集合中的索引';
COMMENT ON COLUMN message_images.image_total  IS '該組合圖片的總數';
COMMENT ON COLUMN message_images.name         IS '儲存用的檔名（可為原始圖名或自定義）';
COMMENT ON COLUMN message_images.extension    IS '圖片副檔名，例如 jpg、png';
COMMENT ON COLUMN message_images.path         IS '圖片實體儲存路徑';
COMMENT ON COLUMN message_images.downloaded   IS '是否已下載圖片內容';
COMMENT ON COLUMN message_images.created_at   IS '紀錄建立時間';
