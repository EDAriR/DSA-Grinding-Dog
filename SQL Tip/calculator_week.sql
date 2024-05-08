-- postgres

-- PARAM can use psql -v PARAM='20240101' 
-- 8週間計算

WITH NOW AS ( 
    SELECT generate_series(
        cast(:'PARAM' as date) - INTERVAL '8 weeks',
        cast(:'PARAM' as date) - INTERVAL '1 day',
        '1 week'::interval
    ) AS week_start,
     generate_series(
        cast(:'PARAM' as date) - INTERVAL '7 weeks',
        cast(:'PARAM' as date) - INTERVAL '1 day' + INTERVAL '1 week',
        '1 week'::interval
    ) AS week_end,
    cast(:'PARAM' as date) today
)