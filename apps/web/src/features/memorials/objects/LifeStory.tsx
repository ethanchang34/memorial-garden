import {
  LIFE_STORY_MAX_LENGTH,
  lifeStoryParagraphs,
  lifeStoryProblem,
  normalizeLifeStory,
} from '@memorial-garden/shared';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { useDateFormat } from '@/app/useDateFormat';
import { Button } from '@/components/ui/button';
import { DrawerDescription } from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import type { Memorial } from '@/core/memorial';
import { useSession } from '@/features/auth/session';
import { cn } from '@/lib/utils';
import { useUpdateLifeStory } from '../useMemorials';

export function LifeStory({ memorial }: { memorial: Memorial }) {
  const { t } = useTranslation();
  const format = useDateFormat();
  const session = useSession();
  const [editing, setEditing] = useState(false);
  const isOwner = session.status === 'signed-in' && session.user.id === memorial.ownerId;
  const story = memorial.lifeStory;

  return (
    <div className="flex flex-col gap-4" data-life-story="">
      <div className="flex flex-col gap-1">
        <p className="font-display text-xl">{memorial.fullName}</p>
        <p className="text-muted-foreground">{format.lifespan(memorial.born, memorial.died)}</p>
      </div>
      {memorial.epitaph ? <p className="text-lg leading-relaxed">{memorial.epitaph}</p> : null}

      {editing ? (
        <StoryForm memorial={memorial} onDone={() => setEditing(false)} />
      ) : story ? (
        <>
          <DrawerDescription className="sr-only">
            {t('memorial.story.about', { name: memorial.fullName })}
          </DrawerDescription>
          <div className="flex flex-col gap-4 text-lg leading-relaxed">
            {lifeStoryParagraphs(story).map((paragraph, index) => (
              <p key={index} className="[overflow-wrap:anywhere] whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </>
      ) : (
        <DrawerDescription className="text-muted-foreground leading-relaxed">
          {isOwner
            ? t('memorial.story.ownerEmpty', { name: memorial.fullName })
            : t('memorial.objects.story.empty')}
        </DrawerDescription>
      )}

      {isOwner && !editing ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={story ? 'secondary' : 'default'}
            size="small"
            onClick={() => setEditing(true)}
          >
            {story ? t('memorial.story.edit') : t('memorial.story.write')}
          </Button>
          <Button asChild variant="ghost" size="small">
            <Link to={`/m/${memorial.slug}/edit`}>{t('memorial.edit.details')}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StoryForm({ memorial, onDone }: { memorial: Memorial; onDone: () => void }) {
  const { t } = useTranslation();
  const id = useId();
  const update = useUpdateLifeStory(memorial.slug);
  const [value, setValue] = useState(memorial.lifeStory ?? '');
  const [touched, setTouched] = useState(false);
  const problem = lifeStoryProblem(value);
  const length = [...normalizeLifeStory(value)].length;
  const showProblem = touched && problem !== null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (problem) return;
    const story = normalizeLifeStory(value);
    update.mutate(
      { id: memorial.id, story: story === '' ? null : story },
      {
        onSuccess: () => {
          toast(t('memorial.story.saved'));
          onDone();
        },
        onError: () => toast.error(t('memorial.story.failed')),
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2" noValidate>
      <label htmlFor={id} className="font-medium">
        {t('memorial.story.label')}
      </label>
      <Textarea
        id={id}
        autoFocus
        rows={10}
        value={value}
        maxLength={LIFE_STORY_MAX_LENGTH + 500}
        placeholder={t('memorial.story.placeholder', { name: memorial.fullName })}
        aria-invalid={showProblem || undefined}
        aria-describedby={`${id}-help`}
        onChange={(event) => setValue(event.target.value)}
        className="max-h-[50dvh]"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          id={`${id}-help`}
          className={cn('text-sm', showProblem ? 'text-destructive' : 'text-muted-foreground')}
          aria-live="polite"
        >
          {showProblem
            ? t(`memorial.story.problem.${problem}`, { max: LIFE_STORY_MAX_LENGTH })
            : t('memorial.story.counter', { count: length, max: LIFE_STORY_MAX_LENGTH })}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="small" onClick={onDone}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" size="small" disabled={update.isPending}>
            {t('memorial.story.save')}
          </Button>
        </div>
      </div>
    </form>
  );
}
