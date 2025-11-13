import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DynamicForm } from './dynamic-form'
import type { TemplateDraftInput } from '@/lib/templates/schema'

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

jest.mock('@/components/signature-pad', () => ({
  SignaturePad: ({ onChange }: { onChange: (value: unknown) => void }) => (
    <button
      type="button"
      onClick={() =>
        onChange({
          dataUrl: 'data:image/png;base64,fake-signature',
          signedAtClientUtc: '2024-01-01T00:00:00.000Z',
        })
      }
    >
      Firma
    </button>
  ),
}))

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
      helperText: 'Inserisci il tuo nome.',
    },
    {
      id: 'signatureField',
      label: 'Firma',
      type: 'signature',
      required: true,
    },
  ],
}

describe('DynamicForm', () => {
  it('mostra i messaggi di errore per i campi obbligatori', async () => {
    const handleSubmit = jest.fn()
    render(
      <DynamicForm schema={schema} onSubmit={handleSubmit} initialValues={{}} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /invia modulo/i }))

    const errors = await screen.findAllByText(/Questo campo è obbligatorio/i)
    expect(errors.length).toBeGreaterThan(0)
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('invia i valori della form inclusa la firma', async () => {
    const handleSubmit = jest.fn()
    render(
      <DynamicForm schema={schema} onSubmit={handleSubmit} initialValues={{}} />,
    )

    const nameInput = screen.getByLabelText(/Nome completo/i)
    fireEvent.change(nameInput, { target: { value: 'Mario Rossi' } })

    fireEvent.click(screen.getByRole('button', { name: 'Firma' }))

    fireEvent.click(screen.getByRole('button', { name: /invia modulo/i }))

    await waitFor(() => expect(handleSubmit).toHaveBeenCalled())

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Mario Rossi',
        signatureField: expect.objectContaining({
          dataUrl: 'data:image/png;base64,fake-signature',
        }),
      }),
      expect.objectContaining({
        signature: expect.objectContaining({
          dataUrl: 'data:image/png;base64,fake-signature',
        }),
        signatureFieldId: 'signatureField',
      }),
    )
  })
})
