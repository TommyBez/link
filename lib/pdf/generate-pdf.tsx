import {
  Document,
  Image,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import { put } from '@vercel/blob'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  submissionInfo: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  textBlock: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 12,
    textAlign: 'justify',
  },
  divider: {
    borderBottom: '1 solid #ccc',
    marginVertical: 12,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  value: {
    fontSize: 11,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    border: '1 solid #e0e0e0',
  },
  signature: {
    marginTop: 4,
    height: 80,
    border: '1 solid #e0e0e0',
    borderRadius: 4,
  },
})

type PDFField = {
  id: string
  fieldType: string
  label: string
  required: boolean
  answer?: string
}

type PDFData = {
  formTitle: string
  formDescription?: string
  clientName: string
  clientEmail: string
  submittedAt: Date
  fields: PDFField[]
}

function ConsentPDF({ data }: { data: PDFData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{data.formTitle}</Text>
          {data.formDescription && (
            <Text style={styles.description}>{data.formDescription}</Text>
          )}
          <Text style={styles.submissionInfo}>
            Submitted by: {data.clientName} ({data.clientEmail})
          </Text>
          <Text style={styles.submissionInfo}>
            Date: {new Date(data.submittedAt).toLocaleString()}
          </Text>
        </View>

        <View style={styles.section}>
          {data.fields.map((field) => {
            if (field.fieldType === 'heading') {
              return (
                <Text key={field.id} style={styles.heading}>
                  {field.label}
                </Text>
              )
            }

            if (field.fieldType === 'text_block') {
              return (
                <Text key={field.id} style={styles.textBlock}>
                  {field.label}
                </Text>
              )
            }

            if (field.fieldType === 'divider') {
              return <View key={field.id} style={styles.divider} />
            }

            if (field.fieldType === 'signature' && field.answer) {
              return (
                <View key={field.id} style={styles.field}>
                  <Text style={styles.label}>
                    {field.label}
                    {field.required && ' *'}
                  </Text>
                  <Image
                    src={field.answer || '/placeholder.svg'}
                    style={styles.signature}
                  />
                </View>
              )
            }

            // Regular fields
            return (
              <View key={field.id} style={styles.field}>
                <Text style={styles.label}>
                  {field.label}
                  {field.required && ' *'}
                </Text>
                <Text style={styles.value}>
                  {field.answer || '(No answer provided)'}
                </Text>
              </View>
            )
          })}
        </View>
      </Page>
    </Document>
  )
}

export async function generateAndUploadPDF(data: PDFData): Promise<string> {
  // Generate PDF buffer
  const pdfBuffer = await renderToBuffer(<ConsentPDF data={data} />)

  // Upload to Vercel Blob
  const filename = `consent-${data.clientName.replace(/\s+/g, '-')}-${Date.now()}.pdf`
  const blob = await put(filename, pdfBuffer, {
    access: 'public',
    contentType: 'application/pdf',
  })

  return blob.url
}
