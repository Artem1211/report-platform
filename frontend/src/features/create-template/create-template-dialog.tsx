import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { createTemplate } from '@/shared/api/methods/reports';
import { reportQueries } from '@/shared/api/query/reports-queries';
import { Typography } from '@/shared/ui';

import { buildSourceConfig } from './build-source-config';
import styles from './styles.module.scss';
import type { FormValues } from './types';

const defaultValues: FormValues = {
  name: '',
  description: '',
  sourceType: 'sql',
  db: '',
  query: '',
  url: '',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateTemplateDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const { register, control, watch, handleSubmit, reset, setValue } = useForm<FormValues>({
    defaultValues,
  });
  const { data: datasources = [] } = useQuery({
    ...reportQueries.datasources(),
    enabled: open,
  });

  const [name, sourceType, db, url] = watch(['name', 'sourceType', 'db', 'url']);

  useEffect(() => {
    if (datasources.length > 0 && !datasources.find((d) => d.id === db) && datasources[0]) {
      setValue('db', datasources[0].id);
    }
  }, [datasources, db, setValue]);

  const selectedDs = datasources.find((d) => d.id === db);
  const sqlPlaceholder = selectedDs?.defaultQuery ?? 'SELECT *';

  const isValid = name.trim().length > 0 && (sourceType !== 'api' || url.trim().length > 0);

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      createTemplate({
        name: values.name,
        description: values.description,
        sourceConfig: buildSourceConfig(values, selectedDs?.dateField),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportQueries.lists() });
      toast.info('Шаблон успешно создан');
      reset(defaultValues);
      onClose();
    },
    onError: (error) => {
      console.error(error);
      toast.error('Произошла ошибка');
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Новый шаблон</DialogTitle>
      <DialogContent className={styles.content}>
        <TextField label="Название" required fullWidth {...register('name')} />
        <TextField label="Описание" fullWidth {...register('description')} />

        <FormControl>
          <FormLabel>Источник данных</FormLabel>
          <Controller
            name="sourceType"
            control={control}
            render={({ field }) => (
              <RadioGroup row {...field}>
                <FormControlLabel value="sql" control={<Radio />} label="SQL" />
                <FormControlLabel value="api" control={<Radio />} label="REST API" />
                <FormControlLabel value="file" control={<Radio />} label="Файл" />
              </RadioGroup>
            )}
          />
        </FormControl>

        {sourceType === 'sql' && (
          <>
            <FormControl fullWidth>
              <InputLabel>База данных</InputLabel>
              <Controller
                name="db"
                control={control}
                render={({ field }) => (
                  <Select label="База данных" {...field}>
                    {datasources.map((ds) => (
                      <MenuItem key={ds.id} value={ds.id} sx={{ gap: 1 }}>
                        {ds.label}
                        <Chip
                          label={ds.engine}
                          size="small"
                          color={ds.engine === 'clickhouse' ? 'warning' : 'info'}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
            <TextField
              label="SQL запрос"
              fullWidth
              multiline
              rows={6}
              placeholder={sqlPlaceholder}
              slotProps={{
                htmlInput: { style: { fontFamily: 'monospace', fontSize: 13 } },
              }}
              {...register('query')}
            />
          </>
        )}

        {sourceType === 'api' && (
          <TextField
            label="URL эндпоинта"
            required
            fullWidth
            placeholder="https://api.example.com/data"
            {...register('url')}
          />
        )}

        {sourceType === 'file' && (
          <Typography variant="caption">
            Файл CSV или XLSX будет загружаться при каждом запуске отчёта.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          variant="contained"
          onClick={handleSubmit((v) => mutate(v))}
          disabled={isPending || !isValid}
        >
          {isPending ? <CircularProgress size={16} /> : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
