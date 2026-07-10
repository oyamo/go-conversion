package document

import (
	"archive/zip"
	"bytes"
	"fmt"
	"strings"
	"go-wasm/internal/registry"
)

func convertPdfToDocx(data []byte) ([]byte, error) {
	// 1. Extract text from PDF first
	extractedTextBytes, err := convertPdfToTxt(data)
	if err != nil {
		return nil, err
	}
	text := string(extractedTextBytes)

	// 2. Package text into standard OpenXML DOCX structure
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	// [Content_Types].xml
	fTypes, err := zw.Create("[Content_Types].xml")
	if err != nil {
		return nil, err
	}
	fTypes.Write([]byte(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`))

	// _rels/.rels
	fRels, err := zw.Create("_rels/.rels")
	if err != nil {
		return nil, err
	}
	fRels.Write([]byte(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`))

	// word/document.xml
	fDoc, err := zw.Create("word/document.xml")
	if err != nil {
		return nil, err
	}
	// Assemble XML paragraphs
	var paragraphs bytes.Buffer
	lines := strings.Split(text, "\n")
	for _, line := range lines {
		if len(strings.TrimSpace(line)) > 0 {
			paragraphs.WriteString(fmt.Sprintf("<w:p><w:r><w:t>%s</w:t></w:r></w:p>", line))
		}
	}

	docXml := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    %s
  </w:body>
</w:document>`, paragraphs.String())
	fDoc.Write([]byte(docXml))

	err = zw.Close()
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "pdf",
		To:       "docx",
		MIMEType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		Label:    "PDF to DOCX",
		Convert:  convertPdfToDocx,
	})
}
