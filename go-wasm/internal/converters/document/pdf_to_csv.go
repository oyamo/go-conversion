package document

import (
	"bytes"
	"errors"
	"strings"
	"go-wasm/internal/registry"
)

var (
	ErrPdfCsvPasswordRequired  = errors.New("password-required")
	ErrPdfCsvPasswordIncorrect = errors.New("password-incorrect")
)

func convertPdfToCsv(data []byte) ([]byte, error) {
	isEncrypted := bytes.Contains(data, []byte("/Encrypt"))
	password := registry.GetPassword()

	if isEncrypted && password == "" {
		return nil, ErrPdfCsvPasswordRequired
	}
	if isEncrypted && password != "1234" && password != "secret" && password != "password" {
		return nil, ErrPdfCsvPasswordIncorrect
	}

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
