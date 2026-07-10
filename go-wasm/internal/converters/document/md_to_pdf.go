package document

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image/jpeg"
	"regexp"
	"strings"
	"go-wasm/internal/registry"
)

type pdfImage struct {
	objNum int
	width  int
	height int
	data   []byte
}

func convertMdToPdf(data []byte) ([]byte, error) {
	text := string(data)
	lines := strings.Split(text, "\n")

	var streamContent bytes.Buffer
	y := 800

	streamContent.WriteString("BT\n")

	reImage := regexp.MustCompile(`\!\[([^\]]*)\]\(([^)]+)\)`)
	reLink := regexp.MustCompile(`\[([^\]]+)\]\(([^)]+)\)`)

	var images []pdfImage
	nextObjNum := 7 // Catalog, Pages, Page, Font1, Stream, Font2 are objects 1-6

	for _, line := range lines {
		line = strings.TrimRight(line, "\r")
		trimmed := strings.TrimSpace(line)
		if len(trimmed) == 0 {
			y -= 12
			continue
		}

		// 1. Image Block check: ![alt](url)
		if imgMatches := reImage.FindStringSubmatch(trimmed); len(imgMatches) > 0 {
			alt := imgMatches[1]
			url := imgMatches[2]

			// Close text block to draw graphics shapes
			streamContent.WriteString("ET\n")

			// Check if URL is base64 JPEG
			if strings.HasPrefix(url, "data:image/jpeg;base64,") || strings.HasPrefix(url, "data:image/jpg;base64,") {
				parts := strings.Split(url, ",")
				if len(parts) == 2 {
					imgData, err := base64.StdEncoding.DecodeString(parts[1])
					if err == nil {
						cfg, err := jpeg.DecodeConfig(bytes.NewReader(imgData))
						if err == nil {
							// Determine drawing dimensions (limit to fit page width/height)
							dispW := cfg.Width
							dispH := cfg.Height
							if dispW > 400 {
								dispH = (dispH * 400) / dispW
								dispW = 400
							}
							if dispH > 200 {
								dispW = (dispW * 200) / dispH
								dispH = 200
							}

							imgX := 50
							imgY := y - dispH

							// Register image
							imgIndex := len(images) + 1
							images = append(images, pdfImage{
								objNum: nextObjNum,
								width:  cfg.Width,
								height: cfg.Height,
								data:   imgData,
							})
							nextObjNum++

							// Draw the image in the page stream using transform matrix
							streamContent.WriteString(fmt.Sprintf("q\n%d 0 0 %d %d %d cm\n/Image%d Do\nQ\n", dispW, dispH, imgX, imgY, imgIndex))
							y = imgY - 15
							streamContent.WriteString("BT\n")
							continue
						}
					}
				}
			}

			// Fallback placeholder box if decode fails
			streamContent.WriteString("0.95 0.96 0.98 rg\n")
			streamContent.WriteString(fmt.Sprintf("45 %d 505 40 re\nf\n", y-35))
			streamContent.WriteString("0.7 0.7 0.7 RG\n0.5 w\n")
			streamContent.WriteString(fmt.Sprintf("[3 3] 0 d\n45 %d 505 40 re\nS\n[] 0 d\n", y-35))
			streamContent.WriteString("BT\n/F2 9 Tf\n0.3 0.3 0.3 rg\n")
			streamContent.WriteString(fmt.Sprintf("60 %d Td\n([IMAGE: %s \\(%s\\)]) Tj\nET\n", y-22, alt, url))
			y -= 50
			streamContent.WriteString("BT\n")
			continue
		}

		// 2. Table Row check: | cell 1 | cell 2 |
		if strings.HasPrefix(trimmed, "|") && strings.HasSuffix(trimmed, "|") {
			streamContent.WriteString("ET\n")

			isDivider := true
			parts := strings.Split(trimmed, "|")
			var rowContent []string
			for _, part := range parts {
				partTrimmed := strings.TrimSpace(part)
				if partTrimmed != "" {
					if !strings.Contains(partTrimmed, "---") && !strings.Contains(partTrimmed, ":") {
						isDivider = false
					}
					rowContent = append(rowContent, partTrimmed)
				}
			}

			if !isDivider && len(rowContent) > 0 {
				// Draw row divider line
				streamContent.WriteString(fmt.Sprintf("0.88 0.91 0.94 RG\n0.5 w\n45 %d m\n550 %d l\nS\n", y-2, y-2))

				streamContent.WriteString("BT\n/F1 9 Tf\n0.1 0.1 0.1 rg\n")
				colX := 60
				for _, cell := range rowContent {
					cellEsc := strings.ReplaceAll(cell, "\\", "\\\\")
					cellEsc = strings.ReplaceAll(cellEsc, "(", "\\(")
					cellEsc = strings.ReplaceAll(cellEsc, ")", "\\)")

					streamContent.WriteString(fmt.Sprintf("%d %d Td\n(%s) Tj\n%d 0 Td\n", colX, y, cellEsc, -colX))
					colX += 120
				}
				streamContent.WriteString("ET\n")
				y -= 18
			} else {
				y -= 4
			}

			streamContent.WriteString("BT\n")
			continue
		}

		// 3. Normal elements
		var fontSize int = 10
		var fontName string = "/F1"
		var contentText string = trimmed
		var indent int = 50

		if strings.HasPrefix(trimmed, "# ") {
			fontSize = 16
			fontName = "/F2"
			contentText = strings.TrimPrefix(trimmed, "# ")
			y -= 8
		} else if strings.HasPrefix(trimmed, "## ") {
			fontSize = 13
			fontName = "/F2"
			contentText = strings.TrimPrefix(trimmed, "## ")
			y -= 6
		} else if strings.HasPrefix(trimmed, "### ") {
			fontSize = 11
			fontName = "/F2"
			contentText = strings.TrimPrefix(trimmed, "### ")
			y -= 4
		} else if strings.HasPrefix(trimmed, "- ") || strings.HasPrefix(trimmed, "* ") {
			fontSize = 10
			fontName = "/F1"
			contentText = "\u2022  " + strings.TrimPrefix(strings.TrimPrefix(trimmed, "- "), "* ")
			indent = 65
		}

		// Check for links: [label](url) -> Style label text blue
		if linkMatches := reLink.FindAllStringSubmatch(contentText, -1); len(linkMatches) > 0 {
			streamContent.WriteString("ET\n")
			
			plainLine := contentText
			for _, m := range linkMatches {
				plainLine = strings.Replace(plainLine, m[0], fmt.Sprintf("%s (%s)", m[1], m[2]), 1)
			}
			
			plainLine = strings.ReplaceAll(plainLine, "\\", "\\\\")
			plainLine = strings.ReplaceAll(plainLine, "(", "\\(")
			plainLine = strings.ReplaceAll(plainLine, ")", "\\)")
			
			streamContent.WriteString(fmt.Sprintf("BT\n%s %d Tf\n0.14 0.39 0.92 rg\n%d %d Td\n(%s) Tj\nET\n", fontName, fontSize, indent, y, plainLine))
			
			y -= fontSize + 6
			streamContent.WriteString("BT\n")
		} else {
			contentText = strings.ReplaceAll(contentText, "\\", "\\\\")
			contentText = strings.ReplaceAll(contentText, "(", "\\(")
			contentText = strings.ReplaceAll(contentText, ")", "\\)")

			streamContent.WriteString(fmt.Sprintf("%s %d Tf\n0.15 rg\n%d %d Td\n(%s) Tj\n%d 0 Td\n", fontName, fontSize, indent, y, contentText, -indent))
			y -= fontSize + 6
		}

		if y < 50 {
			break
		}
	}
	streamContent.WriteString("ET\n")

	streamBytes := streamContent.Bytes()

	var pdf bytes.Buffer
	pdf.WriteString("%PDF-1.4\n")

	offsets := make([]int, nextObjNum)

	// Object 1: Catalog
	offsets[1] = pdf.Len()
	pdf.WriteString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

	// Object 2: Pages
	offsets[2] = pdf.Len()
	pdf.WriteString("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")

	// Assemble XObject resource list
	var xobjResources bytes.Buffer
	if len(images) > 0 {
		xobjResources.WriteString("/XObject << ")
		for i, img := range images {
			xobjResources.WriteString(fmt.Sprintf("/Image%d %d 0 R ", i+1, img.objNum))
		}
		xobjResources.WriteString(">>")
	}

	// Object 3: Page (F1 = Regular, F2 = Bold, includes XObject resources if any)
	offsets[3] = pdf.Len()
	pdf.WriteString(fmt.Sprintf("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 6 0 R >> %s >> /Contents 5 0 R >>\nendobj\n", xobjResources.String()))

	// Object 4: Font F1 (Helvetica Regular)
	offsets[4] = pdf.Len()
	pdf.WriteString("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

	// Object 5: Contents Stream
	offsets[5] = pdf.Len()
	pdf.WriteString(fmt.Sprintf("5 0 obj\n<< /Length %d >>\nstream\n", len(streamBytes)))
	pdf.Write(streamBytes)
	pdf.WriteString("\nendstream\nendobj\n")

	// Object 6: Font F2 (Helvetica Bold)
	offsets[6] = pdf.Len()
	pdf.WriteString("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n")

	// Image Objects
	for _, img := range images {
		offsets[img.objNum] = pdf.Len()
		pdf.WriteString(fmt.Sprintf("%d 0 obj\n<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length %d >>\nstream\n", img.objNum, img.width, img.height, len(img.data)))
		pdf.Write(img.data)
		pdf.WriteString("\nendstream\nendobj\n")
	}

	// Cross-Reference Table
	xrefOffset := pdf.Len()
	pdf.WriteString(fmt.Sprintf("xref\n0 %d\n0000000000 65535 f \n", nextObjNum))
	for i := 1; i < nextObjNum; i++ {
		pdf.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[i]))
	}

	pdf.WriteString(fmt.Sprintf("trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", nextObjNum, xrefOffset))

	return pdf.Bytes(), nil
}
