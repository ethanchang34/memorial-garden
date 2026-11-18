import {
  linkPreview,
  PREVIEW_IMAGE_ALT,
  PREVIEW_IMAGE_PATH,
  SITE_NAME,
} from '@memorial-garden/shared';
import { findPublishedMemorial, isSlug, type PreviewEnv } from '../preview';

const setContent = (value: string): HTMLRewriterElementContentHandlers => ({
  element(element) {
    element.setAttribute('content', value);
  },
});

export const onRequestGet: PagesFunction<PreviewEnv, 'slug'> = async (context) => {
  const page = await context.next();
  const slug = context.params.slug;
  if (!isSlug(slug)) return page;
  if (!page.headers.get('content-type')?.includes('text/html')) return page;

  const memorial = await findPublishedMemorial(context.env, slug);
  if (!memorial) return page;

  const preview = linkPreview(memorial);
  const origin = new URL(context.request.url).origin;
  const image = new URL(PREVIEW_IMAGE_PATH, origin).toString();
  const title = `${preview.title} · ${SITE_NAME}`;

  return new HTMLRewriter()
    .on('title', {
      element(element) {
        element.setInnerContent(title);
      },
    })
    .on('meta[name="description"]', setContent(preview.description))
    .on('meta[property="og:title"]', setContent(preview.title))
    .on('meta[property="og:description"]', setContent(preview.description))
    .on('meta[property="og:image"]', setContent(image))
    .on('meta[property="og:image:alt"]', setContent(PREVIEW_IMAGE_ALT))
    .on('meta[name="twitter:title"]', setContent(preview.title))
    .on('meta[name="twitter:description"]', setContent(preview.description))
    .transform(page);
};
