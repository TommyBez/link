import { db } from '@/lib/db'
import { putSignature } from '@/lib/storage/blob'
import type { TemplateDraftInput } from '@/lib/templates/schema'

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init: { status?: number } = {}) => ({
      status: init.status ?? 200,
      headers: {},
      body,
      json: async () => body,
    })),
  },
}))

import { POST } from './route'

jest.mock('@/lib/db', () => ({
  db: {
    query: {
      intakeSessions: {
        findFirst: jest.fn(),
      },
    },
    transaction: jest.fn(),
  },
}))

jest.mock('@/lib/storage/blob', () => ({
  putSignature: jest.fn(),
}))

const mockedDb = db as unknown as {
  query: { intakeSessions: { findFirst: jest.Mock } }
  transaction: jest.Mock
}

const mockedPutSignature = putSignature as jest.Mock

function createRequest(body: unknown, headers?: Record<string, string>) {
  const headerEntries = Object.entries(headers ?? {}).reduce(
    (acc, [key, value]) => {
      acc[key.toLowerCase()] = value
      return acc
    },
    {} as Record<string, string>,
  )

  const headersMock = {
    get: (name: string) => headerEntries[name.toLowerCase()] ?? null,
  }

  return {
    json: jest.fn().mockResolvedValue(body),
    headers: headersMock,
  } as unknown as Request
}

const schema: TemplateDraftInput = {
  name: 'Test',
  description: 'Modulo di test',
  locale: 'it-IT',
  branding: null,
  fields: [
    {
      id: 'fullName',
      label: 'Nome completo',
      type: 'text',
      required: true,
    },
    {
      id: 'privacy',
      label: 'Consenso privacy',
      type: 'checkbox',
      required: true,
    },
    {
      id: 'signatureField',
      label: 'Firma',
      type: 'signature',
      required: true,
    },
  ],
}

const session = {
  id: 'session-1',
  token: 'token-abc',
  status: 'pending',
  expiresAt: new Date(Date.now() + 60_000),
  templateVersionId: 'template-version-1',
  orgId: 'org-1',
  templateVersion: {
    schemaJson: schema,
    template: {
      name: 'Modulo di test',
    },
  },
}

beforeEach(() => {
  jest.clearAllMocks()
  mockedDb.query.intakeSessions.findFirst.mockResolvedValue(session)
  mockedPutSignature.mockResolvedValue({
    url: 'https://example.com/signature.png',
  })
})

describe('POST /api/submissions', () => {
  it('creates a submission and uploads the signature', async () => {
    const insertValuesMock = jest
      .fn()
      .mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'submission-123' }]),
      })
    const insertSignatureMock = jest.fn().mockResolvedValue(undefined)
    const updateWhereMock = jest.fn().mockResolvedValue(undefined)

    mockedDb.transaction.mockImplementation(async (callback: any) => {
      const tx = {
        insert: jest
          .fn()
          .mockReturnValueOnce({ values: insertValuesMock })
          .mockReturnValueOnce({ values: insertSignatureMock }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: updateWhereMock,
          }),
        }),
      }
      return callback(tx)
    })

    const payload = {
      token: 'token-abc',
      responses: {
        fullName: 'Mario Rossi',
        privacy: true,
        signatureField: {
          dataUrl: 'data:image/png;base64,ZmFrZQ==',
        },
      },
      signature: {
        dataUrl: 'data:image/png;base64,ZmFrZQ==',
        signedAtClientUtc: '2025-01-01T00:00:00.000Z',
      },
    }

    const request = createRequest(payload, {
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'jest',
    })

    const response = await POST(request as any)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body).toEqual({
      submissionId: 'submission-123',
      message: 'Modulo inviato correttamente.',
    })

    expect(mockedDb.query.intakeSessions.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Function),
      }),
    )
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        respondentName: 'Mario Rossi',
        responseData: expect.objectContaining({
          fullName: 'Mario Rossi',
        }),
      }),
    )
    expect(mockedPutSignature).toHaveBeenCalledWith(
      'submission-123.png',
      expect.any(Buffer),
      'image/png',
    )
    expect(updateWhereMock).toHaveBeenCalled()
  })

  it('returns 400 when required fields are missing', async () => {
    const request = createRequest({
      token: 'token-abc',
      responses: {
        privacy: false,
      },
      signature: null,
    })

    const response = await POST(request as any)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toMatchObject({
      error: 'Compila tutti i campi obbligatori.',
      missing: expect.arrayContaining(['Nome completo', 'Consenso privacy', 'Firma']),
    })
    expect(mockedDb.transaction).not.toHaveBeenCalled()
  })
})
