import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class StorageService {
  private readonly dir = join(process.cwd(), 'uploads');

  // Extension point: replace with S3/MinIO — change only this method, interface stays the same
  async save(filename: string, buffer: Buffer): Promise<string> {
    await mkdir(this.dir, { recursive: true });
    const filePath = join(this.dir, filename);
    await writeFile(filePath, buffer);
    return filePath;
  }
}
