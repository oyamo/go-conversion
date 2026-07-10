package document

import (
	"archive/zip"
	"bytes"
	"io"
	"regexp"
	"go-wasm/internal/registry"
)

func convertDocxToPdf(data []byte) ([]byte, error) {
	reader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, err
	}

	var documentXml []byte
	for _, f := range reader.File {
		if f.Name == "word/document.xml" {
			rc, err := f.Open()
			if err != nil {
				return nil, err
			}
			documentXml, err = io.ReadAll(rc)
			rc.Close()
			if err != nil {
				return nil, err
			}
			break
		}
	}

	if len(documentXml) == 0 {
		return convertTxtToPdf([]byte("Empty or invalid DOCX document."))
	}

	// Extract text inside XML tags <w:t>...</w:t>
	re := regexp.MustCompile(`<w:t[^>]*>([^<]*)</w:t>`)
	matches := re.FindAllSubmatch(documentXml, -1)

	var extractedText bytes.Buffer
	for _, match := range matches {
		if len(match) > 1 {
			extractedText.Write(match[1])
			extractedText.WriteString(" ")
		}
	}

	return convertTxtToPdf(extractedText.Bytes())
}

func init() {
	registry.Register(registry.Converter{
		From:     "docx",
		To:       "pdf",
		MIMEType: "application/pdf",
		Label:    "DOCX to PDF",
		Convert:  convertDocxToPdf,
	})
}
