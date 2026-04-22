---
name: "Image Optimization Pipeline"
description: "Sharp for server-side image processing: resize, WebP/AVIF conversion, responsive srcset generation (320w-1920w), blur placeholders. Pipeline integrates with Uppy uploads via post-upload Worker, stores optimized variants in R2. Cloudflare Image Resizing as on-demand alternative."
---

# Image Optimization Pipeline

## Sharp Processing Worker
```typescript
// src/workers/image-processor.ts
import sharp from 'sharp';

interface ImageVariant {
  width: number;
  suffix: string;
}

const VARIANTS: readonly ImageVariant[] = [
  { width: 320, suffix: '320w' },
  { width: 640, suffix: '640w' },
  { width: 1280, suffix: '1280w' },
  { width: 1920, suffix: '1920w' },
] as const;

const FORMATS = ['webp', 'avif'] as const;

interface ProcessedImage {
  key: string;
  format: string;
  width: number;
  size: number;
}

async function processImage(
  env: Env,
  originalKey: string,
  buffer: ArrayBuffer,
): Promise<{ variants: ProcessedImage[]; blurDataUrl: string; dominantColor: string }> {
  const image = sharp(Buffer.from(buffer));
  const metadata = await image.metadata();
  const variants: ProcessedImage[] = [];

  // Generate all size × format combinations
  for (const variant of VARIANTS) {
    if (variant.width > (metadata.width ?? 9999)) continue; // Skip upscaling

    for (const format of FORMATS) {
      const quality = format === 'webp' ? 80 : 70; // Visually lossless
      const processed = await sharp(Buffer.from(buffer))
        .resize(variant.width, undefined, { fit: 'inside', withoutEnlargement: true })
        .toFormat(format, { quality })
        .toBuffer();

      const key = originalKey.replace(/\.[^.]+$/, `-${variant.suffix}.${format}`);
      await env.R2.put(key, processed, {
        httpMetadata: { contentType: `image/${format}` },
        customMetadata: { originalKey, width: String(variant.width), format },
      });

      variants.push({ key, format, width: variant.width, size: processed.byteLength });
    }
  }

  // Blur placeholder (tiny 20px base64)
  const blurBuffer = await sharp(Buffer.from(buffer))
    .resize(20, undefined, { fit: 'inside' })
    .blur(10)
    .webp({ quality: 20 })
    .toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

  // Dominant color extraction
  const { dominant } = await sharp(Buffer.from(buffer)).stats();
  const dominantColor = `rgb(${dominant.r},${dominant.g},${dominant.b})`;

  return { variants, blurDataUrl, dominantColor };
}
```

## Post-Upload Queue Handler
```typescript
// src/queues/image-queue.ts
import { Hono } from 'hono';

interface ImageMessage {
  key: string;
  contentType: string;
}

export default {
  async queue(batch: MessageBatch<ImageMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const { key, contentType } = message.body;
      if (!contentType.startsWith('image/')) {
        message.ack();
        continue;
      }

      const object = await env.R2.get(key);
      if (!object) { message.ack(); continue; }

      const buffer = await object.arrayBuffer();
      const result = await processImage(env, key, buffer);

      // Store metadata in D1
      await env.DB.prepare(
        `UPDATE files SET variants = ?, blur_data_url = ?, dominant_color = ?, processed = 1 WHERE key = ?`
      ).bind(JSON.stringify(result.variants), result.blurDataUrl, result.dominantColor, key).run();

      message.ack();
    }
  },
};
```

## Responsive Image Component (Angular)
```typescript
// responsive-image.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-responsive-image',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <picture>
      <source
        type="image/avif"
        [srcset]="avifSrcset"
        [sizes]="sizes" />
      <source
        type="image/webp"
        [srcset]="webpSrcset"
        [sizes]="sizes" />
      <img
        [src]="fallbackSrc"
        [alt]="alt"
        [width]="width"
        [height]="height"
        [loading]="eager ? 'eager' : 'lazy'"
        decoding="async"
        [style.background-color]="dominantColor"
        [style.background-image]="blurDataUrl ? 'url(' + blurDataUrl + ')' : ''"
        style="background-size: cover" />
    </picture>
  `,
})
export class ResponsiveImageComponent {
  @Input({ required: true }) baseUrl!: string;
  @Input({ required: true }) alt!: string;
  @Input() width = 0;
  @Input() height = 0;
  @Input() eager = false;
  @Input() sizes = '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw';
  @Input() blurDataUrl = '';
  @Input() dominantColor = '#060610';

  get webpSrcset(): string {
    return [320, 640, 1280, 1920].map((w) => `${this.variantUrl(w, 'webp')} ${w}w`).join(', ');
  }
  get avifSrcset(): string {
    return [320, 640, 1280, 1920].map((w) => `${this.variantUrl(w, 'avif')} ${w}w`).join(', ');
  }
  get fallbackSrc(): string { return this.variantUrl(1280, 'webp'); }

  private variantUrl(width: number, format: string): string {
    return this.baseUrl.replace(/\.[^.]+$/, `-${width}w.${format}`);
  }
}
```

## Cloudflare Image Resizing (On-Demand Alternative)
```typescript
// No pre-generation needed — CF resizes on first request, caches at edge
// Requires CF Pro+ plan with Image Resizing enabled

function cfImageUrl(originalUrl: string, width: number, format: 'webp' | 'avif' = 'webp'): string {
  return `/cdn-cgi/image/width=${width},format=${format},quality=80/${originalUrl}`;
}

// Usage in HTML: srcset with CF transform URLs
// <img srcset="/cdn-cgi/image/width=320,format=webp/hero.jpg 320w, /cdn-cgi/image/width=640,format=webp/hero.jpg 640w" />
```

## Uppy Integration (trigger processing after upload)
```typescript
// In upload success handler, queue image for processing
uploads.post('/presign', zValidator('json', uploadSchema), async (c) => {
  // ... presign logic ...
  // After successful upload confirmation:
  await c.env.IMAGE_QUEUE.send({ key, contentType });
  return c.json({ key, publicUrl });
});
```

## wrangler.toml Bindings
```toml
[[queues.producers]]
queue = "image-processing"
binding = "IMAGE_QUEUE"

[[queues.consumers]]
queue = "image-processing"
max_batch_size = 5
max_retries = 3
```

## Quality Settings
WebP quality 80 (SSIM ~0.98, visually lossless). AVIF quality 70 (same perceptual quality, 30-50% smaller than WebP). Never upscale. Skip variants wider than original. Max single image after optimization: <200KB. Total page images: <500KB. Hero: eager+preload. Everything else: lazy, decoding=async.
