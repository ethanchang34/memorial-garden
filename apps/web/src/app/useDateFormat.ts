import {
  formatLifespan,
  formatMemorialDate,
  formatTimestamp,
  type DateLabels,
  type MemorialDate,
} from '@memorial-garden/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useDateFormat() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? 'en';

  return useMemo(() => {
    const labels: DateLabels = { circa: (year) => t('dates.circa', { year }) };

    return {
      memorialDate: (value: MemorialDate) => formatMemorialDate(value, locale, labels),
      lifespan: (born: MemorialDate | null, died: MemorialDate) =>
        formatLifespan(born, died, locale, labels),
      timestamp: (value: string) => formatTimestamp(value, locale),
    };
  }, [locale, t]);
}
