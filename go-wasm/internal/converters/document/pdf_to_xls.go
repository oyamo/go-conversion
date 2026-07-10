package document

import (
	"archive/zip"
	"bytes"
	"fmt"
	"strconv"
	"strings"
	"go-wasm/internal/registry"
)

func isNumber(s string) bool {
	s = strings.ReplaceAll(s, "$", "")
	s = strings.ReplaceAll(s, ",", "")
	s = strings.ReplaceAll(s, "%", "")
	s = strings.TrimSpace(s)
	if s == "" {
		return false
	}
	_, err := strconv.ParseFloat(s, 64)
	return err == nil
}

func convertPdfToXls(data []byte) ([]byte, error) {
	extractedTextBytes, err := convertPdfToTxt(data)
	if err != nil {
		return nil, err
	}
	text := string(extractedTextBytes)

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
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`))

	// _rels/.rels
	fRels, err := zw.Create("_rels/.rels")
	if err != nil {
		return nil, err
	}
	fRels.Write([]byte(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`))

	// xl/workbook.xml
	fWb, err := zw.Create("xl/workbook.xml")
	if err != nil {
		return nil, err
	}
	fWb.Write([]byte(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheets>
    <sheet name="Sheet1" sheetId="1" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
  </sheets>
</workbook>`))

	// xl/_rels/workbook.xml.rels
	fWbRels, err := zw.Create("xl/_rels/workbook.xml.rels")
	if err != nil {
		return nil, err
	}
	fWbRels.Write([]byte(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`))

	// xl/styles.xml
	fStyles, err := zw.Create("xl/styles.xml")
	if err != nil {
		return nil, err
	}
	fStyles.Write([]byte(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="11"/>
      <name val="Calibri"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <name val="Calibri"/>
    </font>
  </fonts>
  <fills count="3">
    <fill>
      <patternFill patternType="none"/>
    </fill>
    <fill>
      <patternFill patternType="gray125"/>
    </fill>
    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="E2E8F0"/>
        <bgColor indexed="64"/>
      </patternFill>
    </fill>
  </fills>
  <borders count="1">
    <border/>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`))

	// xl/worksheets/sheet1.xml
	fSheet, err := zw.Create("xl/worksheets/sheet1.xml")
	if err != nil {
		return nil, err
	}

	var rows bytes.Buffer
	lines := strings.Split(text, "\n")
	rowIdx := 1
	for _, line := range lines {
		if len(strings.TrimSpace(line)) > 0 {
			var cells []string
			if strings.Contains(line, "\t") {
				cells = strings.Split(line, "\t")
			} else if strings.Contains(line, "   |   ") {
				cells = strings.Split(line, "   |   ")
			} else if strings.Contains(line, ",") {
				cells = strings.Split(line, ",")
			} else {
				cells = strings.Fields(line)
			}

			rows.WriteString(fmt.Sprintf("<row r=\"%d\">", rowIdx))
			for colIdx, val := range cells {
				val = strings.TrimSpace(val)
				if val == "" {
					continue
				}
				colLetter := string(rune('A' + colIdx))
				
				styleAttr := ""
				if rowIdx == 1 {
					// Header row: Bold & Grey Fill (Style s="1")
					styleAttr = " s=\"1\""
				} else if colIdx == 0 && isNumber(val) {
					// First column & Number value: Bold Text (Style s="2")
					styleAttr = " s=\"2\""
				}

				rows.WriteString(fmt.Sprintf("<c r=\"%s%d\" t=\"inlineStr\"%s><is><t>%s</t></is></c>", colLetter, rowIdx, styleAttr, val))
			}
			rows.WriteString("</row>")
			rowIdx++
		}
	}

	sheetXml := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    %s
  </sheetData>
</worksheet>`, rows.String())
	fSheet.Write([]byte(sheetXml))

	err = zw.Close()
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "pdf",
		To:       "xlsx",
		MIMEType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		Label:    "PDF to XLSX",
		Convert:  convertPdfToXls,
	})

	registry.Register(registry.Converter{
		From:     "pdf",
		To:       "xls",
		MIMEType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		Label:    "PDF to XLS",
		Convert:  convertPdfToXls,
	})
}
