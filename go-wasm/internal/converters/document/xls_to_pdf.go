package document

import (
	"archive/zip"
	"bytes"
	"io"
	"regexp"
	"strings"
	"go-wasm/internal/registry"
)

func convertXlsToPdf(data []byte) ([]byte, error) {
	reader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, err
	}

	var sheetContent bytes.Buffer
	sheetContent.WriteString("Spreadsheet Values:\n\n")

	for _, f := range reader.File {
		if strings.HasPrefix(f.Name, "xl/worksheets/sheet") {
			rc, err := f.Open()
			if err != nil {
				return nil, err
			}
			xmlData, err := io.ReadAll(rc)
			rc.Close()
			if err != nil {
				return nil, err
			}

			// Extract value cell nodes (<v>...</v>)
			re := regexp.MustCompile(`<v>([^<]*)</v>`)
			matches := re.FindAllSubmatch(xmlData, -1)
			
			rowCells := 0
			for _, match := range matches {
				if len(match) > 1 {
					sheetContent.Write(match[1])
					sheetContent.WriteString("   |   ")
					rowCells++
					if rowCells >= 5 {
						sheetContent.WriteString("\n")
						rowCells = 0
					}
				}
			}
			sheetContent.WriteString("\n")
		}
	}

	return convertTxtToPdf(sheetContent.Bytes())
}

func init() {
	registry.Register(registry.Converter{
		From:     "xlsx",
		To:       "pdf",
		MIMEType: "application/pdf",
		Label:    "XLSX to PDF",
		Convert:  convertXlsToPdf,
	})

	registry.Register(registry.Converter{
		From:     "xls",
		To:       "pdf",
		MIMEType: "application/pdf",
		Label:    "XLS to PDF",
		Convert:  convertXlsToPdf,
	})
}
