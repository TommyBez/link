import { act, fireEvent, render, screen } from '@testing-library/react'
import { SignaturePad } from './signature-pad'

type SignatureCanvasMockType = {
  __getLastInstance: () => {
    methods: {
      clear: jest.Mock
      fromDataURL: jest.Mock
      isEmpty: jest.Mock
      getTrimmedCanvas: jest.Mock
    }
    props: { onEnd?: () => void }
  }
}

jest.mock('react-signature-canvas', () => {
  const React = require('react')

  const instances: Array<{
    methods: {
      clear: jest.Mock
      fromDataURL: jest.Mock
      isEmpty: jest.Mock
      getTrimmedCanvas: jest.Mock
    }
    props: any
  }> = []

  const SignatureCanvas = React.forwardRef((props: any, ref: any) => {
    const methods = {
      clear: jest.fn(),
      fromDataURL: jest.fn(),
      isEmpty: jest.fn().mockReturnValue(true),
      getTrimmedCanvas: jest.fn(() => ({
        toDataURL: jest.fn(() => 'data:image/png;base64,fake-signature'),
      })),
    }
    instances.push({ methods, props })
    if (typeof ref === 'function') {
      ref(methods)
    } else if (ref) {
      ref.current = methods
    }
    return <div data-testid="signature-canvas-mock" onPointerUp={props.onEnd} />
  })

  ;(SignatureCanvas as any).__getLastInstance = () => instances.at(-1)

  return SignatureCanvas
})

const SignatureCanvasMock = jest.requireMock(
  'react-signature-canvas',
) as SignatureCanvasMockType

describe('SignaturePad', () => {
  it('renders acknowledgement text and instructions', () => {
    render(
      <SignaturePad
        value={null}
        onChange={jest.fn()}
        acknowledgementText="Accetto le condizioni"
      />,
    )

    expect(
      screen.getByText(/Firma con il dito o il mouse/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Accetto le condizioni'),
    ).toBeInTheDocument()
  })

  it('calls onChange with signature payload after drawing', () => {
    const handleChange = jest.fn()
    render(<SignaturePad value={null} onChange={handleChange} required />)

    const instance = SignatureCanvasMock.__getLastInstance()
    instance.methods.isEmpty.mockReturnValue(false)
    instance.methods.getTrimmedCanvas.mockReturnValue({
      toDataURL: () => 'data:image/png;base64,signature-data',
    })

    act(() => {
      instance.props.onEnd?.()
    })

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        dataUrl: 'data:image/png;base64,signature-data',
      }),
    )
  })

  it('clears the canvas and resets the value', () => {
    const handleChange = jest.fn()
    render(<SignaturePad value={{ dataUrl: 'x' }} onChange={handleChange} />)

    const instance = SignatureCanvasMock.__getLastInstance()
    fireEvent.click(screen.getByRole('button', { name: /cancella firma/i }))

    expect(instance.methods.clear).toHaveBeenCalled()
    expect(handleChange).toHaveBeenCalledWith(null)
  })
})
