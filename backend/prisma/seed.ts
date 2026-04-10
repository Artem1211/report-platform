import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ENTERPRISES = ['АТП Северное', 'ООО Транспорт Юг', 'ИП Иванов А.В.', 'ЗАО ДорТранс'];
const SPECIALIZATIONS = ['therapist', 'cardiologist', 'ophthalmologist', 'neurologist'];
const STATUSES = ['valid', 'expired', 'revoked'];
const DOCTOR_NAMES = [
  'Иванов И.И.',
  'Петрова А.С.',
  'Сидоров В.Н.',
  'Козлова М.А.',
  'Новиков Д.О.',
  'Морозова Е.В.',
  'Волков А.П.',
  'Алексеева Н.Ю.',
];
const WORKER_NAMES = [
  'Смирнов А.В.',
  'Кузнецов П.И.',
  'Попов Е.С.',
  'Соколов М.Н.',
  'Лебедев О.Д.',
  'Козлов В.А.',
  'Новикова Т.П.',
  'Морозов С.Е.',
  'Федоров Н.В.',
  'Михайлов А.И.',
  'Захаров Д.С.',
  'Романов К.Л.',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const REPORT_TEMPLATES = [
  {
    type: 'exam_events_clickhouse',
    name: 'Осмотры по периоду (ClickHouse)',
    description: 'Статистика прохождения медосмотров за выбранный период из аналитической БД',
    paramsSchema: {
      dateFrom: { type: 'date', label: 'Дата от', required: true },
      dateTo: { type: 'date', label: 'Дата до', required: false },
    },
    sourceConfig: {
      type: 'sql',
      db: 'clickhouse',
      dateField: 'exam_date',
      query:
        'SELECT exam_date, enterprise, status, count() as total, avg(duration_sec) as avg_duration FROM exam_events GROUP BY exam_date, enterprise, status ORDER BY exam_date DESC',
    },
  },
  {
    type: 'medical_certificates_postgres',
    name: 'Медицинские справки (PostgreSQL)',
    description: 'Реестр выданных медицинских справок сотрудников предприятий',
    paramsSchema: {
      dateFrom: { type: 'date', label: 'Дата от', required: true },
      dateTo: { type: 'date', label: 'Дата до', required: false },
    },
    sourceConfig: {
      type: 'sql',
      db: 'postgres',
      dateField: 'issuedAt',
      query: 'SELECT * FROM "MedicalCertificate"',
    },
  },
  {
    type: 'weather_moscow_api',
    name: 'Погода в Москве (Open-Meteo)',
    description: 'Прогноз температуры и осадков на 14 дней из открытого API',
    paramsSchema: {},
    sourceConfig: {
      type: 'api',
      url: 'https://api.open-meteo.com/v1/forecast?latitude=55.75&longitude=37.62&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=14&timezone=Europe/Moscow',
    },
  },
];

async function main() {
  for (const t of REPORT_TEMPLATES) {
    const existing = await prisma.reportTemplate.findFirst({ where: { type: t.type } });
    if (existing) {
      await prisma.reportTemplate.update({
        where: { id: existing.id },
        data: {
          name: t.name,
          description: t.description,
          paramsSchema: t.paramsSchema as object,
          sourceConfig: t.sourceConfig as object,
        },
      });
    } else {
      await prisma.reportTemplate.create({
        data: {
          ...t,
          paramsSchema: t.paramsSchema as object,
          sourceConfig: t.sourceConfig as object,
        },
      });
    }
  }

  const existingCount = await prisma.medicalCertificate.count();
  if (existingCount > 0) {
    console.log(`Skipping MedicalCertificate seed: ${existingCount} rows already exist`);
    return;
  }

  const start = new Date('2024-01-01');
  const end = new Date('2026-04-30');
  const batchSize = 1000;
  const total = 5000;

  for (let i = 0; i < total; i += batchSize) {
    const data = Array.from({ length: Math.min(batchSize, total - i) }, () => {
      const issuedAt = randomDate(start, end);
      const validUntil = new Date(issuedAt);
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      return {
        issuedAt,
        enterprise: randomItem(ENTERPRISES),
        doctorName: randomItem(DOCTOR_NAMES),
        specialization: randomItem(SPECIALIZATIONS),
        workerName: randomItem(WORKER_NAMES),
        validUntil,
        status: randomItem(STATUSES),
      };
    });

    await prisma.medicalCertificate.createMany({ data });
  }

  console.log(`Seeded ${total} medical certificates`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
