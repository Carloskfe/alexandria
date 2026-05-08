import { apiClient } from '../../../src/api/client';

const mockOk = (body: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response);
};

const mockFail = (status: number, message: string) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: jest.fn().mockResolvedValue({ message }),
  } as unknown as Response);
};

afterEach(() => jest.restoreAllMocks());

describe('apiClient.get', () => {
  it('calls fetch with the correct URL and headers', async () => {
    mockOk({ items: [] });
    await apiClient.get('/books');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/books'),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('returns parsed JSON on success', async () => {
    mockOk({ title: 'Book A' });
    const result = await apiClient.get('/books/1');
    expect(result).toEqual({ title: 'Book A' });
  });

  it('throws with status on non-OK response', async () => {
    mockFail(404, 'Not found');
    await expect(apiClient.get('/missing')).rejects.toMatchObject({ status: 404 });
  });
});

describe('apiClient.post', () => {
  it('calls fetch with POST method, Content-Type header, and serialised body', async () => {
    mockOk({ id: 'new-id' });
    await apiClient.post('/books', { title: 'New Book' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/books'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ title: 'New Book' }),
      }),
    );
  });

  it('returns parsed JSON on success', async () => {
    mockOk({ id: 'created' });
    const result = await apiClient.post('/books', {});
    expect(result).toEqual({ id: 'created' });
  });

  it('sends no body when body is undefined', async () => {
    mockOk({});
    await apiClient.post('/logout');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toBeUndefined();
  });
});

describe('apiClient.patch', () => {
  it('calls fetch with PATCH method and serialised body', async () => {
    mockOk({ id: '1' });
    await apiClient.patch('/books/1', { title: 'Updated' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/books/1'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated' }),
      }),
    );
  });
});

describe('apiClient.delete', () => {
  it('calls fetch with DELETE method', async () => {
    mockOk({});
    await apiClient.delete('/books/1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/books/1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
