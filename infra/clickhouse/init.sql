CREATE TABLE IF NOT EXISTS exam_events
(
    id           UUID DEFAULT generateUUIDv4(),
    exam_date    Date,
    enterprise   String,
    status       Enum8('passed' = 1, 'failed' = 2, 'skipped' = 3),
    duration_sec UInt16
) ENGINE = MergeTree()
ORDER BY (exam_date, enterprise);

INSERT INTO exam_events (exam_date, enterprise, status, duration_sec)
SELECT
    toDate('2024-01-01') + toIntervalDay(rand(number) % 850) AS exam_date,
    ['АТП Северное', 'ООО Транспорт Юг', 'ИП Иванов А.В.', 'ЗАО ДорТранс'][1 + rand(number * 7) % 4] AS enterprise,
    ['passed', 'passed', 'passed', 'failed', 'skipped'][1 + rand(number * 13) % 5] AS status,
    toUInt16(180 + rand(number * 17) % 600) AS duration_sec
FROM numbers(10000);
