import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';

import type { ReportData } from './run.types';
import { StorageService } from './storage.service';

@Injectable()
export class XlsxRenderer {
  constructor(private readonly storage: StorageService) {}

  async render(runId: string, data: ReportData): Promise<string> {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Report');
    sheet.columns = data.columns.map((col) => ({ header: col.label, key: col.key, width: 20 }));
    sheet.addRows(data.rows);

    const buffer = await workbook.xlsx.writeBuffer();
    return this.storage.save(`${runId}.xlsx`, Buffer.from(buffer));
  }
}
