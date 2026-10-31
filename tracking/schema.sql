CREATE TABLE IF NOT EXISTS tracking_daily (
 day TEXT NOT NULL,
 item TEXT NOT NULL,
 event TEXT NOT NULL,
 count INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(day,item,event)
);
