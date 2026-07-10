package document

import (
	"bytes"
	"fmt"
	"strings"
	"go-wasm/internal/registry"
)

func convertTxtToPdf(data []byte) ([]byte, error) {
	text := string(data)
	lines := strings.Split(text, "\n")

	// Build the stream object content
	var streamContent bytes.Buffer

	// Body text start setup (Left margin: 50, Top margin: 800)
	streamContent.WriteString("BT\n/F1 10 Tf\n0.0 rg\n14 Lh\n50 800 Td\n")

	y := 800
	for _, line := range lines {
		// Escape parenthesis for PDF string format
		escapedLine := strings.ReplaceAll(line, "\\", "\\\\")
		escapedLine = strings.ReplaceAll(escapedLine, "(", "\\(")
		escapedLine = strings.ReplaceAll(escapedLine, ")", "\\)")
		escapedLine = strings.TrimRight(escapedLine, "\r")

		streamContent.WriteString(fmt.Sprintf("(%s) Tj T*\n", escapedLine))
		y -= 14
		// Limit to single page for simple text previews
		if y < 50 {
			break
		}
	}
	streamContent.WriteString("ET\n")

	streamBytes := streamContent.Bytes()

	var pdf bytes.Buffer
	pdf.WriteString("%PDF-1.4\n")

	offsets := make([]int, 6)

	// Object 1: Catalog
	offsets[1] = pdf.Len()
	pdf.WriteString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

	// Object 2: Pages
	offsets[2] = pdf.Len()
	pdf.WriteString("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")

	// Object 3: Page
	offsets[3] = pdf.Len()
	pdf.WriteString("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n")

	// Object 4: Font
	offsets[4] = pdf.Len()
	pdf.WriteString("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

	// Object 5: Stream
	offsets[5] = pdf.Len()
	pdf.WriteString(fmt.Sprintf("5 0 obj\n<< /Length %d >>\nstream\n", len(streamBytes)))
	pdf.Write(streamBytes)
	pdf.WriteString("\nendstream\nendobj\n")

	// Cross-Reference Table
	xrefOffset := pdf.Len()
	pdf.WriteString("xref\n0 6\n0000000000 65535 f \n")
	for i := 1; i <= 5; i++ {
		pdf.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[i]))
	}

	pdf.WriteString(fmt.Sprintf("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", xrefOffset))

	return pdf.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "txt",
		To:       "pdf",
		MIMEType: "application/pdf",
		Label:    "TXT to PDF",
		Convert:  convertTxtToPdf,
	})
}
