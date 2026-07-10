package document

import (
	"bytes"
	"strings"
	"go-wasm/internal/registry"
)

func convertPdfToMd(data []byte) ([]byte, error) {
	extractedTextBytes, err := convertPdfToTxt(data)
	if err != nil {
		return nil, err
	}
	text := string(extractedTextBytes)

	// Simple heuristic: if a line is short and uppercase, format as a Heading (#)
	lines := strings.Split(text, "\n")
	var mdContent bytes.Buffer

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if len(trimmed) == 0 {
			mdContent.WriteString("\n")
			continue
		}

		if len(trimmed) < 40 && trimmed == strings.ToUpper(trimmed) && !strings.ContainsAny(trimmed, "0123456789|,") {
			mdContent.WriteString("# " + trimmed + "\n\n")
		} else {
			mdContent.WriteString(trimmed + "\n")
		}
	}

	return mdContent.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "pdf",
		To:       "md",
		MIMEType: "text/markdown",
		Label:    "PDF to Markdown",
		Convert:  convertPdfToMd,
	})
}
