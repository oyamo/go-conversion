package document

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"strings"
	"go-wasm/internal/registry"
)

func convertCsvToPdf(data []byte) ([]byte, error) {
	r := csv.NewReader(bytes.NewReader(data))
	r.FieldsPerRecord = -1
	records, err := r.ReadAll()
	if err != nil {
		return nil, err
	}

	var streamContent bytes.Buffer

	y := 800
	for i, record := range records {
		// Draw row separator line (E2E8F0 -> 0.88 0.91 0.94)
		streamContent.WriteString(fmt.Sprintf("0.88 0.91 0.94 RG\n0.5 w\n30 %d m\n565 %d l\nS\n", y-2, y-2))

		// Draw text
		var rowText bytes.Buffer
		for j, val := range record {
			rowText.WriteString(val)
			if j < len(record)-1 {
				rowText.WriteString("   |   ")
			}
		}

		line := rowText.String()
		escapedLine := strings.ReplaceAll(line, "\\", "\\\\")
		escapedLine = strings.ReplaceAll(escapedLine, "(", "\\(")
		escapedLine = strings.ReplaceAll(escapedLine, ")", "\\)")

		// Draw text row (black text, starting at A4 page boundaries)
		streamContent.WriteString(fmt.Sprintf("BT\n/F1 9 Tf\n0.0 rg\n50 %d Td\n(%s) Tj\nET\n", y, escapedLine))

		y -= 16
		if i >= 40 || y < 50 {
			break
		}
	}

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
		From:     "csv",
		To:       "pdf",
		MIMEType: "application/pdf",
		Label:    "CSV to PDF",
		Convert:  convertCsvToPdf,
	})
}
