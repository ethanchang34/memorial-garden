import {
  FLOWER_MESSAGE_MAX_LENGTH,
  flowerMessageProblem,
  normalizeFlowerMessage,
} from '@memorial-garden/shared';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useDateFormat } from '@/app/useDateFormat';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CaptchaError } from '@/core/captcha';
import {
  creditSummary,
  FLOWER_MAX,
  FLOWER_TYPES,
  FlowerError,
  UNDO_WINDOW_MS,
  type FlowerCredit,
  type FlowerState,
  type FlowerType,
} from '@/core/flowers';
import { useSession } from '@/features/auth/session';
import { useAuthActions } from '@/features/auth/useAuthActions';
import { Bloom } from '@/features/garden/FlowerVases';
import { cn } from '@/lib/utils';
import { GardenHint } from '../GardenHint';
import {
  useFlowerCredits,
  useSetFlowerMessageHidden,
  useUndoFlower,
  type PlaceFlowerInput,
} from './useFlowers';

type PlaceFlowerProps = {
  memorialId: string;
  ownerId: string | null;
  name: string;
  state: FlowerState;
  pending: boolean;
  onPlace: (input: PlaceFlowerInput) => Promise<unknown>;
};

const asIs = (hex: string) => hex;
const DAY_MS = 86_400_000;

function placeError(error: unknown, t: (key: string) => string) {
  if (error instanceof FlowerError && error.code === 'daily_limit')
    toast(t('memorial.flowers.dailyLimit'));
  else if (error instanceof FlowerError && error.code === 'message_needs_account')
    toast.error(t('memorial.flowers.messageNeedsAccount'));
  else if (error instanceof CaptchaError) toast.error(t('memorial.candles.captchaFailed'));
  else toast.error(t('memorial.flowers.failed'));
}

