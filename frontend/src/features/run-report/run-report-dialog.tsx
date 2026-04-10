import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import type { ParamsFieldSchemaDto, ReportTemplateDto } from '@/shared/api';
import { createFileRun, createRun } from '@/shared/api/methods/runs';
import { runQueries } from '@/shared/api/query/runs-queries';
import { Typography } from '@/shared/ui';

import styles from './styles.module.scss';

interface Props {
  template: ReportTemplateDto;
  open: boolean;
  onClose: () => void;
}

function buildDefaultValues(
  schema: Record<string, ParamsFieldSchemaDto>,
): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(schema).map(([key, field]) => [key, field.default ?? '']),
  );
}

export function RunReportDialog({ template, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileChosen, setFileChosen] = useState(false);

  const schema = template.paramsSchema;
  const fields = Object.entries(schema).sort(([a], [b]) => {
    if (a === 'dateFrom') return -1;
    if (b === 'dateFrom') return 1;
    return 0;
  });

  const { register, handleSubmit, watch } = useForm({
    defaultValues: buildDefaultValues(schema),
  });

  const values = watch();

  const requiredFilled = fields
    .filter(([key, f]) => f.required && f.type !== 'file' && key !== 'dateTo')
    .every(([key]) => Boolean(values[key]));

  const datesValid =
    !values['dateFrom'] ||
    !values['dateTo'] ||
    String(values['dateFrom']) <= String(values['dateTo']);

  const isFormValid =
    requiredFilled && datesValid && (!fields.some(([, f]) => f.type === 'file') || fileChosen);

  const { mutate, isPending } = useMutation({
    mutationFn: (formValues: Record<string, string | number>) => {
      const file = fileRef.current?.files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('params', JSON.stringify(formValues));
        return createFileRun(template.id, formData);
      }
      return createRun(template.id, formValues);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: runQueries.all() });
      toast.info('Отчёт запущен');
      onClose();
    },
    onError: (error) => {
      console.error(error);
      toast.error('Произошла ошибка');
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{template.name}</DialogTitle>
      <DialogContent className={styles.content}>
        {fields.map(([key, field]) => {
          if (field.type === 'file') {
            return (
              <TextField
                key={key}
                label={field.label}
                type="file"
                required={field.required}
                inputRef={fileRef}
                onChange={() => setFileChosen((fileRef.current?.files?.length ?? 0) > 0)}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { accept: '.csv,.xlsx' },
                }}
                fullWidth
              />
            );
          }

          if (field.type === 'date') {
            return (
              <TextField
                key={key}
                label={field.label}
                type="date"
                required={field.required && key !== 'dateTo'}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                {...register(key)}
              />
            );
          }

          return (
            <TextField
              key={key}
              label={field.label}
              type="number"
              required={field.required}
              fullWidth
              {...register(key, { valueAsNumber: true })}
            />
          );
        })}
      </DialogContent>
      <DialogActions>
        {!datesValid && (
          <Typography variant="caption" className={styles.dateError}>
            Дата «с» не может быть позже даты «по»
          </Typography>
        )}
        <Button onClick={onClose}>Отмена</Button>
        <Button
          variant="contained"
          onClick={handleSubmit((v) => mutate(v))}
          disabled={isPending || !isFormValid}
        >
          {isPending ? <CircularProgress size={16} /> : 'Запустить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
