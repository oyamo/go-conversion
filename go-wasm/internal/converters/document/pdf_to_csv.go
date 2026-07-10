package document

import (
	"bytes"
	"strings"
	"go-wasm/internal/registry"
)

func convertPdfToCsv(data []byte) ([]byte, error) {
	var csvContent bytes.Buffer
	var inParens bool
	var currentWord bytes.Buffer

	for i := 0; i < len(data); i++ {
		char := data[i]
		if char == '(' && (i == 0 || data[i-1] != '\\') {
			inParens = true
			currentWord.Reset()
		} else if char == ')' && inParens && (i == 0 || data[i-1] != '\\') {
			inParens = false
			word := currentWord.String()
			word = strings.ReplaceAll(word, "\\(", "(")
			word = strings.ReplaceAll(word, "\\)", ")")
			word = strings.ReplaceAll(word, "\\\\", "\\")
			
			// If it's a tab or pipe formatted spreadsheet string from pdf_to_xls, convert separators to commas
			word = strings.ReplaceAll(word, "   |   ", ",")
			word = strings.ReplaceAll(word, "\t", ",")
			if len(word) > 0 {
				csvContent.WriteString(word + "\n")
			}
		} else if inParens {
			currentWord.WriteByte(char)
		}
	}

	if csvContent.Len() == 0 {
		return []byte("No structured data could be extracted from PDF."), nil
	}

	return csvContent.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "pdf",
		To:       "csv",
		MIMEType: "text/csv",
		Label:    "PDF to CSV",
		Convert:  convertPdfToCsv,
	})
}
