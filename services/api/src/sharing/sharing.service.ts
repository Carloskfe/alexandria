import { BadGatewayException, Injectable } from '@nestjs/common';
import { Book } from '../books/book.entity';
import { Fragment } from '../fragments/fragment.entity';

@Injectable()
export class SharingService {
  private readonly imageGenUrl = process.env.IMAGE_GEN_URL ?? 'http://image-gen:5000';

  async generateShareUrl(fragment: Fragment, book: Book, platform: string): Promise<string> {
    const response = await fetch(`${this.imageGenUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: fragment.text,
        author: book.author,
        title: book.title,
        platform,
      }),
    });

    if (!response.ok) {
      throw new BadGatewayException('image generation failed');
    }

    const data = (await response.json()) as { url: string };
    return data.url;
  }
}
