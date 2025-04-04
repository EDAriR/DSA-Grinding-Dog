-- 建立 messages 表（如果不存在）
CREATE TABLE IF NOT EXISTS messages (
    message_id    VARCHAR(50) PRIMARY KEY,              -- LINE訊息ID
    type          VARCHAR(10) NOT NULL,                 -- 訊息種類（text, image）
    text          TEXT,                                 -- 文字訊息內容（僅限 type=text）
    timestamp     BIGINT NOT NULL,                      -- 訊息時間戳（毫秒）
    group_id      VARCHAR(50) NOT NULL,                 -- 群組ID
    user_id       VARCHAR(50) NOT NULL,                 -- 發送者使用者ID
    reply_token   VARCHAR(50),                          -- 回覆訊息用 token
    status        VARCHAR(10) DEFAULT 'active',         -- 訊息狀態（active, unsend）
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- 建立時間
);

-- 為 messages 表添加註釋
COMMENT ON TABLE messages IS 'LINE訊息主表';

-- 為每個欄位添加註釋
COMMENT ON COLUMN messages.message_id    IS 'LINE訊息ID';
COMMENT ON COLUMN messages.type          IS '訊息種類（text, image）';
COMMENT ON COLUMN messages.text          IS '文字訊息內容（僅限 type=text）';
COMMENT ON COLUMN messages.timestamp     IS '訊息時間戳（毫秒）';
COMMENT ON COLUMN messages.group_id      IS '群組ID';
COMMENT ON COLUMN messages.user_id       IS '發送者使用者ID';
COMMENT ON COLUMN messages.reply_token   IS '回覆訊息用 token';
COMMENT ON COLUMN messages.status        IS '訊息狀態（active, unsend）';
COMMENT ON COLUMN messages.created_at    IS '建立時間';