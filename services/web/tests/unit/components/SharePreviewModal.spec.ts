import { copyToClipboard } from '../../../lib/share-utils';

describe('copyToClipboard', () => {
  it('writes the given text to the clipboard', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(global, 'navigator', {
      value: { clipboard: { writeText } },
      writable: true,
    });

    await copyToClipboard('http://example.com/img.png');

    expect(writeText).toHaveBeenCalledWith('http://example.com/img.png');
  });

  it('resolves without error on a successful clipboard write', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(global, 'navigator', {
      value: { clipboard: { writeText } },
      writable: true,
    });

    await expect(copyToClipboard('http://example.com/img.png')).resolves.toBeUndefined();
  });

  it('propagates clipboard write errors', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('NotAllowedError'));
    Object.defineProperty(global, 'navigator', {
      value: { clipboard: { writeText } },
      writable: true,
    });

    await expect(copyToClipboard('http://example.com/img.png')).rejects.toThrow('NotAllowedError');
  });
});
