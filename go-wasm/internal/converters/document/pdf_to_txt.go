package document

import (
	"bytes"
	"strings"
	"go-wasm/internal/registry"
)

func convertPdfToTxt(data []byte) ([]byte, error) {
	var txtContent bytes.Buffer
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
			if len(word) > 0 {
				txtContent.WriteString(word + "\n")
			}
		} else if inParens {
			currentWord.WriteByte(char)
		}
	}

	if txtContent.Len() == 0 {
		return []byte("No text content could be extracted from PDF."), nil
	}

	return txtContent.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "pdf",
		To:       "txt",
		MIMEType: "text/plain",
		Label:    "PDF to TXT",
		Convert:  convertPdfToTxt,
	})
}
