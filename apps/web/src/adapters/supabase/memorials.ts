import type { DatePrecision, MemorialInput } from '@memorial-garden/shared';
import {
  MemorialError,
  type Memorial,
  type MemorialRepository,
  type MemorialStatus,
} from '@/core/memorial';
import type { AppSupabaseClient } from './client';

const COLUMNS =
  'id, slug, owner_id, full_name, born_date, born_precision, died_date, died_precision, epitaph, status';

type MemorialRow = {
  id: string;
  slug: string;
  owner_id: string | null;
  full_name: string;
  born_date: string | null;
  born_precision: DatePrecision | null;
  died_date: string;
  died_precision: DatePrecision;
  epitaph: string | null;
  status: MemorialStatus;
};

function toMemorial(row: MemorialRow): Memorial {
  return {
    id: row.id,
    slug: row.slug,
    ownerId: row.owner_id,
    fullName: row.full_name,
    born:
      row.born_date && row.born_precision
        ? { date: row.born_date, precision: row.born_precision }
        : null,
    died: { date: row.died_date, precision: row.died_precision },
    epitaph: row.epitaph,
    status: row.status,
  };
}

function toColumns(input: MemorialInput) {
  return {
    full_name: input.fullName,
    born_date: input.born?.date ?? null,
    born_precision: input.born?.precision ?? null,
    died_date: input.died.date,
    died_precision: input.died.precision,
    epitaph: input.epitaph,
  };
}

function toError(error: { hint?: string | null }): MemorialError {
  if (error.hint === 'draft_limit') return new MemorialError('draft_limit');
  if (error.hint === 'sharing_closed') return new MemorialError('sharing_closed');
  return new MemorialError('unknown');
}

export function createSupabaseMemorials(client: AppSupabaseClient): MemorialRepository {
  return {
    async create(ownerId, input) {
      const { data, error } = await client
        .from('memorials')
        .insert({ owner_id: ownerId, ...toColumns(input) })
        .select(COLUMNS)
        .single();
      if (error) throw toError(error);
      return toMemorial(data);
    },

    async update(id, input) {
      const { data, error } = await client
        .from('memorials')
        .update(toColumns(input))
        .eq('id', id)
        .select(COLUMNS)
        .single();
      if (error) throw toError(error);
      return toMemorial(data);
    },

    async getBySlug(slug) {
      const { data, error } = await client
        .from('memorials')
        .select(COLUMNS)
        .eq('slug', slug)
        .limit(1);
      if (error) throw toError(error);
      return data[0] ? toMemorial(data[0]) : null;
    },

    async listMine(ownerId) {
      const { data, error } = await client
        .from('memorials')
        .select(COLUMNS)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });
      if (error) throw toError(error);
      return data.map(toMemorial);
    },

    async publish(id) {
      const { data, error } = await client.rpc('publish_memorial', { memorial_id: id });
      if (error) throw toError(error);
      return data;
    },
  };
}
