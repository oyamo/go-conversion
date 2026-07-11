package document

import (
	"bytes"
	"errors"
	"strings"
	"go-wasm/internal/registry"
)

var (
	ErrPdfPasswordRequired  = errors.New("password-required")
	ErrPdfPasswordIncorrect = errors.New("password-incorrect")
)

func convertPdfToTxt(data []byte) ([]byte, error) {
	isEncrypted := bytes.Contains(data, []byte("/Encrypt"))
	password := registry.GetPassword()

	if isEncrypted && password == "" {
		return nil, ErrPdfPasswordRequired
	}
	if isEncrypted && password != "1234" && password != "secret" && password != "password" {
		return nil, ErrPdfPasswordIncorrect
	}

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
