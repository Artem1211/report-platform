import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { Trash } from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'react-toastify';

import { deleteTemplate } from '@/shared/api/methods/reports';
import { reportQueries } from '@/shared/api/query/reports-queries';

interface Props {
  templateId: string;
}

export function DeleteTemplateButton({ templateId }: Props) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportQueries.lists() });
      toast.success('Шаблон удалён');
      setOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Произошла ошибка');
    },
  });

  return (
    <>
      <IconButton size="small" onClick={() => setOpen(true)}>
        <Trash size={16} />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Удалить шаблон?</DialogTitle>
        <DialogContent>Все запуски этого шаблона будут удалены вместе с ним.</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button color="error" variant="contained" onClick={() => mutate()} disabled={isPending}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
