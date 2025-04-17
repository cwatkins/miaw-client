export interface MockResponse<T> {
  ok: boolean;
  status?: number;
  json: () => Promise<T>;
  text: () => Promise<string>;
  headers: Headers;
  statusText: string;
  type: ResponseType;
  url: string;
  redirected: boolean;
  clone: () => Response;
  body: ReadableStream | null;
  bodyUsed: boolean;
  arrayBuffer: () => Promise<ArrayBuffer>;
  blob: () => Promise<Blob>;
  formData: () => Promise<FormData>;
}

export type MockFetch = jest.Mock<Promise<MockResponse<any>>, [string, RequestInit?]>; 