export function PlaceFlower({
  memorialId,
  ownerId,
  name,
  state,
  pending,
  onPlace,
}: PlaceFlowerProps) {
  const { t } = useTranslation();
  const groupId = useId();
  const messageId = useId();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<FlowerType>('rose');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const undo = useUndoFlower(memorialId);
  const credits = useFlowerCredits(memorialId, state.types.length > 0);
  const creditList = credits.data ?? [];
  const done = state.placedToday;
  const full = state.types.length >= FLOWER_MAX;
  const member = session.status === 'signed-in';
  const problem = flowerMessageProblem(message);
  const summary = summaryText(creditList, t);

  function takeBack() {
    undo.mutate(undefined, {
      onSuccess: () => toast(t('memorial.flowers.undone')),
      onError: (error) =>
        toast(
          error instanceof FlowerError && error.code === 'undo_expired'
            ? t('memorial.flowers.undoExpired')
            : t('memorial.flowers.failed'),
        ),
    });
  }

  function place() {
    setTouched(true);
    if (member && problem) return;
    const text = member ? normalizeFlowerMessage(message) : '';
    setOpen(false);
    onPlace({ type: choice, message: text === '' ? null : text }).then(
      () => {
        setMessage('');
        setTouched(false);
        toast(t('memorial.flowers.placed'), {
          duration: UNDO_WINDOW_MS,
          action: { label: t('memorial.flowers.undo'), onClick: takeBack },
        });
      },
      (error: unknown) => placeError(error, t),
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={done ? t('memorial.flowers.seeFlowers') : t('memorial.flowers.place')}
          aria-disabled={pending || undefined}
          aria-description={summary ?? undefined}
          data-flower-button=""
          onClick={(event) => {
            if (pending) event.preventDefault();
          }}
          className="peer focus-visible:outline-ring min-w-touch absolute inset-y-0 left-1/2 w-full -translate-x-1/2 cursor-pointer rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-2"
        ></button>
      </DialogTrigger>
      <GardenHint
        flash={null}
        text={done ? t('memorial.flowers.placedToday') : t('memorial.flowers.place')}
        className="top-[72%] left-1/2 -translate-x-1/2"
      />
      {summary ? (
        <span
          aria-hidden="true"
          data-flower-summary=""
          className="garden-hint can-hover:peer-hover:opacity-100 absolute top-[calc(72%+1.4rem)] left-1/2 -translate-x-1/2 text-xs opacity-0"
        >
          {summary}
        </span>
      ) : null}
      <span role="status" className="sr-only">
        {state.types.length > 0
          ? t('memorial.flowers.inBloom', { count: state.types.length, name })
          : ''}
      </span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {done ? t('memorial.flowers.vasesTitle') : t('memorial.flowers.title')}
          </DialogTitle>
          <DialogDescription>
            {done
              ? t('memorial.flowers.placedTodayBody')
              : full
                ? t('memorial.flowers.full', { name })
                : t('memorial.flowers.body', { name })}
          </DialogDescription>
        </DialogHeader>
        {done ? null : (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">{t('memorial.flowers.typeLabel')}</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {FLOWER_TYPES.map((type) => (
                  <label
                    key={type}
                    className={cn(
                      'border-border bg-card has-[:focus-visible]:outline-ring min-h-touch flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 p-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2',
                      choice === type ? 'border-gold-deep bg-muted' : 'can-hover:hover:bg-muted',
                    )}
                  >
                    <input
                      type="radio"
                      name={groupId}
                      value={type}
                      checked={choice === type}
                      onChange={() => setChoice(type)}
                      className="sr-only"
                    />
                    <svg viewBox="-14 -14 28 26" className="size-14" aria-hidden="true">
                      <Bloom type={type} size={11} lit={asIs} />
                    </svg>
                    <span className="text-sm">{t(`memorial.flowers.types.${type}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {member ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={messageId} className="text-sm font-medium">
                  {t('memorial.flowers.messageLabel')}
                </label>
                <Input
                  id={messageId}
                  value={message}
                  maxLength={FLOWER_MESSAGE_MAX_LENGTH + 40}
                  placeholder={t('memorial.flowers.messagePlaceholder')}
                  aria-invalid={(touched && problem !== null) || undefined}
                  aria-describedby={`${messageId}-help`}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <p
                  id={`${messageId}-help`}
                  className={cn(
                    'text-sm',
                    touched && problem ? 'text-destructive' : 'text-muted-foreground',
                  )}
                  aria-live="polite"
                >
                  {touched && problem
                    ? t(`memorial.flowers.messageProblem.${problem}`, {
                        max: FLOWER_MESSAGE_MAX_LENGTH,
                      })
                    : t('memorial.flowers.messageCounter', {
                        count: [...normalizeFlowerMessage(message)].length,
                        max: FLOWER_MESSAGE_MAX_LENGTH,
                      })}
                </p>
              </div>
            ) : session.status !== 'unavailable' ? (
              <SignInForMessage />
            ) : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">{t('memorial.flowers.notNow')}</Button>
              </DialogClose>
              <Button onClick={place}>{t('memorial.flowers.confirm')}</Button>
            </DialogFooter>
          </>
        )}
        {creditList.length > 0 ? (
          <Credits
            credits={creditList}
            bloomUntil={state.bloomUntil}
            canHide={member && session.user.id === ownerId}
            memorialId={memorialId}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function summaryText(credits: readonly FlowerCredit[], t: ReturnType<typeof useTranslation>['t']) {
  if (credits.length === 0) return null;
  const { names, others, visitors } = creditSummary(credits);
  const rest = others + visitors;
  if (names.length === 0) return t('memorial.flowers.fromVisitors', { count: visitors });
  const list = names.join(', ');
  return rest > 0
    ? t('memorial.flowers.fromNamesMore', { names: list, count: rest })
    : t('memorial.flowers.fromNames', { names: list });
}

function SignInForMessage() {
  const { t } = useTranslation();
  const { signIn, pending } = useAuthActions();
  return (
    <div className="bg-muted flex flex-wrap items-center justify-between gap-2 rounded-lg px-4 py-2">
      <p className="text-sm">{t('memorial.flowers.messageSignIn')}</p>
      <Button variant="ghost" size="small" onClick={() => void signIn()} disabled={pending}>
        {t('auth.signIn')}
      </Button>
    </div>
  );
}

type CreditsProps = {
  credits: readonly FlowerCredit[];
  bloomUntil: string | null;
  canHide: boolean;
  memorialId: string;
};

function Credits({ credits, bloomUntil, canHide, memorialId }: CreditsProps) {
  const { t } = useTranslation();
  const format = useDateFormat();
  const hide = useSetFlowerMessageHidden(memorialId);
  const [now] = useState(() => Date.now());
  const daysLeft = bloomUntil ? Math.max(1, Math.ceil((Date.parse(bloomUntil) - now) / DAY_MS)) : 0;

  return (
    <section className="border-border flex flex-col gap-3 border-t pt-4" data-flower-credits="">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-medium">{t('memorial.flowers.inTheVases')}</h3>
        {daysLeft > 0 ? (
          <p className="text-muted-foreground text-sm">
            {t('memorial.flowers.fadesIn', { count: daysLeft })}
          </p>
        ) : null}
      </div>
      <ul className="flex flex-col gap-3">
        {credits.map((credit) => (
          <li key={credit.id} className="flex gap-3" data-credit={credit.type}>
            <svg viewBox="-14 -14 28 26" className="size-7 shrink-0" aria-hidden="true">
              <Bloom type={credit.type} size={11} lit={asIs} />
            </svg>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-sm">
                {t('memorial.flowers.credit', {
                  type: t(`memorial.flowers.types.${credit.type}`),
                  name: credit.mine
                    ? t('memorial.flowers.you')
                    : (credit.giverName ?? t('memorial.flowers.aVisitor')),
                })}
                <span className="text-muted-foreground">
                  {' · '}
                  <time dateTime={credit.placedAt}>{format.timestamp(credit.placedAt)}</time>
                </span>
              </p>
              {credit.message ? (
                <p
                  className={cn(
                    'text-sm leading-relaxed [overflow-wrap:anywhere]',
                    credit.messageHidden && 'opacity-70',
                  )}
                >
                  “{credit.message}”
                </p>
              ) : null}
              {credit.messageHidden ? (
                <span className="bg-muted self-start rounded-full px-2 py-0.5 text-xs">
                  {t('memorial.notes.hiddenLabel')}
                </span>
              ) : null}
              {canHide && credit.message ? (
                <Button
                  variant="ghost"
                  size="small"
                  className="-ml-2 self-start"
                  disabled={hide.isPending}
                  onClick={() =>
                    hide.mutate(
                      { id: credit.id, hidden: !credit.messageHidden },
                      {
                        onSuccess: () =>
                          toast(
                            credit.messageHidden
                              ? t('memorial.flowers.messageShown')
                              : t('memorial.flowers.messageHidden'),
                          ),
                        onError: () => toast.error(t('memorial.flowers.failed')),
                      },
                    )
                  }
                >
                  {credit.messageHidden
                    ? t('memorial.flowers.showMessage')
                    : t('memorial.flowers.hideMessage')}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
